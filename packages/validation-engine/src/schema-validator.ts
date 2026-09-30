/**
 * Schema Validator — validates the structural integrity of a FormSchema.
 *
 * Called at producer save time to ensure schemas are well-formed before
 * they are persisted and presented to citizens.
 */

import type {
  SchemaValidationResult,
  SchemaValidationError,
  FieldType,
} from './types.js';
import { validateActions } from './action-validator.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The set of field types the engine supports. */
const SUPPORTED_FIELD_TYPES: ReadonlySet<string> = new Set<FieldType>([
  'text',
  'number',
  'email',
  'phone',
  'date',
  'dropdown',
  'radio',
  'checkbox',
  'file',
  'textarea',
  'payment',
]);

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

const SCHEMA_MISSING_PROPERTY = 'SCHEMA_MISSING_PROPERTY';
const SCHEMA_INVALID_FIELD = 'SCHEMA_INVALID_FIELD';
const SCHEMA_DUPLICATE_FIELD_ID = 'SCHEMA_DUPLICATE_FIELD_ID';
const SCHEMA_INVALID_CONDITIONAL_REF = 'SCHEMA_INVALID_CONDITIONAL_REF';
const SCHEMA_INVALID_CROSS_FIELD_REF = 'SCHEMA_INVALID_CROSS_FIELD_REF';
const SCHEMA_STEP_FIELD_NOT_FOUND = 'SCHEMA_STEP_FIELD_NOT_FOUND';
const SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE = 'SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE';
const SCHEMA_INVALID_PAYMENT_FIELD = 'SCHEMA_INVALID_PAYMENT_FIELD';
const SCHEMA_DUPLICATE_PAYMENT_FIELD = 'SCHEMA_DUPLICATE_PAYMENT_FIELD';
const SCHEMA_UNSUPPORTED_CURRENCY = 'SCHEMA_UNSUPPORTED_CURRENCY';

/** Supported currencies for payment fields. */
const SUPPORTED_CURRENCIES = new Set(['INR']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// validateSchema
// ---------------------------------------------------------------------------

/**
 * Validates the structural integrity of a raw schema input.
 *
 * Accepts `unknown` because the input has not yet been typed — this function
 * is the gatekeeper that determines whether the input is a valid FormSchema.
 *
 * All errors are collected (no short-circuiting).
 */
export function validateSchema(
  schema: unknown,
  registeredCustomTypes?: Set<string>,
): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];

  // ── 1. Must be an object ──────────────────────────────────────────────
  if (!isObject(schema)) {
    errors.push({
      errorCode: SCHEMA_MISSING_PROPERTY,
      message: 'Schema must be a non-null object',
    });
    return { valid: false, errors };
  }

  // ── 2. Required top-level properties ──────────────────────────────────
  if (!('version' in schema) || !isNonEmptyString(schema.version)) {
    errors.push({
      errorCode: SCHEMA_MISSING_PROPERTY,
      message: 'Schema is missing required property "version"',
    });
  }

  if (!('fields' in schema) || !Array.isArray(schema.fields)) {
    errors.push({
      errorCode: SCHEMA_MISSING_PROPERTY,
      message: 'Schema is missing required property "fields" (must be an array)',
    });
    // Cannot validate fields further without the array
    return { valid: false, errors };
  }

  const fields = schema.fields as unknown[];

  // ── 3. Build field ID set & validate individual fields ────────────────
  const fieldIdSet = new Set<string>();
  const seenIds = new Set<string>();

  for (let i = 0; i < fields.length; i++) {
    const raw = fields[i];

    if (!isObject(raw)) {
      errors.push({
        errorCode: SCHEMA_INVALID_FIELD,
        message: `Field at index ${i} is not a valid object`,
      });
      continue;
    }

    const field = raw as Record<string, unknown>;

    // id
    if (!isNonEmptyString(field.id)) {
      errors.push({
        errorCode: SCHEMA_INVALID_FIELD,
        message: `Field at index ${i} is missing a non-empty "id"`,
      });
    }

    // type
    if (!isNonEmptyString(field.type)) {
      errors.push({
        errorCode: SCHEMA_INVALID_FIELD,
        message: `Field at index ${i} has unsupported or missing "type"${isNonEmptyString(field.id) ? ` (field "${field.id}")` : ''}`,
        fieldId: isNonEmptyString(field.id) ? (field.id as string) : undefined,
      });
    } else if (!SUPPORTED_FIELD_TYPES.has(field.type as string)) {
      // Not a built-in type — check if it's a registered custom type
      if (registeredCustomTypes && registeredCustomTypes.has(field.type as string)) {
        // Valid registered custom type — accepted
      } else if (registeredCustomTypes) {
        // registeredCustomTypes was provided but this type is not in it
        errors.push({
          errorCode: SCHEMA_UNKNOWN_CUSTOM_FIELD_TYPE,
          message: `Field at index ${i} has unregistered custom field type "${field.type}"${isNonEmptyString(field.id) ? ` (field "${field.id}")` : ''}`,
          fieldId: isNonEmptyString(field.id) ? (field.id as string) : undefined,
        });
      } else {
        // No registeredCustomTypes provided — reject unknown types (original behavior)
        errors.push({
          errorCode: SCHEMA_INVALID_FIELD,
          message: `Field at index ${i} has unsupported or missing "type"${isNonEmptyString(field.id) ? ` (field "${field.id}")` : ''}`,
          fieldId: isNonEmptyString(field.id) ? (field.id as string) : undefined,
        });
      }
    }

    // label
    if (!isNonEmptyString(field.label)) {
      errors.push({
        errorCode: SCHEMA_INVALID_FIELD,
        message: `Field at index ${i} is missing a non-empty "label"${isNonEmptyString(field.id) ? ` (field "${field.id}")` : ''}`,
        fieldId: isNonEmptyString(field.id) ? (field.id as string) : undefined,
      });
    }

    // Track IDs for duplicate detection
    if (isNonEmptyString(field.id)) {
      const id = field.id as string;
      if (seenIds.has(id)) {
        errors.push({
          errorCode: SCHEMA_DUPLICATE_FIELD_ID,
          message: `Duplicate field ID "${id}"`,
          fieldId: id,
        });
      } else {
        seenIds.add(id);
      }
      fieldIdSet.add(id);
    }
  }

  // ── 4. Validate conditional clause references ─────────────────────────
  for (let i = 0; i < fields.length; i++) {
    const raw = fields[i];
    if (!isObject(raw)) continue;

    const field = raw as Record<string, unknown>;
    const fieldId = isNonEmptyString(field.id) ? (field.id as string) : undefined;

    if (isObject(field.conditional)) {
      const conditional = field.conditional as Record<string, unknown>;
      const refId = conditional.field;

      if (isNonEmptyString(refId) && !seenIds.has(refId as string)) {
        errors.push({
          errorCode: SCHEMA_INVALID_CONDITIONAL_REF,
          message: `Field "${fieldId ?? `index ${i}`}" has a conditional referencing non-existent field "${refId}"`,
          fieldId: fieldId,
        });
      }
    }
  }

  // ── 5. Validate cross-field rule references ───────────────────────────
  if ('crossFieldRules' in schema && Array.isArray(schema.crossFieldRules)) {
    const rules = schema.crossFieldRules as unknown[];

    for (let i = 0; i < rules.length; i++) {
      const raw = rules[i];
      if (!isObject(raw)) continue;

      const rule = raw as Record<string, unknown>;

      if (Array.isArray(rule.fields)) {
        for (const refId of rule.fields) {
          if (isNonEmptyString(refId) && !seenIds.has(refId as string)) {
            errors.push({
              errorCode: SCHEMA_INVALID_CROSS_FIELD_REF,
              message: `Cross-field rule at index ${i} references non-existent field "${refId}"`,
            });
          }
        }
      }

      // Also check targetField if present
      if (isNonEmptyString(rule.targetField) && !seenIds.has(rule.targetField as string)) {
        errors.push({
          errorCode: SCHEMA_INVALID_CROSS_FIELD_REF,
          message: `Cross-field rule at index ${i} has targetField referencing non-existent field "${rule.targetField}"`,
        });
      }
    }
  }

  // ── 6. Validate step field references ─────────────────────────────────
  if ('steps' in schema && Array.isArray(schema.steps)) {
    const steps = schema.steps as unknown[];

    for (let i = 0; i < steps.length; i++) {
      const raw = steps[i];
      if (!isObject(raw)) continue;

      const step = raw as Record<string, unknown>;

      if (Array.isArray(step.fieldIds)) {
        for (const refId of step.fieldIds) {
          if (isNonEmptyString(refId) && !seenIds.has(refId as string)) {
            errors.push({
              errorCode: SCHEMA_STEP_FIELD_NOT_FOUND,
              message: `Step "${isNonEmptyString(step.id) ? step.id : `index ${i}`}" references non-existent field "${refId}"`,
            });
          }
        }
      }
    }
  }

  // ── 7. Validate action definitions ───────────────────────────────────
  if ('actions' in schema && Array.isArray(schema.actions)) {
    const actionResult = validateActions(schema.actions as unknown[], seenIds);
    for (const actionError of actionResult.errors) {
      errors.push({
        errorCode: actionError.errorCode,
        message: actionError.message,
        fieldId: actionError.actionId,
      });
    }
  }

  // ── 8. Validate payment fields ────────────────────────────────────────
  let paymentFieldCount = 0;

  for (let i = 0; i < fields.length; i++) {
    const raw = fields[i];
    if (!isObject(raw)) continue;

    const field = raw as Record<string, unknown>;
    if (field.type !== 'payment') continue;

    paymentFieldCount++;
    const fieldId = isNonEmptyString(field.id) ? (field.id as string) : undefined;

    // Check customConfig for staticFee / feeExpression
    const customConfig = isObject(field.customConfig)
      ? (field.customConfig as Record<string, unknown>)
      : {};

    const hasStaticFee =
      customConfig.staticFee !== undefined && customConfig.staticFee !== null;
    const hasFeeExpression =
      customConfig.feeExpression !== undefined && customConfig.feeExpression !== null;

    if (!hasStaticFee && !hasFeeExpression) {
      errors.push({
        errorCode: SCHEMA_INVALID_PAYMENT_FIELD,
        message: `Payment field${fieldId ? ` "${fieldId}"` : ` at index ${i}`} must have either "staticFee" or "feeExpression" in customConfig`,
        fieldId,
      });
    } else if (hasStaticFee && hasFeeExpression) {
      errors.push({
        errorCode: SCHEMA_INVALID_PAYMENT_FIELD,
        message: `Payment field${fieldId ? ` "${fieldId}"` : ` at index ${i}`} must not have both "staticFee" and "feeExpression" in customConfig`,
        fieldId,
      });
    }

    // Validate currency if specified
    if (customConfig.currency !== undefined && customConfig.currency !== null) {
      const curr = String(customConfig.currency);
      if (!SUPPORTED_CURRENCIES.has(curr)) {
        errors.push({
          errorCode: SCHEMA_UNSUPPORTED_CURRENCY,
          message: `Payment field${fieldId ? ` "${fieldId}"` : ` at index ${i}`} specifies unsupported currency "${curr}"`,
          fieldId,
        });
      }
    }
  }

  if (paymentFieldCount > 1) {
    errors.push({
      errorCode: SCHEMA_DUPLICATE_PAYMENT_FIELD,
      message: `Schema contains ${paymentFieldCount} payment fields; at most one is allowed`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
