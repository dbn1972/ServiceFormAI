import { Module } from '@nestjs/common';
import { ProducerController } from './producer.controller';
import { RedressController } from './redress.controller';
import { RedressService } from '../consumer/redress.service';
import { ProducerService } from './producer.service';
import { DatabaseModule } from '../database/database.module';
import { ValidationModule } from '../validation/validation.module';
import { ScalabilityModule } from '../scalability/scalability.module';
import { UploadModule } from '../upload/upload.module';
import { AuthModule } from '../auth/auth.module';
import { KeycloakStrategy } from '../auth/strategies/keycloak.strategy';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';

@Module({
  imports: [DatabaseModule, ValidationModule, ScalabilityModule, UploadModule, AuthModule],
  controllers: [ProducerController, RedressController],
  providers: [ProducerService, RedressService, KeycloakStrategy, TenantStaffAuthGuard],
})
export class ProducerModule {}
