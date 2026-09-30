/**
 * Field-level validation rules for the Form Validation Engine.
 *
 * Each check inspects a single FormField + its FormData value and returns
 * zero or more ValidationError objects.  All checks run — no short-circuiting.
 */

import type { FormField, ValidationError } from './types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a single field's value against all applicable field-level rules.
 *
 * @param field  The FormField definition from the schema.
 * @param value  The corresponding value from the FormData payload (may be
 *               `undefined`, `null`, or any other type).
 * @returns An array of ValidationError objects (empty when the value is valid).
 */
export function validateField(
  field: FormField,
  value: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // --- required -----------------------------------------------------------
  if (field.required && isEmpty(value)) {
    errors.push(makeError(field, 'REQUIRED', `${field.label} is required`));
  }

  // If the value is absent / empty and the field is NOT required, skip the
  // remaining constraint checks — they only make sense when a value exists.
  if (isEmpty(value)) {
    return errors;
  }

  const v = field.validation;

  // --- minLength / maxLength ----------------------------------------------
  if (v?.minLength !== undefined && typeof value === 'string') {
    if (value.length < v.minLength) {
      errors.push(
        makeError(
          field,
          'MIN_LENGTH',
          `${field.label} must be at least ${v.minLength} characters`,
        ),
      );
    }
  }

  if (v?.maxLength !== undefined && typeof value === 'string') {
    if (value.length > v.maxLength) {
      errors.push(
        makeError(
          field,
          'MAX_LENGTH',
          `${field.label} must be at most ${v.maxLength} characters`,
        ),
      );
    }
  }

  // --- min / max (numeric) ------------------------------------------------
  if (v?.min !== undefined) {
    const num = toNumber(value);
    if (Number.isNaN(num) || num < v.min) {
      errors.push(
        makeError(
          field,
          'MIN_VALUE',
          `${field.label} must be at least ${v.min}`,
        ),
      );
    }
  }

  if (v?.max !== undefined) {
    const num = toNumber(value);
    if (Number.isNaN(num) || num > v.max) {
      errors.push(
        makeError(
          field,
          'MAX_VALUE',
          `${field.label} must be at most ${v.max}`,
        ),
      );
    }
  }

  // --- pattern (regex) ----------------------------------------------------
  if (v?.pattern !== undefined) {
    try {
      const re = new RegExp(v.pattern);
      if (!re.test(String(value))) {
        errors.push(
          makeError(
            field,
            'PATTERN_MISMATCH',
            `${field.label} does not match the required pattern`,
          ),
        );
      }
    } catch {
      // Invalid regex in the schema — report as a pattern mismatch so the
      // caller gets a structured error rather than an unhandled exception.
      errors.push(
        makeError(
          field,
          'PATTERN_MISMATCH',
          `${field.label} has an invalid validation pattern`,
        ),
      );
    }
  }

  // --- options (dropdown / radio) -----------------------------------------
  if (
    (field.type === 'dropdown' || field.type === 'radio') &&
    field.options &&
    field.options.length > 0
  ) {
    const allowed = new Set(field.options.map((o) => o.value));
    if (!allowed.has(String(value))) {
      errors.push(
        makeError(
          field,
          'INVALID_OPTION',
          `${field.label} has an invalid selection`,
        ),
      );
    }
  }

  // --- minDate / maxDate --------------------------------------------------
  if (v?.minDate !== undefined || v?.maxDate !== undefined) {
    const dateVal = new Date(String(value));
    if (!Number.isNaN(dateVal.getTime())) {
      if (v?.minDate !== undefined) {
        const minDate = new Date(v.minDate);
        if (!Number.isNaN(minDate.getTime()) && dateVal < minDate) {
          errors.push(
            makeError(
              field,
              'DATE_OUT_OF_RANGE',
              `${field.label} must not be before ${v.minDate}`,
            ),
          );
        }
      }
      if (v?.maxDate !== undefined) {
        const maxDate = new Date(v.maxDate);
        if (!Number.isNaN(maxDate.getTime()) && dateVal > maxDate) {
          errors.push(
            makeError(
              field,
              'DATE_OUT_OF_RANGE',
              `${field.label} must not be after ${v.maxDate}`,
            ),
          );
        }
      }
    }
  }

  // --- file: maxSizeMB ----------------------------------------------------
  if (v?.maxSizeMB !== undefined && isFileValue(value)) {
    const maxBytes = v.maxSizeMB * 1024 * 1024;
    if ((value as FileValue).size > maxBytes) {
      errors.push(
        makeError(
          field,
          'FILE_TOO_LARGE',
          `${field.label} exceeds the maximum size of ${v.maxSizeMB} MB`,
        ),
      );
    }
  }

  // --- file: allowedMimeTypes ---------------------------------------------
  if (
    v?.allowedMimeTypes !== undefined &&
    v.allowedMimeTypes.length > 0 &&
    isFileValue(value)
  ) {
    const mimeType = (value as FileValue).type;
    if (!v.allowedMimeTypes.includes(mimeType)) {
      errors.push(
        makeError(
          field,
          'INVALID_FILE_TYPE',
          `${field.label} has an unsupported file type`,
        ),
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shape expected for file-type field values. */
interface FileValue {
  size: number;
  type: string;
}

/** Check whether a value is absent, null, or an empty string. */
function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Coerce a value to a number. Returns NaN for non-numeric inputs. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return n;
  }
  return NaN;
}

/** Duck-type check for file-like values (must have `size` and `type`). */
function isFileValue(value: unknown): value is FileValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'size' in value &&
    'type' in value &&
    typeof (value as FileValue).size === 'number' &&
    typeof (value as FileValue).type === 'string'
  );
}

/** Convenience factory for ValidationError objects. */
function makeError(
  field: FormField,
  errorCode: string,
  message: string,
): ValidationError {
  return { field: field.id, errorCode, message };
}
