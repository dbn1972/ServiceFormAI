import { createHmac } from 'crypto';
import { RazorpayClient } from './razorpay-client';
import { IntegrationService } from '../integration/integration.service';

describe('RazorpayClient', () => {
  let client: RazorpayClient;

  beforeEach(() => {
    const mockIntegrationService = {} as IntegrationService;
    client = new RazorpayClient(mockIntegrationService);
  });

  describe('verifySignature', () => {
    const secret = 'test_secret_key';
    const orderId = 'order_abc123';
    const paymentId = 'pay_xyz789';

    it('should return true for a valid signature', () => {
      const payload = `${orderId}|${paymentId}`;
      const validSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(client.verifySignature(orderId, paymentId, validSignature, secret)).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      expect(
        client.verifySignature(orderId, paymentId, 'invalid_signature_hex', secret),
      ).toBe(false);
    });

    it('should return false for a tampered order ID', () => {
      const payload = `${orderId}|${paymentId}`;
      const validSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(
        client.verifySignature('order_tampered', paymentId, validSignature, secret),
      ).toBe(false);
    });

    it('should return false for a tampered payment ID', () => {
      const payload = `${orderId}|${paymentId}`;
      const validSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(
        client.verifySignature(orderId, 'pay_tampered', validSignature, secret),
      ).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'webhook_secret_123';

    it('should return true for a valid webhook signature', () => {
      const body = '{"event":"payment.captured","payload":{}}';
      const validSignature = createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      expect(client.verifyWebhookSignature(body, validSignature, secret)).toBe(true);
    });

    it('should return false for an invalid webhook signature', () => {
      const body = '{"event":"payment.captured","payload":{}}';
      expect(client.verifyWebhookSignature(body, 'bad_sig', secret)).toBe(false);
    });

    it('should return false for a tampered body', () => {
      const body = '{"event":"payment.captured","payload":{}}';
      const validSignature = createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const tamperedBody = '{"event":"payment.captured","payload":{"tampered":true}}';
      expect(client.verifyWebhookSignature(tamperedBody, validSignature, secret)).toBe(false);
    });
  });
});
