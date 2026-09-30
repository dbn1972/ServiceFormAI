/**
 * Action Validator — validates action definitions within a FormSchema.
 *
 * Called by the SchemaValidationGuard on the backend before persistence.
 * Checks structural integrity, prohibited constructs, syntax validity,
 * and code length limits for all action definitions.
 */

import type {
  ActionEvent,
  ActionValidationError,
  ActionValidationResult,
} from './action-types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The five supported action event types. */
const VALID_ACTION_EVENTS: ReadonlySet<string> = new Set<ActionEvent>([
  'onFieldChange',
  'onFieldBlur',
  'onFormLoad',
  'onFormSubmit',
  'onButtonClick',
]);

/** Events that require a targetId referencing a field or button. */
const TARGET_REQUIRED_EVENTS: ReadonlySet<string> = new Set<string>([
  'onFieldChange',
  'onFieldBlur',
  'onButtonClick',
]);

/** Maximum allowed length for action code. */
const MAX_CODE_LENGTH = 10_000;

/**
 * Identifiers that are prohibited in action code.
 * These cover DOM access, storage, dynamic code execution, and other
 * browser APIs that must not be available inside the sandbox.
 */
const PROHIBITED_IDENTIFIERS: readonly string[] = [
  'eval',
  'Function',
  'XMLHttpRequest',
  'fetch',
  'importScripts',
  'postMessage',
  'localStorage',
  'sessionStorage',
  'document',
  'window',
  'globalThis',
  'self',
  'top',
  'parent',
  'frames',
  'navigator',
  'location',
  'history',
  'crypto',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
];


// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

const DUPLICATE_ACTION_ID = 'DUPLICATE_ACTION_ID';
const INVALID_ACTION_EVENT = 'INVALID_ACTION_EVENT';
const ACTION_TARGET_NOT_FOUND = 'ACTION_TARGET_NOT_FOUND';
const ACTION_CODE_TOO_LONG = 'ACTION_CODE_TOO_LONG';
const ACTION_SYNTAX_ERROR = 'ACTION_SYNTAX_ERROR';
const ACTION_PROHIBITED_CONSTRUCT = 'ACTION_PROHIBITED_CONSTRUCT';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Build a regex pattern for detecting a prohibited identifier as a standalone word.
 * Uses negative lookbehind/lookahead for identifier characters to avoid false
 * positives on substrings (e.g. "fetchData" should not match "fetch").
 *
 * None of the prohibited identifiers contain regex special characters,
 * so no escaping is needed.
 */
function buildProhibitedPattern(identifier: string): RegExp {
  return new RegExp('(?<![a-zA-Z0-9_$])' + identifier + '(?![a-zA-Z0-9_$])');
}

/**
 * Scan code for prohibited identifiers using regex-based detection.
 * Returns an array of detected prohibited identifiers.
 */
function scanForProhibitedIdentifiers(code: string): string[] {
  const found: string[] = [];

  for (const identifier of PROHIBITED_IDENTIFIERS) {
    const pattern = buildProhibitedPattern(identifier);
    if (pattern.test(code)) {
      found.push(identifier);
    }
  }

  return found;
}


/**
 * Scan code for injection patterns:
 * - Template literals with interpolation containing prohibited identifiers
 * - String literals containing encoded/obfuscated prohibited identifiers
 */
function scanForInjectionPatterns(code: string): string[] {
  const found: string[] = [];

  // Check for template literals with ${...} containing prohibited identifiers
  const templateExprRegex = /\$\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = templateExprRegex.exec(code)) !== null) {
    const expr = match[1];
    for (const identifier of PROHIBITED_IDENTIFIERS) {
      const pattern = buildProhibitedPattern(identifier);
      if (pattern.test(expr)) {
        if (!found.includes(identifier)) {
          found.push(identifier);
        }
      }
    }
  }

  // Check for string literals containing encoded prohibited identifiers
  // e.g. hex escapes (\x65 = 'e'), unicode escapes (\u0065 = 'e')
  const stringLiteralRegex = /(['"`])(?:(?!\1|\\).|\\.)*?\1/g;
  while ((match = stringLiteralRegex.exec(code)) !== null) {
    const literal = match[0];
    try {
      const decoded = literal
        .slice(1, -1)
        .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));

      for (const identifier of PROHIBITED_IDENTIFIERS) {
        if (decoded.includes(identifier) && !found.includes(identifier)) {
          found.push(identifier);
        }
      }
    } catch {
      // Ignore decode errors
    }
  }

  return found;
}

/**
 * Validate that code parses as valid JavaScript using new Function().
 * Returns the parse error message if invalid, or null if valid.
 */
function checkSyntax(code: string): string | null {
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
    return null;
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      return err.message;
    }
    return String(err);
  }
}


// ---------------------------------------------------------------------------
// validateActions
// ---------------------------------------------------------------------------

/**
 * Validates all action definitions in a FormSchema.
 *
 * Accepts unknown[] because the input has not yet been typed — this function
 * determines whether each element is a valid ActionDefinition.
 *
 * All errors are collected (no short-circuiting).
 */
export function validateActions(
  actions: unknown[],
  fieldIds: Set<string>,
): ActionValidationResult {
  const errors: ActionValidationError[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < actions.length; i++) {
    const raw = actions[i];

    if (!isObject(raw)) {
      errors.push({
        errorCode: INVALID_ACTION_EVENT,
        message: `Action at index ${i} is not a valid object`,
      });
      continue;
    }

    const action = raw as Record<string, unknown>;
    const actionId = isNonEmptyString(action.id) ? (action.id as string) : undefined;

    // ── Required property: id ───────────────────────────────────────────
    if (!isNonEmptyString(action.id)) {
      errors.push({
        errorCode: INVALID_ACTION_EVENT,
        message: `Action at index ${i} is missing a non-empty "id"`,
        actionId: undefined,
      });
    } else {
      // Duplicate ID check
      if (seenIds.has(action.id as string)) {
        errors.push({
          errorCode: DUPLICATE_ACTION_ID,
          message: `Duplicate action ID "${action.id}"`,
          actionId: action.id as string,
        });
      }
      seenIds.add(action.id as string);
    }

    // ── Required property: event ────────────────────────────────────────
    if (!isNonEmptyString(action.event)) {
      errors.push({
        errorCode: INVALID_ACTION_EVENT,
        message: `Action at index ${i} is missing a non-empty "event"${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
      });
    } else if (!VALID_ACTION_EVENTS.has(action.event as string)) {
      errors.push({
        errorCode: INVALID_ACTION_EVENT,
        message: `Action at index ${i} has invalid event "${action.event}"${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
      });
    } else {
      // ── targetId validation (only for events that require a target) ───
      const event = action.event as string;
      if (TARGET_REQUIRED_EVENTS.has(event)) {
        if (!isNonEmptyString(action.targetId)) {
          errors.push({
            errorCode: ACTION_TARGET_NOT_FOUND,
            message: `Action at index ${i} with event "${event}" is missing a "targetId"${actionId ? ` (action "${actionId}")` : ''}`,
            actionId,
          });
        } else if (!fieldIds.has(action.targetId as string)) {
          errors.push({
            errorCode: ACTION_TARGET_NOT_FOUND,
            message: `Action at index ${i} references non-existent target "${action.targetId}"${actionId ? ` (action "${actionId}")` : ''}`,
            actionId,
          });
        }
      }
    }

    // ── Required property: code ─────────────────────────────────────────
    if (!isNonEmptyString(action.code)) {
      errors.push({
        errorCode: ACTION_SYNTAX_ERROR,
        message: `Action at index ${i} is missing a non-empty "code"${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
      });
      continue; // Cannot validate code further
    }

    const code = action.code as string;

    // ── Code length check ───────────────────────────────────────────────
    if (code.length > MAX_CODE_LENGTH) {
      errors.push({
        errorCode: ACTION_CODE_TOO_LONG,
        message: `Action at index ${i} has code exceeding ${MAX_CODE_LENGTH} characters (${code.length})${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
      });
    }

    // ── Syntax check ────────────────────────────────────────────────────
    const syntaxError = checkSyntax(code);
    if (syntaxError !== null) {
      errors.push({
        errorCode: ACTION_SYNTAX_ERROR,
        message: `Action at index ${i} has a syntax error${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
        details: syntaxError,
      });
      // Still check for prohibited constructs even if syntax is invalid
    }

    // ── Prohibited construct scan ───────────────────────────────────────
    const prohibited = scanForProhibitedIdentifiers(code);
    for (const identifier of prohibited) {
      errors.push({
        errorCode: ACTION_PROHIBITED_CONSTRUCT,
        message: `Action at index ${i} contains prohibited identifier "${identifier}"${actionId ? ` (action "${actionId}")` : ''}`,
        actionId,
        details: identifier,
      });
    }

    // ── Injection pattern scan ──────────────────────────────────────────
    const injections = scanForInjectionPatterns(code);
    for (const identifier of injections) {
      // Avoid duplicate errors if already caught by the direct scan
      if (!prohibited.includes(identifier)) {
        errors.push({
          errorCode: ACTION_PROHIBITED_CONSTRUCT,
          message: `Action at index ${i} contains obfuscated reference to prohibited identifier "${identifier}"${actionId ? ` (action "${actionId}")` : ''}`,
          actionId,
          details: identifier,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
