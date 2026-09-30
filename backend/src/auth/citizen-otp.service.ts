import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { AuthService } from './auth.service';
import { OTP_DELIVERY_PROVIDER, OtpDeliveryProvider } from './otp-delivery.provider';
import { CitizenOtpChallenge } from '../database/entities/citizen-otp-challenge.entity';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;
const INVALID_OTP_MESSAGE = 'Invalid or expired verification code';

@Injectable()
export class CitizenOtpService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    @Inject(OTP_DELIVERY_PROVIDER)
    private readonly deliveryProvider: OtpDeliveryProvider,
  ) {}

  async issue(mobileInput: string, ipAddress: string) {
    const mobile = this.normalizeMobile(mobileInput);
    const now = new Date();
    const challengeId = randomUUID();
    const code = this.generateCode(mobile);

    const result = await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [mobile]);
      const repository = manager.getRepository(CitizenOtpChallenge);
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1_000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
      const requestIpHash = this.hashIp(ipAddress);
      const [mobileHourlyCount, mobileDailyCount, ipHourlyCount] = await Promise.all([
        repository.count({ where: { mobile_e164: mobile, created_at: MoreThanOrEqual(hourAgo) } }),
        repository.count({ where: { mobile_e164: mobile, created_at: MoreThanOrEqual(dayAgo) } }),
        repository.count({ where: { request_ip_hash: requestIpHash, created_at: MoreThanOrEqual(hourAgo) } }),
      ]);

      if (mobileHourlyCount >= 5 || mobileDailyCount >= 10 || ipHourlyCount >= 20) {
        return {
          challengeId,
          retryAfterSeconds: 60,
          shouldSend: false,
        };
      }

      const recent = await repository.findOne({
        where: { mobile_e164: mobile },
        order: { created_at: 'DESC' },
      });

      if (recent && !recent.consumed_at && recent.resend_available_at > now) {
        return {
          challengeId: recent.id,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((recent.resend_available_at.getTime() - now.getTime()) / 1_000),
          ),
          shouldSend: false,
        };
      }

      await repository.update(
        { mobile_e164: mobile, consumed_at: null },
        { consumed_at: now },
      );

      const challenge = repository.create({
        id: challengeId,
        mobile_e164: mobile,
        code_digest: this.digest(challengeId, mobile, code),
        expires_at: new Date(now.getTime() + OTP_EXPIRY_MS),
        resend_available_at: new Date(now.getTime() + OTP_RESEND_SECONDS * 1_000),
        consumed_at: null,
        failed_attempts: 0,
        max_attempts: OTP_MAX_ATTEMPTS,
        request_ip_hash: requestIpHash,
      });
      await repository.save(challenge);

      if (!this.isFixedTestMobile(mobile)) {
        await this.deliveryProvider.send(mobile, code);
      }

      return {
        challengeId,
        retryAfterSeconds: OTP_RESEND_SECONDS,
        shouldSend: true,
      };
    });

    return {
      challengeId: result.challengeId,
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }

  async verify(challengeId: string, mobileInput: string, code: string) {
    const mobile = this.normalizeMobile(mobileInput);
    const verification = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CitizenOtpChallenge);
      const challenge = await repository.findOne({
        where: { id: challengeId, mobile_e164: mobile },
        lock: { mode: 'pessimistic_write' },
      });
      const now = new Date();

      if (
        !challenge ||
        challenge.consumed_at ||
        challenge.expires_at <= now ||
        challenge.failed_attempts >= challenge.max_attempts
      ) {
        return { valid: false } as const;
      }

      const expected = Buffer.from(challenge.code_digest, 'hex');
      const supplied = Buffer.from(this.digest(challenge.id, mobile, code), 'hex');
      if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        challenge.failed_attempts += 1;
        await repository.save(challenge);
        return { valid: false } as const;
      }

      challenge.consumed_at = now;
      await repository.save(challenge);
      return { valid: true, mobile } as const;
    });

    if (!verification.valid) {
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    return this.authService.createConsumerSessionForMobile(verification.mobile);
  }

  private normalizeMobile(input: string): string {
    const digits = input.replace(/\D/g, '');
    const nationalNumber = digits.startsWith('91') && digits.length === 12
      ? digits.slice(2)
      : digits;

    if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
      throw new UnauthorizedException(INVALID_OTP_MESSAGE);
    }

    return `+91${nationalNumber}`;
  }

  private generateCode(mobile: string): string {
    if (process.env.NODE_ENV === 'test' && process.env.OTP_TEST_CODE) {
      return process.env.OTP_TEST_CODE;
    }
    if (this.isFixedTestMobile(mobile)) {
      return process.env.OTP_FIXED_TEST_CODE!;
    }
    return randomInt(100_000, 1_000_000).toString();
  }

  private isFixedTestMobile(mobile: string): boolean {
    return process.env.OTP_FIXED_TEST_ENABLED === 'true'
      && process.env.OTP_FIXED_TEST_MOBILE === mobile
      && /^\d{6}$/.test(process.env.OTP_FIXED_TEST_CODE || '');
  }

  private digest(challengeId: string, mobile: string, code: string): string {
    const pepper = process.env.OTP_PEPPER;
    if (!pepper || pepper.length < 32) {
      throw new ServiceUnavailableException('OTP security configuration is invalid');
    }
    return createHmac('sha256', pepper)
      .update(`${challengeId}:${mobile}:${code}`)
      .digest('hex');
  }

  private hashIp(ipAddress: string): string {
    const pepper = process.env.OTP_PEPPER;
    if (!pepper || pepper.length < 32) {
      throw new ServiceUnavailableException('OTP security configuration is invalid');
    }
    return createHmac('sha256', pepper).update(ipAddress).digest('hex');
  }
}