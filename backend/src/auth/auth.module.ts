import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSecurityService } from './auth-security.service';
import { getJwtExpiry, getJwtSecret } from './auth-secrets';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CitizenOtpService } from './citizen-otp.service';
import { HttpOtpDeliveryProvider, OTP_DELIVERY_PROVIDER } from './otp-delivery.provider';
import { KeycloakStrategy } from './strategies/keycloak.strategy';
import { TenantStaffAuthGuard } from './guards/tenant-staff-auth.guard';
import { CitizenOrTenantStaffAuthGuard } from './guards/citizen-or-tenant-staff-auth.guard';

@Global()
@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiry() },
    }),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSecurityService,
    CitizenOtpService,
    HttpOtpDeliveryProvider,
    JwtStrategy,
    KeycloakStrategy,
    TenantStaffAuthGuard,
    CitizenOrTenantStaffAuthGuard,
    {
      provide: OTP_DELIVERY_PROVIDER,
      useExisting: HttpOtpDeliveryProvider,
    },
  ],
  exports: [AuthService, TenantStaffAuthGuard, CitizenOrTenantStaffAuthGuard],
})
export class AuthModule {}
