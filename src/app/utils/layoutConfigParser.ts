/**
 * Layout Config Parser & Pretty-Printer
 *
 * Provides round-trip-safe serialisation for LayoutConfig objects.
 * The parser returns a typed LayoutConfig or a ParseError (not an exception).
 * The pretty-printer produces canonical JSON with sorted keys and 2-space indentation.
 */

import type { LayoutConfig, ParseError } from '../types/layoutTypes';

/**
 * Deep-sorts all keys in an object (and nested objects) alphabetically.
 */
function sortKeysDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeysDeep);
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Parses a JSON string into a typed LayoutConfig object.
 * Returns a ParseError if the input is invalid.
 */
export function parseLayoutConfig(json: string): LayoutConfig | ParseError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: true, message: 'Invalid JSON: unable to parse input string' };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: true, message: 'Layout config must be a JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  // Validate required `columns` property
  if (obj.columns === undefined) {
    return { error: true, message: 'Missing required property: columns' };
  }

  if (typeof obj.columns !== 'number' || !Number.isInteger(obj.columns) || obj.columns < 1 || obj.columns > 4) {
    return {
      error: true,
      message: `columns must be an integer between 1 and 4, got ${JSON.stringify(obj.columns)}`,
    };
  }

  const config: LayoutConfig = { columns: obj.columns };

  // Parse optional gap
  if (obj.gap !== undefined) {
    if (typeof obj.gap !== 'string') {
      return { error: true, message: `gap must be a string, got ${typeof obj.gap}` };
    }
    config.gap = obj.gap;
  }

  // Parse optional responsive
  if (obj.responsive !== undefined) {
    if (typeof obj.responsive !== 'object' || obj.responsive === null || Array.isArray(obj.responsive)) {
      return { error: true, message: 'responsive must be an object' };
    }

    const responsive = obj.responsive as Record<string, unknown>;
    const validKeys = new Set(['mobile', 'tablet', 'desktop']);
    const result: Record<string, number> = {};

    for (const [key, value] of Object.entries(responsive)) {
      if (!validKeys.has(key)) {
        return { error: true, message: `Invalid responsive breakpoint key: "${key}"` };
      }
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 4) {
        return {
          error: true,
          message: `responsive.${key} must be an integer between 1 and 4, got ${JSON.stringify(value)}`,
        };
      }
      result[key] = value;
    }

    config.responsive = result as LayoutConfig['responsive'];
  }

  return config;
}

/**
 * Pretty-prints a LayoutConfig to canonical JSON with sorted keys and 2-space indentation.
 * Guarantees round-trip stability: prettyPrint(parse(prettyPrint(config))) === prettyPrint(config).
 */
export function prettyPrintLayoutConfig(config: LayoutConfig): string {
  return JSON.stringify(sortKeysDeep(config), null, 2);
}

/**
 * Type guard to check if a result is a ParseError.
 */
export function isParseError(result: LayoutConfig | ParseError): result is ParseError {
  return (result as ParseError).error === true;
}
