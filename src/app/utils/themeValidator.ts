/**
 * Theme Validator
 *
 * Validates tenant theme configurations. Collects all errors
 * without short-circuiting so admins can fix all issues in one pass.
 */

import type { ThemeValidationResult, ThemeValidationError, SpacingToken } from '../types/layoutTypes';

const VALID_SPACING_KEYS = new Set<string>(['xs', 'sm', 'md', 'lg', 'xl']);
const CSS_LENGTH_PATTERN = /^\d+(\.\d+)?(px|rem|em|%|vh|vw|ch|ex|cm|mm|in|pt|pc)$/;

// Named CSS colours (a representative subset — browsers accept ~150 named colours)
const NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
  'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
  'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
  'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy',
  'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
  'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown',
  'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
  'white', 'whitesmoke', 'yellow', 'yellowgreen', 'transparent', 'currentcolor',
]);

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_PATTERN = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
const HSL_PATTERN = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;

/**
 * Checks if a string is a valid CSS colour value.
 */
export function isValidCssColor(value: string): boolean {
  if (typeof value !== 'string') return false;
  const lower = value.trim().toLowerCase();
  return (
    NAMED_COLORS.has(lower) ||
    HEX_COLOR_PATTERN.test(value.trim()) ||
    RGB_PATTERN.test(value.trim()) ||
    HSL_PATTERN.test(value.trim())
  );
}

/**
 * Checks if a value is a valid CSS length string.
 */
function isValidCssLength(value: string): boolean {
  return CSS_LENGTH_PATTERN.test(value);
}

/**
 * Validates a tenant theme configuration.
 * Accepts `unknown` input and validates structure and values.
 */
export function validateTheme(theme: unknown): ThemeValidationResult {
  const errors: ThemeValidationError[] = [];

  if (theme === null || theme === undefined || typeof theme !== 'object') {
    errors.push({ token: 'theme', message: 'Theme must be a non-null object' });
    return { valid: false, errors };
  }

  const t = theme as Record<string, unknown>;

  // Validate colour tokens
  const colorTokens = ['primaryColor', 'secondaryColor', 'borderColor', 'backgroundColor'] as const;
  for (const token of colorTokens) {
    if (t[token] !== undefined) {
      if (typeof t[token] !== 'string' || !isValidCssColor(t[token] as string)) {
        errors.push({
          token,
          message: `${token} must be a valid CSS colour string, got ${JSON.stringify(t[token])}`,
        });
      }
    }
  }

  // Validate fontFamily
  if (t.fontFamily !== undefined) {
    if (typeof t.fontFamily !== 'string' || t.fontFamily.trim().length === 0) {
      errors.push({
        token: 'fontFamily',
        message: `fontFamily must be a non-empty string, got ${JSON.stringify(t.fontFamily)}`,
      });
    }
  }

  // Validate fontSize
  if (t.fontSize !== undefined) {
    if (typeof t.fontSize !== 'string' || !isValidCssLength(t.fontSize)) {
      errors.push({
        token: 'fontSize',
        message: `fontSize must be a valid CSS length string, got ${JSON.stringify(t.fontSize)}`,
      });
    }
  }

  // Validate borderRadius
  if (t.borderRadius !== undefined) {
    if (typeof t.borderRadius === 'number') {
      if (t.borderRadius < 0) {
        errors.push({
          token: 'borderRadius',
          message: `borderRadius must be a non-negative number, got ${t.borderRadius}`,
        });
      }
    } else if (typeof t.borderRadius === 'string') {
      if (!isValidCssLength(t.borderRadius)) {
        errors.push({
          token: 'borderRadius',
          message: `borderRadius must be a valid CSS length string, got "${t.borderRadius}"`,
        });
      }
    } else {
      errors.push({
        token: 'borderRadius',
        message: `borderRadius must be a non-negative number or valid CSS length string, got ${typeof t.borderRadius}`,
      });
    }
  }

  // Validate spacingScale
  if (t.spacingScale !== undefined) {
    if (typeof t.spacingScale !== 'object' || t.spacingScale === null || Array.isArray(t.spacingScale)) {
      errors.push({
        token: 'spacingScale',
        message: 'spacingScale must be an object with keys from {xs, sm, md, lg, xl}',
      });
    } else {
      const scale = t.spacingScale as Record<string, unknown>;
      for (const [key, value] of Object.entries(scale)) {
        if (!VALID_SPACING_KEYS.has(key)) {
          errors.push({
            token: 'spacingScale',
            message: `spacingScale key "${key}" is not valid. Must be one of: xs, sm, md, lg, xl`,
          });
        } else if (typeof value !== 'string' || !isValidCssLength(value)) {
          errors.push({
            token: 'spacingScale',
            message: `spacingScale.${key} must be a valid CSS length string, got ${JSON.stringify(value)}`,
          });
        }
      }
    }
  }

  // Validate direction
  if (t.direction !== undefined) {
    if (t.direction !== 'ltr' && t.direction !== 'rtl') {
      errors.push({
        token: 'direction',
        message: `direction must be "ltr" or "rtl", got ${JSON.stringify(t.direction)}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
