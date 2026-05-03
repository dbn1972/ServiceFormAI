import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { WebhookDeliveryService } from './webhook-delivery.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [TenantService, WebhookDeliveryService],
  controllers: [TenantController],
  exports: [TenantService, WebhookDeliveryService],
})
export class TenantModule {}
