import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, ConflictException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createHash, randomUUID as uuidv4 } from 'crypto';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { ApplicationDeficiency } from '../database/entities/application-deficiency.entity';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { validateTheme } from '../validation/theme-validator';
import { validateBackendServiceManifest } from './manifest-validation';
import { TenantServiceRelease } from '../database/entities/tenant-service-release.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { CERTIFIED_SERVICE_TEMPLATES, getCertifiedServiceTemplate } from './service-template.catalog';
import { ServicePublicationApproval } from '../database/entities/service-publication-approval.entity';
import { ApplicationOutput } from '../database/entities/application-output.entity';
import { S3StorageService } from '../upload/s3-storage.service';

const ALLOWED_APPLICATION_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_review', 'PENDING_DOCUMENTS', 'rejected'],
  under_review: ['PENDING_DOCUMENTS', 'approved', 'rejected'],
  PENDING_DOCUMENTS: ['under_review', 'submitted', 'rejected'],
  approved: [],
  rejected: [],
};

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    @InjectRepository(TenantService)
    private tenantServiceRepository: Repository<TenantService>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(TenantUser)
    private tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(ApplicationEvent)
    private applicationEventRepository: Repository<ApplicationEvent>,
    @InjectRepository(ApplicationDeficiency)
    private applicationDeficiencyRepository: Repository<ApplicationDeficiency>,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Optional() private readonly s3Storage?: S3StorageService,
  ) {}

  private assertManifestValid(manifest: unknown) {
    if (!manifest) {
      return;
    }

    const result = validateBackendServiceManifest(manifest);
    if (!result.valid) {
      throw new BadRequestException({
        message: 'Invalid service manifest',
        errors: result.errors,
      });
    }
  }

  getCertifiedServiceTemplates() {
    return CERTIFIED_SERVICE_TEMPLATES.map(({ manifest, ...template }) => template);
  }

  async cloneCertifiedServiceTemplate(tenantId: string, templateId: string, overrides: any = {}) {
    const template = getCertifiedServiceTemplate(templateId);
    if (!template) {
      throw new NotFoundException('Certified service template not found');
    }

    const suppliedManifest = overrides.manifest ?? {};
    const suppliedService = suppliedManifest.service ?? {};
    const formSchema = overrides.formSchema ?? suppliedService.formSchema ?? template.formSchema;
    const name = overrides.name ?? suppliedService.name ?? template.name;
    const description = overrides.description ?? suppliedService.description ?? template.description;
    const requiredDocuments = overrides.requiredDocuments ?? template.requiredDocuments;
    const workflowStages = template.id === 'income-cert'
      ? (template.manifest as any).workflow.stages
      : overrides.workflowConfig?.stages ?? suppliedManifest.workflow?.stages ?? template.workflowConfig.stages;
    const manifest = {
      ...template.manifest,
      ...suppliedManifest,
      serviceType: (template.manifest as any).serviceType,
      service: {
        ...(template.manifest as any).service,
        ...suppliedService,
        id: template.id,
        name,
        category: template.category,
        description,
        formSchema,
      },
      requiredDocuments,
      workflow: {
        ...(template.manifest as any).workflow,
        ...suppliedManifest.workflow,
        stages: workflowStages,
      },
      sourceTemplate: {
        id: template.id,
        version: template.version,
        certificationStatus: template.certificationStatus,
        certifiedAt: template.certifiedAt,
        certificationAuthority: template.certificationAuthority,
        certificationScope: template.certificationScope,
      },
    };

    return this.createService(tenantId, {
      name,
      category: template.category,
      description,
      formSchema,
      workflowConfig: {
        ...template.workflowConfig,
        ...(overrides.workflowConfig ?? {}),
        stages: workflowStages,
      },
      eligibilityRules: overrides.eligibilityRules ?? template.eligibilityRules,
      requiredDocuments,
      backendApiConfig: overrides.backendApiConfig,
      serviceScope: overrides.serviceScope,
      manifest,
      slaDays: overrides.slaDays ?? template.slaDays,
      fees: overrides.fees,
      published: false,
    });
  }

  async simulateServiceDraft(tenantId: string, serviceId: string) {
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, tenant_id: tenantId, archived: false, published: false },
    });
    if (!service) throw new NotFoundException('Unpublished service draft not found');

    return this.buildSimulationResult(service);
  }

  async requestServicePublication(tenantId: string, serviceId: string, requesterId: string) {
    return this.dataSource.transaction(async (manager) => {
      const services = manager.getRepository(TenantService);
      const approvals = manager.getRepository(ServicePublicationApproval);
      const service = await services.findOne({
        where: { id: serviceId, tenant_id: tenantId, archived: false, published: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!service) throw new NotFoundException('Unpublished service draft not found');

      const simulation = this.buildSimulationResult(service);
      if (!simulation.passed) {
        throw new BadRequestException({
          message: 'Service draft must pass simulation before requesting publication.',
          checks: simulation.checks.filter((check) => !check.passed),
        });
      }

      const existing = await approvals.findOne({
        where: { tenant_id: tenantId, service_id: serviceId, status: 'pending' },
      });
      if (existing) return existing;

      const snapshot = this.createReleaseSnapshot(service);
      const approval = approvals.create({
        tenant_id: tenantId,
        service_id: service.id,
        requested_by_id: requesterId,
        approved_by_id: null,
        status: 'pending',
        requested_content_hash: createHash('sha256').update(this.stableJson(snapshot)).digest('hex'),
        decision_notes: null,
        resolved_at: null,
      });
      return approvals.save(approval);
    });
  }

  async getPendingServicePublicationApprovals(tenantId: string) {
    const approvals = await this.tenantServiceRepository.manager
      .getRepository(ServicePublicationApproval)
      .find({
        where: { tenant_id: tenantId, status: 'pending' },
        order: { created_at: 'ASC' },
      });
    return Promise.all(approvals.map(async (approval) => {
      const service = await this.tenantServiceRepository.findOne({
        where: { id: approval.service_id, tenant_id: tenantId, archived: false, published: false },
      });
      if (!service) return { ...approval, service: null, simulation: null };
      return {
        ...approval,
        service: this.createReleaseSnapshot(service),
        simulation: this.buildSimulationResult(service),
      };
    }));
  }

  async approveServicePublication(tenantId: string, serviceId: string, approverId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const services = manager.getRepository(TenantService);
      const approvals = manager.getRepository(ServicePublicationApproval);
      const releases = manager.getRepository(TenantServiceRelease);
      const approval = await approvals.findOne({
        where: { tenant_id: tenantId, service_id: serviceId, status: 'pending' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!approval) throw new NotFoundException('Pending publication approval not found');
      if (approval.requested_by_id === approverId) {
        throw new ForbiddenException('The requester cannot approve their own service release');
      }

      const service = await services.findOne({
        where: { id: serviceId, tenant_id: tenantId, archived: false, published: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!service) throw new NotFoundException('Unpublished service draft not found');
      const simulation = this.buildSimulationResult(service);
      if (!simulation.passed) {
        throw new BadRequestException({ message: 'Service draft no longer passes simulation.', checks: simulation.checks.filter((check) => !check.passed) });
      }

      const snapshot = this.createReleaseSnapshot(service);
      const contentHash = createHash('sha256').update(this.stableJson(snapshot)).digest('hex');
      if (contentHash !== approval.requested_content_hash) {
        throw new ConflictException('Service draft changed after approval was requested; submit it for approval again');
      }

      const latestRelease = await releases.findOne({
        where: { service_id: service.id, tenant_id: tenantId },
        order: { version: 'DESC' },
      });
      const release = await releases.save(releases.create({
        tenant_id: tenantId,
        service_id: service.id,
        version: (latestRelease?.version ?? 0) + 1,
        snapshot,
        content_hash: contentHash,
      }));
      service.current_release_id = release.id;
      service.published = true;
      await services.save(service);

      approval.status = 'approved';
      approval.approved_by_id = approverId;
      approval.resolved_at = new Date();
      await approvals.save(approval);
      return { service, release };
    });

    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
    this.cacheService.invalidate(`consumer:service:${serviceId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');
    return {
      serviceId: result.service.id,
      release_id: result.release.id,
      version: result.release.version,
      content_hash: result.release.content_hash,
      published: true,
    };
  }
  private buildSimulationResult(service: TenantService) {
    const manifestValidation = validateBackendServiceManifest(service.manifest);
    const fields = (service.manifest as any)?.service?.formSchema?.fields ?? [];
    const requiredFields = fields.filter((field: any) => field.required);
    const workflowStages = (service.manifest as any)?.workflow?.stages ?? [];
    const runtimeFormSchema = service.form_schema;
    const manifestFormSchema = (service.manifest as any)?.service?.formSchema;
    const runtimeWorkflowStages = service.workflow_config?.stages;
    const validInput = Object.fromEntries(fields.map((field: any) => [field.id, this.simulationValue(field)]));
    const missingFieldId = requiredFields[0]?.id;
    const negativeInput = { ...validInput };
    if (missingFieldId) delete negativeInput[missingFieldId];
    const missingRequired = (input: Record<string, unknown>) =>
      requiredFields.filter((field: any) => !this.hasSimulationValue(input[field.id])).map((field: any) => field.id);
    const positiveMissing = missingRequired(validInput);
    const negativeMissing = missingRequired(negativeInput);
    const positiveFieldErrors = fields.flatMap((field: any) => this.validateSimulationField(field, validInput[field.id]));
    const negativeFieldErrors = fields.flatMap((field: any) => this.validateSimulationField(field, negativeInput[field.id]));
    const checks = [
      { id: 'manifest-valid', passed: manifestValidation.valid, details: manifestValidation.errors },
      { id: 'workflow-has-stages', passed: workflowStages.length > 0, details: { stageCount: workflowStages.length } },
      { id: 'runtime-form-matches-manifest', passed: Boolean(runtimeFormSchema?.version) && this.stableJson(runtimeFormSchema) === this.stableJson(manifestFormSchema), details: { runtimeHasVersion: Boolean(runtimeFormSchema?.version), formsMatch: this.stableJson(runtimeFormSchema) === this.stableJson(manifestFormSchema) } },
      { id: 'runtime-workflow-matches-manifest', passed: Array.isArray(runtimeWorkflowStages) && this.stableJson(runtimeWorkflowStages) === this.stableJson(workflowStages), details: { runtimeStageCount: runtimeWorkflowStages?.length ?? 0, manifestStageCount: workflowStages.length } },
      { id: 'runtime-documents-match-manifest', passed: this.stableJson(service.required_documents ?? []) === this.stableJson((service.manifest as any)?.requiredDocuments ?? []), details: { documentsMatch: this.stableJson(service.required_documents ?? []) === this.stableJson((service.manifest as any)?.requiredDocuments ?? []) } },
      { id: 'valid-submission-fixture', passed: positiveMissing.length === 0 && positiveFieldErrors.length === 0, details: { missingFields: positiveMissing, validationErrors: positiveFieldErrors } },
      { id: 'missing-required-field-fixture', passed: Boolean(missingFieldId) && negativeMissing.includes(missingFieldId) && negativeFieldErrors.length > 0, details: { expectedField: missingFieldId, missingFields: negativeMissing, validationErrors: negativeFieldErrors } },
    ];

    return {
      serviceId: service.id,
      serviceReleaseId: service.current_release_id,
      passed: checks.every((check) => check.passed),
      checks,
      simulatedAt: new Date().toISOString(),
    };
  }

  private simulationValue(field: any): unknown {
    const constraints = field.validation ?? {};
    if (field.type === 'number') return constraints.min ?? 1;
    if (field.type === 'date') return constraints.minDate ?? '2026-01-01';
    if (field.type === 'file') return { testFixture: true, fileName: 'fixture.pdf' };
    if (Array.isArray(field.options) && field.options.length) {
      const first = field.options[0];
      return typeof first === 'object' ? first.value ?? first.id ?? first.label : first;
    }
    if (field.type === 'email') return 'simulation@example.gov.in';
    if (constraints.minLength) return 'T'.repeat(constraints.minLength);
    if (constraints.pattern) {
      return ['TEST-123', '1234567890', 'AAAAAAAAAA'].find((candidate) => {
        try {
          return new RegExp(constraints.pattern).test(candidate);
        } catch {
          return false;
        }
      }) ?? 'Test fixture';
    }
    return 'Test fixture';
  }

  private validateSimulationField(field: any, value: unknown): string[] {
    if (!this.hasSimulationValue(value)) {
      return field.required ? [`${field.id}: required value missing`] : [];
    }
    const constraints = field.validation ?? {};
    const errors: string[] = [];
    if (field.type === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number)) errors.push(`${field.id}: expected a number`);
      if (constraints.min !== undefined && number < constraints.min) errors.push(`${field.id}: below minimum`);
      if (constraints.max !== undefined && number > constraints.max) errors.push(`${field.id}: above maximum`);
    }
    if (typeof value === 'string') {
      if (constraints.minLength !== undefined && value.length < constraints.minLength) errors.push(`${field.id}: too short`);
      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) errors.push(`${field.id}: too long`);
      if (constraints.pattern) {
        try {
          if (!new RegExp(constraints.pattern).test(value)) errors.push(`${field.id}: pattern mismatch`);
        } catch {
          errors.push(`${field.id}: invalid pattern`);
        }
      }
    }
    if (field.type === 'email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${field.id}: invalid email`);
    }
    if (field.type === 'date' && typeof value === 'string') {
      const date = Date.parse(value);
      if (Number.isNaN(date)) errors.push(`${field.id}: invalid date`);
      if (constraints.minDate && date < Date.parse(constraints.minDate)) errors.push(`${field.id}: before minimum date`);
      if (constraints.maxDate && date > Date.parse(constraints.maxDate)) errors.push(`${field.id}: after maximum date`);
    }
    if (['select', 'dropdown', 'radio'].includes(field.type) && Array.isArray(field.options) && field.options.length) {
      const allowed = field.options.map((option: any) => typeof option === 'object' ? option.value ?? option.id ?? option.label : option);
      if (!allowed.includes(value)) errors.push(`${field.id}: value is not an option`);
    }
    return errors;
  }

  private hasSimulationValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    return typeof value !== 'string' || value.trim().length > 0;
  }

  async createService(tenantId: string, serviceData: any) {
    this.assertManifestValid(serviceData.manifest);

    const serviceId = uuidv4();
    // Draft creation must be read-after-write consistent for validation and simulation.
    this.queueService.recordDirectWriteBypass(
      'producer.createService',
      'Draft persistence commits synchronously so validation and simulation can immediately read it.',
    );

    const service = this.tenantServiceRepository.create({
      id: serviceId,
      tenant_id: tenantId,
      name: serviceData.name,
      category: serviceData.category,
      description: serviceData.description,
      form_schema: serviceData.formSchema,
      workflow_config: serviceData.workflowConfig,
      eligibility_rules: serviceData.eligibilityRules,
      required_documents: serviceData.requiredDocuments,
      backend_api_config: serviceData.backendApiConfig,
      service_scope: serviceData.serviceScope,
      manifest: serviceData.manifest,
      published: false,
      archived: false,
      sla_days: serviceData.slaDays,
      fees: serviceData.fees,
    });

    await this.tenantServiceRepository.save(service);
    try {
      await this.queueService.publishShadowWriteEvent({
        type: 'service.created',
        module: 'producer.createService.shadow',
        payload: {
          serviceId: service.id,
          tenantId: service.tenant_id,
          published: service.published,
        },
        idempotencyKey: `service.created:${service.id}`,
      });
    } catch (error) {
      this.logger.error(`Service draft ${service.id} was saved but its shadow event could not be queued: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      service_scope: service.service_scope,
      manifest: service.manifest,
      published: service.published,
      created_at: service.created_at,
    };
  }

  async getServices(tenantId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    return this.cacheService.readThrough({
      key: `producer:services:${tenantId}:${safePage}:${safeLimit}`,
      domain: 'producer-services',
      endpoint: 'producer.getServices',
      featureFlag: 'producer.services.cache',
      loader: async () => {
        const [services, total] = await this.tenantServiceRepository.findAndCount({
          where: { tenant_id: tenantId, archived: false },
          order: { created_at: 'DESC' },
          skip,
          take: safeLimit,
        });

        return {
          data: services.map((service) => ({
            id: service.id,
            name: service.name,
            category: service.category,
            description: service.description,
            service_scope: service.service_scope,
            manifest: service.manifest,
            published: service.published,
            sla_days: service.sla_days,
            fees: service.fees,
            created_at: service.created_at,
            updated_at: service.updated_at,
          })),
          total,
          page: safePage,
          limit: safeLimit,
        };
      },
    });
  }

  async getServiceById(tenantId: string, serviceId: string) {
    return this.cacheService.readThrough({
      key: `producer:service:${tenantId}:${serviceId}`,
      domain: 'producer-services',
      endpoint: 'producer.getServiceById',
      featureFlag: 'producer.services.cache',
      loader: async () => {
        const service = await this.tenantServiceRepository.findOne({
          where: { id: serviceId, tenant_id: tenantId, archived: false },
        });

        if (!service) {
          throw new NotFoundException('Service not found');
        }

        return service;
      },
    });
  }

  async updateService(tenantId: string, serviceId: string, updateData: any) {
    this.assertManifestValid(updateData.manifest);
    const service = await this.dataSource.transaction(async (manager) => {
      const services = manager.getRepository(TenantService);
      const service = await services.findOne({
        where: { id: serviceId, tenant_id: tenantId, archived: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!service) throw new NotFoundException('Service not found');
      if (service.published) {
        throw new ForbiddenException('Published service releases are immutable. Create a draft before editing.');
      }

      if (updateData.formSchema !== undefined) {
        const history = Array.isArray(service.schema_version_history)
          ? service.schema_version_history
          : [];
        service.schema_version_history = [...history, {
          version: service.schema_version ?? 1,
          schema: service.form_schema,
          updatedAt: new Date().toISOString(),
        }].slice(-2);
        service.schema_version = (service.schema_version ?? 1) + 1;
      }

      const existingLineage = service.manifest?.sourceTemplate;
      const updatedManifest = updateData.manifest ?? service.manifest;
      const { sourceTemplate: _untrustedLineage, ...manifestWithoutLineage } = updatedManifest ?? {};

      Object.assign(service, {
        name: updateData.name ?? service.name,
        category: updateData.category ?? service.category,
        description: updateData.description ?? service.description,
        form_schema: updateData.formSchema ?? service.form_schema,
        workflow_config: updateData.workflowConfig ?? service.workflow_config,
        eligibility_rules: updateData.eligibilityRules ?? service.eligibility_rules,
        required_documents: updateData.requiredDocuments ?? service.required_documents,
        backend_api_config: updateData.backendApiConfig ?? service.backend_api_config,
        service_scope: updateData.serviceScope ?? service.service_scope,
        manifest: existingLineage
          ? { ...manifestWithoutLineage, sourceTemplate: existingLineage }
          : manifestWithoutLineage,
        sla_days: updateData.slaDays ?? service.sla_days,
        fees: updateData.fees ?? service.fees,
      });
      const saved = await services.save(service);
      const approvals = manager.getRepository(ServicePublicationApproval);
      const pendingApprovals = await approvals.find({
        where: { tenant_id: tenantId, service_id: serviceId, status: 'pending' },
      });
      for (const approval of pendingApprovals) {
        approval.status = 'rejected';
        approval.decision_notes = 'Draft changed after publication was requested; simulate and submit the new version.';
        approval.resolved_at = new Date();
        await approvals.save(approval);
      }
      return saved;
    });

    this.queueService.recordDirectWriteBypass(
      'producer.updateService',
      'Draft service updates commit transactionally so publication and editing serialize on the service row.',
    );
    await this.queueService.publishShadowWriteEvent({
      type: 'service.updated',
      module: 'producer.updateService.shadow',
      payload: {
        serviceId: service.id,
        tenantId: service.tenant_id,
        published: service.published,
      },
      idempotencyKey: `service.updated:${service.id}:${service.updated_at?.toISOString?.() || Date.now()}`,
    });
    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
    this.cacheService.invalidate(`consumer:service:${serviceId}`);
    this.cacheService.invalidate(`consumer:form-schema:${serviceId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');
    // Invalidate cached validation results when form_schema may have changed
    this.cacheService.invalidateByPrefix(`validation:${serviceId}:`);

    return {
      id: service.id,
      name: service.name,
      service_scope: service.service_scope,
      manifest: service.manifest,
      published: service.published,
      updated_at: service.updated_at,
    };
  }

  async deleteService(tenantId: string, serviceId: string) {
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, tenant_id: tenantId, archived: false },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.published = false;
    service.archived = true;
    await this.tenantServiceRepository.save(service);
    await this.queueService.publishShadowWriteEvent({
      type: 'service.archived',
      module: 'producer.deleteService.shadow',
      payload: {
        serviceId,
        tenantId,
      },
      idempotencyKey: `service.deleted:${serviceId}`,
    });
    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
    this.cacheService.invalidate(`consumer:service:${serviceId}`);
    this.cacheService.invalidate(`consumer:form-schema:${serviceId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');

    return {
      success: true,
      message: 'Service archived; release and application history were retained.',
    };
  }

  async getApplications(tenantId: string, status?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    return this.cacheService.readThrough({
      key: `producer:applications:${tenantId}:${status || 'all'}:${safePage}:${safeLimit}`,
      domain: 'producer-applications',
      endpoint: 'producer.getApplications',
      featureFlag: 'producer.applications.cache',
      loader: async () => {
        const queryBuilder = this.applicationRepository
          .createQueryBuilder('a')
          .where('a.tenant_id = :tenantId', { tenantId })
          .skip(skip)
          .take(safeLimit);

        if (status) {
          queryBuilder.andWhere('a.status = :status', { status });
        }

        queryBuilder.orderBy('a.created_at', 'DESC');

        const [applications, total] = await queryBuilder.getManyAndCount();

        return {
          data: applications.map((app) => ({
            id: app.id,
            service_id: app.service_id,
            tracking_number: app.tracking_number,
            status: app.status,
            current_stage: app.current_stage,
            assigned_to: app.assigned_to,
            submitted_at: app.created_at,
            updated_at: app.updated_at,
          })),
          total,
          page: safePage,
          limit: safeLimit,
        };
      },
    });
  }

  async getApplicationById(tenantId: string, applicationId: string) {
    return this.cacheService.readThrough({
      key: `producer:application:${tenantId}:${applicationId}`,
      domain: 'producer-applications',
      endpoint: 'producer.getApplicationById',
      featureFlag: 'producer.applications.cache',
      loader: async () => {
        const application = await this.applicationRepository.findOne({
          where: { id: applicationId, tenant_id: tenantId },
        });

        if (!application) {
          throw new NotFoundException('Application not found');
        }

        const [statusHistory, deficiencies] = await Promise.all([
          this.applicationEventRepository.find({
            where: { application_id: application.id, tenant_id: tenantId },
            order: { created_at: 'ASC' },
          }),
          this.applicationDeficiencyRepository.find({
            where: { application_id: application.id, tenant_id: tenantId },
            order: { created_at: 'DESC' },
          }),
        ]);

        return {
          ...application,
          status_history: statusHistory,
          deficiencies,
        };
      },
    });
  }

  async updateApplicationStatus(
    tenantId: string,
    applicationId: string,
    status: string,
    stage?: string,
    notes?: string,
    deficiencyDueAt?: string,
    actor?: { id: string; role: string },
  ) {
    const transition = await this.dataSource.transaction(async (manager) => {
      const applications = manager.getRepository(Application);
      const outputs = manager.getRepository(ApplicationOutput);
      const events = manager.getRepository(ApplicationEvent);
      const deficiencies = manager.getRepository(ApplicationDeficiency);
      const audits = manager.getRepository(AuditLog);
      const outbox = manager.getRepository(OutboxEvent);
      const application = await applications.findOne({
        where: { id: applicationId, tenant_id: tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!application) throw new NotFoundException('Application not found');

      const allowedTargets = ALLOWED_APPLICATION_TRANSITIONS[application.status] ?? [];
      if (!allowedTargets.includes(status)) {
        throw new BadRequestException(`Invalid application transition: ${application.status} -> ${status}`);
      }
      if (['approved', 'rejected', 'APPROVED', 'REJECTED'].includes(status) && !['admin', 'approver'].includes(actor?.role ?? '')) {
        throw new ForbiddenException('Only an authorized competent authority may approve or reject an application');
      }

      const previousStatus = application.status;
      application.status = status;
      if (stage) application.current_stage = stage;
      await applications.save(application);

      if (status === 'approved') {
        const existingOutput = await outputs.findOne({ where: { application_id: application.id } });
        if (!existingOutput) {
          const issuedAt = new Date();
          const certificateNumber = `CERT-${issuedAt.getUTCFullYear()}-${application.tracking_number}`;
          const storageKey = this.s3Storage
            ? await this.s3Storage.putObject({
                key: `outputs/${tenantId}/${application.id}/${certificateNumber}.pdf`,
                body: this.buildCertificatePdf(application, certificateNumber, issuedAt),
                contentType: 'application/pdf',
                metadata: { applicationId: application.id, certificateNumber },
              })
            : null;
          await outputs.save(outputs.create({
            application_id: application.id,
            tenant_id: tenantId,
            consumer_id: application.consumer_id,
            certificate_number: certificateNumber,
            status: 'issued',
            format: 'PDF',
            storage_key: storageKey,
            verification_code: `VERIFY-${application.id}`,
            metadata: {
              serviceId: application.service_id,
              serviceReleaseId: application.service_release_id,
              trackingNumber: application.tracking_number,
            },
            issued_at: issuedAt,
          }));
        }
      }

      await events.save(events.create({
        application_id: application.id,
        tenant_id: tenantId,
        actor_id: actor?.id ?? null,
        actor_role: actor?.role ?? 'officer',
        event_type: status === 'PENDING_DOCUMENTS' ? 'deficiency.raised' : 'status.updated',
        from_status: previousStatus,
        to_status: status,
        stage: application.current_stage,
        title: status === 'PENDING_DOCUMENTS' ? 'Deficiency raised' : 'Application status updated',
        notes: notes ?? null,
        metadata: { actorId: actor?.id ?? null, actorRole: actor?.role ?? 'officer' },
      }));

      if (status === 'PENDING_DOCUMENTS') {
        const existing = await deficiencies.findOne({
          where: { application_id: application.id, tenant_id: tenantId, status: 'open' },
        });
        await deficiencies.save(deficiencies.create({
          ...(existing ?? {}),
          application_id: application.id,
          tenant_id: tenantId,
          raised_by_id: actor?.id ?? null,
          raised_by_role: actor?.role ?? 'officer',
          title: 'Document deficiency',
          description: notes?.trim() || 'Additional documents or corrections are required before processing can continue.',
          status: 'open',
          due_at: deficiencyDueAt ? new Date(deficiencyDueAt) : existing?.due_at ?? null,
          resolved_at: null,
          resolution_notes: null,
          metadata: { stage: application.current_stage },
        }));
      } else {
        const open = await deficiencies.find({
          where: { application_id: application.id, tenant_id: tenantId, status: 'open' },
        });
        for (const deficiency of open) {
          deficiency.status = 'resolved';
          deficiency.resolved_at = new Date();
          deficiency.resolution_notes = notes ?? 'Resolved by application status update.';
          await deficiencies.save(deficiency);
        }
      }

      await audits.save(audits.create({
        event_type: 'admin.application.status_update',
        actor_id: actor?.id ?? null,
        actor_role: actor?.role ?? 'officer',
        tenant_id: tenantId,
        resource_type: 'application',
        resource_id: application.id,
        metadata: { fromStatus: previousStatus, toStatus: status, stage: application.current_stage },
        success: true,
      }));

      const outboxPayload = {
        applicationId: application.id,
        tenantId,
        consumerId: application.consumer_id,
        status,
        currentStage: application.current_stage,
        notes: notes ?? null,
      };
      await outbox.save(outbox.create({
        event_type: 'application.status-updated',
        aggregate_type: 'application',
        aggregate_id: application.id,
        tenant_id: tenantId,
        payload: outboxPayload,
        idempotency_key: `application.status:${application.id}:${application.updated_at?.toISOString?.() ?? Date.now()}`,
        status: 'pending',
      }));

      return { application, previousStatus, outboxPayload };
    });

    const { application } = transition;
    await this.queueService.publishShadowWriteEvent({
      type: 'application.status-updated',
      module: 'producer.updateApplicationStatus.shadow',
      payload: transition.outboxPayload,
      idempotencyKey: `application.status:${application.id}:${application.updated_at?.toISOString?.() || Date.now()}`,
    });
    this.cacheService.invalidateByPrefix(`producer:applications:${tenantId}:`);
    this.cacheService.invalidate(`producer:application:${tenantId}:${applicationId}`);
    this.cacheService.invalidateByPrefix(`consumer:applications:${application.consumer_id}:`);
    this.cacheService.invalidate(`consumer:application:${application.consumer_id}:${applicationId}`);

    return {
      id: application.id,
      status: application.status,
      current_stage: application.current_stage,
      updated_at: application.updated_at,
    };
  }

  // ── Publish / Unpublish ────────────────────────────────────────────────────

  async setServicePublished(tenantId: string, serviceId: string, published: boolean) {
    if (!this.dataSource) {
      throw new InternalServerErrorException('Service release persistence is unavailable');
    }

    const service = await this.dataSource.transaction(async (manager) => {
      const services = manager.getRepository(TenantService);
      const releases = manager.getRepository(TenantServiceRelease);
      const service = await services.findOne({
        where: { id: serviceId, tenant_id: tenantId, archived: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!service) throw new NotFoundException('Service not found');

      if (published) {
        const simulation = this.buildSimulationResult(service);
        if (!simulation.passed) {
          throw new BadRequestException({
            message: 'Service draft must pass simulation before publication.',
            checks: simulation.checks.filter((check) => !check.passed),
          });
        }
        const snapshot = this.createReleaseSnapshot(service);
        const latestRelease = await releases.findOne({
          where: { service_id: service.id, tenant_id: tenantId },
          order: { version: 'DESC' },
        });
        let release = latestRelease;
        if (!latestRelease || this.stableJson(latestRelease.snapshot) !== this.stableJson(snapshot)) {
          const draftRelease = releases.create({
            tenant_id: tenantId,
            service_id: service.id,
            version: (latestRelease?.version ?? 0) + 1,
            snapshot,
            content_hash: createHash('sha256').update(this.stableJson(snapshot)).digest('hex'),
          });
          release = await releases.save(draftRelease);
        }
        service.current_release_id = release.id;
      }

      service.published = published;
      await services.save(service);
      return service;
    });

    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
    this.cacheService.invalidate(`consumer:service:${serviceId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');

    return {
      id: service.id,
      name: service.name,
      published: service.published,
      release_id: service.current_release_id,
      updated_at: service.updated_at,
    };
  }

  private createReleaseSnapshot(service: TenantService) {
    return {
      id: service.id,
      tenant_id: service.tenant_id,
      name: service.name,
      category: service.category,
      description: service.description,
      service_scope: service.service_scope,
      form_schema: service.form_schema,
      workflow_config: service.workflow_config,
      eligibility_rules: service.eligibility_rules,
      required_documents: service.required_documents,
      backend_api_config: service.backend_api_config,
      manifest: service.manifest,
      sla_days: service.sla_days,
      fees: service.fees,
      schema_version: service.schema_version ?? 1,
    };
  }

  private stableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableJson(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${this.stableJson(record[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private buildCertificatePdf(application: Application, certificateNumber: string, issuedAt: Date): Buffer {
    const escapePdf = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const lines = [
      'ServiceFormAI Government Service Certificate',
      `Certificate number: ${certificateNumber}`,
      `Application tracking number: ${application.tracking_number}`,
      `Issued on: ${issuedAt.toISOString().slice(0, 10)}`,
      'This certificate was issued after the configured human approval workflow.',
    ];
    const content = ['BT', '/F1 14 Tf', '72 720 Td', ...lines.flatMap((line, index) => [index === 0 ? `(${escapePdf(line)}) Tj` : `0 -28 Td (${escapePdf(line)}) Tj`]), 'ET'].join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
  }

  // ── Assign Application ────────────────────────────────────────────────────

  async assignApplication(tenantId: string, applicationId: string, officerId: string) {
    if (!officerId) throw new BadRequestException('officerId is required');

    const [application, officer] = await Promise.all([
      this.applicationRepository.findOne({ where: { id: applicationId, tenant_id: tenantId } }),
      this.tenantUserRepository.findOne({ where: { id: officerId, tenant_id: tenantId } }),
    ]);

    if (!application) throw new NotFoundException('Application not found');
    if (!officer) throw new NotFoundException('Officer not found in tenant');

    application.assigned_to = officerId;
    await this.applicationRepository.save(application);

    this.cacheService.invalidateByPrefix(`producer:applications:${tenantId}:`);
    this.cacheService.invalidate(`producer:application:${tenantId}:${applicationId}`);

    return { id: application.id, assigned_to: application.assigned_to, updated_at: application.updated_at };
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getTenantAnalytics(tenantId: string, dateFrom?: string, dateTo?: string) {
    return this.cacheService.readThrough({
      key: `producer:analytics:${tenantId}:${dateFrom || ''}:${dateTo || ''}`,
      domain: 'producer-analytics',
      endpoint: 'producer.getTenantAnalytics',
      featureFlag: 'producer.analytics.cache',
      loader: async () => {
        const qb = this.applicationRepository
          .createQueryBuilder('a')
          .where('a.tenant_id = :tenantId', { tenantId });

        if (dateFrom) qb.andWhere('a.created_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
        if (dateTo) qb.andWhere('a.created_at <= :dateTo', { dateTo: new Date(dateTo) });

        const [applications, serviceCount] = await Promise.all([
          qb.select(['a.status', 'COUNT(*) AS cnt']).groupBy('a.status').getRawMany(),
          this.tenantServiceRepository.count({ where: { tenant_id: tenantId } }),
        ]);

        const byStatus: Record<string, number> = {};
        let total = 0;
        for (const row of applications) {
          byStatus[row.a_status] = parseInt(row.cnt, 10);
          total += byStatus[row.a_status];
        }

        return {
          totalApplications: total,
          applicationsByStatus: byStatus,
          totalServices: serviceCount,
          pendingReview: byStatus['SUBMITTED'] || 0,
          approved: byStatus['APPROVED'] || 0,
          rejected: byStatus['REJECTED'] || 0,
          completed: byStatus['COMPLETED'] || 0,
        };
      },
    });
  }

  async getServiceAnalytics(tenantId: string, serviceId: string, dateFrom?: string, dateTo?: string) {
    return this.cacheService.readThrough({
      key: `producer:service-analytics:${tenantId}:${serviceId}:${dateFrom || ''}:${dateTo || ''}`,
      domain: 'producer-analytics',
      endpoint: 'producer.getServiceAnalytics',
      featureFlag: 'producer.analytics.cache',
      loader: async () => {
        const service = await this.tenantServiceRepository.findOne({
          where: { id: serviceId, tenant_id: tenantId },
        });
        if (!service) throw new NotFoundException('Service not found');

        const qb = this.applicationRepository
          .createQueryBuilder('a')
          .where('a.tenant_id = :tenantId AND a.service_id = :serviceId', { tenantId, serviceId });

        if (dateFrom) qb.andWhere('a.created_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
        if (dateTo) qb.andWhere('a.created_at <= :dateTo', { dateTo: new Date(dateTo) });

        const rows = await qb
          .select(['a.status', 'COUNT(*) AS cnt'])
          .groupBy('a.status')
          .getRawMany();

        const byStatus: Record<string, number> = {};
        let total = 0;
        for (const row of rows) {
          byStatus[row.a_status] = parseInt(row.cnt, 10);
          total += byStatus[row.a_status];
        }

        return {
          serviceId,
          serviceName: service.name,
          totalApplications: total,
          applicationsByStatus: byStatus,
        };
      },
    });
  }

  // ── Tenant Users ──────────────────────────────────────────────────────────

  async getTenantUsers(tenantId: string) {
    const users = await this.tenantUserRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'ASC' },
      select: ['id', 'email', 'role', 'first_name', 'last_name', 'active', 'created_at'],
    });
    return users;
  }

  async createTenantUser(
    tenantId: string,
    data: { email: string; first_name?: string; last_name?: string; role: string; password: string },
  ) {
    const existing = await this.tenantUserRepository.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existing) throw new BadRequestException('A user with this email already exists in the tenant');

    const password_hash = await bcrypt.hash(data.password, 12);

    const user = this.tenantUserRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      email: data.email,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      role: data.role,
      password_hash,
      active: true,
    });
    await this.tenantUserRepository.save(user);

    const { password_hash: _, ...safe } = user as any;
    return safe;
  }

  async updateTenantUser(
    tenantId: string,
    userId: string,
    data: { role?: string; active?: boolean; first_name?: string; last_name?: string },
  ) {
    const user = await this.tenantUserRepository.findOne({ where: { id: userId, tenant_id: tenantId } });
    if (!user) throw new NotFoundException('User not found');

    if (data.role !== undefined) user.role = data.role;
    if (data.active !== undefined) user.active = data.active;
    if (data.first_name !== undefined) user.first_name = data.first_name;
    if (data.last_name !== undefined) user.last_name = data.last_name;

    await this.tenantUserRepository.save(user);
    return { id: user.id, email: user.email, role: user.role, active: user.active };
  }

  async deleteTenantUser(tenantId: string, userId: string, actorId: string) {
    if (userId === actorId) throw new ForbiddenException('Cannot deactivate your own account');

    const user = await this.tenantUserRepository.findOne({ where: { id: userId, tenant_id: tenantId } });
    if (!user) throw new NotFoundException('User not found');

    user.active = false;
    await this.tenantUserRepository.save(user);
  }

  // ── Tenant Settings ───────────────────────────────────────────────────────

  async getTenantSettings(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      id: tenant.id,
      name: tenant.name,
      logo: (tenant.branding as any)?.logo_url || null,
      primaryColor: (tenant.branding as any)?.primary_color || null,
      secondaryColor: null,
      customDomain: null,
      governanceScope: tenant.governance_scope,
      branding: tenant.branding,
    };
  }

  async updateTenantSettings(
    tenantId: string,
    data: { name?: string; logo?: string; primaryColor?: string; secondaryColor?: string; customDomain?: string; theme?: unknown; governanceScope?: unknown },
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Validate theme if present
    if (data.theme !== undefined) {
      const themeResult = validateTheme(data.theme);
      if (!themeResult.valid) {
        throw new BadRequestException({
          success: false,
          errors: themeResult.errors,
        });
      }
    }

    if (data.name) tenant.name = data.name;
    if (data.governanceScope !== undefined) {
      tenant.governance_scope = {
        ...((tenant.governance_scope as Record<string, unknown>) || {}),
        ...(data.governanceScope as Record<string, unknown>),
      } as any;
    }

    const branding: Record<string, any> = { ...((tenant.branding as any) || {}) };
    if (data.logo !== undefined) branding.logo_url = data.logo;
    if (data.primaryColor !== undefined) branding.primary_color = data.primaryColor;
    if (data.secondaryColor !== undefined) branding.secondary_color = data.secondaryColor;
    if (data.customDomain !== undefined) branding.custom_domain = data.customDomain;
    if (data.theme !== undefined) branding.theme = data.theme;
    tenant.branding = branding as any;

    await this.tenantRepository.save(tenant);

    return { id: tenant.id, name: tenant.name, branding: tenant.branding };
  }
}

