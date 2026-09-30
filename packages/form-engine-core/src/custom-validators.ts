/**
 * Custom Validator Registry for the Form Validation Engine.
 *
 * Allows custom components to register synchronous, pure validator functions
 * that run in the same pipeline as built-in validators, on both frontend
 * and backend.
 */

import type { FormField, FormData, ValidationError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A custom validator function. Must be pure and synchronous.
 * Receives the field value, full form data, and field definition.
 * Returns an array of ValidationError objects (empty = valid).
 */
export type CustomValidatorFn = (
  value: unknown,
  formData: FormData,
  field: FormField,
) => ValidationError[];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * In-memory registry that maps validator names to their implementations.
 * Used by the `validate()` function to look up custom validators referenced
 * in `field.customValidation.validatorName`.
 */
export class CustomValidatorRegistry {
  private validators = new Map<string, CustomValidatorFn>();

  /** Register a custom validator by name. Replaces any existing validator with the same name. */
  register(name: string, validator: CustomValidatorFn): void {
    this.validators.set(name, validator);
  }

  /** Look up a validator by name. Returns `undefined` if not registered. */
  getValidator(name: string): CustomValidatorFn | undefined {
    return this.validators.get(name);
  }

  /** Remove a validator by name. Returns `true` if removed, `false` if not found. */
  remove(name: string): boolean {
    return this.validators.delete(name);
  }

  /** List all registered validator names. */
  listRegistered(): string[] {
    return Array.from(this.validators.keys());
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Global singleton instance of the CustomValidatorRegistry. */
export const customValidatorRegistry = new CustomValidatorRegistry();
