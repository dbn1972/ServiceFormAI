import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { IntegrationModule } from '../integration/integration.module';
import { AuditModule } from '../audit/audit.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayClient } from './razorpay-client';
import { ReceiptGenerator } from './receipt-generator';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRecord, TenantService]),
    IntegrationModule,
    AuditModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayClient, ReceiptGenerator],
  exports: [PaymentService],
})
export class PaymentModule {}
