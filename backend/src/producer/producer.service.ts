import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import * as bcrypt from 'bcrypt';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';

@Injectable()
export class ProducerService {
  constructor(
    @InjectRepository(TenantService)
    private tenantServiceRepository: Repository<TenantService>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(TenantUser)
    private tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
  ) {}

  async createService(tenantId: string, serviceData: any) {
    const serviceId = uuidv4();
    const servicePayload = {
      serviceId,
      tenantId,
      name: serviceData.name,
      category: serviceData.category,
      description: serviceData.description,
      formSchema: serviceData.formSchema,
      workflowConfig: serviceData.workflowConfig,
      eligibilityRules: serviceData.eligibilityRules,
      requiredDocuments: serviceData.requiredDocuments,
      backendApiConfig: serviceData.backendApiConfig,
      published: serviceData.published || false,
      slaDays: serviceData.slaDays,
      fees: serviceData.fees,
    };

    // ── Queue-first write path ──────────────────────────────────────────────
    if (this.queueService.isWritePathEnabled()) {
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'service.persist.create',
        module: 'producer.createService',
        payload: servicePayload,
        idempotencyKey: `service.persist.create:${serviceId}`,
      });

      if (enqueueResult.queued) {
        void this.queueService.publishShadowWriteEvent({
          type: 'service.created',
          module: 'producer.createService.shadow',
          payload: { serviceId, tenantId, published: serviceData.published || false },
          idempotencyKey: `service.created:${serviceId}`,
        });
        this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
        this.cacheService.invalidateByPrefix('consumer:services:');
        return {
          id: serviceId,
          name: serviceData.name,
          category: serviceData.category,
          published: serviceData.published || false,
          queued: true,
        };
      }
      // Graceful degradation: queue unavailable → fall through to direct write
    }

    // ── Direct-write fallback path ──────────────────────────────────────────
    this.queueService.recordDirectWriteBypass(
      'producer.createService',
      'Service creation falling back to direct DB write: queue unavailable or write path disabled.',
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
      published: serviceData.published || false,
      sla_days: serviceData.slaDays,
      fees: serviceData.fees,
    });

    await this.tenantServiceRepository.save(service);
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
    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');

    return {
      id: service.id,
      name: service.name,
      category: service.category,
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
          where: { tenant_id: tenantId },
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
          where: { id: serviceId, tenant_id: tenantId },
        });

        if (!service) {
          throw new NotFoundException('Service not found');
        }

        return service;
      },
    });
  }

  async updateService(tenantId: string, serviceId: string, updateData: any) {
    // Fetch current record for ownership validation and delta computation
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, tenant_id: tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const updatePayload = {
      serviceId,
      tenantId,
      name: updateData.name ?? service.name,
      category: updateData.category ?? service.category,
      description: updateData.description ?? service.description,
      formSchema: updateData.formSchema ?? service.form_schema,
      workflowConfig: updateData.workflowConfig ?? service.workflow_config,
      eligibilityRules: updateData.eligibilityRules ?? service.eligibility_rules,
      requiredDocuments: updateData.requiredDocuments ?? service.required_documents,
      backendApiConfig: updateData.backendApiConfig ?? service.backend_api_config,
      published: updateData.published ?? service.published,
      slaDays: updateData.slaDays ?? service.sla_days,
      fees: updateData.fees ?? service.fees,
    };

    // ── Queue-first write path ──────────────────────────────────────────────
    if (this.queueService.isWritePathEnabled()) {
      const idempotencyKey = `service.persist.update:${serviceId}:${Date.now()}`;
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'service.persist.update',
        module: 'producer.updateService',
        payload: updatePayload,
        idempotencyKey,
      });

      if (enqueueResult.queued) {
        this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
        this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
        this.cacheService.invalidate(`consumer:service:${serviceId}`);
        this.cacheService.invalidate(`consumer:form-schema:${serviceId}`);
        this.cacheService.invalidateByPrefix('consumer:services:');
        return { id: serviceId, name: updatePayload.name, published: updatePayload.published, queued: true };
      }
    }

    // ── Direct-write fallback path ──────────────────────────────────────────
    this.queueService.recordDirectWriteBypass(
      'producer.updateService',
      'Service update falling back to direct DB write: queue unavailable or write path disabled.',
    );

    Object.assign(service, {
      name: updateData.name ?? service.name,
      category: updateData.category ?? service.category,
      description: updateData.description ?? service.description,
      form_schema: updateData.formSchema ?? service.form_schema,
      workflow_config: updateData.workflowConfig ?? service.workflow_config,
      eligibility_rules: updateData.eligibilityRules ?? service.eligibility_rules,
      required_documents: updateData.requiredDocuments ?? service.required_documents,
      backend_api_config: updateData.backendApiConfig ?? service.backend_api_config,
      published: updateData.published ?? service.published,
      sla_days: updateData.slaDays ?? service.sla_days,
      fees: updateData.fees ?? service.fees,
    });

    await this.tenantServiceRepository.save(service);
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

    return {
      id: service.id,
      name: service.name,
      published: service.published,
      updated_at: service.updated_at,
    };
  }

  async deleteService(tenantId: string, serviceId: string) {
    // Fetch for ownership + application safety check (always a necessary DB read)
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, tenant_id: tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const applicationCount = await this.applicationRepository.count({
      where: { service_id: serviceId },
    });

    if (applicationCount > 0) {
      throw new ForbiddenException(
        `Cannot delete service with ${applicationCount} existing applications`,
      );
    }

    // ── Queue-first write path ──────────────────────────────────────────────
    if (this.queueService.isWritePathEnabled()) {
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'service.persist.delete',
        module: 'producer.deleteService',
        payload: { serviceId, tenantId },
        idempotencyKey: `service.persist.delete:${serviceId}`,
      });

      if (enqueueResult.queued) {
        this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
        this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
        this.cacheService.invalidate(`consumer:service:${serviceId}`);
        this.cacheService.invalidate(`consumer:form-schema:${serviceId}`);
        this.cacheService.invalidateByPrefix('consumer:services:');
        return { success: true, message: 'Service deletion queued', queued: true };
      }
    }

    // ── Direct-write fallback path ──────────────────────────────────────────
    this.queueService.recordDirectWriteBypass(
      'producer.deleteService',
      'Service deletion falling back to direct DB write: queue unavailable or write path disabled.',
    );

    await this.tenantServiceRepository.remove(service);
    await this.queueService.publishShadowWriteEvent({
      type: 'service.deleted',
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
      message: 'Service deleted successfully',
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

        return application;
      },
    });
  }

  async updateApplicationStatus(
    tenantId: string,
    applicationId: string,
    status: string,
    stage?: string,
  ) {
    this.queueService.recordDirectWriteBypass(
      'producer.updateApplicationStatus',
      'Application status updates are still writing directly to PostgreSQL because no durable queue/broker is configured.',
    );

    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, tenant_id: tenantId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = status;
    if (stage) {
      application.current_stage = stage;
    }

    await this.applicationRepository.save(application);
    await this.queueService.publishShadowWriteEvent({
      type: 'application.status-updated',
      module: 'producer.updateApplicationStatus.shadow',
      payload: {
        applicationId: application.id,
        tenantId: application.tenant_id,
        consumerId: application.consumer_id,
        status: application.status,
        currentStage: application.current_stage,
      },
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
    const service = await this.tenantServiceRepository.findOne({
      where: { id: serviceId, tenant_id: tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');

    service.published = published;
    await this.tenantServiceRepository.save(service);

    this.cacheService.invalidateByPrefix(`producer:services:${tenantId}`);
    this.cacheService.invalidate(`producer:service:${tenantId}:${serviceId}`);
    this.cacheService.invalidate(`consumer:service:${serviceId}`);
    this.cacheService.invalidateByPrefix('consumer:services:');

    return { id: service.id, name: service.name, published: service.published, updated_at: service.updated_at };
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
      branding: tenant.branding,
    };
  }

  async updateTenantSettings(
    tenantId: string,
    data: { name?: string; logo?: string; primaryColor?: string; secondaryColor?: string; customDomain?: string },
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (data.name) tenant.name = data.name;

    const branding: Record<string, any> = { ...((tenant.branding as any) || {}) };
    if (data.logo !== undefined) branding.logo_url = data.logo;
    if (data.primaryColor !== undefined) branding.primary_color = data.primaryColor;
    if (data.secondaryColor !== undefined) branding.secondary_color = data.secondaryColor;
    if (data.customDomain !== undefined) branding.custom_domain = data.customDomain;
    tenant.branding = branding as any;

    await this.tenantRepository.save(tenant);

    return { id: tenant.id, name: tenant.name, branding: tenant.branding };
  }
}

