import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { TenantOnboardingController } from './tenant-onboarding.controller';
import { TenantOnboardingService } from './tenant-onboarding.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [TenantService, WebhookDeliveryService, TenantOnboardingService],
  controllers: [TenantController, TenantOnboardingController],
  exports: [TenantService, WebhookDeliveryService],
})
export class TenantModule {}
