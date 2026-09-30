/**
 * Action type definitions for the Custom Form Actions system.
 *
 * These types define the event-driven action model that allows government
 * department admins to attach JavaScript-based event handlers to form fields.
 */

// ---------------------------------------------------------------------------
// Action Events
// ---------------------------------------------------------------------------

/** Supported action trigger events. */
export type ActionEvent =
  | 'onFieldChange'
  | 'onFieldBlur'
  | 'onFormLoad'
  | 'onFormSubmit'
  | 'onButtonClick';

// ---------------------------------------------------------------------------
// Action Definition
// ---------------------------------------------------------------------------

/** A single action definition within a FormSchema. */
export interface ActionDefinition {
  /** Unique identifier for this action. */
  id: string;
  /** The form event that triggers this action. */
  event: ActionEvent;
  /** Field ID or button ID; omitted for onFormLoad/onFormSubmit. */
  targetId?: string;
  /** JavaScript function body to execute in the sandbox. */
  code: string;
  /** Human-readable documentation of the action's purpose. */
  description?: string;
  /** Whether this action is enabled; defaults to true. */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Action Validation
// ---------------------------------------------------------------------------

/** A single validation error found in an action definition. */
export interface ActionValidationError {
  errorCode: string;
  message: string;
  actionId?: string;
  details?: string;
}

/** Result of validating action definitions. */
export interface ActionValidationResult {
  valid: boolean;
  errors: ActionValidationError[];
}
