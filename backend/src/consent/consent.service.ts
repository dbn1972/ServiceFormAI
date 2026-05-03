import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import {
  ConsentRecord,
  type ConsentStatus,
} from '../database/entities/consent-record.entity';
import { AuditService } from '../audit/audit.service';
import { RequestConsentDto } from './dto/request-consent.dto';

export interface ConsentStats {
  total: number;
  by_status: Record<ConsentStatus, number>;
  by_purpose: Record<string, { granted: number; revoked: number; pending: number }>;
  expired_count: number;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(ConsentRecord)
    private readonly consentRepository: Repository<ConsentRecord>,
    private readonly auditService: AuditService,
  ) {}

  // ─── Consumer: Request ─────────────────────────────────────────────────────

  async requestConsent(
    consumerId: string,
    dto: RequestConsentDto,
    ipAddress?: string,
  ): Promise<ConsentRecord> {
    // Check for an active non-expired record for this consumer+tenant+purpose
    const existing = await this.consentRepository.findOne({
      where: {
        consumer_id: consumerId,
        tenant_id: dto.tenantId,
        purpose: dto.purpose,
        status: 'granted' as ConsentStatus,
      },
    });

    if (existing) {
      if (!existing.expires_at || existing.expires_at > new Date()) {
        throw new ConflictException('An active consent already exists for this purpose');
      }
      // Existing record is expired — fall through to create a new one
    }

    const record = this.consentRepository.create({
      id: uuidv4(),
      consumer_id: consumerId,
      tenant_id: dto.tenantId,
      purpose: dto.purpose,
      purpose_description: dto.purposeDescription,
      resource_type: dto.resourceType ?? null,
      resource_id: dto.resourceId ?? null,
      status: 'pending',
      request_id: dto.requestId ?? null,
      expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    await this.consentRepository.save(record);

    void this.auditService.log({
      eventType: 'consent.requested',
      actorId: consumerId,
      actorRole: 'consumer',
      tenantId: dto.tenantId,
      ipAddress,
      resourceType: 'consent_record',
      resourceId: record.id,
      metadata: { purpose: dto.purpose, status: 'pending' },
      success: true,
    });

    return record;
  }

  // ─── Consumer: State transitions ───────────────────────────────────────────

  async grantConsent(consentId: string, consumerId: string, ipAddress?: string): Promise<ConsentRecord> {
    const record = await this.findOwnedRecord(consentId, consumerId);
    this.assertTransitionAllowed(record, 'granted');

    record.status = 'granted';
    record.granted_at = new Date();
    await this.consentRepository.save(record);

    void this.auditService.log({
      eventType: 'consent.granted',
      actorId: consumerId,
      actorRole: 'consumer',
      tenantId: record.tenant_id,
      ipAddress,
      resourceType: 'consent_record',
      resourceId: record.id,
      metadata: { purpose: record.purpose },
    });

    return record;
  }

  async denyConsent(consentId: string, consumerId: string, ipAddress?: string): Promise<ConsentRecord> {
    const record = await this.findOwnedRecord(consentId, consumerId);
    this.assertTransitionAllowed(record, 'denied');

    record.status = 'denied';
    record.denied_at = new Date();
    await this.consentRepository.save(record);

    void this.auditService.log({
      eventType: 'consent.denied',
      actorId: consumerId,
      actorRole: 'consumer',
      tenantId: record.tenant_id,
      ipAddress,
      resourceType: 'consent_record',
      resourceId: record.id,
      metadata: { purpose: record.purpose },
    });

    return record;
  }

  async revokeConsent(consentId: string, consumerId: string, ipAddress?: string): Promise<ConsentRecord> {
    const record = await this.findOwnedRecord(consentId, consumerId);
    this.assertTransitionAllowed(record, 'revoked');

    record.status = 'revoked';
    record.revoked_at = new Date();
    await this.consentRepository.save(record);

    void this.auditService.log({
      eventType: 'consent.revoked',
      actorId: consumerId,
      actorRole: 'consumer',
      tenantId: record.tenant_id,
      ipAddress,
      resourceType: 'consent_record',
      resourceId: record.id,
      metadata: { purpose: record.purpose },
    });

    return record;
  }

  // ─── Consumer: Read ────────────────────────────────────────────────────────

  async getConsumerConsentHistory(consumerId: string): Promise<ConsentRecord[]> {
    return this.consentRepository.find({
      where: { consumer_id: consumerId },
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  async getConsumerActiveConsents(consumerId: string): Promise<ConsentRecord[]> {
    const now = new Date();
    return this.consentRepository
      .createQueryBuilder('cr')
      .where('cr.consumer_id = :consumerId', { consumerId })
      .andWhere('cr.status = :status', { status: 'granted' })
      .andWhere('(cr.expires_at IS NULL OR cr.expires_at > :now)', { now })
      .orderBy('cr.created_at', 'DESC')
      .take(200)
      .getMany();
  }

  // ─── Admin: Read ───────────────────────────────────────────────────────────

  async getTenantConsentRecords(
    tenantId: string,
    status?: ConsentStatus,
    page = 1,
    limit = 100,
  ): Promise<{ records: ConsentRecord[]; total: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(500, Math.max(1, limit));

    const qb = this.consentRepository
      .createQueryBuilder('cr')
      .where('cr.tenant_id = :tenantId', { tenantId })
      .orderBy('cr.created_at', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (status) {
      qb.andWhere('cr.status = :status', { status });
    }

    const [records, total] = await qb.getManyAndCount();
    return { records, total };
  }

  async getConsentStats(tenantId: string): Promise<ConsentStats> {
    const all = await this.consentRepository.find({
      where: { tenant_id: tenantId },
    });

    const now = new Date();
    const stats: ConsentStats = {
      total: all.length,
      by_status: { pending: 0, granted: 0, denied: 0, revoked: 0, expired: 0 },
      by_purpose: {},
      expired_count: 0,
    };

    for (const r of all) {
      // Count as expired if granted but past expiry
      const isExpired = r.status === 'granted' && r.expires_at !== null && r.expires_at <= now;
      const effectiveStatus: ConsentStatus = isExpired ? 'expired' : r.status;

      stats.by_status[effectiveStatus] = (stats.by_status[effectiveStatus] ?? 0) + 1;
      if (isExpired) stats.expired_count += 1;

      if (!stats.by_purpose[r.purpose]) {
        stats.by_purpose[r.purpose] = { granted: 0, revoked: 0, pending: 0 };
      }
      if (effectiveStatus === 'granted') stats.by_purpose[r.purpose].granted += 1;
      else if (effectiveStatus === 'revoked') stats.by_purpose[r.purpose].revoked += 1;
      else if (effectiveStatus === 'pending') stats.by_purpose[r.purpose].pending += 1;
    }

    return stats;
  }

  // ─── Admin: Override revoke ────────────────────────────────────────────────

  /**
   * Platform/tenant admin can revoke any consent within their tenant.
   * Used for GDPR right-to-withdraw and compliance purposes.
   */
  async adminRevokeConsent(
    consentId: string,
    adminId: string,
    adminTenantId: string,
    reason: string,
    ipAddress?: string,
  ): Promise<ConsentRecord> {
    const record = await this.consentRepository.findOne({ where: { id: consentId } });
    if (!record) throw new NotFoundException('Consent record not found');
    if (record.tenant_id !== adminTenantId) throw new ForbiddenException('Access denied');
    if (record.status === 'revoked' || record.status === 'expired') {
      throw new ConflictException(`Consent is already ${record.status}`);
    }

    record.status = 'revoked';
    record.revoked_at = new Date();
    record.metadata = { ...record.metadata, admin_revoke_reason: reason, revoked_by: adminId };
    await this.consentRepository.save(record);

    void this.auditService.log({
      eventType: 'consent.admin_revoked',
      actorId: adminId,
      actorRole: 'admin',
      tenantId: adminTenantId,
      ipAddress,
      resourceType: 'consent_record',
      resourceId: record.id,
      metadata: { purpose: record.purpose, reason, consumerId: record.consumer_id },
    });

    return record;
  }

  /**
   * Revoke all active consents for a consumer under a tenant.
   * Used for GDPR right-to-erasure or tenant offboarding.
   * Returns the count of records revoked.
   */
  async bulkRevokeByConsumer(
    consumerId: string,
    tenantId: string,
    actorId: string,
    reason = 'bulk_revoke',
  ): Promise<{ revokedCount: number }> {
    const active = await this.consentRepository.find({
      where: { consumer_id: consumerId, tenant_id: tenantId, status: 'granted' },
    });

    const now = new Date();
    for (const record of active) {
      record.status = 'revoked';
      record.revoked_at = now;
      record.metadata = { ...record.metadata, bulk_revoke_reason: reason, revoked_by: actorId };
    }

    if (active.length > 0) {
      await this.consentRepository.save(active);
    }

    void this.auditService.log({
      eventType: 'consent.bulk_revoked',
      actorId,
      actorRole: 'admin',
      tenantId,
      resourceType: 'consumer',
      resourceId: consumerId,
      metadata: { revokedCount: active.length, reason },
    });

    return { revokedCount: active.length };
  }

  // ─── TTL enforcement ───────────────────────────────────────────────────────

  /**
   * Batch-marks all granted consents whose expires_at has passed as 'expired'.
   * Called by a scheduled job or manually via admin. Returns count expired.
   */
  async expireStaleConsents(): Promise<{ expiredCount: number }> {
    const now = new Date();

    const stale = await this.consentRepository.find({
      where: {
        status: 'granted' as ConsentStatus,
        expires_at: LessThan(now),
      },
    });

    if (stale.length === 0) return { expiredCount: 0 };

    for (const record of stale) {
      record.status = 'expired';
    }

    await this.consentRepository.save(stale);

    this.logger.log(`Expired ${stale.length} stale consent records`);

    return { expiredCount: stale.length };
  }

  // ─── Internal: isConsentActive ────────────────────────────────────────────

  async isConsentActive(
    consumerId: string,
    tenantId: string,
    purpose: string,
  ): Promise<boolean> {
    const now = new Date();
    const record = await this.consentRepository
      .createQueryBuilder('cr')
      .where('cr.consumer_id = :consumerId', { consumerId })
      .andWhere('cr.tenant_id = :tenantId', { tenantId })
      .andWhere('cr.purpose = :purpose', { purpose })
      .andWhere('cr.status = :status', { status: 'granted' })
      .andWhere('(cr.expires_at IS NULL OR cr.expires_at > :now)', { now })
      .getOne();

    return record !== null;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async findOwnedRecord(consentId: string, consumerId: string): Promise<ConsentRecord> {
    const record = await this.consentRepository.findOne({
      where: { id: consentId },
    });

    if (!record) {
      throw new NotFoundException('Consent record not found');
    }

    if (record.consumer_id !== consumerId) {
      throw new ForbiddenException('Access denied');
    }

    return record;
  }

  private assertTransitionAllowed(record: ConsentRecord, target: ConsentStatus): void {
    const allowed: Record<ConsentStatus, ConsentStatus[]> = {
      pending: ['granted', 'denied'],
      granted: ['revoked'],
      denied: [],
      revoked: [],
      expired: [],
    };

    if (!allowed[record.status]?.includes(target)) {
      throw new ConflictException(
        `Cannot transition consent from "${record.status}" to "${target}"`,
      );
    }
  }
}
