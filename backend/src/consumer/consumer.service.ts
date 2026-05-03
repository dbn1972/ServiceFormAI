import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import { TenantService as TenantEntityService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { ConsentService } from '../consent/consent.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class ConsumerService {
  constructor(
    @InjectRepository(TenantEntityService)
    private tenantServiceRepository: Repository<TenantEntityService>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(ConsumerUser)
    private consumerUserRepository: Repository<ConsumerUser>,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
    private readonly consentService: ConsentService,
    private readonly tenantService: TenantService,
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
          .andWhere('t.status = :status', { status: 'active' })
          .skip(skip)
          .take(safeLimit);

        if (category) {
          queryBuilder.andWhere('ts.category = :category', { category });
        }

        if (search) {
          queryBuilder.andWhere(
            '(ts.name ILIKE :search OR ts.description ILIKE :search)',
            { search: `%${search}%` },
          );
        }

        const [services, total] = await queryBuilder.getManyAndCount();

        return {
          data: services.map((service) => ({
            id: service.id,
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
          where: { id: serviceId, published: true },
          relations: ['tenant'],
        });

        if (!service || service.tenant?.status !== 'active') {
          throw new NotFoundException('Service not found');
        }

        return {
          id: service.id,
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
          where: { id: serviceId, published: true },
        });

        if (!service) {
          throw new NotFoundException('Service not found');
        }

        return {
          service_id: serviceId,
          service_name: service.name,
          category: service.category,
          form_schema: service.form_schema,
        };
      },
    });
  }

  async submitApplication(
    serviceId: string,
    consumerId: string,
    consumerSource: string,
    formData: any,
    idempotencyKey?: string,
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
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
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

    const applicationId = uuidv4();
    const trackingNumber = this.generateTrackingNumber();
    const firstStage = service.workflow_config?.stages?.[0]?.name || 'Submitted';
    const submittedAt = new Date();

    // ── Queue-first write path ──────────────────────────────────────────────
    // When the queue write path is enabled, we generate the ID + tracking number
    // upfront, enqueue a durable 'application.persist' command, and return
    // immediately. The QueueWorkerService persists the record and sends webhooks
    // asynchronously, giving us safe degradation under high submission load.
    if (this.queueService.isWritePathEnabled()) {
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'application.persist',
        module: 'consumer.submitApplication',
        payload: {
          applicationId,
          tenantId: service.tenant_id,
          serviceId,
          consumerId,
          consumerSource,
          formData,
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
      id: applicationId,
      tenant_id: service.tenant_id,
      service_id: serviceId,
      consumer_id: consumerId,
      consumer_source: consumerSource,
      form_data: formData,
      status: 'submitted',
      current_stage: firstStage,
      tracking_number: trackingNumber,
      idempotency_key: idempotencyKey ?? null,
    });

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

        return {
          application_id: application.id,
          tracking_number: application.tracking_number,
          status: application.status,
          current_stage: application.current_stage,
          service_name: service?.name,
          tenant_name: service?.tenant?.name,
          submitted_at: application.created_at,
          last_updated: application.updated_at,
        };
      },
    });
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

  // ─── Grievances (stored in application metadata) ─────────────────────────

  async getGrievances(consumerId: string, _status?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const applications = await this.applicationRepository.find({
      where: { consumer_id: consumerId },
      order: { updated_at: 'DESC' },
      skip,
      take: safeLimit,
    });

    // Return grievances from application metadata
    const grievances = applications
      .filter((app) => Array.isArray(app.form_data?.['grievances']))
      .flatMap((app) =>
        (app.form_data['grievances'] as any[]).map((g: any) => ({
          ...g,
          applicationId: app.id,
          trackingNumber: app.tracking_number,
        })),
      );

    return { data: grievances, total: grievances.length, page: safePage, limit: safeLimit };
  }

  async getGrievanceById(consumerId: string, grievanceId: string) {
    const applications = await this.applicationRepository.find({
      where: { consumer_id: consumerId },
    });

    for (const app of applications) {
      const grievances: any[] = Array.isArray(app.form_data?.['grievances'])
        ? (app.form_data['grievances'] as any[])
        : [];
      const found = grievances.find((g: any) => g.id === grievanceId);
      if (found) return { ...found, applicationId: app.id };
    }
    throw new NotFoundException('Grievance not found');
  }

  async createGrievance(
    consumerId: string,
    dto: { applicationId: string; subject: string; description: string },
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');

    const grievanceId = uuidv4();
    const newGrievance = {
      id: grievanceId,
      subject: dto.subject,
      description: dto.description,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      comments: [],
    };

    const existing: any[] = Array.isArray(application.form_data?.['grievances'])
      ? (application.form_data['grievances'] as any[])
      : [];
    application.form_data = {
      ...(application.form_data || {}),
      grievances: [...existing, newGrievance],
    };
    await this.applicationRepository.save(application);
    return newGrievance;
  }

  async addGrievanceComment(consumerId: string, grievanceId: string, comment: string) {
    const applications = await this.applicationRepository.find({
      where: { consumer_id: consumerId },
    });

    for (const app of applications) {
      const grievances: any[] = Array.isArray(app.form_data?.['grievances'])
        ? (app.form_data['grievances'] as any[])
        : [];
      const idx = grievances.findIndex((g: any) => g.id === grievanceId);
      if (idx !== -1) {
        grievances[idx].comments = [
          ...(grievances[idx].comments || []),
          { id: uuidv4(), text: comment, created_at: new Date().toISOString() },
        ];
        app.form_data = { ...(app.form_data || {}), grievances };
        await this.applicationRepository.save(app);
        return;
      }
    }
    throw new NotFoundException('Grievance not found');
  }

  // ─── Feedback ────────────────────────────────────────────────────────────

  async submitFeedback(
    consumerId: string,
    dto: { applicationId: string; rating: number; comment?: string; tags?: string[] },
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, consumer_id: consumerId },
    });
    if (!application) throw new NotFoundException('Application not found');

    application.form_data = {
      ...(application.form_data || {}),
      feedback: {
        rating: dto.rating,
        comment: dto.comment || null,
        tags: dto.tags || [],
        submitted_at: new Date().toISOString(),
      },
    };
    await this.applicationRepository.save(application);
  }
}
