/**
 * Pre-Built Action Library — ready-to-use action templates that admins
 * can attach to fields without writing custom JavaScript.
 *
 * Each pre-built action generates a standard ActionDefinition whose `code`
 * uses only Restricted API functions and passes `validateActions()`.
 */

import type { ActionDefinition, ActionEvent } from '@serviceformai/validation-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported pre-built action types. */
export type PreBuiltActionType =
  | 'auto-calculate'
  | 'auto-format-phone'
  | 'auto-format-currency'
  | 'conditional-api-lookup'
  | 'field-dependency';

/** Configuration for a pre-built action. */
export type PreBuiltActionConfig =
  | AutoCalculateConfig
  | AutoFormatPhoneConfig
  | AutoFormatCurrencyConfig
  | ConditionalApiLookupConfig
  | FieldDependencyConfig;

interface AutoCalculateConfig {
  type: 'auto-calculate';
  params: {
    /** Field IDs whose values should be summed. */
    sourceFields: string[];
    /** Field ID where the sum result is written. */
    targetField: string;
  };
}

interface AutoFormatPhoneConfig {
  type: 'auto-format-phone';
  params: {
    /** Field ID to format on blur. */
    fieldId: string;
  };
}

interface AutoFormatCurrencyConfig {
  type: 'auto-format-currency';
  params: {
    /** Field ID to format on blur. */
    fieldId: string;
  };
}

interface ConditionalApiLookupConfig {
  type: 'conditional-api-lookup';
  params: {
    /** Field ID that triggers the lookup on change. */
    triggerField: string;
    /** HTTPS API endpoint to call. */
    apiEndpoint: string;
    /** Mapping from response keys to target field IDs. */
    targetFields: Record<string, string>;
  };
}

interface FieldDependencyConfig {
  type: 'field-dependency';
  params: {
    /** Source field ID whose change triggers the mapping. */
    sourceField: string;
    /** Target field ID to update. */
    targetField: string;
    /** Value mapping: source value → target value. */
    mapping: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Descriptions (for the Action Editor UI)
// ---------------------------------------------------------------------------

export const PRE_BUILT_ACTION_DESCRIPTIONS: Record<PreBuiltActionType, string> = {
  'auto-calculate': 'Automatically sums specified source field values and writes the result to a target field when any source field changes.',
  'auto-format-phone': 'Formats a phone number field to the standard Indian format (+91 XXXXX XXXXX) when the field loses focus.',
  'auto-format-currency': 'Formats a number field with Indian numbering system separators (e.g., 1,23,456.00) when the field loses focus.',
  'conditional-api-lookup': 'Calls a configured API endpoint when a trigger field changes and populates target fields from the response.',
  'field-dependency': 'Sets a target field value based on a configurable mapping when a source field changes.',
};

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateAutoCalculateCode(params: AutoCalculateConfig['params']): string {
  const sourceFieldsJson = JSON.stringify(params.sourceFields);
  const targetField = JSON.stringify(params.targetField);
  return `var sourceFields = ${sourceFieldsJson};
var sum = 0;
for (var i = 0; i < sourceFields.length; i++) {
  var val = getFieldValue(sourceFields[i]);
  var num = parseFloat(val);
  if (!isNaN(num)) {
    sum += num;
  }
}
setFieldValue(${targetField}, sum);`;
}

function generateAutoFormatPhoneCode(_params: AutoFormatPhoneConfig['params']): string {
  return `var raw = String(getFieldValue(args.fieldId) || '');
var digits = raw.replace(/[^0-9]/g, '');
if (digits.length === 0) return;
if (digits.length > 10 && digits.substring(0, 2) === '91') {
  digits = digits.substring(2);
}
if (digits.length === 10) {
  var formatted = '+91 ' + digits.substring(0, 5) + ' ' + digits.substring(5);
  setFieldValue(args.fieldId, formatted);
}`;
}

function generateAutoFormatCurrencyCode(_params: AutoFormatCurrencyConfig['params']): string {
  return `var raw = String(getFieldValue(args.fieldId) || '');
var cleaned = raw.replace(/[^0-9.\\-]/g, '');
var num = parseFloat(cleaned);
if (isNaN(num)) return;
var isNeg = num < 0;
var abs = Math.abs(num);
var parts = abs.toFixed(2).split('.');
var intPart = parts[0];
var decPart = parts[1];
var result = '';
if (intPart.length <= 3) {
  result = intPart;
} else {
  result = intPart.substring(intPart.length - 3);
  var remaining = intPart.substring(0, intPart.length - 3);
  while (remaining.length > 2) {
    result = remaining.substring(remaining.length - 2) + ',' + result;
    remaining = remaining.substring(0, remaining.length - 2);
  }
  if (remaining.length > 0) {
    result = remaining + ',' + result;
  }
}
var formatted = (isNeg ? '-' : '') + result + '.' + decPart;
setFieldValue(args.fieldId, formatted);`;
}

function generateConditionalApiLookupCode(params: ConditionalApiLookupConfig['params']): string {
  const endpoint = JSON.stringify(params.apiEndpoint);
  const targetFieldsJson = JSON.stringify(params.targetFields);
  return `var triggerValue = getFieldValue(args.fieldId);
if (triggerValue === undefined || triggerValue === null || triggerValue === '') return;
var url = ${endpoint} + '?q=' + encodeURIComponent(String(triggerValue));
var response = await fetch(url);
if (response.status >= 200 && response.status < 300 && response.body) {
  var targetFields = ${targetFieldsJson};
  var keys = Object.keys(targetFields);
  for (var i = 0; i < keys.length; i++) {
    var responseKey = keys[i];
    var fieldId = targetFields[responseKey];
    if (response.body[responseKey] !== undefined) {
      setFieldValue(fieldId, response.body[responseKey]);
    }
  }
}`;
}

function generateFieldDependencyCode(params: FieldDependencyConfig['params']): string {
  const targetField = JSON.stringify(params.targetField);
  const mappingJson = JSON.stringify(params.mapping);
  return `var sourceValue = String(getFieldValue(args.fieldId) || '');
var mapping = ${mappingJson};
if (mapping[sourceValue] !== undefined) {
  setFieldValue(${targetField}, mapping[sourceValue]);
}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an ActionDefinition from a pre-built action configuration.
 *
 * @param id - Unique action ID.
 * @param config - Pre-built action configuration.
 * @returns A complete ActionDefinition ready for inclusion in a FormSchema.
 */
export function generatePreBuiltAction(
  id: string,
  config: PreBuiltActionConfig,
): ActionDefinition {
  switch (config.type) {
    case 'auto-calculate': {
      return {
        id,
        event: 'onFieldChange' as ActionEvent,
        targetId: config.params.sourceFields[0],
        code: generateAutoCalculateCode(config.params),
        description: `Auto-calculate: sum ${config.params.sourceFields.join(', ')} → ${config.params.targetField}`,
        enabled: true,
      };
    }

    case 'auto-format-phone': {
      return {
        id,
        event: 'onFieldBlur' as ActionEvent,
        targetId: config.params.fieldId,
        code: generateAutoFormatPhoneCode(config.params),
        description: `Auto-format phone: ${config.params.fieldId}`,
        enabled: true,
      };
    }

    case 'auto-format-currency': {
      return {
        id,
        event: 'onFieldBlur' as ActionEvent,
        targetId: config.params.fieldId,
        code: generateAutoFormatCurrencyCode(config.params),
        description: `Auto-format currency: ${config.params.fieldId}`,
        enabled: true,
      };
    }

    case 'conditional-api-lookup': {
      return {
        id,
        event: 'onFieldChange' as ActionEvent,
        targetId: config.params.triggerField,
        code: generateConditionalApiLookupCode(config.params),
        description: `API lookup: ${config.params.triggerField} → ${config.params.apiEndpoint}`,
        enabled: true,
      };
    }

    case 'field-dependency': {
      return {
        id,
        event: 'onFieldChange' as ActionEvent,
        targetId: config.params.sourceField,
        code: generateFieldDependencyCode(config.params),
        description: `Field dependency: ${config.params.sourceField} → ${config.params.targetField}`,
        enabled: true,
      };
    }

    default: {
      const _exhaustive: never = config;
      throw new Error(`Unknown pre-built action type: ${(_exhaustive as any).type}`);
    }
  }
}
