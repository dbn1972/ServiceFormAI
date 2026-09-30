/**
 * @serviceformai/form-engine-core
 *
 * Headless, framework-agnostic form engine core.
 * Pure TypeScript — no browser APIs, no framework dependencies.
 *
 * Re-exports all public APIs from the validation engine and adds
 * state management utilities for form lifecycle operations.
 */

// Types
export type {
  SupportedLocale,
  FormSchema,
  FormStep,
  FieldType,
  ValidatorType,
  FormField,
  FieldValidation,
  FieldOption,
  ConditionalClause,
  CrossFieldRule,
  ValidationResult,
  ValidationError,
  ValidateOptions,
  SchemaValidationResult,
  SchemaValidationError,
  ParseError,
  FormData,
} from './types.js';

// Field-level validators
export { validateField } from './field-validators.js';

// Indian document validators
export {
  validateAadhaar,
  validatePAN,
  validateMobileIN,
  validateIFSC,
  validatePincodeIN,
  validateEmail,
  validateBankAccountIN,
  verhoeffValidate,
  verhoeffGenerate,
} from './indian-validators.js';

// Cross-field validators
export { evaluateCrossFieldRules } from './cross-field-validators.js';

// Conditional visibility resolver
export { resolveVisibility } from './conditional.js';

// Localisation
export { getDefaultMessage } from './i18n/index.js';

// Schema validator
export { validateSchema } from './schema-validator.js';

// FormSchema parser & pretty-printer
export { parseFormSchema, prettyPrintFormSchema } from './parser.js';

// ComponentManifest parser & pretty-printer
export type { ComponentManifest, ManifestParseError } from './manifest-parser.js';
export { parseComponentManifest, prettyPrintManifest } from './manifest-parser.js';

// Core validation function
export { validate } from './validate.js';

// Custom validator registry
export type { CustomValidatorFn } from './custom-validators.js';
export { CustomValidatorRegistry, customValidatorRegistry } from './custom-validators.js';

// Action types
export type {
  ActionEvent,
  ActionDefinition,
  ActionValidationError,
  ActionValidationResult,
} from './action-types.js';

// Action validator
export { validateActions } from './action-validator.js';

// Fee calculator
export type { PaymentFieldConfig, FeeExpression, FeeCalculationResult } from './fee-calculator.js';
export { calculateFee, bankersRound } from './fee-calculator.js';

// Fee expression parser
export { evaluateExpression } from './fee-expression-parser.js';

// State management
export type { FormState } from './state.js';
export {
  createFormState,
  setFieldValue,
  validateFormState,
  getDirtyFields,
  resetFormState,
} from './state.js';
