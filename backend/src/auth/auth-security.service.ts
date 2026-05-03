import { createHash } from 'crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import { LoginRateLimit } from '../database/entities/login-rate-limit.entity';

@Injectable()
export class AuthSecurityService {
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxFailures = 5;
  private readonly lockoutMs = 15 * 60 * 1000;

  constructor(
    @InjectRepository(LoginRateLimit)
    private readonly rateLimitRepository: Repository<LoginRateLimit>,
  ) {}

  async assertLoginAllowed(identifier: string, ipAddress: string): Promise<void> {
    const record = await this.rateLimitRepository.findOne({
      where: {
        identifier_hash: this.hashIdentifier(identifier),
        ip_address: ipAddress,
      },
    });

    if (!record) return;

    const now = new Date();

    // If window expired, the record is stale — ignore it
    if (now.getTime() - record.window_started_at.getTime() > this.windowMs) {
      return;
    }

    if (record.locked_until && record.locked_until > now) {
      const secondsRemaining = Math.ceil((record.locked_until.getTime() - now.getTime()) / 1000);
      throw new HttpException(
        `Too many failed login attempts. Try again in ${secondsRemaining} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerLoginFailure(identifier: string, ipAddress: string): Promise<void> {
    const hash = this.hashIdentifier(identifier);
    const now = new Date();
    const windowCutoff = new Date(now.getTime() - this.windowMs);

    const existing = await this.rateLimitRepository.findOne({
      where: { identifier_hash: hash, ip_address: ipAddress },
    });

    if (!existing) {
      try {
        await this.rateLimitRepository.insert({
          id: uuidv4(),
          identifier_hash: hash,
          ip_address: ipAddress,
          failure_count: 1,
          window_started_at: now,
          locked_until: null,
        });
      } catch {
        // Concurrent insert from parallel request — safe to ignore
      }
      return;
    }

    // Reset if the tracking window has expired
    if (existing.window_started_at < windowCutoff) {
      existing.failure_count = 1;
      existing.window_started_at = now;
      existing.locked_until = null;
    } else {
      existing.failure_count += 1;
      if (existing.failure_count >= this.maxFailures) {
        existing.locked_until = new Date(now.getTime() + this.lockoutMs);
      }
    }

    await this.rateLimitRepository.save(existing);
  }

  async clearLoginFailures(identifier: string, ipAddress: string): Promise<void> {
    await this.rateLimitRepository.delete({
      identifier_hash: this.hashIdentifier(identifier),
      ip_address: ipAddress,
    });
  }

  private hashIdentifier(value: string): string {
    return createHash('sha256').update(value.toLowerCase()).digest('hex');
  }
}
