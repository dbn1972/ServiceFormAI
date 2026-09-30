import type { PaymentStatus } from '../database/entities/payment-record.entity';

// ── Gateway Adapter Interfaces ──────────────────────────────────────────────

export interface CreateOrderParams {
  amount_paise: number;
  currency: string;
  receipt: string;
  idempotency_key: string;
}

export interface GatewayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface GatewayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
}

export interface GatewayRefund {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
}

export interface SignatureParams {
  order_id: string;
  payment_id: string;
  signature: string;
  secret: string;
}

export interface RefundParams {
  amount_paise: number;
  reason?: string;
}

// ── Payment Gateway Adapter Interface ───────────────────────────────────────

export interface PaymentGatewayAdapter {
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>;
  fetchPayment(paymentId: string): Promise<GatewayPayment>;
  createRefund(paymentId: string, params: RefundParams): Promise<GatewayRefund>;
  verifySignature(orderId: string, paymentId: string, signature: string, secret: string): boolean;
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean;
}

// ── Fee Configuration Types ─────────────────────────────────────────────────

export type FeeExpression =
  | { type: 'lookup'; fieldRef: string; table: Record<string, string>; defaultFee?: string }
  | { type: 'formula'; expression: string; fieldRefs: string[] };

export interface PaymentFieldConfig {
  staticFee?: string;
  feeExpression?: FeeExpression;
  currency?: string;
}

export interface FeeCalculationResult {
  status: 'resolved' | 'pending' | 'error';
  amount?: string;
  amountPaise?: number;
  currency: string;
  breakdown?: string;
  errorMessage?: string;
}

// ── Status Transition ───────────────────────────────────────────────────────

export interface StatusTransition {
  from: PaymentStatus | null;
  to: PaymentStatus;
  timestamp: string; // ISO 8601
  reason?: string;
  method?: 'api' | 'webhook' | 'timeout';
}

// ── Supported Currencies ────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = ['INR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// ── Amount Limits ───────────────────────────────────────────────────────────

/** Maximum amount in paise (₹10,00,000 = 10,00,00,000 paise) */
export const MAX_AMOUNT_PAISE = 1_000_000_00; // 10,00,000 INR in paise

/** Maximum retry attempts per application */
export const MAX_PAYMENT_ATTEMPTS = 5;

/** Stale payment timeout in milliseconds (30 minutes) */
export const STALE_PAYMENT_TIMEOUT_MS = 30 * 60 * 1000;
