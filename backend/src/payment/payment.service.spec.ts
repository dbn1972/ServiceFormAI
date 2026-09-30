import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRecord } from '../database/entities/payment-record.entity';
import { IntegrationService } from '../integration/integration.service';
import { AuditService } from '../audit/audit.service';
import { RazorpayClient } from './razorpay-client';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: any;
  let integrationService: any;
  let auditService: any;
  let razorpayClient: any;

  const mockPaymentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockIntegrationService = {
    assertIntegrationAvailable: jest.fn(),
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
    resolveCredentials: jest.fn(),
    resolveWebhookSecret: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
    paymentRepo = mockPaymentRepo;
    integrationService = mockIntegrationService;
    auditService = mockAuditService;
    razorpayClient = mockRazorpayClient;
  });

  describe('createOrder', () => {
    const appId = '11111111-1111-1111-1111-111111111111';
    const tenantId = '22222222-2222-2222-2222-222222222222';
    const consumerId = '33333333-3333-3333-3333-333333333333';

    it('should reject non-positive amounts', async () => {
      await expect(
        service.createOrder(appId, tenantId, consumerId, 0),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createOrder(appId, tenantId, consumerId, -100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject amounts exceeding the maximum', async () => {
      await expect(
        service.createOrder(appId, tenantId, consumerId, 1_000_000_01),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing pending record (idempotency)', async () => {
      const existingRecord = {
        id: 'rec-1',
        application_id: appId,
        status: 'pending',
        attempt_number: 1,
        razorpay_order_id: 'order_123',
      };
      paymentRepo.find.mockResolvedValue([existingRecord]);
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'rzp_test_key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });

      const result = await service.createOrder(appId, tenantId, consumerId, 10000);
      expect(result.record).toBe(existingRecord);
      expect(result.razorpayKeyId).toBe('rzp_test_key');
      expect(razorpayClient.createOrder).not.toHaveBeenCalled();
    });

    it('should return existing completed record (idempotency)', async () => {
      const existingRecord = {
        id: 'rec-1',
        application_id: appId,
        status: 'completed',
        attempt_number: 1,
      };
      paymentRepo.find.mockResolvedValue([existingRecord]);
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'rzp_test_key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });

      const result = await service.createOrder(appId, tenantId, consumerId, 10000);
      expect(result.record).toBe(existingRecord);
    });

    it('should increment attempt number after failed payment', async () => {
      const failedRecord = {
        id: 'rec-1',
        application_id: appId,
        status: 'failed',
        attempt_number: 1,
      };
      paymentRepo.find.mockResolvedValue([failedRecord]);
      paymentRepo.findOne.mockResolvedValue(null);
      integrationService.assertIntegrationAvailable.mockResolvedValue(undefined);
      razorpayClient.createOrder.mockResolvedValue({
        id: 'order_new',
        amount: 10000,
        currency: 'INR',
        receipt: `app_${appId}_2`,
        status: 'created',
      });
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'rzp_test_key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });
      paymentRepo.create.mockImplementation((data: any) => ({ ...data }));
      paymentRepo.save.mockImplementation((data: any) => data);

      const result = await service.createOrder(appId, tenantId, consumerId, 10000);
      expect(result.record.attempt_number).toBe(2);
      expect(result.record.idempotency_key).toBe(`pay_${appId}_2`);
    });

    it('should reject when max attempts exceeded', async () => {
      const failedRecord = {
        id: 'rec-5',
        application_id: appId,
        status: 'failed',
        attempt_number: 5,
      };
      paymentRepo.find.mockResolvedValue([failedRecord]);

      await expect(
        service.createOrder(appId, tenantId, consumerId, 10000),
      ).rejects.toThrow(HttpException);
    });

    it('should create a new order successfully', async () => {
      paymentRepo.find.mockResolvedValue([]);
      paymentRepo.findOne.mockResolvedValue(null);
      integrationService.assertIntegrationAvailable.mockResolvedValue(undefined);
      razorpayClient.createOrder.mockResolvedValue({
        id: 'order_abc',
        amount: 15000,
        currency: 'INR',
        receipt: `app_${appId}_1`,
        status: 'created',
      });
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'rzp_test_key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });
      paymentRepo.create.mockImplementation((data: any) => ({ ...data }));
      paymentRepo.save.mockImplementation((data: any) => data);

      const result = await service.createOrder(appId, tenantId, consumerId, 15000);
      expect(result.record.status).toBe('pending');
      expect(result.record.razorpay_order_id).toBe('order_abc');
      expect(result.record.idempotency_key).toBe(`pay_${appId}_1`);
      expect(result.razorpayKeyId).toBe('rzp_test_key');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'payment.order.created' }),
      );
    });
  });

  describe('verifyPayment', () => {
    const tenantId = '22222222-2222-2222-2222-222222222222';

    it('should throw NotFoundException when record not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyPayment('order_123', 'pay_123', 'sig_123', tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid signature', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: tenantId,
        application_id: 'app-1',
        amount_paise: 10000,
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });
      razorpayClient.verifySignature.mockReturnValue(false);
      paymentRepo.save.mockImplementation((data: any) => data);

      await expect(
        service.verifyPayment('order_123', 'pay_123', 'bad_sig', tenantId),
      ).rejects.toThrow(BadRequestException);

      expect(record.status).toBe('failed');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'payment.verification.failed' }),
      );
    });

    it('should reject amount mismatch', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: tenantId,
        application_id: 'app-1',
        amount_paise: 10000,
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });
      razorpayClient.verifySignature.mockReturnValue(true);
      razorpayClient.fetchPayment.mockResolvedValue({
        id: 'pay_123',
        order_id: 'order_123',
        amount: 20000, // mismatch
        currency: 'INR',
        status: 'captured',
        method: 'upi',
      });
      paymentRepo.save.mockImplementation((data: any) => data);

      await expect(
        service.verifyPayment('order_123', 'pay_123', 'sig_123', tenantId),
      ).rejects.toThrow(BadRequestException);

      expect(record.status).toBe('failed');
    });

    it('should complete verification successfully', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: tenantId,
        consumer_id: 'consumer-1',
        application_id: 'app-1',
        amount_paise: 10000,
        razorpay_payment_id: null,
        completed_at: null,
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveCredentials.mockResolvedValue({
        keyId: 'key',
        keySecret: 'secret',
        baseUrl: 'https://api.razorpay.com/v1',
      });
      razorpayClient.verifySignature.mockReturnValue(true);
      razorpayClient.fetchPayment.mockResolvedValue({
        id: 'pay_123',
        order_id: 'order_123',
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
      });
      paymentRepo.save.mockImplementation((data: any) => data);

      const result = await service.verifyPayment('order_123', 'pay_123', 'sig_123', tenantId);
      expect(result.status).toBe('completed');
      expect(result.razorpay_payment_id).toBe('pay_123');
      expect(result.completed_at).toBeInstanceOf(Date);
    });
  });

  describe('initiateRefund', () => {
    it('should reject refund for non-completed payment', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        status: 'pending',
      });

      await expect(
        service.initiateRefund('rec-1', 5000, 'test', 'admin-1', 'admin', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject refund exceeding original amount', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        status: 'completed',
        amount_paise: 10000,
        refunded_amount_paise: 8000,
        razorpay_payment_id: 'pay_123',
      });

      await expect(
        service.initiateRefund('rec-1', 5000, 'test', 'admin-1', 'admin', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process full refund successfully', async () => {
      const record = {
        id: 'rec-1',
        status: 'completed',
        amount_paise: 10000,
        refunded_amount_paise: 0,
        razorpay_payment_id: 'pay_123',
        razorpay_refund_id: null,
        refunded_at: null,
        application_id: 'app-1',
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.createRefund.mockResolvedValue({
        id: 'rfnd_123',
        payment_id: 'pay_123',
        amount: 10000,
        status: 'processed',
      });
      paymentRepo.save.mockImplementation((data: any) => data);

      const result = await service.initiateRefund(
        'rec-1', 10000, 'Application rejected', 'admin-1', 'admin', 'tenant-1',
      );

      expect(result.status).toBe('refunded');
      expect(result.refunded_amount_paise).toBe(10000);
      expect(result.razorpay_refund_id).toBe('rfnd_123');
    });

    it('should process partial refund successfully', async () => {
      const record = {
        id: 'rec-1',
        status: 'completed',
        amount_paise: 10000,
        refunded_amount_paise: 0,
        razorpay_payment_id: 'pay_123',
        razorpay_refund_id: null,
        refunded_at: null,
        application_id: 'app-1',
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.createRefund.mockResolvedValue({
        id: 'rfnd_456',
        payment_id: 'pay_123',
        amount: 5000,
        status: 'processed',
      });
      paymentRepo.save.mockImplementation((data: any) => data);

      const result = await service.initiateRefund(
        'rec-1', 5000, 'Partial refund', 'admin-1', 'admin', 'tenant-1',
      );

      expect(result.status).toBe('partially_refunded');
      expect(result.refunded_amount_paise).toBe(5000);
    });
  });

  describe('processWebhook', () => {
    it('should handle unknown order ID gracefully', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      // Should not throw
      await service.processWebhook(
        '{}',
        'sig',
        'payment.captured',
        { payment: { entity: { order_id: 'unknown_order' } } },
      );
    });

    it('should reject invalid webhook signature', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: 'tenant-1',
        application_id: 'app-1',
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveWebhookSecret.mockResolvedValue('webhook_secret');
      razorpayClient.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.processWebhook(
          '{"event":"payment.captured"}',
          'bad_sig',
          'payment.captured',
          { payment: { entity: { order_id: 'order_123' } } },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process payment.captured webhook for pending record', async () => {
      const record = {
        id: 'rec-1',
        status: 'pending',
        tenant_id: 'tenant-1',
        application_id: 'app-1',
        amount_paise: 10000,
        razorpay_payment_id: null,
        completed_at: null,
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveWebhookSecret.mockResolvedValue('webhook_secret');
      razorpayClient.verifyWebhookSignature.mockReturnValue(true);
      paymentRepo.save.mockImplementation((data: any) => data);

      await service.processWebhook(
        '{"event":"payment.captured"}',
        'valid_sig',
        'payment.captured',
        { payment: { entity: { order_id: 'order_123', id: 'pay_456' } } },
      );

      expect(record.status).toBe('completed');
      expect(record.razorpay_payment_id).toBe('pay_456');
    });

    it('should not change status for already completed record (idempotency)', async () => {
      const record = {
        id: 'rec-1',
        status: 'completed',
        tenant_id: 'tenant-1',
        application_id: 'app-1',
        status_history: [],
      };
      paymentRepo.findOne.mockResolvedValue(record);
      razorpayClient.resolveWebhookSecret.mockResolvedValue('webhook_secret');
      razorpayClient.verifyWebhookSignature.mockReturnValue(true);

      await service.processWebhook(
        '{"event":"payment.captured"}',
        'valid_sig',
        'payment.captured',
        { payment: { entity: { order_id: 'order_123', id: 'pay_456' } } },
      );

      // Status should remain completed — no save called for status change
      expect(record.status).toBe('completed');
    });
  });

  describe('cleanupStalePayments', () => {
    it('should mark stale pending payments as failed', async () => {
      const staleRecord = {
        id: 'rec-stale',
        status: 'pending',
        created_at: new Date(Date.now() - 31 * 60 * 1000),
        status_history: [],
        failure_reason: null,
      };
      paymentRepo.find.mockResolvedValue([staleRecord]);
      paymentRepo.save.mockImplementation((data: any) => data);

      const count = await service.cleanupStalePayments();
      expect(count).toBe(1);
      expect(staleRecord.status).toBe('failed');
      expect(staleRecord.failure_reason).toBe('timeout');
    });

    it('should return 0 when no stale payments exist', async () => {
      paymentRepo.find.mockResolvedValue([]);
      const count = await service.cleanupStalePayments();
      expect(count).toBe(0);
    });
  });

  describe('assertPaymentCompleted', () => {
    it('should pass when no payment field in schema', async () => {
      await expect(
        service.assertPaymentCompleted('app-1', { fields: [{ type: 'text' }] }),
      ).resolves.toBeUndefined();
    });

    it('should pass when schema has no fields', async () => {
      await expect(
        service.assertPaymentCompleted('app-1', {}),
      ).resolves.toBeUndefined();
    });

    it('should pass when payment field has zero fee', async () => {
      await expect(
        service.assertPaymentCompleted('app-1', {
          fields: [{ type: 'payment', customConfig: { staticFee: '0' } }],
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw 402 when no completed payment exists', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertPaymentCompleted('app-1', {
          fields: [{ type: 'payment', customConfig: { staticFee: '150.00' } }],
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should pass when completed payment exists', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 'rec-1',
        status: 'completed',
      });

      await expect(
        service.assertPaymentCompleted('app-1', {
          fields: [{ type: 'payment', customConfig: { staticFee: '150.00' } }],
        }),
      ).resolves.toBeUndefined();
    });
  });
});
