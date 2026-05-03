import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, type AuditEventType } from '../database/entities/audit-log.entity';
import { QueueService } from '../scalability/queue.service';

export interface AuditLogOptions {
  eventType: AuditEventType;
  actorId?: string;
  actorRole?: string;
  tenantId?: string;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    // Optional: when the queue is available, audit writes are decoupled from the
    // request path to prevent audit log DB pressure at 1000 TPS.
    @Optional() private readonly queueService?: QueueService,
  ) {}

  async log(options: AuditLogOptions): Promise<void> {
    // ── Queue-first audit path ─────────────────────────────────────────────
    if (this.queueService?.isWritePathEnabled()) {
      const enqueueResult = await this.queueService.enqueueWriteCommand({
        type: 'audit.log',
        module: 'audit.service',
        payload: {
          eventType: options.eventType,
          actorId: options.actorId ?? null,
          actorRole: options.actorRole ?? null,
          tenantId: options.tenantId ?? null,
          ipAddress: options.ipAddress ?? null,
          resourceType: options.resourceType ?? null,
          resourceId: options.resourceId ?? null,
          metadata: options.metadata ?? null,
          success: options.success ?? true,
        },
        // Audit logs are intentionally not deduplicated — each event is unique
        idempotencyKey: `audit.log:${options.eventType}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      }).catch((err) => {
        this.logger.error(
          `Audit log queue enqueue failed for event "${options.eventType}": ${err instanceof Error ? err.message : String(err)}`,
        );
        return { queued: false, reason: 'enqueue-error' };
      });

      if (enqueueResult.queued) {
        return;
      }
      // Graceful degradation: queue unavailable → fall through to direct write
    }

    // ── Direct-write fallback path ─────────────────────────────────────────
    try {
      const entry = this.auditRepository.create({
        event_type: options.eventType,
        actor_id: options.actorId ?? null,
        actor_role: options.actorRole ?? null,
        tenant_id: options.tenantId ?? null,
        ip_address: options.ipAddress ?? null,
        resource_type: options.resourceType ?? null,
        resource_id: options.resourceId ?? null,
        metadata: options.metadata ?? null,
        success: options.success ?? true,
      });
      await this.auditRepository.save(entry);
    } catch (err) {
      // Audit failures must never break the primary request path
      this.logger.error(
        `Audit log write failed for event "${options.eventType}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Convenience helpers

  async logAuthSuccess(params: { actorId: string; actorRole: string; tenantId?: string; ipAddress?: string; method: string }) {
    return this.log({
      eventType: 'auth.login.success',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
      metadata: { method: params.method },
    });
  }

  async logAuthFailure(params: { identifier: string; ipAddress?: string; reason: string; method: string }) {
    return this.log({
      eventType: 'auth.login.failure',
      ipAddress: params.ipAddress,
      // Do not store the identifier directly; store a reason only
      metadata: { reason: params.reason, method: params.method },
      success: false,
    });
  }

  async logTokenRefresh(params: { actorId: string; actorRole: string; tenantId?: string; ipAddress?: string }) {
    return this.log({
      eventType: 'auth.token.refresh',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
    });
  }

  async logTokenInvalid(params: { ipAddress?: string; reason: string }) {
    return this.log({
      eventType: 'auth.token.invalid',
      ipAddress: params.ipAddress,
      metadata: { reason: params.reason },
      success: false,
    });
  }

  async logRegistration(params: { actorId: string; actorRole: string; tenantId?: string; ipAddress?: string }) {
    return this.log({
      eventType: 'auth.register',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
    });
  }

  async logLogout(params: { actorId: string; actorRole: string; tenantId?: string; ipAddress?: string }) {
    return this.log({
      eventType: 'auth.logout',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
    });
  }

  async logDocumentUpload(params: { actorId: string; actorRole: string; tenantId?: string; documentId: string; ipAddress?: string }) {
    return this.log({
      eventType: 'document.upload',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
      resourceType: 'document',
      resourceId: params.documentId,
    });
  }

  async logDocumentDownload(params: { actorId: string; actorRole: string; tenantId?: string; documentId: string; ipAddress?: string }) {
    return this.log({
      eventType: 'document.download',
      actorId: params.actorId,
      actorRole: params.actorRole,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
      resourceType: 'document',
      resourceId: params.documentId,
    });
  }

  async getLogs(params: {
    tenantId?: string;
    actorId?: string;
    eventType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, params.page ?? 1);
    const safeLimit = Math.min(200, Math.max(1, params.limit ?? 50));
    const skip = (safePage - 1) * safeLimit;

    const qb = this.auditRepository.createQueryBuilder('al').orderBy('al.created_at', 'DESC').skip(skip).take(safeLimit);

    if (params.tenantId) qb.andWhere('al.tenant_id = :tenantId', { tenantId: params.tenantId });
    if (params.actorId) qb.andWhere('al.actor_id = :actorId', { actorId: params.actorId });
    if (params.eventType) qb.andWhere('al.event_type = :eventType', { eventType: params.eventType });
    if (params.from) qb.andWhere('al.created_at >= :from', { from: new Date(params.from) });
    if (params.to) qb.andWhere('al.created_at <= :to', { to: new Date(params.to) });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page: safePage, limit: safeLimit };
  }
}
