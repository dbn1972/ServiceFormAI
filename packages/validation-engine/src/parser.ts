/**
 * FormSchema Parser & PrettyPrinter.
 *
 * - `parseFormSchema` validates structural completeness and returns a typed
 *   `FormSchema` on success or a descriptive `ParseError` on failure.
 * - `prettyPrintFormSchema` produces canonical JSON with recursively sorted
 *   keys and 2-space indentation, ensuring round-trip stability.
 */

import type { FormSchema, ParseError } from './types.js';

/**
 * Parse a JSON string into a `FormSchema`.
 *
 * 1. Attempts `JSON.parse` — returns a `ParseError` on syntax failure.
 * 2. Checks the result is a non-null object.
 * 3. Checks `version` is a non-empty string.
 * 4. Checks `fields` is an array.
 * 5. If `actions` is present, checks it is an array and validates each entry
 *    has required properties (`id`, `event`, `code`).
 * 6. Returns the parsed object as `FormSchema` if all checks pass.
 */
export function parseFormSchema(json: string): FormSchema | ParseError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: true, message: `Invalid JSON: ${message}` };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: true, message: 'Invalid schema: expected a JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== 'string' || obj.version.length === 0) {
    return {
      error: true,
      message: 'Invalid schema: missing or empty "version" property',
    };
  }

  if (!Array.isArray(obj.fields)) {
    return {
      error: true,
      message: 'Invalid schema: missing or non-array "fields" property',
    };
  }

  // Validate actions array if present
  if (obj.actions !== undefined) {
    if (!Array.isArray(obj.actions)) {
      return {
        error: true,
        message: 'Invalid schema: "actions" property must be an array',
      };
    }

    for (let i = 0; i < obj.actions.length; i++) {
      const action = obj.actions[i];
      if (action === null || typeof action !== 'object' || Array.isArray(action)) {
        return {
          error: true,
          message: `Invalid schema: action at index ${i} must be an object`,
        };
      }

      const actionObj = action as Record<string, unknown>;

      if (typeof actionObj.id !== 'string' || actionObj.id.length === 0) {
        return {
          error: true,
          message: `Invalid schema: action at index ${i} is missing required property "id"`,
        };
      }

      if (typeof actionObj.event !== 'string' || actionObj.event.length === 0) {
        return {
          error: true,
          message: `Invalid schema: action at index ${i} is missing required property "event"`,
        };
      }

      if (typeof actionObj.code !== 'string' || actionObj.code.length === 0) {
        return {
          error: true,
          message: `Invalid schema: action at index ${i} is missing required property "code"`,
        };
      }
    }
  }

  return parsed as FormSchema;
}

/**
 * Canonical key order for ActionDefinition objects.
 * Keys not in this list are appended in alphabetical order.
 */
const ACTION_KEY_ORDER = ['id', 'event', 'targetId', 'code', 'description', 'enabled'];

/**
 * Order keys of an ActionDefinition according to the canonical order.
 */
function orderActionKeys(action: Record<string, unknown>): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};

  // First, add keys in the canonical order (if present)
  for (const key of ACTION_KEY_ORDER) {
    if (key in action) {
      ordered[key] = sortKeysDeep(action[key]);
    }
  }

  // Then, add any remaining keys in alphabetical order
  const remaining = Object.keys(action)
    .filter((k) => !ACTION_KEY_ORDER.includes(k))
    .sort();
  for (const key of remaining) {
    ordered[key] = sortKeysDeep(action[key]);
  }

  return ordered;
}

/**
 * Recursively sort all keys in a value so that `JSON.stringify` produces
 * a deterministic, canonical output.
 *
 * ActionDefinition objects within the `actions` array use a custom key
 * ordering (`id`, `event`, `targetId`, `code`, `description`, `enabled`)
 * instead of alphabetical sort.
 */
function sortKeysDeep(value: unknown, isAction = false): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (isAction) {
    return orderActionKeys(value as Record<string, unknown>);
  }

  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (key === 'actions' && Array.isArray(obj[key])) {
      sorted[key] = (obj[key] as unknown[]).map((item) => sortKeysDeep(item, true));
    } else {
      sorted[key] = sortKeysDeep(obj[key]);
    }
  }
  return sorted;
}

/**
 * Produce canonical JSON for a `FormSchema` with sorted keys at all levels
 * and 2-space indentation.
 *
 * ActionDefinition objects within the `actions` array use a consistent key
 * ordering: `id`, `event`, `targetId`, `code`, `description`, `enabled`.
 *
 * Round-trip guarantee:
 * ```
 * prettyPrintFormSchema(parseFormSchema(prettyPrintFormSchema(schema)) as FormSchema)
 *   === prettyPrintFormSchema(schema)
 * ```
 */
export function prettyPrintFormSchema(schema: FormSchema): string {
  return JSON.stringify(sortKeysDeep(schema), null, 2);
}
