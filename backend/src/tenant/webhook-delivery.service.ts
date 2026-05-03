/**
 * WebhookDeliveryService
 *
 * Delivers signed event payloads to a tenant's configured webhook URL.
 *
 * Security:
 *   - HMAC-SHA256 signature in X-ServiceFormAI-Signature header (sha256=<hex>)
 *   - Per-delivery unique ID in X-ServiceFormAI-Delivery header
 *   - Configurable secret per tenant (stored in notification_policy.webhook_secret)
 *
 * Reliability:
 *   - Up to 3 attempts with 400 ms / 800 ms exponential back-off
 *   - 5-second per-request timeout
 *   - Failures are logged but never thrown (non-blocking)
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';

export interface WebhookEvent {
  /** Unique delivery ID (UUID) */
  id: string;
  /** Event type e.g. "tenant.created", "tenant.suspended" */
  type: string;
  tenantId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);
  private readonly TIMEOUT_MS = 5_000;
  private readonly MAX_RETRIES = 3;

  /**
   * Fire-and-forget webhook delivery. Returns true on success, false after
   * all retries exhausted. Does NOT throw.
   */
  async deliver(url: string, secret: string | undefined, event: WebhookEvent): Promise<boolean> {
    const body = JSON.stringify(event);
    const signature = secret ? this.sign(body, secret) : undefined;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'ServiceFormAI-Webhook/1.0',
          'X-ServiceFormAI-Event': event.type,
          'X-ServiceFormAI-Delivery': event.id,
          'X-ServiceFormAI-Timestamp': event.timestamp,
        };

        if (signature) {
          headers['X-ServiceFormAI-Signature'] = `sha256=${signature}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          this.logger.log(`Webhook delivered: ${event.type} → ${url} [${response.status}]`);
          return true;
        }

        this.logger.warn(
          `Webhook attempt ${attempt}/${this.MAX_RETRIES} non-OK: ` +
          `${event.type} → ${url} [${response.status}]`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Webhook attempt ${attempt}/${this.MAX_RETRIES} error: ${event.type} → ${url}: ${msg}`,
        );
      }

      if (attempt < this.MAX_RETRIES) {
        await this.delay(2 ** attempt * 200); // 400 ms, 800 ms
      }
    }

    this.logger.error(
      `Webhook delivery failed after ${this.MAX_RETRIES} attempts: ${event.type} → ${url}`,
    );
    return false;
  }

  /**
   * Build a WebhookEvent with a fresh delivery ID and current timestamp.
   */
  buildEvent(
    type: string,
    tenantId: string,
    payload: Record<string, unknown>,
  ): WebhookEvent {
    return {
      id: randomUUID(),
      type,
      tenantId,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  private sign(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
