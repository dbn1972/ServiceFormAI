/**
 * Payment Record Serializer / Deserializer
 *
 * Serializes PaymentRecord objects to canonical JSON with:
 * - Monetary amounts as string decimal representations (not floating-point)
 * - Consistent key ordering
 * - Round-trip property: serialize(deserialize(serialize(r))) === serialize(r)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerializedPaymentRecord {
  id: string;
  application_id: string;
  tenant_id: string;
  consumer_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  amount: string;           // Decimal string, e.g. "150.00"
  currency: string;
  refunded_amount: string;  // Decimal string, e.g. "0.00"
  status: string;
  failure_reason: string | null;
  attempt_number: number;
  idempotency_key: string;
  receipt_number: string | null;
  status_history: Array<{
    from: string | null;
    to: string;
    timestamp: string;
    reason?: string;
    method?: string;
  }>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  refunded_at: string | null;
}

export interface DeserializedPaymentRecord {
  id: string;
  application_id: string;
  tenant_id: string;
  consumer_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  amount_paise: number;
  currency: string;
  refunded_amount_paise: number;
  status: string;
  failure_reason: string | null;
  attempt_number: number;
  idempotency_key: string;
  receipt_number: string | null;
  status_history: Array<{
    from: string | null;
    to: string;
    timestamp: string;
    reason?: string;
    method?: string;
  }>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  refunded_at: string | null;
}

export interface SerializationError {
  error: true;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert paise (integer) to a decimal string with exactly 2 decimal places.
 */
function paiseToDecimalString(paise: number): string {
  const rupees = paise / 100;
  return rupees.toFixed(2);
}

/**
 * Convert a decimal string (e.g. "150.00") to paise (integer).
 */
function decimalStringToPaise(str: string): number {
  const num = parseFloat(str);
  return Math.round(num * 100);
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (date instanceof Date) return date.toISOString();
  return String(date);
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

/**
 * Serialize a PaymentRecord (or deserialized record) to a canonical JSON string.
 * Monetary amounts are encoded as string decimals.
 * Keys are in a consistent order.
 */
export function serializePaymentRecord(
  record: DeserializedPaymentRecord | Record<string, any>,
): string {
  const serialized: SerializedPaymentRecord = {
    id: record.id,
    application_id: record.application_id,
    tenant_id: record.tenant_id,
    consumer_id: record.consumer_id,
    razorpay_order_id: record.razorpay_order_id ?? null,
    razorpay_payment_id: record.razorpay_payment_id ?? null,
    razorpay_refund_id: record.razorpay_refund_id ?? null,
    amount: paiseToDecimalString(
      typeof record.amount_paise === 'number' ? record.amount_paise : 0,
    ),
    currency: record.currency ?? 'INR',
    refunded_amount: paiseToDecimalString(
      typeof record.refunded_amount_paise === 'number' ? record.refunded_amount_paise : 0,
    ),
    status: record.status ?? 'pending',
    failure_reason: record.failure_reason ?? null,
    attempt_number: record.attempt_number ?? 1,
    idempotency_key: record.idempotency_key ?? '',
    receipt_number: record.receipt_number ?? null,
    status_history: Array.isArray(record.status_history)
      ? record.status_history.map((t: any) => ({
          from: t.from ?? null,
          to: t.to,
          timestamp: t.timestamp,
          ...(t.reason !== undefined ? { reason: t.reason } : {}),
          ...(t.method !== undefined ? { method: t.method } : {}),
        }))
      : [],
    created_at: formatDate(record.created_at) ?? new Date().toISOString(),
    updated_at: formatDate(record.updated_at) ?? new Date().toISOString(),
    completed_at: formatDate(record.completed_at),
    refunded_at: formatDate(record.refunded_at),
  };

  return JSON.stringify(serialized);
}

// ---------------------------------------------------------------------------
// Deserialize
// ---------------------------------------------------------------------------

/**
 * Deserialize a JSON string into a typed PaymentRecord object.
 * Returns a descriptive error for missing or malformed properties.
 */
export function deserializePaymentRecord(
  json: string,
): DeserializedPaymentRecord | SerializationError {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: true, message: 'Invalid JSON string' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: true, message: 'Expected a JSON object' };
  }

  // Required string fields
  const requiredStrings = ['id', 'application_id', 'tenant_id', 'consumer_id', 'status', 'idempotency_key'] as const;
  for (const key of requiredStrings) {
    if (typeof parsed[key] !== 'string' || parsed[key].trim() === '') {
      return { error: true, message: `Missing or invalid required property "${key}"` };
    }
  }

  // Amount fields (must be string decimals)
  if (typeof parsed.amount !== 'string') {
    return { error: true, message: 'Missing or invalid property "amount" (expected decimal string)' };
  }
  const amountPaise = decimalStringToPaise(parsed.amount);
  if (isNaN(amountPaise)) {
    return { error: true, message: `Invalid amount value: "${parsed.amount}"` };
  }

  const refundedAmountStr = parsed.refunded_amount ?? '0.00';
  if (typeof refundedAmountStr !== 'string') {
    return { error: true, message: 'Invalid property "refunded_amount" (expected decimal string)' };
  }
  const refundedAmountPaise = decimalStringToPaise(refundedAmountStr);

  // attempt_number
  if (typeof parsed.attempt_number !== 'number' || !Number.isInteger(parsed.attempt_number)) {
    return { error: true, message: 'Missing or invalid property "attempt_number" (expected integer)' };
  }

  return {
    id: parsed.id,
    application_id: parsed.application_id,
    tenant_id: parsed.tenant_id,
    consumer_id: parsed.consumer_id,
    razorpay_order_id: parsed.razorpay_order_id ?? null,
    razorpay_payment_id: parsed.razorpay_payment_id ?? null,
    razorpay_refund_id: parsed.razorpay_refund_id ?? null,
    amount_paise: amountPaise,
    currency: parsed.currency ?? 'INR',
    refunded_amount_paise: refundedAmountPaise,
    status: parsed.status,
    failure_reason: parsed.failure_reason ?? null,
    attempt_number: parsed.attempt_number,
    idempotency_key: parsed.idempotency_key,
    receipt_number: parsed.receipt_number ?? null,
    status_history: Array.isArray(parsed.status_history) ? parsed.status_history : [],
    created_at: parsed.created_at ?? new Date().toISOString(),
    updated_at: parsed.updated_at ?? new Date().toISOString(),
    completed_at: parsed.completed_at ?? null,
    refunded_at: parsed.refunded_at ?? null,
  };
}
