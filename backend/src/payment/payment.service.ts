import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomUUID as uuidv4 } from 'crypto';
import {
  PaymentRecord,
  type PaymentStatus,
  type StatusTransition,
} from '../database/entities/payment-record.entity';
import { IntegrationService } from '../integration/integration.service';
import { AuditService } from '../audit/audit.service';
import { RazorpayClient } from './razorpay-client';
import {
  MAX_AMOUNT_PAISE,
  MAX_PAYMENT_ATTEMPTS,
  STALE_PAYMENT_TIMEOUT_MS,
} from './types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentRecord)
    private readonly paymentRepository: Repository<PaymentRecord>,
    private readonly integrationService: IntegrationService,
    private readonly auditService: AuditService,
    private readonly razorpayClient: RazorpayClient,
  ) {}

  // ── Order Creation ────────────────────────────────────────────────────────

  async createOrder(
    applicationId: string,
    tenantId: string,
    consumerId: string,
    amountPaise: number,
    currency: string = 'INR',
  ): Promise<{ record: PaymentRecord; razorpayKeyId: string }> {
    // Validate amount
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new BadRequestException('Amount must be a positive integer in paise');
    }
    if (amountPaise > MAX_AMOUNT_PAISE) {
      throw new BadRequestException(
        `Amount exceeds maximum allowed: ${MAX_AMOUNT_PAISE} paise`,
      );
    }

    // Find the latest attempt for this application
    let attemptNumber = 1;
    const existingRecords = await this.paymentRepository.find({
      where: { application_id: applicationId },
      order: { attempt_number: 'DESC' },
    });

    if (existingRecords.length > 0) {
      const latest = existingRecords[0];

      // If latest is pending or completed, return it (idempotency)
      if (latest.status === 'pending' || latest.status === 'completed') {
        const creds = await this.razorpayClient.resolveCredentials(tenantId);
        return { record: latest, razorpayKeyId: creds.keyId };
      }

      // If latest is failed, increment attempt number
      if (latest.status === 'failed') {
        attemptNumber = latest.attempt_number + 1;
      }
    }

    // Check max attempts
    if (attemptNumber > MAX_PAYMENT_ATTEMPTS) {
      throw new HttpException(
        'Maximum number of payment attempts reached. Please start a new application.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check integration availability
    await this.integrationService.assertIntegrationAvailable(tenantId, 'razorpay');

    // Generate idempotency key
    const idempotencyKey = `pay_${applicationId}_${attemptNumber}`;

    // Check if a record with this idempotency key already exists
    const existingByKey = await this.paymentRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });
    if (existingByKey) {
      if (existingByKey.status === 'pending' || existingByKey.status === 'completed') {
        const creds = await this.razorpayClient.resolveCredentials(tenantId);
        return { record: existingByKey, razorpayKeyId: creds.keyId };
      }
    }

    // Create Razorpay order
    const receipt = `app_${applicationId}_${attemptNumber}`;
    const gatewayOrder = await this.razorpayClient.createOrder(
      {
        amount_paise: amountPaise,
        currency,
        receipt,
        idempotency_key: idempotencyKey,
      },
      tenantId,
    );

    // Persist PaymentRecord
    const now = new Date().toISOString();
    const initialTransition: StatusTransition = {
      from: null,
      to: 'pending',
      timestamp: now,
      method: 'api',
    };

    const record = this.paymentRepository.create({
      id: uuidv4(),
      application_id: applicationId,
      tenant_id: tenantId,
      consumer_id: consumerId,
      razorpay_order_id: gatewayOrder.id,
      razorpay_payment_id: null,
      razorpay_refund_id: null,
      amount_paise: amountPaise,
      currency,
      refunded_amount_paise: 0,
      status: 'pending' as PaymentStatus,
      failure_reason: null,
      attempt_number: attemptNumber,
      idempotency_key: idempotencyKey,
      receipt_number: null,
      status_history: [initialTransition],
      completed_at: null,
      refunded_at: null,
    });

    await this.paymentRepository.save(record);

    // Audit log
    void this.auditService.log({
      eventType: 'payment.order.created',
      actorId: consumerId,
      actorRole: 'consumer',
      tenantId,
      resourceType: 'payment_record',
      resourceId: record.id,
      metadata: {
        applicationId,
        razorpayOrderId: gatewayOrder.id,
        amountPaise,
        currency,
        attemptNumber,
      },
    });

    // Resolve public key for frontend
    const creds = await this.razorpayClient.resolveCredentials(tenantId);

    return { record, razorpayKeyId: creds.keyId };
  }

  // ── Payment Verification ──────────────────────────────────────────────────

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    tenantId: string,
  ): Promise<PaymentRecord> {
    // Find payment record
    const record = await this.paymentRepository.findOne({
      where: { razorpay_order_id: razorpayOrderId },
    });
    if (!record) {
      throw new NotFoundException('Payment record not found for this order');
    }

    // Resolve tenant secret
    const creds = await this.razorpayClient.resolveCredentials(tenantId);

    // Verify HMAC signature
    const signatureValid = this.razorpayClient.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      creds.keySecret,
    );

    if (!signatureValid) {
      await this.transitionStatus(record, 'failed', 'Signature verification failed', 'api');

      void this.auditService.log({
        eventType: 'payment.verification.failed',
        tenantId: record.tenant_id,
        resourceType: 'payment_record',
        resourceId: record.id,
        metadata: {
          applicationId: record.application_id,
          razorpayOrderId,
          reason: 'signature_mismatch',
        },
        success: false,
      });

      throw new BadRequestException('Payment signature verification failed');
    }

    // Fetch payment from Razorpay to confirm status and amount
    const gatewayPayment = await this.razorpayClient.fetchPayment(razorpayPaymentId, tenantId);

    if (gatewayPayment.amount !== record.amount_paise) {
      await this.transitionStatus(record, 'failed', 'Amount mismatch', 'api');

      void this.auditService.log({
        eventType: 'payment.verification.failed',
        tenantId: record.tenant_id,
        resourceType: 'payment_record',
        resourceId: record.id,
        metadata: {
          applicationId: record.application_id,
          razorpayOrderId,
          reason: 'amount_mismatch',
          expectedAmount: record.amount_paise,
          actualAmount: gatewayPayment.amount,
        },
        success: false,
      });

      throw new BadRequestException('Payment amount mismatch');
    }

    if (gatewayPayment.status !== 'captured') {
      await this.transitionStatus(
        record,
        'failed',
        `Payment status is ${gatewayPayment.status}, expected captured`,
        'api',
      );
      throw new BadRequestException(`Payment not captured. Status: ${gatewayPayment.status}`);
    }

    // Success — update record
    record.razorpay_payment_id = razorpayPaymentId;
    record.completed_at = new Date();
    await this.transitionStatus(record, 'completed', undefined, 'api');

    void this.auditService.log({
      eventType: 'payment.verified',
      actorId: record.consumer_id,
      actorRole: 'consumer',
      tenantId: record.tenant_id,
      resourceType: 'payment_record',
      resourceId: record.id,
      metadata: {
        applicationId: record.application_id,
        razorpayOrderId,
        razorpayPaymentId,
        amountPaise: record.amount_paise,
        method: 'api',
      },
    });

    return record;
  }

  // ── Webhook Processing ────────────────────────────────────────────────────

  async processWebhook(
    rawBody: string,
    signature: string,
    eventType: string,
    payload: any,
  ): Promise<void> {
    // Extract Razorpay order ID from payload
    const razorpayOrderId =
      payload?.payment?.entity?.order_id ??
      payload?.refund?.entity?.order_id ??
      payload?.order?.entity?.id;

    if (!razorpayOrderId) {
      this.logger.warn('Webhook received without recognizable order ID');
      return;
    }

    // Look up payment record
    const record = await this.paymentRepository.findOne({
      where: { razorpay_order_id: razorpayOrderId },
    });

    if (!record) {
      this.logger.warn(
        `Webhook received for unknown order ID: ${razorpayOrderId}`,
      );
      return; // Return 200 to prevent Razorpay retries
    }

    // Resolve webhook secret and verify signature
    let webhookSecret: string;
    try {
      webhookSecret = await this.razorpayClient.resolveWebhookSecret(record.tenant_id);
    } catch {
      this.logger.error(
        `Cannot resolve webhook secret for tenant ${record.tenant_id}`,
      );
      throw new BadRequestException('Webhook secret not configured');
    }

    const signatureValid = this.razorpayClient.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!signatureValid) {
      void this.auditService.log({
        eventType: 'payment.webhook.received',
        tenantId: record.tenant_id,
        resourceType: 'payment_record',
        resourceId: record.id,
        metadata: {
          webhookEventType: eventType,
          razorpayOrderId,
          signatureValid: false,
        },
        success: false,
      });
      throw new BadRequestException('Invalid webhook signature');
    }

    // Log valid webhook receipt
    void this.auditService.log({
      eventType: 'payment.webhook.received',
      tenantId: record.tenant_id,
      resourceType: 'payment_record',
      resourceId: record.id,
      metadata: {
        webhookEventType: eventType,
        razorpayOrderId,
        signatureValid: true,
      },
    });

    // Process event
    switch (eventType) {
      case 'payment.captured': {
        if (record.status === 'pending') {
          const paymentId = payload?.payment?.entity?.id;
          if (paymentId) {
            record.razorpay_payment_id = paymentId;
          }
          record.completed_at = new Date();
          await this.transitionStatus(record, 'completed', undefined, 'webhook');

          void this.auditService.log({
            eventType: 'payment.verified',
            tenantId: record.tenant_id,
            resourceType: 'payment_record',
            resourceId: record.id,
            metadata: {
              applicationId: record.application_id,
              razorpayOrderId,
              razorpayPaymentId: paymentId,
              amountPaise: record.amount_paise,
              method: 'webhook',
            },
          });
        }
        break;
      }

      case 'payment.failed': {
        if (record.status === 'pending') {
          const reason =
            payload?.payment?.entity?.error_description ?? 'Payment failed via webhook';
          await this.transitionStatus(record, 'failed', reason, 'webhook');
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload?.refund?.entity;
        if (refundEntity) {
          record.razorpay_refund_id = refundEntity.id;
          const refundAmount = refundEntity.amount ?? 0;
          record.refunded_amount_paise += refundAmount;
          record.refunded_at = new Date();

          const newStatus: PaymentStatus =
            record.refunded_amount_paise >= record.amount_paise
              ? 'refunded'
              : 'partially_refunded';

          await this.transitionStatus(record, newStatus, 'Refund processed via webhook', 'webhook');
        }
        break;
      }

      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }
  }

  // ── Refund ────────────────────────────────────────────────────────────────

  async initiateRefund(
    paymentRecordId: string,
    amountPaise: number,
    reason: string,
    actorId: string,
    actorRole: string,
    tenantId: string,
  ): Promise<PaymentRecord> {
    const record = await this.paymentRepository.findOne({
      where: { id: paymentRecordId },
    });
    if (!record) {
      throw new NotFoundException('Payment record not found');
    }

    if (record.status !== 'completed' && record.status !== 'partially_refunded') {
      throw new BadRequestException(
        'Only completed or partially refunded payments can be refunded',
      );
    }

    if (record.refunded_amount_paise + amountPaise > record.amount_paise) {
      throw new BadRequestException(
        'Refund amount exceeds remaining refundable amount',
      );
    }

    if (!record.razorpay_payment_id) {
      throw new BadRequestException('No Razorpay payment ID available for refund');
    }

    // Log refund initiation
    void this.auditService.log({
      eventType: 'payment.refund.initiated',
      actorId,
      actorRole,
      tenantId,
      resourceType: 'payment_record',
      resourceId: record.id,
      metadata: {
        applicationId: record.application_id,
        refundAmountPaise: amountPaise,
        reason,
      },
    });

    // Call Razorpay
    let gatewayRefund;
    try {
      gatewayRefund = await this.razorpayClient.createRefund(
        record.razorpay_payment_id,
        { amount_paise: amountPaise, reason },
        tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Razorpay refund failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(
        `Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Update record
    record.razorpay_refund_id = gatewayRefund.id;
    record.refunded_amount_paise += amountPaise;
    record.refunded_at = new Date();

    const newStatus: PaymentStatus =
      record.refunded_amount_paise >= record.amount_paise
        ? 'refunded'
        : 'partially_refunded';

    await this.transitionStatus(record, newStatus, reason, 'api');

    // Log refund completion
    void this.auditService.log({
      eventType: 'payment.refund.completed',
      actorId,
      actorRole,
      tenantId,
      resourceType: 'payment_record',
      resourceId: record.id,
      metadata: {
        applicationId: record.application_id,
        razorpayRefundId: gatewayRefund.id,
        refundAmountPaise: amountPaise,
        totalRefundedPaise: record.refunded_amount_paise,
      },
    });

    return record;
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  async getPaymentByApplication(applicationId: string): Promise<PaymentRecord | null> {
    return this.paymentRepository.findOne({
      where: { application_id: applicationId },
      order: { attempt_number: 'DESC' },
    });
  }

  // ── Payment Gate ──────────────────────────────────────────────────────────

  async assertPaymentCompleted(
    applicationId: string,
    formSchema: any,
  ): Promise<void> {
    if (!formSchema?.fields) return;

    // Check if there's a payment field
    const paymentField = (formSchema.fields as any[]).find(
      (f: any) => f.type === 'payment',
    );
    if (!paymentField) return;

    // Check if fee is zero (static fee check)
    const customConfig = paymentField.customConfig ?? paymentField.config ?? {};
    if (customConfig.staticFee === '0' || customConfig.staticFee === '0.00') {
      return;
    }

    // Look for a completed payment record
    const record = await this.paymentRepository.findOne({
      where: { application_id: applicationId, status: 'completed' as PaymentStatus },
    });

    if (!record) {
      throw new HttpException('Payment required', HttpStatus.PAYMENT_REQUIRED);
    }
  }

  // ── Stale Payment Cleanup ─────────────────────────────────────────────────

  async cleanupStalePayments(): Promise<number> {
    const cutoff = new Date(Date.now() - STALE_PAYMENT_TIMEOUT_MS);

    const staleRecords = await this.paymentRepository.find({
      where: {
        status: 'pending' as PaymentStatus,
        created_at: LessThan(cutoff),
      },
    });

    for (const record of staleRecords) {
      await this.transitionStatus(record, 'failed', 'timeout', 'timeout');
    }

    if (staleRecords.length > 0) {
      this.logger.log(
        `Cleaned up ${staleRecords.length} stale payment record(s)`,
      );
    }

    return staleRecords.length;
  }

  // ── Status Transition Helper ──────────────────────────────────────────────

  private async transitionStatus(
    record: PaymentRecord,
    to: PaymentStatus,
    reason?: string,
    method?: 'api' | 'webhook' | 'timeout',
  ): Promise<void> {
    const transition: StatusTransition = {
      from: record.status,
      to,
      timestamp: new Date().toISOString(),
      reason,
      method,
    };

    record.status_history = [...(record.status_history ?? []), transition];
    record.status = to;

    if (to === 'failed' && reason) {
      record.failure_reason = reason;
    }

    await this.paymentRepository.save(record);
  }
}
