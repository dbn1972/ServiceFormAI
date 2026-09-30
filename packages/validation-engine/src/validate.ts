/**
 * Core validation orchestrator for the Form Validation Engine.
 *
 * Evaluates a FormSchema against a FormData payload and returns a
 * structured ValidationResult. This is a pure function — no side effects,
 * no async, no external dependencies.
 */

import type {
  FormSchema,
  FormField,
  FormData,
  ValidateOptions,
  ValidationResult,
  ValidationError,
  ValidatorType,
  SupportedLocale,
} from './types.js';
import { validateField } from './field-validators.js';
import {
  validateAadhaar,
  validatePAN,
  validateMobileIN,
  validateIFSC,
  validatePincodeIN,
  validateEmail,
  validateBankAccountIN,
} from './indian-validators.js';
import { evaluateCrossFieldRules } from './cross-field-validators.js';
import { resolveVisibility } from './conditional.js';
import { getDefaultMessage } from './i18n/index.js';
import { customValidatorRegistry } from './custom-validators.js';

// ---------------------------------------------------------------------------
// Indian validator dispatch map
// ---------------------------------------------------------------------------

const indianValidatorMap: Record<ValidatorType, (value: string) => ValidationError | null> = {
  aadhaar: validateAadhaar,
  pan: validatePAN,
  mobile_in: validateMobileIN,
  ifsc: validateIFSC,
  pincode_in: validatePincodeIN,
  email: validateEmail,
  bank_account_in: validateBankAccountIN,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate form data against a schema.
 *
 * @param schema  The FormSchema describing fields and their constraints.
 * @param data    The FormData payload (field ID → value map).
 * @param options Optional settings: `fieldId` for single-field validation
 *                (onBlur use case), `stepId` and `locale` for later tasks.
 * @returns A ValidationResult with `valid` flag and errors map.
 */
export function validate(
  schema: FormSchema,
  data: FormData,
  options?: ValidateOptions,
): ValidationResult {
  const errors: Record<string, ValidationError[]> = {};

  // Resolve conditional visibility for all fields before validation.
  // This determines which fields are visible based on their conditional
  // clauses and the current form data.
  const visibility = resolveVisibility(schema.fields, data);

  // --- Determine which fields to validate ---

  // fieldId takes precedence over stepId — if both are set, only validate
  // the single field.
  let fieldsToValidate = schema.fields;

  if (options?.fieldId) {
    // Single-field validation (onBlur use case)
    fieldsToValidate = schema.fields.filter((f) => f.id === options.fieldId);

    // If the target field is hidden, return valid immediately.
    const targetField = fieldsToValidate[0];
    if (targetField && visibility.get(targetField.id) === false) {
      return { valid: true, errors: {} };
    }
  } else if (options?.stepId) {
    // Step-scoped validation — validate only fields belonging to the step.
    // Step filtering happens BEFORE conditional visibility filtering.
    const step = schema.steps?.find((s) => s.id === options.stepId);

    if (!step) {
      // Unknown step ID — return UNKNOWN_STEP error immediately.
      return {
        valid: false,
        errors: {
          _step: [
            {
              field: '_step',
              errorCode: 'UNKNOWN_STEP',
              message: `Unknown step: ${options.stepId}`,
            },
          ],
        },
      };
    }

    const stepFieldIds = new Set(step.fieldIds);
    fieldsToValidate = schema.fields.filter((f) => stepFieldIds.has(f.id));
  }

  // Filter out hidden fields — they should not be validated at all
  fieldsToValidate = fieldsToValidate.filter(
    (f) => visibility.get(f.id) !== false,
  );

  // Run field-level validation for each visible field in scope
  for (const field of fieldsToValidate) {
    const value = data[field.id];
    const fieldErrors = validateField(field, value);

    // Run Indian document validator if the field has a validatorType and
    // the value is present (don't validate empty optional fields).
    if (
      field.validatorType &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const validatorFn = indianValidatorMap[field.validatorType];
      if (validatorFn) {
        const indianError = validatorFn(String(value));
        if (indianError) {
          // The Indian validators return field: '' — set the actual field ID.
          fieldErrors.push({ ...indianError, field: field.id });
        }
      }
    }

    // Run custom validator if the field has a customValidation configuration.
    if (field.customValidation?.validatorName) {
      const customValidator = customValidatorRegistry.getValidator(
        field.customValidation.validatorName,
      );
      if (customValidator) {
        try {
          const customErrors = customValidator(value, data, field);
          if (customErrors.length > 0) {
            fieldErrors.push(...customErrors);
          }
        } catch {
          fieldErrors.push({
            field: field.id,
            errorCode: 'CUSTOM_VALIDATOR_ERROR',
            message: `Custom validator "${field.customValidation.validatorName}" threw an exception`,
          });
        }
      }
    }

    if (fieldErrors.length > 0) {
      errors[field.id] = fieldErrors;
    }
  }

  // Run cross-field rules after all field-level rules.
  // Cross-field rules only run on full/step validation — NOT on single-field
  // validation (fieldId is set for onBlur).
  // The fieldsInScope set only includes VISIBLE fields so that cross-field
  // rules referencing hidden fields are not evaluated.
  // For step-scoped validation, fieldsInScope is limited to the step's
  // fields — cross-field rules spanning multiple steps won't be evaluated.
  if (!options?.fieldId && schema.crossFieldRules && schema.crossFieldRules.length > 0) {
    const fieldsInScope = new Set(fieldsToValidate.map((f) => f.id));
    const crossFieldErrors = evaluateCrossFieldRules(schema.crossFieldRules, data, fieldsInScope);

    // Merge cross-field errors into the existing errors record
    for (const [fieldId, cfErrors] of crossFieldErrors) {
      if (errors[fieldId]) {
        errors[fieldId].push(...cfErrors);
      } else {
        errors[fieldId] = cfErrors;
      }
    }
  }

  // --- Post-process error messages with localisation ---
  // Resolve the active locale: options.locale → schema.defaultLocale → 'en'
  const locale: SupportedLocale = options?.locale ?? schema.defaultLocale ?? 'en';

  // Build a lookup map of field ID → FormField for label access
  const fieldMap = new Map<string, FormField>();
  for (const field of schema.fields) {
    fieldMap.set(field.id, field);
  }

  // Build a lookup map of cross-field rule targetField/fields[0] → rule for
  // custom message access on cross-field errors
  const crossFieldRulesByErrorField = new Map<string, Map<string, string | undefined>>();
  if (schema.crossFieldRules) {
    for (const rule of schema.crossFieldRules) {
      // Determine which error code this rule type produces
      const errorCodeForRule = crossFieldRuleErrorCode(rule.type);
      if (!errorCodeForRule) continue;

      // Determine which fields could receive errors from this rule
      const errorFields: string[] = [];
      if (rule.type === 'mutually_exclusive') {
        errorFields.push(...rule.fields);
      } else {
        errorFields.push(rule.targetField ?? rule.fields[0]);
      }

      for (const ef of errorFields) {
        if (!crossFieldRulesByErrorField.has(ef)) {
          crossFieldRulesByErrorField.set(ef, new Map());
        }
        crossFieldRulesByErrorField.get(ef)!.set(errorCodeForRule, rule.message);
      }
    }
  }

  for (const [fieldId, fieldErrors] of Object.entries(errors)) {
    const field = fieldMap.get(fieldId);

    for (let i = 0; i < fieldErrors.length; i++) {
      const err = fieldErrors[i];

      // Check if the field's validation has a custom message override
      if (field?.validation?.message) {
        fieldErrors[i] = { ...err, message: field.validation.message };
      } else {
        // Check if this is a cross-field error with a custom message
        const crossFieldMessages = crossFieldRulesByErrorField.get(fieldId);
        const crossFieldCustomMessage = crossFieldMessages?.get(err.errorCode);

        if (crossFieldCustomMessage) {
          // Cross-field rule has a custom message — use it as-is
          fieldErrors[i] = { ...err, message: crossFieldCustomMessage };
        } else {
          // Use the localised default message
          const label = field?.label;
          const localisedMessage = getDefaultMessage(err.errorCode, locale, label);
          fieldErrors[i] = { ...err, message: localisedMessage };
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map cross-field rule type to its error code. */
function crossFieldRuleErrorCode(type: string): string | undefined {
  switch (type) {
    case 'date_after': return 'DATE_ORDER_VIOLATION';
    case 'required_if': return 'CONDITIONAL_REQUIRED';
    case 'sum_equals': return 'SUM_MISMATCH';
    case 'mutually_exclusive': return 'MUTUALLY_EXCLUSIVE_VIOLATION';
    case 'match': return 'FIELD_MISMATCH';
    default: return undefined;
  }
}
