/**
 * Payment Integration Tests
 *
 * Tests the payment lifecycle end-to-end with mocked Razorpay API.
 * Covers order creation, verification, webhooks, refunds, payment gate,
 * retry limits, and stale payment cleanup.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { IntegrationService } from '../integration/integration.service';
import { AuditService } from '../audit/audit.service';
import { RazorpayClient } from './razorpay-client';

describe('Payment Integration Tests', () => {
  let service: PaymentService;

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockIntegrationService = {
    assertIntegrationAvailable: jest.fn().mockResolvedValue(undefined),
    getIntegration: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockRazorpayClient = {
    createOrder: jest.fn(),
    fetchPayment: jest.fn(),
    createRefund: jest.fn(),
    verifySignature: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    resolveCredentials: jest.fn().mockResolvedValue({
      keyId: 'rzp_test_key',
      keySecret: 'rzp_test_secret',
      baseUrl: 'https://api.razorpay.com/v1',
    }),
    resolveWebhookSecret: jest.fn().mockResolvedValue('webhook_secret'),
  };

  const APP_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const TENANT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CONSUMER_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPaymentRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockPaymentRepo.save.mockImplementation((data: any) => data);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(PaymentRecord), useValue: mockPaymentRepo },
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: RazorpayClient, useValue: mockRazorpayClient },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  // ── (a) Create order → verify payment → check completed ──────────────

  describe('full payment lifecycle: create → verify → completed', () => {
    it('should complete the full payment flow', async () => {
      // Step 1: Create order
      mockPaymentRepo.find.mockResolvedValue([]);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockRazorpayClient.createOrder.mockResolvedValue({
        id: 'order_test_123',
        amount: 15000,
        currency: 'INR',
        receipt: `app_${APP_ID}_1`,
        status: 'created',
      });

      const orderResult = await service.createOrder(APP_ID, TENANT_ID, CONSUMER_ID, 15000);
      expect(orderResult.record.status).toBe('pending');
      expect(orderResult.record.razorpay_order_id).toBe('order_test_123');
      expect(orderResult.razorpayKeyId).toBe('rzp_test_key');

      // Step 2: Verify payment
      mockPaymentRepo.findOne.mockResolvedValue(orderResult.record);
      mockRazorpayClient.verifySignature.mockReturnValue(true);
      mockRazorpayClient.fetchPayment.mockResolvedValue({
        id: 'pay_test_456',
        order_id: 'order_test_123',
        amount: 15000,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
      });

      const verifiedRecord = await service.verifyPayment(
        'order_test_123',
        'pay_test_456',
        'valid_signature',
        TENANT_ID,
      );

      expect(verifiedRecord.status).toBe('completed');
      expect(verifiedRecord.razorpay_payment_id).toBe('pay_test_456');
      expect(verifiedRecord.completed_at).toBeInstanceOf(Date);
    });
  });

  // ── (b) Duplicate idempotency key → same record returned ─────────────

  describe('idempotency: duplicate order creation returns same record', () => {
    it('should return existing pending record without creating new order', async () => {
      const existingRecord = {
        id: 'rec-existing',
        application_id: APP_ID,
        status: 'pending',
        attempt_number: 1,
        razorpay_order_id: 'order_existing',
        idempotency_key: `pay_${APP_ID}_1`,
      };
      mockPaymentRepo.find.mockResolvedValue([existingRecord]);

      const result = await service.createOrder(APP_ID, TENANT_ID, CONSUMER_ID, 10000);
      expect(result.record.id).toBe('rec-existing');
      expect(mockRazorpayClient.createOrder).not.toHaveBeenCalled();
    });
  });

  // ── (c) Webhook payment.captured → completed ─────────────────────────

  describe('webhook: payment.captured transitions to completed', () => {
    it('should update pending record to completed via webhook', async () => {
      const record = {
        id: 'rec-webhook',
        status: 'pending',
        tenant_id: TENANT_ID,
        application_id: APP_ID,
        amount_paise: 10000,
        razorpay_payment_id: null,
        completed_at: null,
        status_history: [],
      };
      mockPaymentRepo.findOne.mockResolvedValue(record);
      mockRazorpayClient.verifyWebhookSignature.mockReturnValue(true);

      await service.processWebhook(
        '{"event":"payment.captured"}',
        'valid_sig',
        'payment.captured',
        { payment: { entity: { order_id: 'order_webhook', id: 'pay_webhook' } } },
      );

      expect(record.status).toBe('completed');
      expect(record.razorpay_payment_id).toBe('pay_webhook');
    });
  });

  // ── (d) Webhook with invalid signature → 400, no state change ────────

  describe('webhook: invalid signature rejected', () => {
    it('should reject webhook with invalid signature', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: TENANT_ID,
        application_id: APP_ID,
        status_history: [],
      };
      mockPaymentRepo.findOne.mockResolvedValue(record);
      mockRazorpayClient.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.processWebhook(
          '{"event":"payment.captured"}',
          'invalid_sig',
          'payment.captured',
          { payment: { entity: { order_id: 'order_123' } } },
        ),
      ).rejects.toThrow(BadRequestException);

      expect(record.status).toBe('pending'); // No state change
    });
  });

  // ── (e) Refund flow ──────────────────────────────────────────────────

  describe('refund: initiate refund → record transitions to refunded', () => {
    it('should process full refund successfully', async () => {
      const record = {
        id: 'rec-refund',
        status: 'completed',
        amount_paise: 20000,
        refunded_amount_paise: 0,
        razorpay_payment_id: 'pay_refund',
        razorpay_refund_id: null,
        refunded_at: null,
        application_id: APP_ID,
        status_history: [],
      };
      mockPaymentRepo.findOne.mockResolvedValue(record);
      mockRazorpayClient.createRefund.mockResolvedValue({
        id: 'rfnd_test',
        payment_id: 'pay_refund',
        amount: 20000,
        status: 'processed',
      });

      const result = await service.initiateRefund(
        'rec-refund', 20000, 'Application rejected', 'admin-1', 'admin', TENANT_ID,
      );

      expect(result.status).toBe('refunded');
      expect(result.refunded_amount_paise).toBe(20000);
      expect(result.razorpay_refund_id).toBe('rfnd_test');
    });
  });

  // ── (f) Payment gate: 402 without payment, success with payment ──────

  describe('payment gate enforcement', () => {
    it('should reject submission without completed payment (HTTP 402)', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertPaymentCompleted(APP_ID, {
          fields: [{ type: 'payment', customConfig: { staticFee: '150.00' } }],
        }),
      ).rejects.toThrow(HttpException);

      try {
        await service.assertPaymentCompleted(APP_ID, {
          fields: [{ type: 'payment', customConfig: { staticFee: '150.00' } }],
        });
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      }
    });

    it('should allow submission with completed payment', async () => {
      mockPaymentRepo.findOne.mockResolvedValue({ id: 'rec-1', status: 'completed' });

      await expect(
        service.assertPaymentCompleted(APP_ID, {
          fields: [{ type: 'payment', customConfig: { staticFee: '150.00' } }],
        }),
      ).resolves.toBeUndefined();
    });

    it('should allow submission when no payment field exists', async () => {
      await expect(
        service.assertPaymentCompleted(APP_ID, {
          fields: [{ type: 'text', id: 'name', label: 'Name' }],
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ── (g) Max retry limit → 429 on 6th attempt ─────────────────────────

  describe('max retry limit enforcement', () => {
    it('should reject 6th payment attempt with 429', async () => {
      const failedRecord = {
        id: 'rec-5',
        application_id: APP_ID,
        status: 'failed',
        attempt_number: 5,
      };
      mockPaymentRepo.find.mockResolvedValue([failedRecord]);

      await expect(
        service.createOrder(APP_ID, TENANT_ID, CONSUMER_ID, 10000),
      ).rejects.toThrow(HttpException);

      try {
        await service.createOrder(APP_ID, TENANT_ID, CONSUMER_ID, 10000);
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  // ── (h) Stale payment cleanup ────────────────────────────────────────

  describe('stale payment cleanup', () => {
    it('should mark pending records older than 30 min as failed', async () => {
      const staleRecord = {
        id: 'rec-stale',
        status: 'pending',
        created_at: new Date(Date.now() - 31 * 60 * 1000),
        status_history: [],
        failure_reason: null,
      };
      mockPaymentRepo.find.mockResolvedValue([staleRecord]);

      const count = await service.cleanupStalePayments();
      expect(count).toBe(1);
      expect(staleRecord.status).toBe('failed');
      expect(staleRecord.failure_reason).toBe('timeout');
    });
  });
});
