/**
 * Sandbox Communication Protocol Types
 *
 * Defines the typed message protocol for host↔iframe communication
 * between the DynamicFormRenderer and sandboxed custom components.
 * All messages use a discriminated union on the `type` field.
 */

// ---------------------------------------------------------------------------
// Host → Sandbox messages
// ---------------------------------------------------------------------------

/** Messages sent from the host form to the sandboxed component. */
export type HostToSandboxMessage =
  | { type: 'config-update'; props: SandboxedFieldProps }
  | { type: 'destroy' };

// ---------------------------------------------------------------------------
// Sandbox → Host messages
// ---------------------------------------------------------------------------

/** Messages sent from the sandboxed component to the host form. */
export type SandboxToHostMessage =
  | { type: 'ready' }
  | { type: 'value-change'; value: unknown }
  | { type: 'blur' }
  | { type: 'error'; message: string }
  | { type: 'resize'; height: number };

// ---------------------------------------------------------------------------
// Sandboxed field props (serializable)
// ---------------------------------------------------------------------------

/**
 * Props sent to the sandboxed component via postMessage.
 * This is a serializable subset of CustomFieldProps — no functions.
 */
export interface SandboxedFieldProps {
  /** Unique field instance identifier. */
  fieldId: string;
  /** Serializable field definition. */
  field: SerializableFormField;
  /** Current field value from form state. */
  value: unknown;
  /** Current validation error message, if any. */
  error: string | undefined;
  /** Whether the field is currently disabled. */
  disabled: boolean;
  /** Tenant-specific configuration. */
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// SerializableFormField
// ---------------------------------------------------------------------------

/**
 * FormField with only JSON-serializable properties (no functions).
 * Used for postMessage communication with sandboxed components.
 */
export interface SerializableFormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, unknown>;
  options?: Array<{ value: string; label: string }>;
  customConfig?: Record<string, unknown>;
}
