import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSecurityService } from './auth-security.service';
import { getJwtExpiry, getJwtSecret } from './auth-secrets';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

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
  providers: [AuthService, AuthSecurityService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
