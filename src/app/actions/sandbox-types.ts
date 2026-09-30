/**
 * Sandbox message types for communication between the Action Engine
 * and the Sandbox Worker via postMessage.
 *
 * These types define the structured message protocol used for all
 * main-thread ↔ Worker communication.
 */

import type { ActionEvent } from '@serviceformai/validation-engine';

// ---------------------------------------------------------------------------
// API Call Types (recorded during sandbox execution)
// ---------------------------------------------------------------------------

/** A single Restricted API call recorded during sandbox execution. */
export type SandboxApiCall =
  | { fn: 'setFieldValue'; args: { fieldId: string; value: unknown } }
  | { fn: 'showField'; args: { fieldId: string } }
  | { fn: 'hideField'; args: { fieldId: string } }
  | {
      fn: 'showMessage';
      args: { text: string; type: 'info' | 'warning' | 'error' | 'success' };
    };

// ---------------------------------------------------------------------------
// Request (Main Thread → Worker)
// ---------------------------------------------------------------------------

/** Message sent from the Action Engine to the Sandbox Worker. */
export interface SandboxRequest {
  type: 'execute';
  requestId: string;
  code: string;
  event: ActionEvent;
  args: {
    fieldId?: string;
    value?: unknown;
    previousValue?: unknown;
    buttonId?: string;
  };
  /** Read-only snapshot of all current form field values. */
  formValues: Record<string, unknown>;
  /** Tenant's fetch domain allowlist. */
  allowlist: string[];
}

// ---------------------------------------------------------------------------
// Response (Worker → Main Thread)
// ---------------------------------------------------------------------------

/** Message sent from the Sandbox Worker back to the Action Engine. */
export interface SandboxResponse {
  type: 'result';
  requestId: string;
  status: 'success' | 'error' | 'timeout';
  apiCalls: SandboxApiCall[];
  error?: { code: string; message: string };
  executionDurationMs: number;
}
