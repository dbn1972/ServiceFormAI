/**
 * Core type definitions for the Form Validation Engine.
 *
 * These types define the schema-driven validation model used by both
 * the React frontend and the NestJS backend.
 */

import type { ActionDefinition } from './action-types.js';

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

/** Supported locales for default error messages. */
export type SupportedLocale = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'kn';

// ---------------------------------------------------------------------------
// FormSchema and related types
// ---------------------------------------------------------------------------

/** Top-level schema describing a form's fields, steps, and rules. */
export interface FormSchema {
  version: string;
  fields: FormField[];
  steps?: FormStep[];
  crossFieldRules?: CrossFieldRule[];
  defaultLocale?: SupportedLocale;
  actions?: ActionDefinition[];
}

/** A single step in a multi-step form. */
export interface FormStep {
  id: string;
  label: string;
  fieldIds: string[];
}

/** Supported field types. */
export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'textarea'
  | 'payment';

/** Supported Indian document / format validator types. */
export type ValidatorType =
  | 'aadhaar'
  | 'pan'
  | 'mobile_in'
  | 'ifsc'
  | 'pincode_in'
  | 'email'
  | 'bank_account_in';

/** A single field definition within a FormSchema. */
export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  validatorType?: ValidatorType;
  options?: FieldOption[];
  conditional?: ConditionalClause;
  /** Component-specific configuration for custom field types. */
  customConfig?: Record<string, unknown>;
  /** Custom validation configuration. */
  customValidation?: {
    validatorName: string;
    params?: Record<string, unknown>;
  };
}

/** Per-field validation constraints. */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  /** ISO 8601 date string. */
  minDate?: string;
  /** ISO 8601 date string. */
  maxDate?: string;
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
  /** Custom error message override. */
  message?: string;
}

/** A selectable option for dropdown / radio fields. */
export interface FieldOption {
  value: string;
  label: string;
}

/** Conditional visibility clause attached to a FormField. */
export interface ConditionalClause {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}

// ---------------------------------------------------------------------------
// Cross-field rules
// ---------------------------------------------------------------------------

/** A rule that compares or combines multiple fields. */
export interface CrossFieldRule {
  type: 'date_after' | 'required_if' | 'sum_equals' | 'mutually_exclusive' | 'match';
  /** Field IDs involved in the rule. */
  fields: string[];
  /** Primary field for error attachment. */
  targetField?: string;
  /** e.g. the expected sum, or the trigger value for required_if. */
  targetValue?: any;
  /** Custom error message. */
  message?: string;
}

// ---------------------------------------------------------------------------
// Validation results
// ---------------------------------------------------------------------------

/** The structured output of the Validation Engine. */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, ValidationError[]>;
}

/** A single validation error for a specific field. */
export interface ValidationError {
  field: string;
  errorCode: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Validate options
// ---------------------------------------------------------------------------

/** Options passed to the `validate()` function. */
export interface ValidateOptions {
  /** Validate only a specific step. */
  stepId?: string;
  /** Validate only a specific field (for onBlur). */
  fieldId?: string;
  /** Locale for default error messages. */
  locale?: SupportedLocale;
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/** Result of validating a FormSchema's structure. */
export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

/** A single structural error found in a FormSchema. */
export interface SchemaValidationError {
  errorCode: string;
  message: string;
  fieldId?: string;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/** Error returned when parsing a FormSchema JSON string fails. */
export interface ParseError {
  error: true;
  message: string;
}

// ---------------------------------------------------------------------------
// FormData alias
// ---------------------------------------------------------------------------

/**
 * Key-value map where keys are field IDs and values are the citizen's inputs.
 * Kept as a type alias so consuming code can reference it by name.
 */
export type FormData = Record<string, any>;

// ---------------------------------------------------------------------------
// Payment field types
// ---------------------------------------------------------------------------

/** Fee expression for dynamic fee calculation. */
export type FeeExpression =
  | { type: 'lookup'; fieldRef: string; table: Record<string, string>; defaultFee?: string }
  | { type: 'formula'; expression: string; fieldRefs: string[] };

/** Configuration for a payment field. */
export interface PaymentFieldConfig {
  staticFee?: string;
  feeExpression?: FeeExpression;
  currency?: string;
}

/** Result of a fee calculation. */
export interface FeeCalculationResult {
  status: 'resolved' | 'pending' | 'error';
  amount?: string;
  amountPaise?: number;
  currency: string;
  breakdown?: string;
  errorMessage?: string;
}
