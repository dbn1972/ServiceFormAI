import {
  Controller,
  HttpCode,
  Post,
  Body,
  Get,
  GoneException,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthSecurityService } from './auth-security.service';
import { AuditService } from '../audit/audit.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginTenantDto } from './dto/login-tenant.dto';
import { LoginConsumerDto } from './dto/login-consumer.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { BootstrapPlatformAdminDto } from './dto/bootstrap-platform-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantStaffAuthGuard } from './guards/tenant-staff-auth.guard';
import { CitizenOrTenantStaffAuthGuard } from './guards/citizen-or-tenant-staff-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CitizenOtpService } from './citizen-otp.service';
import { IssueCitizenOtpDto } from './dto/issue-citizen-otp.dto';
import { VerifyCitizenOtpDto } from './dto/verify-citizen-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authSecurityService: AuthSecurityService,
    private readonly auditService: AuditService,
    private readonly citizenOtpService: CitizenOtpService,
  ) {}

  @Post('citizen/otp')
  @HttpCode(202)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async issueCitizenOtp(@Body() dto: IssueCitizenOtpDto, @Req() request: Request) {
    const data = await this.citizenOtpService.issue(dto.mobile, this.getIpAddress(request));
    return {
      success: true,
      message: 'If the number can receive messages, a code has been sent.',
      data,
    };
  }

  @Post('citizen/otp/verify')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async verifyCitizenOtp(@Body() dto: VerifyCitizenOtpDto, @Req() request: Request) {
    const result = await this.citizenOtpService.verify(dto.challengeId, dto.mobile, dto.code);
    void this.auditService.logAuthSuccess({
      actorId: result.user.id,
      actorRole: 'consumer',
      ipAddress: this.getIpAddress(request),
      method: 'mobile_otp',
    });
    return { success: true, data: result };
  }

  @UseGuards(TenantStaffAuthGuard)
  @Post('staff/session')
  async createTenantStaffSession(@CurrentUser() user: any) {
    if (user.identityProvider !== 'keycloak') {
      throw new UnauthorizedException('A Keycloak identity is required');
    }
    const result = await this.authService.createTenantStaffSessionForKeycloak(user);
    return { success: true, data: result };
  }

  @Post('register/tenant')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async registerTenant(@Body() dto: RegisterTenantDto, @Req() request: Request) {
    this.assertLegacyTenantPasswordAuthEnabled();
    const result = await this.authService.registerTenantUser(dto);
    void this.auditService.logRegistration({
      actorId: result.user.id,
      actorRole: result.user.role,
      tenantId: result.user.tenantId,
      ipAddress: this.getIpAddress(request),
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('login/tenant')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async loginTenant(@Body() dto: LoginTenantDto, @Req() request: Request) {
    this.assertLegacyTenantPasswordAuthEnabled();
    const loginKey = dto.email.trim().toLowerCase();
    const ipAddress = this.getIpAddress(request);
    await this.authSecurityService.assertLoginAllowed(loginKey, ipAddress);

    let result;
    try {
      result = await this.authService.loginTenantUser(dto);
      await this.authSecurityService.clearLoginFailures(loginKey, ipAddress);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.authSecurityService.registerLoginFailure(loginKey, ipAddress);
        void this.auditService.logAuthFailure({
          identifier: loginKey,
          ipAddress,
          reason: error.message,
          method: 'tenant',
        });
      }
      throw error;
    }

    void this.auditService.logAuthSuccess({
      actorId: result.user.id,
      actorRole: result.user.role,
      tenantId: result.user.tenantId,
      ipAddress,
      method: 'tenant',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('register/consumer')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async registerConsumer(@Body() _dto: RegisterConsumerDto) {
    throw new GoneException('Citizen accounts are created after mobile OTP verification');
  }

  @Post('login/consumer')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async loginConsumer(@Body() dto: LoginConsumerDto, @Req() request: Request) {
    const loginKey = dto.identifier.trim().toLowerCase();
    const ipAddress = this.getIpAddress(request);
    await this.authSecurityService.assertLoginAllowed(loginKey, ipAddress);

    let result;
    try {
      result = await this.authService.loginConsumerUser(dto);
      await this.authSecurityService.clearLoginFailures(loginKey, ipAddress);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.authSecurityService.registerLoginFailure(loginKey, ipAddress);
        void this.auditService.logAuthFailure({
          identifier: loginKey,
          ipAddress,
          reason: error.message,
          method: 'consumer',
        });
      }
      throw error;
    }

    void this.auditService.logAuthSuccess({
      actorId: result.user.id,
      actorRole: 'consumer',
      ipAddress,
      method: 'consumer',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    const ipAddress = this.getIpAddress(request);
    let tokens;
    try {
      const result = await this.authService.refreshToken(dto.refreshToken);
      tokens = result.tokens;
    } catch (error) {
      void this.auditService.logTokenInvalid({
        ipAddress,
        reason: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
    return {
      success: true,
      data: { tokens },
    };
  }

  @UseGuards(CitizenOrTenantStaffAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return {
      success: true,
      data: { user },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: any, @Req() request: Request) {
    // Revoke all refresh token nonces for this user — invalidates all active sessions
    await this.authService.revokeAllUserSessions(user.id);
    void this.auditService.logLogout({
      actorId: user.id,
      actorRole: user.role,
      tenantId: user.tenantId,
      ipAddress: this.getIpAddress(request),
    });
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email, dto.tenantId);
    return {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      data: result,
    };
  }

  @Get('reset-password/verify')
  async verifyResetToken(@Query('token') token: string) {
    const result = await this.authService.verifyResetToken(token ?? '');
    return { success: true, data: result };
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true, message: 'Password reset successfully.' };
  }

  private getIpAddress(request: Request) {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private assertLegacyTenantPasswordAuthEnabled(): void {
    if (
      process.env.NODE_ENV !== 'test' &&
      process.env.ALLOW_LEGACY_TENANT_PASSWORD_AUTH !== 'true'
    ) {
      throw new GoneException('Tenant staff must authenticate through the configured identity provider');
    }
  }

  // Only callable when BOOTSTRAP_SECRET env is set AND no platform_admin exists yet.
  // Disable by unsetting BOOTSTRAP_SECRET after first use.
  @Post('bootstrap/platform-admin')
  async bootstrapPlatformAdmin(@Body() dto: BootstrapPlatformAdminDto, @Req() request: Request) {
    const result = await this.authService.bootstrapPlatformAdmin(dto);
    void this.auditService.logRegistration({
      actorId: result.user.id,
      actorRole: result.user.role,
      tenantId: result.user.tenantId,
      ipAddress: this.getIpAddress(request),
    });
    return { success: true, data: result };
  }
}
