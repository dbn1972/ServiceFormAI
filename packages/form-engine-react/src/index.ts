/**
 * @serviceformai/form-engine-react
 *
 * React bindings for the ServiceFormAI form engine.
 * Provides hooks, context, pluggable UI adapters, and a FormField component
 * for building schema-driven forms with any React component library.
 *
 * Re-exports everything from @serviceformai/form-engine-core so consumers
 * only need a single import source.
 */

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export { useFormEngine } from './useFormEngine';
export type { FormEngineInstance, UseFormEngineOptions } from './useFormEngine';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export { FormProvider, useFormContext, useUIAdapter } from './FormProvider';
export type { FormProviderProps } from './FormProvider';

// ---------------------------------------------------------------------------
// UI Adapter
// ---------------------------------------------------------------------------

export { defaultAdapter, createAdapter } from './adapter';
export type { UIAdapterProps, UIAdapter } from './adapter';

// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------

export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

// ---------------------------------------------------------------------------
// Re-export everything from @serviceformai/form-engine-core
// ---------------------------------------------------------------------------

export {
  // Validation
  validate,
  validateField,
  evaluateCrossFieldRules,
  resolveVisibility,
  validateSchema,
  parseFormSchema,
  prettyPrintFormSchema,
  getDefaultMessage,

  // Indian document validators
  validateAadhaar,
  validatePAN,
  validateMobileIN,
  validateIFSC,
  validatePincodeIN,
  validateEmail,
  validateBankAccountIN,
  verhoeffValidate,
  verhoeffGenerate,

  // State management
  createFormState,
  setFieldValue,
  validateFormState,
  getDirtyFields,
  resetFormState,
} from '@serviceformai/form-engine-core';

export type {
  // Types
  SupportedLocale,
  FormSchema,
  FormStep,
  FieldType,
  ValidatorType,
  FormField as FormFieldDefinition,
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
  FormState,
} from '@serviceformai/form-engine-core';
