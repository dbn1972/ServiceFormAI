/**
 * Fee Expression Serializer / Deserializer
 *
 * Serializes and parses FeeExpression objects with validation.
 * Ensures round-trip property: parse(serialize(expr)) produces an equivalent object.
 */

import type { FeeExpression } from './fee-calculator.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeeExpressionParseError {
  error: true;
  message: string;
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

/**
 * Serialize a FeeExpression to a canonical JSON string.
 */
export function serializeFeeExpression(expr: FeeExpression): string {
  if (expr.type === 'lookup') {
    const serialized: Record<string, unknown> = {
      type: 'lookup',
      fieldRef: expr.fieldRef,
      table: expr.table,
    };
    if (expr.defaultFee !== undefined) {
      serialized.defaultFee = expr.defaultFee;
    }
    return JSON.stringify(serialized);
  }

  if (expr.type === 'formula') {
    const serialized: Record<string, unknown> = {
      type: 'formula',
      expression: expr.expression,
      fieldRefs: expr.fieldRefs,
    };
    return JSON.stringify(serialized);
  }

  // Unknown type — serialize as-is
  return JSON.stringify(expr);
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/**
 * Parse a JSON string into a typed FeeExpression object.
 * Returns a descriptive error for malformed input.
 */
export function parseFeeExpression(
  json: string,
): FeeExpression | FeeExpressionParseError {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: true, message: 'Invalid JSON string' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: true, message: 'Expected a JSON object' };
  }

  if (typeof parsed.type !== 'string') {
    return { error: true, message: 'Missing or invalid "type" property' };
  }

  if (parsed.type === 'lookup') {
    if (typeof parsed.fieldRef !== 'string' || parsed.fieldRef.trim() === '') {
      return { error: true, message: 'Lookup expression missing "fieldRef"' };
    }
    if (typeof parsed.table !== 'object' || parsed.table === null || Array.isArray(parsed.table)) {
      return { error: true, message: 'Lookup expression missing or invalid "table"' };
    }
    // Validate table values are strings
    for (const [key, val] of Object.entries(parsed.table)) {
      if (typeof val !== 'string') {
        return { error: true, message: `Lookup table value for key "${key}" is not a string` };
      }
    }

    const result: FeeExpression = {
      type: 'lookup',
      fieldRef: parsed.fieldRef,
      table: parsed.table,
    };
    if (parsed.defaultFee !== undefined) {
      if (typeof parsed.defaultFee !== 'string') {
        return { error: true, message: '"defaultFee" must be a string' };
      }
      result.defaultFee = parsed.defaultFee;
    }
    return result;
  }

  if (parsed.type === 'formula') {
    if (typeof parsed.expression !== 'string' || parsed.expression.trim() === '') {
      return { error: true, message: 'Formula expression missing "expression"' };
    }
    if (!Array.isArray(parsed.fieldRefs)) {
      return { error: true, message: 'Formula expression missing "fieldRefs" array' };
    }
    for (let i = 0; i < parsed.fieldRefs.length; i++) {
      if (typeof parsed.fieldRefs[i] !== 'string') {
        return { error: true, message: `fieldRefs[${i}] is not a string` };
      }
    }

    return {
      type: 'formula',
      expression: parsed.expression,
      fieldRefs: parsed.fieldRefs,
    };
  }

  return { error: true, message: `Unknown fee expression type: "${parsed.type}"` };
}
