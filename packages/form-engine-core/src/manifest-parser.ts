/**
 * ComponentManifest Parser & PrettyPrinter.
 *
 * - `parseComponentManifest` validates required properties and returns a typed
 *   `ComponentManifest` on success or a `ManifestParseError` on failure.
 * - `prettyPrintManifest` produces canonical JSON with recursively sorted
 *   keys and 2-space indentation, ensuring round-trip stability.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata describing a custom component's capabilities and configuration. */
export interface ComponentManifest {
  /** Custom field type name (e.g., "address_picker"). */
  fieldType: string;
  /** Human-readable display name. */
  displayName: string;
  /** Semantic version of the component. */
  version: string;
  /** Optional description. */
  description?: string;
  /** URL to the component's JavaScript bundle. */
  bundleUrl?: string;
  /** Optional array of custom validator definitions. */
  validators?: Array<{
    name: string;
    description?: string;
    params?: Record<string, unknown>;
  }>;
  /** Default configuration values. */
  defaultConfig?: Record<string, unknown>;
  /** Allowed external domains for network requests (CSP connect-src). */
  allowedDomains?: string[];
}

/** Error returned when parsing a ComponentManifest JSON string fails. */
export interface ManifestParseError {
  error: true;
  message: string;
  missingProperties?: string[];
}

// ---------------------------------------------------------------------------
// Required properties
// ---------------------------------------------------------------------------

const REQUIRED_PROPERTIES = ['fieldType', 'displayName', 'version'] as const;

// ---------------------------------------------------------------------------
// parseComponentManifest
// ---------------------------------------------------------------------------

/**
 * Parse a JSON string into a `ComponentManifest`.
 *
 * 1. Attempts `JSON.parse` — returns a `ManifestParseError` on syntax failure.
 * 2. Checks the result is a non-null object.
 * 3. Checks all required properties (`fieldType`, `displayName`, `version`)
 *    are present and are non-empty strings.
 * 4. Returns the parsed object as `ComponentManifest` if all checks pass.
 */
export function parseComponentManifest(
  json: string,
): ComponentManifest | ManifestParseError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: true, message: `Invalid JSON: ${message}` };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: true, message: 'Invalid manifest: expected a JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  const missing: string[] = [];
  for (const prop of REQUIRED_PROPERTIES) {
    if (typeof obj[prop] !== 'string' || (obj[prop] as string).length === 0) {
      missing.push(prop);
    }
  }

  if (missing.length > 0) {
    return {
      error: true,
      message: `Invalid manifest: missing or empty required properties: ${missing.join(', ')}`,
      missingProperties: missing,
    };
  }

  return parsed as ComponentManifest;
}

// ---------------------------------------------------------------------------
// prettyPrintManifest
// ---------------------------------------------------------------------------

/**
 * Recursively sort all keys in a value so that `JSON.stringify` produces
 * a deterministic, canonical output.
 */
function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(value as Record<string, unknown>).sort();
  for (const key of keys) {
    sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Produce canonical JSON for a `ComponentManifest` with sorted keys at all
 * levels and 2-space indentation.
 *
 * Round-trip guarantee:
 * ```
 * prettyPrintManifest(parseComponentManifest(prettyPrintManifest(m)) as ComponentManifest)
 *   === prettyPrintManifest(m)
 * ```
 */
export function prettyPrintManifest(manifest: ComponentManifest): string {
  return JSON.stringify(sortKeysDeep(manifest), null, 2);
}
