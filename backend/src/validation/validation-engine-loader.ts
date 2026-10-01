/**
 * Loader for the validation-engine package.
 *
 * The validation-engine is an ESM package, but the backend runs in CJS mode.
 * The validation-engine provides a CJS build at dist/cjs/ which this loader
 * imports using require() via a resolved path.
 */

import * as path from 'path';
import { existsSync } from 'fs';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, Array<{ field: string; errorCode: string; message: string }>>;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: Array<{ errorCode: string; message: string; fieldId?: string }>;
}

let cachedModule: any = null;

function loadModule(): any {
  if (cachedModule) {
    return cachedModule;
  }

  const modulePaths = [
    path.resolve(__dirname, '..', '..', 'packages', 'validation-engine', 'dist', 'cjs', 'index.js'),
    path.resolve(__dirname, '..', '..', '..', 'packages', 'validation-engine', 'dist', 'cjs', 'index.js'),
  ];
  const modulePath = modulePaths.find(existsSync);
  if (!modulePath) {
    throw new Error(`Validation engine CJS build not found. Searched: ${modulePaths.join(', ')}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cachedModule = require(modulePath);
  return cachedModule;
}

/**
 * Loads and returns the `validate` function from the validation-engine package.
 * Uses the CJS build at packages/validation-engine/dist/cjs/index.js.
 * The result is cached after the first successful load.
 */
export function loadValidateSync(): (schema: any, data: any) => ValidationResult {
  return loadModule().validate;
}

/**
 * Loads and returns the `validateSchema` function from the validation-engine package.
 * Uses the CJS build at packages/validation-engine/dist/cjs/index.js.
 * The result is cached after the first successful load.
 */
export function loadValidateSchemaSync(): (schema: unknown, registeredCustomTypes?: Set<string>) => SchemaValidationResult {
  return loadModule().validateSchema;
}

/**
 * Loads and returns the `validateActions` function from the validation-engine package.
 * Uses the CJS build at packages/validation-engine/dist/cjs/index.js.
 * The result is cached after the first successful load.
 */
export function loadValidateActionsSync(): (actions: unknown[], fieldIds: Set<string>) => { valid: boolean; errors: Array<{ errorCode: string; message: string; actionId?: string; details?: string }> } {
  return loadModule().validateActions;
}
