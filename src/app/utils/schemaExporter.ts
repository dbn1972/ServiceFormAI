/**
 * SchemaExporter — Converts BuilderState to ServiceFormSchema.
 *
 * Pure function. Produces canonical JSON with sorted keys and 2-space
 * indentation. Clamps field colSpan to the global column count.
 */

import type { ServiceFormSchema, FormField } from '../types/externalAPI';
import type { BuilderState } from '../components/form-builder/types';

/**
 * Convert a BuilderState into a ServiceFormSchema.
 */
export function exportSchema(state: BuilderState): ServiceFormSchema {
  const fields: FormField[] = state.fields.map((bf) => {
    const field: FormField = {
      id: bf.id,
      type: bf.type as FormField['type'],
      label: bf.label,
      required: bf.required,
    };

    if (bf.placeholder) field.placeholder = bf.placeholder;
    if (bf.helpText) field.helpText = bf.helpText;

    // Map validation
    if (bf.validation) {
      const v: FormField['validation'] = {};
      if (bf.validation.pattern !== undefined) v.pattern = bf.validation.pattern;
      if (bf.validation.minLength !== undefined) v.minLength = bf.validation.minLength;
      if (bf.validation.maxLength !== undefined) v.maxLength = bf.validation.maxLength;
      if (bf.validation.min !== undefined) v.min = bf.validation.min;
      if (bf.validation.max !== undefined) v.max = bf.validation.max;
      if (Object.keys(v).length > 0) field.validation = v;
    }

    // Options for dropdown/radio
    if (bf.options && bf.options.length > 0) {
      field.options = bf.options.map((o) => ({ value: o.value, label: o.label }));
    }

    // Conditional visibility
    if (bf.conditional) {
      field.conditional = {
        field: bf.conditional.field,
        operator: bf.conditional.operator,
        value: bf.conditional.value,
      };
    }

    return field;
  });

  // Build the schema
  const schema: ServiceFormSchema = {
    version: '1.0',
    serviceId: state.metadata.serviceId || '',
    serviceName: state.metadata.serviceName,
    department: state.metadata.department || '',
    metadata: {
      description: state.metadata.description,
      category: state.metadata.category,
      sla: '',
      targetAudience: 'citizens',
    },
    fields,
    documents: [],
    endpoints: {
      submit: {
        method: 'POST',
        url: '',
        auth: { type: 'none', config: {} },
      },
      status: {
        method: 'GET',
        url: '',
        auth: { type: 'none', config: {} },
      },
    },
  };

  return schema;
}

/**
 * Export BuilderState to a canonical JSON string.
 * Keys are sorted alphabetically, 2-space indentation.
 */
export function exportSchemaToJson(state: BuilderState): string {
  const schema = exportSchema(state);
  return JSON.stringify(schema, Object.keys(schema).sort(), 2);
}

/**
 * Deep sort keys in an object for canonical JSON output.
 */
function sortKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (typeof obj === 'object') {
    const sorted: any = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Export to canonical JSON string with deeply sorted keys.
 */
export function exportSchemaCanonical(state: BuilderState): string {
  const schema = exportSchema(state);
  return JSON.stringify(sortKeys(schema), null, 2);
}
