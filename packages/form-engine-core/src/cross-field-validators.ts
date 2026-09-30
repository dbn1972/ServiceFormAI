/**
 * Cross-field validation rules for the Form Validation Engine.
 *
 * Evaluates rules that compare or combine multiple fields:
 * - date_after: fieldA must be strictly after fieldB
 * - required_if: fieldA required when fieldB equals targetValue
 * - sum_equals: numeric sum of fields must equal targetValue
 * - mutually_exclusive: at most one field in a group may be non-empty
 * - match: fieldA must equal fieldB
 *
 * Only rules whose referenced fields are ALL within `fieldsInScope` are
 * evaluated — this supports step-scoped validation.
 */

import type { CrossFieldRule, FormData, ValidationError } from './types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate cross-field rules against form data.
 *
 * @param rules         The cross-field rules from the FormSchema.
 * @param data          The FormData payload (field ID → value map).
 * @param fieldsInScope Set of field IDs currently in scope for validation.
 * @returns A Map keyed by field ID, each value an array of ValidationErrors.
 */
export function evaluateCrossFieldRules(
  rules: CrossFieldRule[],
  data: FormData,
  fieldsInScope: Set<string>,
): Map<string, ValidationError[]> {
  const errorMap = new Map<string, ValidationError[]>();

  for (const rule of rules) {
    // Only evaluate a rule if ALL its referenced fields are in scope
    if (!rule.fields.every((f) => fieldsInScope.has(f))) {
      continue;
    }

    switch (rule.type) {
      case 'date_after':
        evaluateDateAfter(rule, data, errorMap);
        break;
      case 'required_if':
        evaluateRequiredIf(rule, data, errorMap);
        break;
      case 'sum_equals':
        evaluateSumEquals(rule, data, errorMap);
        break;
      case 'mutually_exclusive':
        evaluateMutuallyExclusive(rule, data, errorMap);
        break;
      case 'match':
        evaluateMatch(rule, data, errorMap);
        break;
    }
  }

  return errorMap;
}

// ---------------------------------------------------------------------------
// Rule evaluators
// ---------------------------------------------------------------------------

/**
 * date_after: fields[0] must be strictly after fields[1].
 * Error goes on fields[0] (or targetField if specified).
 */
function evaluateDateAfter(
  rule: CrossFieldRule,
  data: FormData,
  errorMap: Map<string, ValidationError[]>,
): void {
  const fieldA = rule.fields[0];
  const fieldB = rule.fields[1];
  const valueA = data[fieldA];
  const valueB = data[fieldB];

  // If either value is empty, skip — field-level required checks handle that
  if (isEmpty(valueA) || isEmpty(valueB)) {
    return;
  }

  const dateA = new Date(String(valueA));
  const dateB = new Date(String(valueB));

  // If either date is invalid, skip
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
    return;
  }

  if (dateA.getTime() <= dateB.getTime()) {
    const errorField = rule.targetField ?? fieldA;
    addError(errorMap, errorField, {
      field: errorField,
      errorCode: 'DATE_ORDER_VIOLATION',
      message: rule.message ?? `${fieldA} must be after ${fieldB}`,
    });
  }
}

/**
 * required_if: fields[0] is required when fields[1] equals targetValue.
 * Error goes on fields[0].
 */
function evaluateRequiredIf(
  rule: CrossFieldRule,
  data: FormData,
  errorMap: Map<string, ValidationError[]>,
): void {
  const fieldA = rule.fields[0];
  const fieldB = rule.fields[1];
  const triggerValue = rule.targetValue;
  const valueB = data[fieldB];

  // Check if the trigger condition is met
  // Use loose string comparison to handle type coercion
  if (String(valueB) !== String(triggerValue)) {
    return;
  }

  const valueA = data[fieldA];
  if (isEmpty(valueA)) {
    addError(errorMap, fieldA, {
      field: fieldA,
      errorCode: 'CONDITIONAL_REQUIRED',
      message: rule.message ?? `${fieldA} is required when ${fieldB} is ${triggerValue}`,
    });
  }
}

/**
 * sum_equals: numeric sum of all fields must equal targetValue.
 * Error goes on fields[0] (or targetField if specified).
 */
function evaluateSumEquals(
  rule: CrossFieldRule,
  data: FormData,
  errorMap: Map<string, ValidationError[]>,
): void {
  const targetSum = Number(rule.targetValue);
  if (Number.isNaN(targetSum)) {
    return;
  }

  let sum = 0;
  for (const fieldId of rule.fields) {
    const value = data[fieldId];
    const num = Number(value);
    if (Number.isNaN(num)) {
      // If any field is non-numeric, skip the rule
      return;
    }
    sum += num;
  }

  if (sum !== targetSum) {
    const errorField = rule.targetField ?? rule.fields[0];
    addError(errorMap, errorField, {
      field: errorField,
      errorCode: 'SUM_MISMATCH',
      message: rule.message ?? `Fields must sum to ${targetSum}`,
    });
  }
}

/**
 * mutually_exclusive: at most one field in the group may be non-empty.
 * Error on EACH field that has a non-empty value when more than one is non-empty.
 */
function evaluateMutuallyExclusive(
  rule: CrossFieldRule,
  data: FormData,
  errorMap: Map<string, ValidationError[]>,
): void {
  const nonEmptyFields = rule.fields.filter((fieldId) => !isEmpty(data[fieldId]));

  if (nonEmptyFields.length > 1) {
    for (const fieldId of nonEmptyFields) {
      addError(errorMap, fieldId, {
        field: fieldId,
        errorCode: 'MUTUALLY_EXCLUSIVE_VIOLATION',
        message: rule.message ?? `Only one of ${rule.fields.join(', ')} may be filled`,
      });
    }
  }
}

/**
 * match: fields[0] must equal fields[1].
 * Error goes on fields[0] (or targetField if specified).
 */
function evaluateMatch(
  rule: CrossFieldRule,
  data: FormData,
  errorMap: Map<string, ValidationError[]>,
): void {
  const fieldA = rule.fields[0];
  const fieldB = rule.fields[1];
  const valueA = data[fieldA];
  const valueB = data[fieldB];

  // Compare using strict string comparison for consistency
  if (String(valueA ?? '') !== String(valueB ?? '')) {
    const errorField = rule.targetField ?? fieldA;
    addError(errorMap, errorField, {
      field: errorField,
      errorCode: 'FIELD_MISMATCH',
      message: rule.message ?? `${fieldA} must match ${fieldB}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a value is absent, null, or an empty string. */
function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Append an error to the error map for a given field. */
function addError(
  errorMap: Map<string, ValidationError[]>,
  fieldId: string,
  error: ValidationError,
): void {
  const existing = errorMap.get(fieldId);
  if (existing) {
    existing.push(error);
  } else {
    errorMap.set(fieldId, [error]);
  }
}
