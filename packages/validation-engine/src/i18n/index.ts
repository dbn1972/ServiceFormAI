/**
 * Localisation module for the Form Validation Engine.
 *
 * Provides default error messages in all supported locales.
 * Messages use `{field}` as a placeholder for the field label.
 */

import type { SupportedLocale } from '../types.js';
import { localeMessages } from './messages.js';

/** Generic fallback message when the error code is not found in any locale. */
const GENERIC_FALLBACK = 'Validation failed';

/** Default placeholder used when no field label is provided. */
const DEFAULT_FIELD_PLACEHOLDER = 'This field';

/**
 * Get the default localised error message for a given error code.
 *
 * Resolution order:
 * 1. Look up the error code in the requested locale's message map.
 * 2. If not found, fall back to the English (`en`) message map.
 * 3. If still not found, return a generic "Validation failed" message.
 *
 * The `{field}` placeholder in the template is replaced with `fieldLabel`
 * if provided, or "This field" otherwise.
 *
 * @param errorCode  The machine-readable error code (e.g. "REQUIRED").
 * @param locale     The target locale.
 * @param fieldLabel Optional human-readable field label for interpolation.
 * @returns A non-empty localised error message string.
 */
export function getDefaultMessage(
  errorCode: string,
  locale: SupportedLocale,
  fieldLabel?: string,
): string {
  const label = fieldLabel || DEFAULT_FIELD_PLACEHOLDER;

  // Try the requested locale first
  const localeMap = localeMessages[locale];
  if (localeMap && localeMap[errorCode]) {
    return localeMap[errorCode].replace(/\{field\}/g, label);
  }

  // Fall back to English
  const enMap = localeMessages.en;
  if (enMap && enMap[errorCode]) {
    return enMap[errorCode].replace(/\{field\}/g, label);
  }

  // Final fallback — generic message
  return GENERIC_FALLBACK;
}

export { localeMessages } from './messages.js';
