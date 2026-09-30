/**
 * PaymentField Component
 *
 * Renders inside DynamicFormRenderer when `field.type === 'payment'`.
 * Displays fee summary, triggers Razorpay checkout, and handles
 * payment lifecycle (success, cancel, failure, retry).
 *
 * Loads Razorpay Checkout.js SDK dynamically on first use.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle, Loader2, CreditCard, RefreshCw } from 'lucide-react';
import { calculateFee } from '@serviceformai/form-engine-core';
import type { PaymentFieldConfig, FeeCalculationResult } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentDetails {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amount: number;
  currency: string;
}

interface PaymentFieldProps {
  field: {
    id: string;
    type: string;
    label: string;
    required: boolean;
    helpText?: string;
    customConfig?: Record<string, unknown>;
  };
  formData: Record<string, any>;
  onPaymentComplete: (paymentDetails: PaymentDetails) => void;
  serviceId: string;
  tenantId: string;
  disabled?: boolean;
}

type PaymentState =
  | 'idle'
  | 'creating_order'
  | 'checkout_open'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Razorpay SDK loader
// ---------------------------------------------------------------------------

let razorpayLoadPromise: Promise<void> | null = null;

function loadRazorpaySDK(): Promise<void> {
  if (razorpayLoadPromise) return razorpayLoadPromise;

  razorpayLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayLoadPromise = null;
      reject(new Error('Failed to load Razorpay SDK'));
    };
    document.head.appendChild(script);
  });

  return razorpayLoadPromise;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function createPaymentOrder(
  applicationId: string,
  serviceId: string,
): Promise<{
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
}> {
  const response = await fetch('/api/payments/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ applicationId, serviceId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create payment order' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function verifyPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<void> {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Payment verification failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;

export default function PaymentField({
  field,
  formData,
  onPaymentComplete,
  serviceId,
  tenantId,
  disabled = false,
}: PaymentFieldProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [feeResult, setFeeResult] = useState<FeeCalculationResult | null>(null);
  const razorpayInstanceRef = useRef<any>(null);

  // Compute fee whenever form data changes
  useEffect(() => {
    const config: PaymentFieldConfig = {
      staticFee: field.customConfig?.staticFee as string | undefined,
      feeExpression: field.customConfig?.feeExpression as any,
      currency: (field.customConfig?.currency as string) ?? 'INR',
    };

    const result = calculateFee(config, formData);
    setFeeResult(result);
  }, [field.customConfig, formData]);

  const handlePay = useCallback(async () => {
    if (paymentState === 'creating_order' || paymentState === 'checkout_open' || paymentState === 'verifying') {
      return;
    }

    if (attemptNumber > MAX_ATTEMPTS) {
      setErrorMessage('Maximum payment attempts reached. Please start a new application.');
      setPaymentState('failed');
      return;
    }

    setPaymentState('creating_order');
    setErrorMessage(null);

    try {
      // Load Razorpay SDK
      await loadRazorpaySDK();

      // Create order
      const applicationId = formData._applicationId || `${serviceId}_${tenantId}`;
      const order = await createPaymentOrder(applicationId, serviceId);

      setPaymentState('checkout_open');

      // Open Razorpay checkout
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: tenantId,
        description: `Payment for service`,
        order_id: order.razorpayOrderId,
        handler: async (response: any) => {
          setPaymentState('verifying');
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPaymentState('completed');
            onPaymentComplete({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              amount: order.amount,
              currency: order.currency,
            });
          } catch (err) {
            setPaymentState('failed');
            setErrorMessage(err instanceof Error ? err.message : 'Payment verification failed');
            setAttemptNumber((prev) => prev + 1);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentState('cancelled');
            razorpayInstanceRef.current = null;
          },
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      razorpayInstanceRef.current = rzp;

      rzp.on('payment.failed', (response: any) => {
        setPaymentState('failed');
        setErrorMessage(
          response.error?.description || 'Payment failed. Please try again.',
        );
        setAttemptNumber((prev) => prev + 1);
        razorpayInstanceRef.current = null;
      });

      rzp.open();
    } catch (err) {
      setPaymentState('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initiate payment');
    }
  }, [paymentState, attemptNumber, formData, serviceId, tenantId, onPaymentComplete]);

  // ── Render ──────────────────────────────────────────────────────────────

  const isProcessing =
    paymentState === 'creating_order' ||
    paymentState === 'checkout_open' ||
    paymentState === 'verifying';

  const canRetry =
    (paymentState === 'failed' || paymentState === 'cancelled') &&
    attemptNumber <= MAX_ATTEMPTS;

  const remainingAttempts = MAX_ATTEMPTS - attemptNumber + 1;

  return (
    <div id={`field-${field.id}`} className="mb-6">
      <label className="block text-sm font-medium mb-2">
        {field.label}
        {field.required && (
          <span className="text-destructive ml-1" aria-label="required">*</span>
        )}
      </label>

      {field.helpText && (
        <p className="text-sm text-muted-foreground mb-3">{field.helpText}</p>
      )}

      {/* Fee Summary */}
      <div className="border rounded-lg p-4 mb-3 bg-muted/30">
        {!feeResult && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Calculating fee...</span>
          </div>
        )}

        {feeResult?.status === 'pending' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">
              Fee will be calculated after completing required fields
            </span>
          </div>
        )}

        {feeResult?.status === 'error' && (
          <div className="flex items-center gap-2 text-destructive" role="alert">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">{feeResult.errorMessage}</span>
          </div>
        )}

        {feeResult?.status === 'resolved' && feeResult.amountPaise === 0 && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">No fee required</span>
          </div>
        )}

        {feeResult?.status === 'resolved' && (feeResult.amountPaise ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-semibold">
                {feeResult.currency === 'INR' ? '₹' : feeResult.currency}{' '}
                {feeResult.amount}
              </span>
            </div>
            {feeResult.breakdown && (
              <p className="text-xs text-muted-foreground mt-1">{feeResult.breakdown}</p>
            )}
          </div>
        )}
      </div>

      {/* Payment Status */}
      {paymentState === 'completed' && (
        <div
          className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg mb-3"
          role="status"
        >
          <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
          <span className="text-sm font-medium text-success">Payment completed successfully</span>
        </div>
      )}

      {errorMessage && paymentState === 'failed' && (
        <div
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mb-3"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
          <span className="text-sm text-destructive">{errorMessage}</span>
        </div>
      )}

      {paymentState === 'cancelled' && (
        <div
          className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg mb-3"
          role="status"
        >
          <AlertCircle className="w-5 h-5 text-warning" aria-hidden="true" />
          <span className="text-sm text-warning-foreground">Payment was cancelled</span>
        </div>
      )}

      {/* Pay / Retry Button */}
      {paymentState !== 'completed' &&
        feeResult?.status === 'resolved' &&
        (feeResult.amountPaise ?? 0) > 0 && (
          <div>
            {(paymentState === 'idle' || canRetry) && (
              <button
                type="button"
                onClick={handlePay}
                disabled={disabled || isProcessing}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {paymentState === 'creating_order' && 'Creating order...'}
                    {paymentState === 'checkout_open' && 'Waiting for payment...'}
                    {paymentState === 'verifying' && 'Verifying payment...'}
                  </>
                ) : canRetry ? (
                  <>
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Retry Payment
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" aria-hidden="true" />
                    Pay Now
                  </>
                )}
              </button>
            )}

            {/* Attempt counter */}
            {attemptNumber > 1 && remainingAttempts > 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Attempt {attemptNumber} of {MAX_ATTEMPTS} ({remainingAttempts} remaining)
              </p>
            )}

            {attemptNumber > MAX_ATTEMPTS && (
              <p className="text-xs text-destructive mt-2 text-center">
                Maximum payment attempts reached. Please start a new application.
              </p>
            )}
          </div>
        )}
    </div>
  );
}
