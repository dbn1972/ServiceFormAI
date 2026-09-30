/**
 * SchemaImporter — Converts ServiceFormSchema JSON to BuilderState.
 *
 * Pure function. Returns ImportError on failure without throwing.
 */

import type { FormField } from '../types/externalAPI';
import type {
  BuilderState,
  BuilderField,
  BuilderFieldValidation,
  ImportError,
} from '../components/form-builder/types';

/**
 * Import a ServiceFormSchema JSON string into a BuilderState.
 * Returns ImportError on invalid input.
 */
export function importSchema(json: string): BuilderState | ImportError {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e: any) {
    return {
      error: true,
      message: `Invalid JSON: ${e.message}`,
    };
  }

  // Validate basic structure
  if (!parsed || typeof parsed !== 'object') {
    return {
      error: true,
      message: 'Invalid schema: expected a JSON object',
    };
  }

  if (!Array.isArray(parsed.fields)) {
    return {
      error: true,
      message: 'Invalid schema: missing required property "fields" (expected an array)',
    };
  }

  // Extract metadata
  const serviceName = parsed.serviceName || '';
  const department = parsed.department || '';
  const description = parsed.metadata?.description || '';
  const category = parsed.metadata?.category || '';
  const serviceId = parsed.serviceId || undefined;

  // Map fields
  const fields: BuilderField[] = parsed.fields.map((f: FormField) => {
    const bf: BuilderField = {
      id: f.id || `field_${Math.random().toString(36).substring(2, 9)}`,
      type: f.type || 'text',
      label: f.label || '',
      required: !!f.required,
    };

    if (f.placeholder) bf.placeholder = f.placeholder;
    if (f.helpText) bf.helpText = f.helpText;

    // Map validation
    if (f.validation) {
      const v: BuilderFieldValidation = {};
      if (f.validation.pattern !== undefined) v.pattern = f.validation.pattern;
      if (f.validation.minLength !== undefined) v.minLength = f.validation.minLength;
      if (f.validation.maxLength !== undefined) v.maxLength = f.validation.maxLength;
      if (f.validation.min !== undefined) v.min = f.validation.min;
      if (f.validation.max !== undefined) v.max = f.validation.max;
      if (Object.keys(v).length > 0) bf.validation = v;
    }

    // Options
    if (f.options && f.options.length > 0) {
      bf.options = f.options.map((o) => ({ value: o.value, label: o.label }));
    }

    // Conditional
    if (f.conditional) {
      bf.conditional = {
        field: f.conditional.field,
        operator: f.conditional.operator,
        value: f.conditional.value,
      };
    }

    return bf;
  });

  // Extract layout config
  const layout = parsed.layout;
  const columns = layout?.columns || 1;
  const gap = layout?.gap || 'md';

  // Extract sections
  const sections = Array.isArray(parsed.sections)
    ? parsed.sections.map((s: any) => ({
        id: s.id || `section_${Math.random().toString(36).substring(2, 9)}`,
        title: s.title || '',
        description: s.description,
        collapsible: s.collapsible,
        fieldIds: Array.isArray(s.fieldIds) ? s.fieldIds : [],
      }))
    : [];

  // Extract cross-field rules
  const crossFieldRules = Array.isArray(parsed.crossFieldRules)
    ? parsed.crossFieldRules
    : [];

  return {
    metadata: {
      serviceId,
      serviceName,
      description,
      category,
      department,
    },
    fields,
    sections,
    formSettings: {
      columns: Math.min(Math.max(columns, 1), 4),
      gap,
    },
    crossFieldRules,
  };
}

/**
 * Type guard to check if a result is an ImportError.
 */
export function isImportError(result: BuilderState | ImportError): result is ImportError {
  return (result as ImportError).error === true;
}
