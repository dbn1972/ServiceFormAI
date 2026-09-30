/**
 * Core state management utilities for the Form Engine.
 *
 * Provides pure functions for creating and transitioning immutable form state.
 * No framework dependencies — works in Node.js, Deno, and browsers.
 */

import type { FormSchema, FormData, ValidateOptions } from './types.js';
import { resolveVisibility } from './conditional.js';
import { validate } from './validate.js';

// ---------------------------------------------------------------------------
// FormState interface
// ---------------------------------------------------------------------------

/** Immutable form state object. */
export interface FormState {
  readonly values: FormData;
  readonly touched: Readonly<Record<string, boolean>>;
  readonly errors: Readonly<Record<string, string>>;
  readonly visibleFieldIds: readonly string[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create initial form state from a schema.
 *
 * Iterates `schema.fields` to build default values (empty string for most
 * types, `false` for checkbox), overlays any provided `initialValues`, then
 * calls `resolveVisibility` to compute the initial set of visible field IDs.
 *
 * @param schema         The FormSchema describing the form's fields.
 * @param initialValues  Optional partial FormData to override defaults.
 * @returns A frozen FormState with defaults, empty touched/errors, and computed visibility.
 */
export function createFormState(
  schema: FormSchema,
  initialValues?: FormData,
): FormState {
  // 1. Build default values for every field
  const values: FormData = {};
  for (const field of schema.fields) {
    values[field.id] = field.type === 'checkbox' ? false : '';
  }

  // 2. Overlay initialValues if provided
  if (initialValues) {
    for (const [key, value] of Object.entries(initialValues)) {
      values[key] = value;
    }
  }

  // 3. Compute visible field IDs
  const visibilityMap = resolveVisibility(schema.fields, values);
  const visibleFieldIds: string[] = [];
  for (const field of schema.fields) {
    if (visibilityMap.get(field.id) !== false) {
      visibleFieldIds.push(field.id);
    }
  }

  // 4. Return frozen state
  const state: FormState = {
    values: Object.freeze({ ...values }),
    touched: Object.freeze({}),
    errors: Object.freeze({}),
    visibleFieldIds: Object.freeze(visibleFieldIds),
  };

  return Object.freeze(state);
}

/**
 * Return a new FormState with an updated field value and re-computed visibility.
 *
 * Does NOT re-validate — that is the caller's responsibility.
 * If `fieldId` does not exist in the schema, returns the state unchanged.
 *
 * @param schema  The FormSchema describing the form's fields.
 * @param state   The current FormState.
 * @param fieldId The ID of the field to update.
 * @param value   The new value for the field.
 * @returns A new frozen FormState with the updated value and visibility.
 */
export function setFieldValue(
  schema: FormSchema,
  state: FormState,
  fieldId: string,
  value: any,
): FormState {
  // If fieldId doesn't exist in schema, return state unchanged
  const fieldExists = schema.fields.some((f) => f.id === fieldId);
  if (!fieldExists) {
    return state;
  }

  // 1. Create new values with the updated field
  const newValues: FormData = { ...state.values, [fieldId]: value };

  // 2. Re-compute visibility with the new values
  const visibilityMap = resolveVisibility(schema.fields, newValues);
  const visibleFieldIds: string[] = [];
  for (const field of schema.fields) {
    if (visibilityMap.get(field.id) !== false) {
      visibleFieldIds.push(field.id);
    }
  }

  // 3. Return new frozen state, preserving existing touched and errors
  const newState: FormState = {
    values: Object.freeze({ ...newValues }),
    touched: state.touched,
    errors: state.errors,
    visibleFieldIds: Object.freeze(visibleFieldIds),
  };

  return Object.freeze(newState);
}

/**
 * Return a new FormState with updated errors based on current values.
 *
 * Calls `validate(schema, state.values, options)` and extracts the first
 * error message per field from the ValidationResult.
 *
 * @param schema  The FormSchema describing the form's fields.
 * @param state   The current FormState.
 * @param options Optional validation options (fieldId, stepId, locale).
 * @returns A new frozen FormState with updated errors.
 */
export function validateFormState(
  schema: FormSchema,
  state: FormState,
  options?: ValidateOptions,
): FormState {
  // 1. Call the validation engine
  const result = validate(schema, state.values, options);

  // 2. Extract first error message per field
  const errors: Record<string, string> = {};
  for (const [fieldId, fieldErrors] of Object.entries(result.errors)) {
    if (fieldErrors.length > 0) {
      errors[fieldId] = fieldErrors[0].message;
    }
  }

  // 3. Return new frozen state with updated errors, preserving values, touched, and visibleFieldIds
  const newState: FormState = {
    values: state.values,
    touched: state.touched,
    errors: Object.freeze(errors),
    visibleFieldIds: state.visibleFieldIds,
  };

  return Object.freeze(newState);
}

/**
 * Return an array of field IDs whose values differ between two states.
 *
 * Uses shallow inequality (`!==`) to compare each field's value.
 *
 * @param state        The current FormState.
 * @param initialState The initial FormState to compare against.
 * @returns An array of field IDs that have changed.
 */
export function getDirtyFields(
  state: FormState,
  initialState: FormState,
): string[] {
  const dirtyFields: string[] = [];

  // Check all fields in the current state
  for (const fieldId of Object.keys(state.values)) {
    if (state.values[fieldId] !== initialState.values[fieldId]) {
      dirtyFields.push(fieldId);
    }
  }

  // Check for fields that exist in initialState but not in current state
  for (const fieldId of Object.keys(initialState.values)) {
    if (
      !(fieldId in state.values) &&
      state.values[fieldId] !== initialState.values[fieldId]
    ) {
      dirtyFields.push(fieldId);
    }
  }

  return dirtyFields;
}

/**
 * Return a fresh FormState equivalent to calling `createFormState`.
 *
 * Exists for semantic clarity — makes intent explicit when resetting a form.
 *
 * @param schema         The FormSchema describing the form's fields.
 * @param initialValues  Optional partial FormData to override defaults.
 * @returns A frozen FormState identical to what `createFormState` would produce.
 */
export function resetFormState(
  schema: FormSchema,
  initialValues?: FormData,
): FormState {
  return createFormState(schema, initialValues);
}
