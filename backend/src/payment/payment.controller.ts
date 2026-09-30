import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { TenantService } from '../database/entities/tenant-service.entity';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectRepository(TenantService)
    private readonly tenantServiceRepository: Repository<TenantService>,
  ) {}

  // ── POST /payments/orders — Create payment order (authenticated consumer) ─

  @Post('orders')
  @UseGuards(TenantStaffAuthGuard, RolesGuard)
  @Roles('consumer')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    // Resolve fee from service schema
    const service = await this.tenantServiceRepository.findOne({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Determine fee amount from form_schema payment field or service fees
    let amountPaise: number;
    let currency = 'INR';

    const formSchema = service.form_schema;
    const paymentField = formSchema?.fields?.find?.(
      (f: any) => f.type === 'payment',
    );

    if (paymentField) {
      const config = paymentField.customConfig ?? paymentField.config ?? {};
      if (config.currency) {
        currency = config.currency;
      }
      if (config.staticFee) {
        amountPaise = Math.round(parseFloat(config.staticFee) * 100);
      } else {
        // For dynamic fees, the frontend should pass the computed amount
        // For now, fall back to service.fees
        amountPaise = service.fees ? Math.round(Number(service.fees) * 100) : 0;
      }
    } else if (service.fees) {
      amountPaise = Math.round(Number(service.fees) * 100);
    } else {
      throw new BadRequestException('No fee configured for this service');
    }

    if (amountPaise <= 0) {
      throw new BadRequestException('Fee amount must be greater than zero');
    }

    const { record, razorpayKeyId } = await this.paymentService.createOrder(
      dto.applicationId,
      service.tenant_id,
      user.sub ?? user.id,
      amountPaise,
      currency,
    );

    return {
      orderId: record.id,
      razorpayOrderId: record.razorpay_order_id,
      razorpayKeyId,
      amount: record.amount_paise,
      currency: record.currency,
    };
  }

  // ── POST /payments/verify — Verify payment (authenticated consumer) ───────

  @Post('verify')
  @UseGuards(TenantStaffAuthGuard, RolesGuard)
  @Roles('consumer')
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: any,
  ) {
    const record = await this.paymentService.verifyPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
      user.tenantId,
    );

    return {
      paymentRecordId: record.id,
      status: record.status,
      applicationId: record.application_id,
      amountPaise: record.amount_paise,
      currency: record.currency,
      completedAt: record.completed_at,
    };
  }

  // ── GET /payments/:applicationId — Get payment status ─────────────────────

  @Get(':applicationId')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('applicationId') applicationId: string) {
    const record = await this.paymentService.getPaymentByApplication(applicationId);
    if (!record) {
      throw new NotFoundException('No payment record found for this application');
    }

    return {
      paymentRecordId: record.id,
      applicationId: record.application_id,
      status: record.status,
      amountPaise: record.amount_paise,
      currency: record.currency,
      razorpayOrderId: record.razorpay_order_id,
      razorpayPaymentId: record.razorpay_payment_id,
      attemptNumber: record.attempt_number,
      completedAt: record.completed_at,
      refundedAmountPaise: record.refunded_amount_paise,
      refundedAt: record.refunded_at,
      statusHistory: record.status_history,
    };
  }

  // ── POST /payments/refund — Initiate refund (tenant admin) ────────────────

  @Post('refund')
  @UseGuards(TenantStaffAuthGuard, RolesGuard)
  @Roles('admin', 'tenant_admin')
  async initiateRefund(
    @Body() dto: InitiateRefundDto,
    @CurrentUser() user: any,
  ) {
    const amountPaise = Math.round(dto.amount * 100);

    const record = await this.paymentService.initiateRefund(
      dto.paymentRecordId,
      amountPaise,
      dto.reason,
      user.sub ?? user.id,
      user.role,
      user.tenantId,
    );

    return {
      paymentRecordId: record.id,
      status: record.status,
      refundedAmountPaise: record.refunded_amount_paise,
      razorpayRefundId: record.razorpay_refund_id,
      refundedAt: record.refunded_at,
    };
  }

  // ── GET /payments/:applicationId/receipt — Download receipt ────────────────

  @Get(':applicationId/receipt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('consumer')
  async getReceipt(@Param('applicationId') applicationId: string) {
    const record = await this.paymentService.getPaymentByApplication(applicationId);
    if (!record) {
      throw new NotFoundException('No payment record found for this application');
    }

    if (record.status !== 'completed' && record.status !== 'refunded') {
      throw new NotFoundException('Receipt not available for this payment status');
    }

    // Receipt generation is a separate task (Task 12) — return JSON receipt for now
    return {
      receiptNumber: record.receipt_number,
      transactionId: record.razorpay_payment_id,
      amountPaise: record.amount_paise,
      currency: record.currency,
      status: record.status,
      completedAt: record.completed_at,
      refundedAmountPaise: record.refunded_amount_paise,
      refundedAt: record.refunded_at,
    };
  }

  // ── POST /payments/webhook/razorpay — Webhook (unauthenticated) ───────────

  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Get raw body for signature verification
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : typeof req.rawBody === 'object'
          ? Buffer.isBuffer(req.rawBody)
            ? req.rawBody.toString('utf-8')
            : JSON.stringify(req.body)
          : JSON.stringify(req.body);

    const body = req.body;
    const eventType = body?.event;
    const payload = body?.payload;

    await this.paymentService.processWebhook(
      rawBody,
      signature,
      eventType,
      payload,
    );

    return { status: 'ok' };
  }
}
