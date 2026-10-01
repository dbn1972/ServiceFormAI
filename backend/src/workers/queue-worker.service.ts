import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { QueueService, type ClaimedQueueMessage } from '../scalability/queue.service';
import { ScalabilityMetricsService } from '../scalability/scalability-metrics.service';
import { OutboxEvent } from '../database/entities/outbox-event.entity';

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private stopped = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly metricsService: ScalabilityMetricsService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantService)
    private readonly tenantServiceRepository: Repository<TenantService>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ConsumerUser)
    private readonly consumerUserRepository: Repository<ConsumerUser>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.loopPromise = this.runLoop();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.loopPromise;
  }

  private async runLoop() {
    this.logger.log('Queue worker started.');

    while (!this.stopped) {
      try {
        const dispatchedOutboxEvent = await this.processPendingOutboxEvent();
        if (dispatchedOutboxEvent) {
          continue;
        }
        const claimed = await this.queueService.claimNextMessage();
        if (!claimed) {
          await this.sleep(1000);
          continue;
        }

        await this.processMessage(claimed);
        await this.queueService.acknowledgeMessage(claimed);
        this.metricsService.recordQueueProcessed(claimed.message.type);
      } catch (error) {
        this.logger.error(
          error instanceof Error ? error.message : 'Unknown queue worker error',
          error instanceof Error ? error.stack : undefined,
        );
        await this.sleep(1000);
      }
    }

    this.logger.log('Queue worker stopped.');
  }

  async processPendingOutboxEvent(): Promise<boolean> {
    const staleProcessingBefore = new Date(Date.now() - 30_000);
    const event = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OutboxEvent);
      const next = await repository.findOne({
        where: [
          { status: 'pending' },
          { status: 'processing', created_at: LessThan(staleProcessingBefore) },
        ],
        order: { created_at: 'ASC' },
        lock: { mode: 'pessimistic_write', onLocked: 'skip_locked' },
      });
      if (!next) return null;
      next.status = 'processing';
      return repository.save(next);
    });

    if (!event) return false;

    try {
      const result = await this.queueService.enqueueWriteCommand({
        type: event.event_type,
        module: 'transactional-outbox',
        payload: event.payload,
        idempotencyKey: event.idempotency_key,
      });
      event.status = result.queued || result.reason === 'duplicate' ? 'published' : 'pending';
      await this.outboxRepository.save(event);
    } catch (error) {
      event.status = 'pending';
      await this.outboxRepository.save(event);
      throw error;
    }

    return event.status === 'published';
  }

  private async processMessage(claimed: ClaimedQueueMessage) {
    try {
      switch (claimed.message.type) {
        // ── Queue-first write handlers (persist + notify) ──────────────────
        case 'application.persist':
          await this.handleApplicationPersist(claimed.message.payload as Record<string, unknown>);
          break;
        case 'service.persist.create':
          await this.handleServicePersistCreate(claimed.message.payload as Record<string, unknown>);
          break;
        case 'service.persist.update':
          await this.handleServicePersistUpdate(claimed.message.payload as Record<string, unknown>);
          break;
        case 'service.persist.delete':
          await this.handleServicePersistDelete(claimed.message.payload as Record<string, unknown>);
          break;
        case 'audit.log':
          await this.handleAuditLog(claimed.message.payload as Record<string, unknown>);
          break;
        // ── Legacy / shadow notification handlers ──────────────────────────
        case 'application.submitted':
          await this.handleApplicationSubmitted(claimed.message.payload as Record<string, unknown>);
          break;
        case 'application.status-updated':
          await this.handleApplicationStatusUpdated(claimed.message.payload as Record<string, unknown>);
          break;
        case 'service.created':
        case 'service.updated':
        case 'service.deleted':
        case 'service.archived':
          await this.handleServiceMutation(claimed.message.type, claimed.message.payload as Record<string, unknown>);
          break;
        default:
          this.logger.warn(`No worker handler is registered for message type "${claimed.message.type}".`);
      }
    } catch (error) {
      this.metricsService.recordQueueFailed(claimed.message.type);
      await this.queueService.failMessage(claimed, error);
      throw error;
    }
  }

  // ── application.persist handler ────────────────────────────────────────────
  // Persists the Application row, then sends webhooks/notifications.
  // Idempotent: skips write if record already exists (safe on retry).
  private async handleApplicationPersist(payload: Record<string, unknown>) {
    const applicationId = String(payload.applicationId || 'unknown');
    this.logger.log(`Processing application.persist for application ${applicationId}.`);

    try {
      // Idempotency guard: skip if already persisted
      let application = await this.applicationRepository.findOne({ where: { id: applicationId } });
      if (!application) {
        application = this.applicationRepository.create({
          id: applicationId,
          tenant_id: String(payload.tenantId),
          service_id: String(payload.serviceId),
          service_release_id: payload.serviceReleaseId ? String(payload.serviceReleaseId) : null,
          consumer_id: String(payload.consumerId),
          consumer_source: String(payload.consumerSource || 'web'),
          form_data: payload.formData,
          eligibility_result: payload.eligibilityResult as Record<string, unknown> | null ?? null,
          status: String(payload.status || 'submitted'),
          current_stage: String(payload.currentStage || 'Submitted'),
          tracking_number: String(payload.trackingNumber),
          idempotency_key: (payload.idempotencyKey as string | null) ?? null,
        });
        await this.applicationRepository.save(application);
        this.logger.log(`application.persist: persisted application ${applicationId}.`);
      } else {
        this.logger.log(`application.persist: application ${applicationId} already exists — skipping write.`);
      }

      await this.notifyApplicationEvent('application.submitted', application);
    } catch (err) {
      this.logger.error(
        `handleApplicationPersist failed for ${applicationId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  // ── service.persist.create handler ────────────────────────────────────────
  private async handleServicePersistCreate(payload: Record<string, unknown>) {
    const serviceId = String(payload.serviceId || 'unknown');
    this.logger.log(`Processing service.persist.create for service ${serviceId}.`);

    try {
      const existing = await this.tenantServiceRepository.findOne({ where: { id: serviceId } });
      if (existing) {
        this.logger.log(`service.persist.create: service ${serviceId} already exists — skipping.`);
        return;
      }

      const service = this.tenantServiceRepository.create({
        id: serviceId,
        tenant_id: String(payload.tenantId),
        name: String(payload.name),
        category: String(payload.category),
        description: payload.description as string | null,
        form_schema: payload.formSchema,
        workflow_config: payload.workflowConfig,
        eligibility_rules: payload.eligibilityRules as any,
        required_documents: payload.requiredDocuments as any,
        backend_api_config: payload.backendApiConfig as any,
        manifest: payload.manifest as any,
        published: Boolean(payload.published),
        archived: false,
        sla_days: payload.slaDays as number | null,
        fees: payload.fees as number | null,
      });
      await this.tenantServiceRepository.save(service);
      this.logger.log(`service.persist.create: persisted service ${serviceId}.`);
    } catch (err) {
      this.logger.error(
        `handleServicePersistCreate failed for ${serviceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  // ── service.persist.update handler ────────────────────────────────────────
  private async handleServicePersistUpdate(payload: Record<string, unknown>) {
    const serviceId = String(payload.serviceId || 'unknown');
    const tenantId = String(payload.tenantId || '');
    this.logger.log(`Processing service.persist.update for service ${serviceId}.`);

    try {
      const service = await this.tenantServiceRepository.findOne({
        where: { id: serviceId, tenant_id: tenantId },
      });
      if (!service) {
        this.logger.warn(`service.persist.update: service ${serviceId} not found — skipping.`);
        return;
      }
      if (service.published || service.archived) {
        this.logger.warn(`service.persist.update: refusing to mutate published or archived service ${serviceId}.`);
        return;
      }

      Object.assign(service, {
        name: payload.name ?? service.name,
        category: payload.category ?? service.category,
        description: payload.description ?? service.description,
        form_schema: payload.formSchema ?? service.form_schema,
        workflow_config: payload.workflowConfig ?? service.workflow_config,
        eligibility_rules: payload.eligibilityRules ?? service.eligibility_rules,
        required_documents: payload.requiredDocuments ?? service.required_documents,
        backend_api_config: payload.backendApiConfig ?? service.backend_api_config,
        manifest: payload.manifest ?? service.manifest,
        published: service.published,
        archived: false,
        sla_days: payload.slaDays ?? service.sla_days,
        fees: payload.fees ?? service.fees,
      });
      await this.tenantServiceRepository.save(service);
      this.logger.log(`service.persist.update: updated service ${serviceId}.`);
    } catch (err) {
      this.logger.error(
        `handleServicePersistUpdate failed for ${serviceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  // ── service.persist.delete handler ────────────────────────────────────────
  private async handleServicePersistDelete(payload: Record<string, unknown>) {
    const serviceId = String(payload.serviceId || 'unknown');
    const tenantId = String(payload.tenantId || '');
    this.logger.log(`Processing service.persist.delete for service ${serviceId}.`);

    try {
      const service = await this.tenantServiceRepository.findOne({
        where: { id: serviceId, tenant_id: tenantId },
      });
      if (!service) {
        this.logger.log(`service.persist.delete: service ${serviceId} already removed — idempotent skip.`);
        return;
      }
      service.published = false;
      service.archived = true;
      await this.tenantServiceRepository.save(service);
      this.logger.log(`service.persist.delete: deleted service ${serviceId}.`);
    } catch (err) {
      this.logger.error(
        `handleServicePersistDelete failed for ${serviceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  // ── audit.log handler ──────────────────────────────────────────────────────
  // Persists audit log entries asynchronously to decouple audit writes from
  // the primary request path at 1000 TPS.
  private async handleAuditLog(payload: Record<string, unknown>) {
    try {
      const entry = this.auditLogRepository.create({
        event_type: String(payload.eventType) as any,
        actor_id: (payload.actorId as string | null) ?? null,
        actor_role: (payload.actorRole as string | null) ?? null,
        tenant_id: (payload.tenantId as string | null) ?? null,
        ip_address: (payload.ipAddress as string | null) ?? null,
        resource_type: (payload.resourceType as string | null) ?? null,
        resource_id: (payload.resourceId as string | null) ?? null,
        metadata: (payload.metadata as Record<string, unknown> | null) ?? null,
        success: payload.success !== false,
      });
      await this.auditLogRepository.save(entry);
    } catch (err) {
      // Audit failures must never poison the queue with retries — log and move on.
      this.logger.error(
        `audit.log worker handler failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Do NOT rethrow — audit failure should not retry-loop the queue.
    }
  }

  // ── Shared notification helper ─────────────────────────────────────────────
  private async notifyApplicationEvent(event: string, application: Application) {
    try {
      const [tenant, consumer] = await Promise.all([
        this.tenantRepository.findOne({ where: { id: application.tenant_id } }),
        this.consumerUserRepository.findOne({ where: { id: application.consumer_id } }),
      ]);

      const notificationPolicy = tenant?.notification_policy as Record<string, unknown> | null;
      const webhookUrl = notificationPolicy?.webhook_url as string | null;

      if (webhookUrl) {
        await this.postWebhook(webhookUrl, {
          event,
          applicationId: application.id,
          trackingNumber: application.tracking_number,
          serviceId: application.service_id,
          tenantId: application.tenant_id,
          consumerId: application.consumer_id,
          consumerEmail: consumer?.email ?? null,
          status: application.status,
          submittedAt: application.created_at,
        });
      }

      if (notificationPolicy?.email_enabled && consumer?.email) {
        this.logger.log(
          `[EMAIL PENDING] To: ${consumer.email} | Subject: Application ${application.tracking_number} received | Body: Your application for service ${application.service_id} has been submitted successfully.`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `notifyApplicationEvent(${event}) failed for ${application.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Notification failures are non-fatal — do not rethrow
    }
  }

  // ── Legacy shadow notification handler ────────────────────────────────────
  private async handleApplicationSubmitted(payload: Record<string, unknown>) {
    const applicationId = String(payload.applicationId || 'unknown');
    this.logger.log(`Processing application.submitted for application ${applicationId}.`);

    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      this.logger.warn(`application.submitted: application ${applicationId} not found — skipping notification.`);
      return;
    }
    await this.notifyApplicationEvent('application.submitted', application);
  }

  private async handleApplicationStatusUpdated(payload: Record<string, unknown>) {
    const applicationId = String(payload.applicationId || 'unknown');
    this.logger.log(`Processing application.status-updated for application ${applicationId}.`);

    try {
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId },
      });
      if (!application) {
        this.logger.warn(`application.status-updated: application ${applicationId} not found — skipping notification.`);
        return;
      }

      const [tenant, consumer] = await Promise.all([
        this.tenantRepository.findOne({ where: { id: application.tenant_id } }),
        this.consumerUserRepository.findOne({ where: { id: application.consumer_id } }),
      ]);

      const notificationPolicy = tenant?.notification_policy as Record<string, unknown> | null;
      const webhookUrl = notificationPolicy?.webhook_url as string | null;

      if (webhookUrl) {
        await this.postWebhook(webhookUrl, {
          event: 'application.status-updated',
          applicationId: application.id,
          trackingNumber: application.tracking_number,
          tenantId: application.tenant_id,
          consumerId: application.consumer_id,
          consumerEmail: consumer?.email ?? null,
          newStatus: application.status,
          currentStage: application.current_stage,
          updatedAt: application.updated_at,
        });
      }

      if (notificationPolicy?.email_enabled && consumer?.email) {
        this.logger.log(
          `[EMAIL PENDING] To: ${consumer.email} | Subject: Application ${application.tracking_number} status update | Body: Your application status is now "${application.status}".`,
        );
      }
    } catch (err) {
      this.logger.error(
        `handleApplicationStatusUpdated failed for ${applicationId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  private async handleServiceMutation(type: string, payload: Record<string, unknown>) {
    const serviceId = String(payload.serviceId || 'unknown');
    const tenantId = String(payload.tenantId || '');
    this.logger.log(`Processing ${type} for service ${serviceId}.`);

    if (tenantId) {
      const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } }).catch(() => null);
      const webhookUrl = (tenant?.notification_policy as Record<string, unknown> | null)?.webhook_url as string | null;
      if (webhookUrl) {
        await this.postWebhook(webhookUrl, { event: type, serviceId, tenantId }).catch((err) => {
          this.logger.warn(`Service webhook failed for ${type}: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    }
  }

  private async postWebhook(url: string, body: Record<string, unknown>): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(`Webhook POST to ${url} returned HTTP ${response.status}`);
      } else {
        this.logger.log(`Webhook delivered to ${url} (event: ${String(body.event)})`);
      }
    } catch (err) {
      this.logger.warn(`Webhook POST to ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
