/**
 * BuilderStateSerializer — Parse and pretty-print BuilderState.
 *
 * Provides round-trip stability: prettyPrint(parse(prettyPrint(s))) === prettyPrint(s).
 * Returns ParseError on invalid input (never throws).
 */

import type { BuilderState, ParseError } from '../components/form-builder/types';

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
 * Parse a JSON string into a typed BuilderState.
 * Validates required properties (fields array, metadata object).
 * Returns ParseError on invalid input.
 */
export function parseBuilderState(json: string): BuilderState | ParseError {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e: any) {
    return {
      error: true,
      message: `Invalid JSON: ${e.message}`,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      error: true,
      message: 'Invalid BuilderState: expected a JSON object',
    };
  }

  if (!Array.isArray(parsed.fields)) {
    return {
      error: true,
      message: 'Missing required property: fields (expected an array)',
    };
  }

  if (!parsed.metadata || typeof parsed.metadata !== 'object') {
    return {
      error: true,
      message: 'Missing required property: metadata (expected an object)',
    };
  }

  // Ensure defaults for optional properties
  const state: BuilderState = {
    metadata: {
      serviceId: parsed.metadata.serviceId,
      serviceName: parsed.metadata.serviceName || '',
      description: parsed.metadata.description || '',
      category: parsed.metadata.category || '',
      department: parsed.metadata.department,
    },
    fields: parsed.fields,
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    formSettings: {
      columns: parsed.formSettings?.columns || 1,
      gap: parsed.formSettings?.gap || 'md',
    },
    crossFieldRules: Array.isArray(parsed.crossFieldRules) ? parsed.crossFieldRules : [],
  };

  return state;
}

/**
 * Pretty-print a BuilderState as canonical JSON.
 * Sorted keys, 2-space indentation.
 */
export function prettyPrintBuilderState(state: BuilderState): string {
  return JSON.stringify(sortKeys(state), null, 2);
}

/**
 * Type guard to check if a result is a ParseError.
 */
export function isParseError(result: BuilderState | ParseError): result is ParseError {
  return (result as ParseError).error === true;
}
