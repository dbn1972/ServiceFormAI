import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import { TenantService as TenantEntityService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { ApplicationDeficiency } from '../database/entities/application-deficiency.entity';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { ConsentService } from '../consent/consent.service';
import { TenantService } from '../tenant/tenant.service';
import { PaymentService } from '../payment/payment.service';
import { SaveApplicationDraftDto } from './dto/save-application-draft.dto';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { GrievanceCase } from '../database/entities/grievance-case.entity';
import { AppealCase } from '../database/entities/appeal-case.entity';
import { CitizenFeedback } from '../database/entities/citizen-feedback.entity';
import { ApplicationOutput } from '../database/entities/application-output.entity';
import { S3StorageService } from '../upload/s3-storage.service';
import { evaluateEligibilityRules } from '../validation/eligibility-rules';
import { firstHumanWorkflowStage, WorkflowRuntimeStage } from '../producer/workflow-runtime';

function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

@Injectable()
export class ConsumerService {
  constructor(
    @InjectRepository(TenantEntityService)
    private tenantServiceRepository: Repository<TenantEntityService>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(ConsumerUser)
    private consumerUserRepository: Repository<ConsumerUser>,
    @InjectRepository(ApplicationEvent)
    private applicationEventRepository: Repository<ApplicationEvent>,
    @InjectRepository(ApplicationDeficiency)
    private applicationDeficiencyRepository: Repository<ApplicationDeficiency>,
    @InjectRepository(GrievanceCase)
    private grievanceRepository: Repository<GrievanceCase>,
    @InjectRepository(AppealCase)
    private appealRepository: Repository<AppealCase>,
    @InjectRepository(CitizenFeedback)
    private feedbackRepository: Repository<CitizenFeedback>,
    @InjectRepository(ApplicationOutput)
    private outputRepository: Repository<ApplicationOutput>,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
    private readonly consentService: ConsentService,
    private readonly tenantService: TenantService,
    private readonly paymentService: PaymentService,
    @Optional() private readonly s3Storage?: S3StorageService,
  ) {}

  async getServices(category?: string, search?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const cacheKey = `consumer:services:${category || 'all'}:${search || 'all'}:${safePage}:${safeLimit}`;
    return this.cacheService.readThrough({
      key: cacheKey,
      domain: 'consumer-services-list',
      endpoint: 'consumer.getServices',
      featureFlag: 'consumer.services.cache',
      loader: async () => {
        const queryBuilder = this.tenantServiceRepository
          .createQueryBuilder('ts')
          .leftJoinAndSelect('ts.tenant', 't')
          .where('ts.published = :published', { published: true })
          .andWhere('ts.archived = :archived', { archived: false })
          .andWhere('t.status = :status', { status: 'active' })
          .skip(skip)
          .take(safeLimit);

        if (category) {
          queryBuilder.andWhere('ts.category = :category', { category });
        }

        if (search) {
          queryBuilder.andWhere(
            '(ts.name ILIKE :search OR ts.description ILIKE :search)',
            { search: `%${escapeLikePattern(search)}%` },
          );
        }

        const [services, total] = await queryBuilder.getManyAndCount();

        return {
          data: services.map((service) => ({
            id: service.id,
            service_release_id: service.current_release_id,
            tenant_id: service.tenant_id,
            tenant_name: service.tenant?.name,
            name: service.name,
            category: service.category,
            description: service.description,
            sla_days: service.sla_days,
            fees: service.fees,
          })),
          total,
          page: safePage,
          limit: safeLimit,
        };
      },
    });
  }

  async getServiceById(serviceId: string) {
    return this.cacheService.readThrough({
      key: `consumer:service:${serviceId}`,
      domain: 'consumer-service-detail',
      endpoint: 'consumer.getServiceById',
      featureFlag: 'consumer.serviceDetail.cache',
      loader: async () => {
        const service = await this.tenantServiceRepository.findOne({
          where: { id: serviceId, published: true, archived: false },
          relations: ['tenant'],
        });

        if (!service || !service.current_release_id || service.tenant?.status !== 'active') {
          throw new NotFoundException('Service not found');
        }

        return {
          id: service.id,
          service_release_id: service.current_release_id,
          tenant_id: service.tenant_id,
          tenant_name: service.tenant.name,
          name: service.name,
          category: service.category,
          description: service.description,
          sla_days: service.sla_days,
          fees: service.fees,
          form_schema: service.form_schema,
          workflow_config: service.workflow_config,
          eligibility_rules: service.eligibility_rules,
          required_documents: service.required_documents,
          manifest: service.manifest,
          schema_version: service.schema_version ?? 1,
        };
      },
    });
  }

  async getFormSchema(serviceId: string) {
    return this.cacheService.readThrough({
      key: `consumer:form-schema:${serviceId}`,
      domain: 'consumer-form-schema',
      endpoint: 'consumer.getFormSchema',
      featureFlag: 'consumer.formSchema.cache',
      loader: async () => {
        const service = await this.tenantServiceRepository.findOne({
          where: { id: serviceId, published: true, archived: false },
          relations: ['tenant'],
        });

        if (!service || !service.current_release_id || service.tenant?.status !== 'active') {
          throw new NotFoundException('Service not found');
        }

        // Extract tenant theme from branding JSONB
        const tenantTheme = (service.tenant?.branding as any)?.theme ?? null;

        return {
          service_id: serviceId,
          service_name: service.name,
          category: service.category,
          form_schema: service.form_schema,
          schema_version: service.schema_version ?? 1,
          service_release_id: service.current_release_id,
          theme: tenantTheme,
        };
      },
    });
  }

  async getServiceDraft(serviceId: string, consumerId: string) {
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, published: true, archived: false },
      relations: ['tenant'],
    });
    if (!service || !service.current_release_id || service.tenant?.status !== 'active') {
      throw new NotFoundException('Service not found');
    }

    const draft = await this.applicationRepository.findOne({
      where: {
        service_id: serviceId,
        service_release_id: service.current_release_id,
        consumer_id: consumerId,
        status: 'DRAFT',
      },
    });
      if (!draft) return null;

    return {
      application_id: draft.id,
      service_id: draft.service_id,
      service_release_id: draft.service_release_id,
      form_data: draft.form_data,
      schema_version: draft.schema_version,
      tracking_number: draft.tracking_number,
      updated_at: draft.updated_at,
    };
  }

  async saveServiceDraft(
    serviceId: string,
    consumerId: string,
    consumerSource: string,
    dto: SaveApplicationDraftDto,
  ) {
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, published: true, archived: false },
      relations: ['tenant'],
    });
    if (!service || !service.current_release_id || service.tenant?.status !== 'active') {
      throw new NotFoundException('Service not found');
    }
    const schemaVersion = dto.schemaVersion ?? service.schema_version ?? 1;
    if (schemaVersion !== (service.schema_version ?? 1)) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Schema version mismatch',
        currentVersion: service.schema_version ?? 1,
        submittedVersion: schemaVersion,
        changes: this.computeSchemaDiff(service, schemaVersion),
      });
    }

    let draft = dto.applicationId
      ? await this.applicationRepository.findOne({
          where: {
            id: dto.applicationId,
            service_id: serviceId,
            service_release_id: service.current_release_id,
            consumer_id: consumerId,
            status: 'DRAFT',
          },
        })
      : await this.applicationRepository.findOne({
          where: {
            service_id: serviceId,
            service_release_id: service.current_release_id,
            consumer_id: consumerId,
            status: 'DRAFT',
          },
        });

    if (dto.applicationId && !draft) {
      throw new NotFoundException('Draft not found for this citizen and service release');
    }

    if (!draft) {
      draft = this.applicationRepository.create({
        tenant_id: service.tenant_id,
        service_id: serviceId,
        service_release_id: service.current_release_id,
        consumer_id: consumerId,
        consumer_source: consumerSource,
        form_data: dto.formData,
        status: 'DRAFT',
        current_stage: 'Draft',
        tracking_number: this.generateTrackingNumber(),
        idempotency_key: null,
        schema_version: schemaVersion,
        offline_submitted_at: null,
      });
    } else {
      draft.form_data = dto.formData;
      draft.schema_version = schemaVersion;
    }

    try {
      const saved = await this.applicationRepository.save(draft);
      return {
        application_id: saved.id,
        service_id: saved.service_id,
        service_release_id: saved.service_release_id,
        schema_version: saved.schema_version,
        tracking_number: saved.tracking_number,
        updated_at: saved.updated_at,
      };
    } catch (error: any) {
      if (error?.code !== '23505' || dto.applicationId) throw error;
      const existing = await this.applicationRepository.findOne({
        where: {
          service_id: serviceId,
          service_release_id: service.current_release_id,
          consumer_id: consumerId,
          status: 'DRAFT',
        },
      });
      if (!existing) throw error;
      existing.form_data = dto.formData;
      existing.schema_version = schemaVersion;
      return this.applicationRepository.save(existing);
    }
  }

  async submitApplication(
    serviceId: string,
    consumerId: string,
    consumerSource: string,
    formData: any,
    idempotencyKey?: string,
    schemaVersion?: number,
    offlineSubmittedAt?: string,
    draftApplicationId?: string,
  ) {
    // If a key was provided, return any existing record to ensure idempotency
    if (idempotencyKey) {
      const existing = await this.applicationRepository.findOne({
        where: { idempotency_key: idempotencyKey },
      });
      if (existing) {
        return {
          application_id: existing.id,
          tracking_number: existing.tracking_number,
          status: existing.status,
          submitted_at: existing.created_at,
          idempotent: true,
        };
      }
    }

    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, published: true, archived: false },
      relations: ['tenant'],
    });

    if (!service || !service.current_release_id || service.tenant?.status !== 'active') {
      throw new NotFoundException('Service not found');
    }

    const allowedEligibilityFields = new Set<string>(
      Array.isArray(service.form_schema?.fields)
        ? service.form_schema.fields
            .map((field: { id?: unknown }) => field.id)
            .filter((id: unknown): id is string => typeof id === 'string')
        : [],
    );
    const eligibilityResult = evaluateEligibilityRules(
      service.eligibility_rules,
      formData,
      allowedEligibilityFields,
    );

    // ── Schema version conflict check ──────────────────────────────────────
    // If the client provided a schema version, verify it matches the current
    // service schema version. If not, return a 409 with a field-level diff.
    if (schemaVersion !== undefined && schemaVersion !== null) {
      const currentVersion = service.schema_version ?? 1;
      if (schemaVersion !== currentVersion) {
        const changes = this.computeSchemaDiff(service, schemaVersion);
        throw new ConflictException({
          statusCode: 409,
          error: 'Schema version mismatch',
          currentVersion,
          submittedVersion: schemaVersion,
          changes,
        });
      }
    }

    // Read tenant consent policy — whether consent is required and which purposes
    const consentPolicy = await this.tenantService.getEffectiveConsentPolicy(service.tenant_id);

    if (consentPolicy.require_consent_before_submission) {
      const purposes: string[] = consentPolicy.consent_purposes?.length
        ? consentPolicy.consent_purposes
        : ['service_delivery'];

      for (const purpose of purposes) {
        const hasConsent = await this.consentService.isConsentActive(
          consumerId,
          service.tenant_id,
          purpose,
        );
        if (!hasConsent) {
          throw new ForbiddenException(
            `Consent for purpose "${purpose}" is required before submitting an application. ` +
            'Please grant consent via POST /consumer/consent/request.',
          );
        }
      }
    }

    // ── Payment gate ──────────────────────────────────────────────────────
    // If the form schema has a payment field with a non-zero fee, verify
    // that a completed payment record exists before allowing submission.
    const formSchema = service.form_schema;
    let paymentDetails: { amount: number; currency: string; transactionId: string } | null = null;

    if (formSchema) {
      // assertPaymentCompleted throws HTTP 402 if payment is required but not completed
      await this.paymentService.assertPaymentCompleted(
        idempotencyKey ? idempotencyKey : serviceId + ':' + consumerId,
        formSchema,
      );

      // If we get here and there's a payment field, fetch payment details for the response
      const paymentField = Array.isArray(formSchema.fields)
        ? (formSchema.fields as any[]).find((f: any) => f.type === 'payment')
        : null;
      if (paymentField) {
        const paymentRecord = await this.paymentService.getPaymentByApplication(
          idempotencyKey ? idempotencyKey : serviceId + ':' + consumerId,
        );
        if (paymentRecord && paymentRecord.status === 'completed') {
          paymentDetails = {
            amount: paymentRecord.amount_paise,
            currency: paymentRecord.currency,
            transactionId: paymentRecord.razorpay_payment_id ?? paymentRecord.razorpay_order_id ?? '',
          };
        }
      }
    }

    const applicationId = uuidv4();
    const draft = draftApplicationId
      ? await this.applicationRepository.findOne({
          where: {
            id: draftApplicationId,
            service_id: serviceId,
            service_release_id: service.current_release_id,
            consumer_id: consumerId,
            status: 'DRAFT',
          },
        })
      : null;
    if (draftApplicationId && !draft) {
      throw new NotFoundException('Draft not found for this citizen and service release');
    }
    const resolvedApplicationId = draft?.id ?? applicationId;
    const trackingNumber = draft?.tracking_number ?? this.generateTrackingNumber();
    const workflowStages = Array.isArray(service.workflow_config?.stages)
      ? service.workflow_config.stages as WorkflowRuntimeStage[]
      : [];
    const firstStage = firstHumanWorkflowStage(workflowStages)?.id
      || workflowStages[0]?.name
      || 'Submitted';
    const submittedAt = new Date();

    // ── Queue-first write path ──────────────────────────────────────────────
    // When the queue write path is enabled, we generate the ID + tracking number
    // upfront, enqueue a durable 'application.persist' command, and return
    // immediately. The QueueWorkerService persists the record and sends webhooks
    // asynchronously, giving us safe degradation under high submission load.
    if (this.queueService.isWritePathEnabled() && !draft) {
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'application.persist',
        module: 'consumer.submitApplication',
        payload: {
          applicationId,
          tenantId: service.tenant_id,
          serviceId,
          serviceReleaseId: service.current_release_id,
          consumerId,
          consumerSource,
          formData,
          eligibilityResult,
          status: 'submitted',
          currentStage: firstStage,
          trackingNumber,
          idempotencyKey: idempotencyKey ?? null,
          submittedAt: submittedAt.toISOString(),
        },
        idempotencyKey: idempotencyKey ?? `application.persist:${applicationId}`,
      });

      if (enqueueResult.queued) {
        this.cacheService.invalidateByPrefix(`consumer:applications:${consumerId}:`);
        this.cacheService.invalidateByPrefix(`producer:applications:${service.tenant_id}:`);
        return {
          application_id: applicationId,
          tracking_number: trackingNumber,
          status: 'submitted',
          submitted_at: submittedAt,
          queued: true,
        };
      }
      // Graceful degradation: queue unavailable → fall through to direct write
    }

    // ── Direct-write fallback path ──────────────────────────────────────────
    this.queueService.recordDirectWriteBypass(
      'consumer.submitApplication',
      'Application submission falling back to direct DB write: queue unavailable or write path disabled.',
    );

    const application = this.applicationRepository.create({
      id: resolvedApplicationId,
      tenant_id: service.tenant_id,
      service_id: serviceId,
      service_release_id: service.current_release_id,
      consumer_id: consumerId,
      consumer_source: consumerSource,
      form_data: formData,
      eligibility_result: eligibilityResult,
      status: 'submitted',
      current_stage: firstStage,
      tracking_number: trackingNumber,
      idempotency_key: idempotencyKey ?? draft?.idempotency_key ?? null,
      schema_version: schemaVersion ?? null,
      offline_submitted_at: offlineSubmittedAt ? new Date(offlineSubmittedAt) : null,
    });

    application.status = 'submitted';
    application.current_stage = firstStage;
    application.form_data = formData;
    await this.applicationRepository.save(application);
    await this.queueService.publishShadowWriteEvent({
      type: 'application.submitted',
      module: 'consumer.submitApplication.shadow',
      payload: {
        applicationId: application.id,
        tenantId: application.tenant_id,
        serviceId: application.service_id,
        consumerId: application.consumer_id,
        status: application.status,
        currentStage: application.current_stage,
      },
      idempotencyKey: `application.submitted:${application.id}`,
    });
    this.cacheService.invalidateByPrefix(`consumer:applications:${consumerId}:`);
    this.cacheService.invalidateByPrefix(`producer:applications:${service.tenant_id}:`);

    return {
      application_id: application.id,
      tracking_number: application.tracking_number,
      status: application.status,
      submitted_at: application.created_at,
      queued: false,
      ...(paymentDetails ? { payment: paymentDetails } : {}),
    };
  }

  async getApplicationStatus(applicationId: string, consumerId: string) {
    return this.cacheService.readThrough({
      key: `consumer:application:${consumerId}:${applicationId}`,
      domain: 'consumer-applications',
      endpoint: 'consumer.getApplicationStatus',
      featureFlag: 'consumer.applications.cache',
      loader: async () => {
        const application = await this.applicationRepository.findOne({
          where: { id: applicationId, consumer_id: consumerId },
        });

        if (!application) {
          throw new NotFoundException('Application not found');
        }

        const service = await this.tenantServiceRepository.findOne({
          where: { id: application.service_id },
          relations: ['tenant'],
        });

        const [statusHistory, deficiencies] = await Promise.all([
          this.applicationEventRepository.find({
            where: { application_id: application.id, tenant_id: application.tenant_id },
            order: { created_at: 'ASC' },
          }),
          this.applicationDeficiencyRepository.find({
            where: { application_id: application.id, tenant_id: application.tenant_id },
            order: { created_at: 'DESC' },
          }),
        ]);

        return {
          application_id: application.id,
          service_id: application.service_id,
          tenant_id: application.tenant_id,
          tracking_number: application.tracking_number,
          status: application.status,
          current_stage: application.current_stage,
          service_name: service?.name,
          tenant_name: service?.tenant?.name,
          submitted_at: application.created_at,
          last_updated: application.updated_at,
          status_history: statusHistory,
          deficiencies,
        };
      },
    });
  }

  async getApplicationOutput(applicationId: string, consumerId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (!['approved', 'completed', 'APPROVED', 'COMPLETED'].includes(application.status)) {
      throw new BadRequestException('Certificate output is not available for this application');
    }
    const output = await this.outputRepository.findOne({
      where: { application_id: applicationId, consumer_id: consumerId, status: 'issued' },
    });
    if (!output) throw new NotFoundException('Certificate output not found');
    return {
      ...output,
      download_url: output.storage_key && this.s3Storage
        ? await this.s3Storage.getPresignedDownloadUrl(output.storage_key)
        : null,
    };
  }

  async getApplicationsByConsumer(consumerId: string, status?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    return this.cacheService.readThrough({
      key: `consumer:applications:${consumerId}:${status || 'all'}:${safePage}:${safeLimit}`,
      domain: 'consumer-applications',
      endpoint: 'consumer.getApplicationsByConsumer',
      featureFlag: 'consumer.applications.cache',
      loader: async () => {
        const queryBuilder = this.applicationRepository
          .createQueryBuilder('a')
          .leftJoin(TenantEntityService, 'ts', 'ts.id = a.service_id')
          .addSelect('ts.name', 'service_name')
          .where('a.consumer_id = :consumerId', { consumerId })
          .skip(skip)
          .take(safeLimit);

        if (status) {
          queryBuilder.andWhere('a.status = :status', { status });
        }

        queryBuilder.orderBy('a.created_at', 'DESC');

        const [rawApps, total] = await Promise.all([
          queryBuilder.getRawMany<{
            a_id: string;
            a_tracking_number: string;
            a_status: string;
            a_current_stage: string | null;
            a_created_at: Date;
            service_name: string | null;
          }>(),
          this.applicationRepository.count({ where: { consumer_id: consumerId } }),
        ]);

        return {
          data: rawApps.map((app) => ({
            application_id: app.a_id,
            tracking_number: app.a_tracking_number,
            status: app.a_status,
            current_stage: app.a_current_stage,
            service_name: app.service_name,
            submitted_at: app.a_created_at,
          })),
          total,
          page: safePage,
          limit: safeLimit,
        };
      },
    });
  }

  /**
   * Compute a field-level diff between the submitted schema version and the
   * current schema. Returns an array of change descriptors.
   *
   * If the submitted version is not found in history, returns null (too old).
   */
  private computeSchemaDiff(
    service: any,
    submittedVersion: number,
  ): Array<{ field: string; change: 'added' | 'removed' | 'modified'; label: string; detail?: string }> | null {
    const history: any[] = Array.isArray(service.schema_version_history)
      ? service.schema_version_history
      : [];

    // Find the snapshot for the submitted version
    const snapshot = history.find((s: any) => s.version === submittedVersion);
    if (!snapshot) {
      // Version too old — cannot compute precise diff
      return null;
    }

    const oldFields: any[] = Array.isArray(snapshot.schema?.fields) ? snapshot.schema.fields : [];
    const newFields: any[] = Array.isArray(service.form_schema?.fields) ? service.form_schema.fields : [];

    const oldMap = new Map<string, any>(oldFields.map((f: any) => [f.id, f]));
    const newMap = new Map<string, any>(newFields.map((f: any) => [f.id, f]));

    const changes: Array<{ field: string; change: 'added' | 'removed' | 'modified'; label: string; detail?: string }> = [];

    // Added fields (in new but not in old)
    for (const [id, field] of newMap) {
      if (!oldMap.has(id)) {
        changes.push({ field: id, change: 'added', label: field.label || id });
      }
    }

    // Removed fields (in old but not in new)
    for (const [id, field] of oldMap) {
      if (!newMap.has(id)) {
        changes.push({ field: id, change: 'removed', label: field.label || id });
      }
    }

    // Modified fields (in both but different)
    for (const [id, oldField] of oldMap) {
      const newField = newMap.get(id);
      if (newField) {
        const oldJson = JSON.stringify(oldField);
        const newJson = JSON.stringify(newField);
        if (oldJson !== newJson) {
          // Find first differing key for detail
          let detail: string | undefined;
          for (const key of Object.keys(newField)) {
            if (JSON.stringify(oldField[key]) !== JSON.stringify(newField[key])) {
              detail = `${key} changed from ${JSON.stringify(oldField[key])} to ${JSON.stringify(newField[key])}`;
              break;
            }
          }
          changes.push({ field: id, change: 'modified', label: newField.label || id, detail });
        }
      }
    }

    return changes;
  }

  private generateTrackingNumber(): string {
    const prefix = 'APP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async trackApplication(trackingNumber: string) {
    const application = await this.applicationRepository.findOne({
      where: { tracking_number: trackingNumber },
    });
    if (!application) throw new NotFoundException('Application not found');

    return {
      application_id: application.id,
      tracking_number: application.tracking_number,
      status: application.status,
      current_stage: application.current_stage,
      submitted_at: application.created_at,
      last_updated: application.updated_at,
    };
  }

  async updateDraft(applicationId: string, consumerId: string, formData: Record<string, any>) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT applications can be updated');
    }

    application.form_data = formData;
    await this.applicationRepository.save(application);

    this.cacheService.invalidate(`consumer:application:${consumerId}:${applicationId}`);
    this.cacheService.invalidateByPrefix(`consumer:applications:${consumerId}:`);

    return {
      application_id: application.id,
      tracking_number: application.tracking_number,
      status: application.status,
      updated_at: application.updated_at,
    };
  }

  async submitDeficiencyResponse(
    applicationId: string,
    consumerId: string,
    payload: { notes?: string; formData?: Record<string, any> },
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, consumer_id: consumerId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const openDeficiencies = await this.applicationDeficiencyRepository.find({
      where: { application_id: application.id, tenant_id: application.tenant_id, status: 'open' },
      order: { created_at: 'ASC' },
    });

    if (openDeficiencies.length === 0) {
      throw new BadRequestException('No open deficiency found for this application.');
    }

    const service = await this.tenantServiceRepository.findOne({
      where: { id: application.service_id, tenant_id: application.tenant_id, archived: false },
    });
    const stages = Array.isArray(service?.workflow_config?.stages)
      ? service.workflow_config.stages as Array<{ id: string; name?: string; nextStages?: string[] }>
      : [];
    const currentStage = stages.find((stage) =>
      stage.id === application.current_stage || stage.name === application.current_stage,
    );
    const nextStageId = currentStage?.nextStages?.[0];
    const nextStage = nextStageId
      ? stages.find((stage) => stage.id === nextStageId || stage.name === nextStageId)
      : null;

    if (payload.formData && Object.keys(payload.formData).length > 0) {
      application.form_data = {
        ...(application.form_data || {}),
        ...payload.formData,
      };
    }

    application.status = 'UNDER_REVIEW';
    application.current_stage = nextStage?.id ?? nextStageId ?? 'under_review';
    await this.applicationRepository.save(application);

    await this.applicationEventRepository.save(
      this.applicationEventRepository.create({
        application_id: application.id,
        tenant_id: application.tenant_id,
        actor_id: consumerId,
        actor_role: 'consumer',
        event_type: 'deficiency.response_submitted',
        from_status: 'PENDING_DOCUMENTS',
        to_status: 'UNDER_REVIEW',
        stage: application.current_stage,
        title: 'Deficiency response submitted',
        notes: payload.notes ?? null,
        metadata: {
          responseType: 'citizen',
          resolvedDeficiencies: openDeficiencies.length,
        },
      }),
    );

    for (const deficiency of openDeficiencies) {
      deficiency.status = 'resolved';
      deficiency.resolved_at = new Date();
      deficiency.resolution_notes = payload.notes ?? 'Citizen submitted a deficiency response.';
      await this.applicationDeficiencyRepository.save(deficiency);
    }

    this.cacheService.invalidateByPrefix(`consumer:applications:${consumerId}:`);
    this.cacheService.invalidate(`consumer:application:${consumerId}:${applicationId}`);
    this.cacheService.invalidateByPrefix(`producer:applications:${application.tenant_id}:`);
    this.cacheService.invalidate(`producer:application:${application.tenant_id}:${applicationId}`);

    return {
      application_id: application.id,
      tracking_number: application.tracking_number,
      status: application.status,
      current_stage: application.current_stage,
      submitted_at: application.created_at,
    };
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  async getProfile(consumerId: string) {
    const user = await this.consumerUserRepository.findOne({ where: { id: consumerId } });
    if (!user) throw new NotFoundException('Profile not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      consumer_source: user.consumer_source,
      created_at: user.created_at,
    };
  }

  async updateProfile(consumerId: string, dto: { name?: string; email?: string; phone?: string }) {
    const user = await this.consumerUserRepository.findOne({ where: { id: consumerId } });
    if (!user) throw new NotFoundException('Profile not found');
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    await this.consumerUserRepository.save(user);
    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
  }

  // ─── Notifications (derived from audit logs for the consumer) ────────────

  async getNotifications(consumerId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    // Notifications are derived from application status-change audit events
    const applications = await this.applicationRepository.find({
      where: { consumer_id: consumerId },
      order: { updated_at: 'DESC' },
      skip,
      take: safeLimit,
      select: ['id', 'tracking_number', 'status', 'updated_at'],
    });

    const notifications = applications.map((app) => ({
      id: app.id,
      type: 'application_update',
      title: `Application ${app.tracking_number} ${app.status.toLowerCase().replace('_', ' ')}`,
      message: `Your application status changed to ${app.status}`,
      read: false,
      created_at: app.updated_at,
      meta: { applicationId: app.id, trackingNumber: app.tracking_number, status: app.status },
    }));

    const total = await this.applicationRepository.count({ where: { consumer_id: consumerId } });
    return { data: notifications, total, page: safePage, limit: safeLimit };
  }

  async markNotificationRead(_consumerId: string, _notificationId: string) {
    // Notifications are derived — mark-as-read is a client-side concern in this MVP
    return;
  }

  async markAllNotificationsRead(_consumerId: string) {
    return;
  }

  // ─── Grievances, appeals, and independent feedback ───────────────────────

  async getGrievances(consumerId: string, status?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const where: any = { consumer_id: consumerId };
    if (status) where.status = status;
    const [data, total] = await this.grievanceRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async getGrievanceById(consumerId: string, grievanceId: string) {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId, consumer_id: consumerId },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async createGrievance(consumerId: string, dto: CreateGrievanceDto) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status === 'DRAFT') throw new BadRequestException('Submit the application before creating a grievance');
    const now = new Date();
    const grievance = this.grievanceRepository.create({
      tenant_id: application.tenant_id,
      application_id: application.id,
      service_release_id: application.service_release_id,
      consumer_id: consumerId,
      category: dto.category,
      subject: dto.subject,
      description: dto.description,
      status: 'submitted',
      assigned_to: null,
      resolution: null,
      resolved_at: null,
      reopened_at: null,
      due_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      timeline: [{ event: 'submitted', actorId: consumerId, at: now.toISOString() }],
    });
    return this.grievanceRepository.save(grievance);
  }

  async addGrievanceComment(consumerId: string, grievanceId: string, comment: string) {
    const grievance = await this.grievanceRepository.findOne({ where: { id: grievanceId, consumer_id: consumerId } });
    if (!grievance) throw new NotFoundException('Grievance not found');
    grievance.timeline = [...(grievance.timeline ?? []), {
      event: 'citizen_comment',
      actorId: consumerId,
      comment: comment.slice(0, 2000),
      at: new Date().toISOString(),
    }];
    await this.grievanceRepository.save(grievance);
  }

  async reopenGrievance(consumerId: string, grievanceId: string, reason: string) {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId, consumer_id: consumerId },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    if (grievance.status !== 'resolved' || !grievance.resolved_at) {
      throw new BadRequestException('Only a resolved grievance may be reopened');
    }
    if (Date.now() - grievance.resolved_at.getTime() > 30 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('The 30-day reopening period has expired');
    }
    const now = new Date();
    grievance.status = 'reopened';
    grievance.reopened_at = now;
    grievance.timeline = [...(grievance.timeline ?? []), {
      event: 'reopened', actorId: consumerId, reason, at: now.toISOString(),
    }];
    return this.grievanceRepository.save(grievance);
  }

  async getAppeals(consumerId: string, applicationId?: string) {
    return this.appealRepository.find({
      where: applicationId ? { consumer_id: consumerId, application_id: applicationId } : { consumer_id: consumerId },
      order: { created_at: 'DESC' },
    });
  }

  async createAppeal(consumerId: string, dto: CreateAppealDto) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');
    const status = application.status.toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestException('Only a final approval or rejection decision can be appealed');
    }

    const decisionEvents = await this.applicationEventRepository.find({
      where: { application_id: application.id },
      order: { created_at: 'DESC' },
    });
    const decisionEvent = decisionEvents.find((event) => event.to_status?.toUpperCase() === status);
    if (!decisionEvent) throw new BadRequestException('The final decision has no appealable decision record');

    const appealDeadline = new Date(decisionEvent.created_at.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (Date.now() > appealDeadline.getTime()) throw new BadRequestException('The 30-day appeal period has expired');
    const existing = await this.appealRepository.findOne({ where: { application_id: application.id } });
    if (existing) throw new ConflictException('An appeal already exists for this application');

    const now = new Date();
    return this.appealRepository.save(this.appealRepository.create({
      tenant_id: application.tenant_id,
      application_id: application.id,
      service_release_id: application.service_release_id,
      consumer_id: consumerId,
      original_decision_event_id: decisionEvent.id,
      original_decision_actor_id: decisionEvent.actor_id,
      original_decision: status,
      grounds: dto.grounds,
      statement: dto.statement,
      status: 'submitted',
      assigned_to: null,
      decided_by: null,
      decision_reason: null,
      decided_at: null,
      submitted_at: now,
      appeal_deadline: appealDeadline,
      timeline: [{ event: 'submitted', actorId: consumerId, at: now.toISOString() }],
    }));
  }

  async getCitizenFeedback(consumerId: string, applicationId?: string) {
    return this.feedbackRepository.find({
      where: applicationId ? { consumer_id: consumerId, application_id: applicationId } : { consumer_id: consumerId },
      order: { created_at: 'DESC' },
    });
  }

  async submitFeedback(consumerId: string, dto: SubmitFeedbackDto) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (!['COMPLETED', 'APPROVED', 'REJECTED'].includes(application.status.toUpperCase())) {
      throw new BadRequestException('Feedback is available after a final service decision');
    }
    const existing = await this.feedbackRepository.findOne({
      where: { application_id: application.id, consumer_id: consumerId },
    });
    if (existing) throw new ConflictException('Feedback has already been submitted for this application');

    const feedback = this.feedbackRepository.create({
      tenant_id: application.tenant_id,
      application_id: application.id,
      service_release_id: application.service_release_id,
      consumer_id: consumerId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      tags: dto.tags ?? [],
      status: 'submitted',
      assigned_to: null,
      response: null,
      closed_at: null,
    });
    return this.feedbackRepository.save(feedback);
  }
}
