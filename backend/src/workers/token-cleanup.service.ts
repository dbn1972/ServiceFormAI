import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshTokenNonce } from '../database/entities/refresh-token-nonce.entity';
import { LoginRateLimit } from '../database/entities/login-rate-limit.entity';
import { ConsentRecord } from '../database/entities/consent-record.entity';

// Runs inside the worker process on a fixed interval.
// Purges stale security records and enforces consent expiry.
@Injectable()
export class TokenCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenCleanupService.name);
  private readonly intervalMs = 60 * 60 * 1000; // run every hour
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(RefreshTokenNonce)
    private readonly nonceRepository: Repository<RefreshTokenNonce>,
    @InjectRepository(LoginRateLimit)
    private readonly rateLimitRepository: Repository<LoginRateLimit>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepository: Repository<ConsentRecord>,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.runCleanup(), this.intervalMs);
    // Also run once shortly after startup
    setTimeout(() => void this.runCleanup(), 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runCleanup(): Promise<void> {
    try {
      await this.purgeExpiredNonces();
      await this.purgeStaleRateLimits();
      await this.expireStaleConsents();
    } catch (err) {
      this.logger.error(
        `Cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async purgeExpiredNonces(): Promise<void> {
    const now = new Date();
    const result = await this.nonceRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Purged ${result.affected} expired refresh token nonce(s).`);
    }
  }

  private async purgeStaleRateLimits(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.rateLimitRepository.delete({
      window_started_at: LessThan(cutoff),
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Purged ${result.affected} stale rate-limit record(s).`);
    }
  }

  private async expireStaleConsents(): Promise<void> {
    const now = new Date();
    // Transition granted consents that have a non-null expires_at in the past to 'expired'
    const result = await this.consentRepository
      .createQueryBuilder()
      .update()
      .set({ status: 'expired' })
      .where(
        'status = :status AND expires_at IS NOT NULL AND expires_at < :now',
        { status: 'granted', now },
      )
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Expired ${result.affected} consent record(s) past their expires_at.`);
    }
  }
}
