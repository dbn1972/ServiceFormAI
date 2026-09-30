import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { DatabaseModule } from '../database/database.module';
import { ConsentModule } from '../consent/consent.module';
import { TenantModule } from '../tenant/tenant.module';
import { ValidationModule } from '../validation/validation.module';
import { PaymentModule } from '../payment/payment.module';
import { ScalabilityModule } from '../scalability/scalability.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [DatabaseModule, ConsentModule, TenantModule, ValidationModule, PaymentModule, ScalabilityModule, UploadModule],
  controllers: [ConsumerController],
  providers: [ConsumerService],
})
export class ConsumerModule {}
