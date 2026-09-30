import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID as uuidv4 } from 'crypto';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { RefreshTokenNonce } from '../database/entities/refresh-token-nonce.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginTenantDto } from './dto/login-tenant.dto';
import { LoginConsumerDto } from './dto/login-consumer.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import {
  getJwtExpiry,
  getJwtRefreshExpiry,
  getJwtRefreshSecret,
  getJwtSecret,
  getPasswordResetSecret,
} from './auth-secrets';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TenantUser)
    private tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(ConsumerUser)
    private consumerUserRepository: Repository<ConsumerUser>,
    @InjectRepository(RefreshTokenNonce)
    private refreshTokenNonceRepository: Repository<RefreshTokenNonce>,
    private jwtService: JwtService,
  ) {}

  async registerTenantUser(dto: RegisterTenantDto) {
    const existing = await this.tenantUserRepository.findOne({
      where: { email: dto.email, tenant_id: dto.tenantId },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.tenantUserRepository.create({
      id: uuidv4(),
      tenant_id: dto.tenantId,
      email: dto.email,
      password_hash: passwordHash,
      role: dto.role,
      first_name: dto.firstName,
      last_name: dto.lastName,
      active: true,
    });

    await this.tenantUserRepository.save(user);

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenant_id);

    return {
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens,
    };
  }

  async loginTenantUser(dto: LoginTenantDto) {
    // Always scope by both email AND tenantId — prevents cross-tenant user confusion
    const user = await this.tenantUserRepository.findOne({
      where: { email: dto.email, tenant_id: dto.tenantId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenant_id);

    return {
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens,
    };
  }

  async registerConsumerUser(dto: RegisterConsumerDto) {
    const consumerSource = dto.consumerSource || 'direct';
    const externalId = dto.externalId || dto.email || dto.phone;

    if (!externalId) {
      throw new UnauthorizedException('Email or phone is required');
    }

    if (dto.password) {
      const existingDirectUser = await this.consumerUserRepository.findOne({
        where: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      });

      if (existingDirectUser) {
        throw new ConflictException('User already exists');
      }
    }

    let user = await this.consumerUserRepository.findOne({
      where: {
        consumer_source: consumerSource,
        external_id: externalId,
      },
    });

    if (user) {
      if (dto.password && user.password_hash) {
        throw new ConflictException('User already exists');
      }

      user.name = dto.name || user.name;
      user.email = dto.email || user.email;
      user.phone = dto.phone || user.phone;
      user.password_hash = dto.password
        ? await bcrypt.hash(dto.password, 12)
        : user.password_hash;
      user.active = true;
      user.digilocker_data = dto.digilockerData || user.digilocker_data;
      await this.consumerUserRepository.save(user);
    } else {
      user = this.consumerUserRepository.create({
        id: uuidv4(),
        name: dto.name,
        consumer_source: consumerSource,
        external_id: externalId,
        email: dto.email,
        phone: dto.phone,
        password_hash: dto.password
          ? await bcrypt.hash(dto.password, 12)
          : null,
        active: true,
        digilocker_data: dto.digilockerData,
      });
      await this.consumerUserRepository.save(user);
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email || '',
      'consumer',
      undefined,
      user.consumer_source,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        consumerSource: user.consumer_source,
        externalId: user.external_id,
        email: user.email,
        phone: user.phone,
      },
      tokens,
    };
  }

  async loginConsumerUser(dto: LoginConsumerDto) {
    const identifier = dto.method === 'mobile' ? dto.identifier.replace(/\D/g, '') : dto.identifier.trim().toLowerCase();

    const user = await this.consumerUserRepository.findOne({
      where: dto.method === 'mobile'
        ? { phone: identifier }
        : { email: identifier },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email || '',
      'consumer',
      undefined,
      user.consumer_source,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        consumerSource: user.consumer_source,
        externalId: user.external_id,
        email: user.email,
        phone: user.phone,
      },
      tokens,
    };
  }

  async createConsumerSessionForMobile(mobile: string) {
    let user = await this.consumerUserRepository.findOne({
      where: [
        { phone: mobile },
        { consumer_source: 'mobile', external_id: mobile },
      ],
    });

    if (user && !user.active) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user) {
      user = this.consumerUserRepository.create({
        id: uuidv4(),
        name: null,
        consumer_source: 'mobile',
        external_id: mobile,
        email: null,
        phone: mobile,
        password_hash: null,
        active: true,
        digilocker_data: null,
      });
      await this.consumerUserRepository.save(user);
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email || '',
      'consumer',
      undefined,
      user.consumer_source,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        consumerSource: user.consumer_source,
        externalId: user.external_id,
        email: user.email,
        phone: user.phone,
      },
      tokens,
    };
  }

  async createTenantStaffSessionForKeycloak(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  }) {
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.tenantId,
      undefined,
      'keycloak',
    );
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: getJwtRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid token type');
    }

    // Atomic revocation: UPDATE ... WHERE nonce = jti AND revoked_at IS NULL AND expires_at > now
    // affected=0 means the nonce was already used, revoked, or expired (replay rejected)
    const now = new Date();
    const result = await this.refreshTokenNonceRepository
      .createQueryBuilder()
      .update()
      .set({ revoked_at: now })
      .where('nonce = :nonce AND revoked_at IS NULL AND expires_at > :now', {
        nonce: payload.jti,
        now,
      })
      .execute();

    if (result.affected === 0) {
      throw new UnauthorizedException('Refresh token is invalid, expired, or already used');
    }

    const tokens = await this.generateTokens(
      payload.sub,
      payload.email,
      payload.role,
      payload.tenantId,
      payload.consumerSource,
    );

    return { tokens };
  }

  async revokeAllUserSessions(userId: string): Promise<void> {    await this.refreshTokenNonceRepository
      .createQueryBuilder()
      .update()
      .set({ revoked_at: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
  }

  // Single-use platform admin bootstrap.
  // Guarded by BOOTSTRAP_SECRET env and rejected if any platform_admin already exists.
  async bootstrapPlatformAdmin(params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    bootstrapSecret: string;
  }) {
    const expectedSecret = process.env.BOOTSTRAP_SECRET;
    if (!expectedSecret || expectedSecret.length < 32) {
      throw new ForbiddenException('Bootstrap is not enabled on this instance');
    }
    if (params.bootstrapSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid bootstrap secret');
    }

    const existingAdmin = await this.tenantUserRepository.findOne({
      where: { role: 'platform_admin' },
    });
    if (existingAdmin) {
      throw new ConflictException('A platform admin already exists. Bootstrap is disabled.');
    }

    const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
    const passwordHash = await bcrypt.hash(params.password, 12);

    const user = this.tenantUserRepository.create({
      id: uuidv4(),
      tenant_id: PLATFORM_TENANT_ID,
      email: params.email,
      password_hash: passwordHash,
      role: 'platform_admin',
      first_name: params.firstName ?? null,
      last_name: params.lastName ?? null,
      active: true,
    });
    await this.tenantUserRepository.save(user);

    const tokens = await this.generateTokens(user.id, user.email, user.role, PLATFORM_TENANT_ID);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: PLATFORM_TENANT_ID,
      },
      tokens,
    };
  }

  async forgotPassword(email: string, tenantId?: string): Promise<{ resetToken: string }> {
    const minResponseTime = 200;
    const start = Date.now();

    let userId: string | undefined;
    let userRole: string | undefined;
    let resolvedTenantId: string | undefined;

    if (tenantId) {
      const user = await this.tenantUserRepository.findOne({
        where: { email, tenant_id: tenantId, active: true },
      });
      if (user) {
        userId = user.id;
        userRole = user.role;
        resolvedTenantId = user.tenant_id;
      }
    } else {
      const user = await this.consumerUserRepository.findOne({
        where: { email, active: true },
      });
      if (user) {
        userId = user.id;
        userRole = 'consumer';
      }
    }

    // Always return success to prevent email enumeration attacks
    if (!userId) {
      const elapsed = Date.now() - start;
      if (elapsed < minResponseTime) {
        await new Promise(r => setTimeout(r, minResponseTime - elapsed));
      }
      return { resetToken: '' };
    }

    const resetToken = this.jwtService.sign(
      { sub: userId, email, role: userRole, tenantId: resolvedTenantId, purpose: 'password_reset' },
      { secret: getPasswordResetSecret(), expiresIn: '1h' },
    );

    const elapsed = Date.now() - start;
    if (elapsed < minResponseTime) {
      await new Promise(r => setTimeout(r, minResponseTime - elapsed));
    }

    return { resetToken };
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      const payload = this.jwtService.verify(token, { secret: getPasswordResetSecret() });
      if (payload.purpose !== 'password_reset') {
        return { valid: false };
      }
      return { valid: true, email: payload.email as string };
    } catch {
      return { valid: false };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: getPasswordResetSecret() });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid token type');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (payload.tenantId) {
      await this.tenantUserRepository.update(
        { id: payload.sub as string, tenant_id: payload.tenantId as string },
        { password_hash: passwordHash },
      );
    } else {
      await this.consumerUserRepository.update(
        { id: payload.sub as string },
        { password_hash: passwordHash },
      );
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    tenantId?: string,
    consumerSource?: string,
    authSource?: string,
  ) {
    const jti = uuidv4();

    const basePayload = {
      sub: userId,
      email,
      role,
      tenantId,
      consumerSource,
      authSource,
    };

    const accessToken = this.jwtService.sign(
      { ...basePayload, tokenType: 'access' },
      { secret: getJwtSecret(), expiresIn: getJwtExpiry() },
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, tokenType: 'refresh', jti },
      { secret: getJwtRefreshSecret(), expiresIn: getJwtRefreshExpiry() },
    );

    const refreshExpiry = getJwtRefreshExpiry() as string;

    await this.refreshTokenNonceRepository.save(
      this.refreshTokenNonceRepository.create({
        user_id: userId,
        user_type: tenantId ? 'tenant' : 'consumer',
        nonce: jti,
        expires_at: this.parseExpiryToDate(refreshExpiry),
        revoked_at: null,
      }),
    );

    return { accessToken, refreshToken };
  }

  private parseExpiryToDate(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return new Date(Date.now() + value * (multipliers[match[2]] ?? 86_400_000));
  }
}
