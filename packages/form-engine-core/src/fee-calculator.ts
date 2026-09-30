/**
 * Fee Calculator — pure function module for computing payment fees.
 *
 * Shared between frontend (live preview) and backend (server-side validation).
 * Supports static fees, lookup-based fees, and formula-based fees.
 *
 * All monetary amounts are handled as integers in paise (smallest currency unit)
 * internally, and returned as both paise (integer) and decimal strings.
 *
 * Uses banker's rounding (round half to even) for 2-decimal-place results.
 */

import { evaluateExpression } from './fee-expression-parser.js';

// ---------------------------------------------------------------------------
// Types (re-exported from here for convenience)
// ---------------------------------------------------------------------------

export interface FeeExpression {
  type: 'lookup' | 'formula';
  fieldRef?: string;
  table?: Record<string, string>;
  defaultFee?: string;
  expression?: string;
  fieldRefs?: string[];
}

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

// ---------------------------------------------------------------------------
// Banker's rounding (round half to even)
// ---------------------------------------------------------------------------

/**
 * Round a number to 2 decimal places using banker's rounding.
 * When the value is exactly halfway (e.g. 2.5, 3.5), round to the nearest
 * even number.
 */
export function bankersRound(value: number): number {
  const shifted = value * 100;
  const floored = Math.floor(shifted);
  const diff = shifted - floored;

  if (Math.abs(diff - 0.5) < 1e-9) {
    if (floored % 2 === 0) {
      return floored / 100;
    } else {
      return (floored + 1) / 100;
    }
  }

  return Math.round(shifted) / 100;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDecimalString(str: string): number {
  if (typeof str !== 'string') return NaN;
  const trimmed = str.trim();
  if (trimmed === '') return NaN;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return NaN;
  return parseFloat(trimmed);
}

function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

function formatAmount(paise: number): string {
  const rupees = paise / 100;
  return rupees.toFixed(2);
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export function calculateFee(
  paymentField: PaymentFieldConfig,
  formData: Record<string, unknown>,
): FeeCalculationResult {
  const currency = paymentField.currency ?? 'INR';

  if (paymentField.staticFee !== undefined && paymentField.staticFee !== null) {
    const amount = parseDecimalString(paymentField.staticFee);
    if (isNaN(amount)) {
      return { status: 'error', currency, errorMessage: `Invalid static fee value: "${paymentField.staticFee}"` };
    }
    if (amount < 0) {
      return { status: 'error', currency, errorMessage: 'Fee amount cannot be negative' };
    }
    const rounded = bankersRound(amount);
    const paise = toPaise(rounded);
    return {
      status: 'resolved',
      amount: formatAmount(paise),
      amountPaise: paise,
      currency,
      breakdown: `Static fee: ${currency} ${formatAmount(paise)}`,
    };
  }

  if (!paymentField.feeExpression) {
    return { status: 'error', currency, errorMessage: 'Payment field has neither staticFee nor feeExpression' };
  }

  const expr = paymentField.feeExpression;

  if (expr.type === 'lookup') {
    return calculateLookupFee(expr, formData, currency);
  }

  if (expr.type === 'formula') {
    return calculateFormulaFee(expr, formData, currency);
  }

  return { status: 'error', currency, errorMessage: `Unknown fee expression type: "${(expr as any).type}"` };
}

function calculateLookupFee(
  expr: FeeExpression,
  formData: Record<string, unknown>,
  currency: string,
): FeeCalculationResult {
  const fieldRef = expr.fieldRef;
  if (!fieldRef) {
    return { status: 'error', currency, errorMessage: 'Lookup expression missing fieldRef' };
  }
  const table = expr.table;
  if (!table || typeof table !== 'object') {
    return { status: 'error', currency, errorMessage: 'Lookup expression missing table' };
  }
  const fieldValue = formData[fieldRef];
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return { status: 'pending', currency };
  }
  const key = String(fieldValue);
  let feeStr = table[key];
  if (feeStr === undefined) {
    if (expr.defaultFee !== undefined && expr.defaultFee !== null) {
      feeStr = expr.defaultFee;
    } else {
      return { status: 'error', currency, errorMessage: `No fee defined for value "${key}" and no default fee specified` };
    }
  }
  const amount = parseDecimalString(feeStr);
  if (isNaN(amount)) {
    return { status: 'error', currency, errorMessage: `Invalid fee value in lookup table: "${feeStr}"` };
  }
  if (amount < 0) {
    return { status: 'error', currency, errorMessage: 'Fee amount cannot be negative' };
  }
  const rounded = bankersRound(amount);
  const paise = toPaise(rounded);
  return {
    status: 'resolved',
    amount: formatAmount(paise),
    amountPaise: paise,
    currency,
    breakdown: `Lookup fee for "${key}": ${currency} ${formatAmount(paise)}`,
  };
}

function calculateFormulaFee(
  expr: FeeExpression,
  formData: Record<string, unknown>,
  currency: string,
): FeeCalculationResult {
  const expression = expr.expression;
  if (!expression || typeof expression !== 'string') {
    return { status: 'error', currency, errorMessage: 'Formula expression missing expression string' };
  }
  const fieldRefs = expr.fieldRefs ?? [];
  const fieldValues: Record<string, number> = {};
  for (const ref of fieldRefs) {
    const val = formData[ref];
    if (val === undefined || val === null || val === '') {
      return { status: 'pending', currency };
    }
    const numVal = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(numVal)) {
      return { status: 'error', currency, errorMessage: `Non-numeric value for field "${ref}": "${val}"` };
    }
    fieldValues[ref] = numVal;
  }
  const result = evaluateExpression(expression, fieldValues, fieldRefs);
  if (result.status === 'error') {
    return { status: 'error', currency, errorMessage: result.errorMessage ?? 'Expression evaluation failed' };
  }
  const rawValue = result.value!;
  if (rawValue < 0) {
    return { status: 'error', currency, errorMessage: 'Computed fee is negative' };
  }
  const rounded = bankersRound(rawValue);
  const paise = toPaise(rounded);
  return {
    status: 'resolved',
    amount: formatAmount(paise),
    amountPaise: paise,
    currency,
    breakdown: `Formula: ${expression} = ${currency} ${formatAmount(paise)}`,
  };
}
