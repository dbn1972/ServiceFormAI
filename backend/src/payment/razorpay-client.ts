import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { CircuitBreaker } from '../common/circuit-breaker';
import { IntegrationService } from '../integration/integration.service';
import type {
  PaymentGatewayAdapter,
  CreateOrderParams,
  GatewayOrder,
  GatewayPayment,
  GatewayRefund,
  RefundParams,
} from './types';

const DEFAULT_BASE_URL = 'https://api.razorpay.com/v1';
const REQUEST_TIMEOUT_MS = 5_000;

interface ResolvedCredentials {
  keyId: string;
  keySecret: string;
  baseUrl: string;
}

@Injectable()
export class RazorpayClient implements PaymentGatewayAdapter {
  private readonly logger = new Logger(RazorpayClient.name);
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly integrationService: IntegrationService) {
    this.circuitBreaker = new CircuitBreaker({
      name: 'razorpay',
      failureThreshold: 5,
      cooldownMs: 30_000,
      onStateChange: (name, from, to) => {
        this.logger.warn(`Circuit breaker "${name}" transitioned from ${from} to ${to}`);
      },
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async createOrder(params: CreateOrderParams, tenantId?: string): Promise<GatewayOrder> {
    const creds = tenantId ? await this.resolveCredentials(tenantId) : null;
    return this.circuitBreaker.execute(async () => {
      const body = {
        amount: params.amount_paise,
        currency: params.currency,
        receipt: params.receipt,
      };
      const response = await this.request(
        'POST',
        '/orders',
        body,
        creds,
        { 'X-Razorpay-Idempotency-Key': params.idempotency_key },
      );
      return {
        id: response.id,
        amount: response.amount,
        currency: response.currency,
        receipt: response.receipt,
        status: response.status,
      };
    });
  }

  async fetchPayment(paymentId: string, tenantId?: string): Promise<GatewayPayment> {
    const creds = tenantId ? await this.resolveCredentials(tenantId) : null;
    return this.circuitBreaker.execute(async () => {
      const response = await this.request('GET', `/payments/${paymentId}`, null, creds);
      return {
        id: response.id,
        order_id: response.order_id,
        amount: response.amount,
        currency: response.currency,
        status: response.status,
        method: response.method,
      };
    });
  }

  async createRefund(paymentId: string, params: RefundParams, tenantId?: string): Promise<GatewayRefund> {
    const creds = tenantId ? await this.resolveCredentials(tenantId) : null;
    return this.circuitBreaker.execute(async () => {
      const body: Record<string, unknown> = { amount: params.amount_paise };
      if (params.reason) {
        body.notes = { reason: params.reason };
      }
      const response = await this.request(
        'POST',
        `/payments/${paymentId}/refunds`,
        body,
        creds,
      );
      return {
        id: response.id,
        payment_id: response.payment_id,
        amount: response.amount,
        status: response.status,
      };
    });
  }

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string,
  ): boolean {
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // ── Credential Resolution ─────────────────────────────────────────────────

  async resolveCredentials(tenantId: string): Promise<ResolvedCredentials> {
    const integration = await this.integrationService.getIntegration(tenantId, 'razorpay');

    const credentialRefs = integration.credential_refs ?? {};
    const apiKeyRef = credentialRefs['api_key_ref'];
    const apiSecretRef = credentialRefs['api_secret_ref'];

    if (!apiKeyRef || !apiSecretRef) {
      throw new Error('Razorpay credential references not configured for this tenant');
    }

    const keyId = process.env[apiKeyRef];
    const keySecret = process.env[apiSecretRef];

    if (!keyId || !keySecret) {
      throw new Error(
        `Razorpay credentials not found in environment: ${apiKeyRef}, ${apiSecretRef}`,
      );
    }

    const config = (integration.config ?? {}) as Record<string, unknown>;
    const sandboxMode = config['sandbox_mode'] === true;
    const baseUrl = (config['base_url'] as string) || DEFAULT_BASE_URL;

    return { keyId, keySecret, baseUrl: sandboxMode ? baseUrl : DEFAULT_BASE_URL };
  }

  async resolveWebhookSecret(tenantId: string): Promise<string> {
    const integration = await this.integrationService.getIntegration(tenantId, 'razorpay');
    const webhookSecretRef = integration.webhook_secret_ref;
    if (!webhookSecretRef) {
      throw new Error('Razorpay webhook secret reference not configured for this tenant');
    }
    const secret = process.env[webhookSecretRef];
    if (!secret) {
      throw new Error(
        `Razorpay webhook secret not found in environment: ${webhookSecretRef}`,
      );
    }
    return secret;
  }

  // ── HTTP Helper ───────────────────────────────────────────────────────────

  private async request(
    method: string,
    path: string,
    body: Record<string, unknown> | null,
    creds: ResolvedCredentials | null,
    extraHeaders?: Record<string, string>,
  ): Promise<any> {
    const baseUrl = creds?.baseUrl ?? DEFAULT_BASE_URL;
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (creds) {
      const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Razorpay API error: ${response.status} ${response.statusText} — ${errorBody}`,
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
