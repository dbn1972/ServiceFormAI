/**
 * Custom Component Registry Types
 *
 * Defines the interfaces for custom form field components that extend
 * the platform's built-in field types. Custom components implement
 * CustomFieldProps to integrate with the DynamicFormRenderer and
 * validation engine.
 */

import type { FormField } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// CustomFieldProps
// ---------------------------------------------------------------------------

/**
 * The standardized props contract that every custom component receives
 * from the form system. Custom components must implement this interface
 * to integrate with the DynamicFormRenderer.
 */
export interface CustomFieldProps {
  /** Full field definition from the schema. */
  field: FormField;
  /** Unique field instance identifier for DOM id/aria attributes. */
  fieldId: string;
  /** Current field value from form state. */
  value: unknown;
  /** Callback to update the field value in form state. */
  onChange: (value: unknown) => void;
  /** Callback when the field loses focus (triggers validation). */
  onBlur: () => void;
  /** Current validation error message, if any. */
  error: string | undefined;
  /** Whether the field is currently disabled. */
  disabled: boolean;
  /** Tenant-specific configuration (API keys, feature flags, style overrides). */
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// CustomValidatorDefinition
// ---------------------------------------------------------------------------

/** Describes a custom validator that a component provides. */
export interface CustomValidatorDefinition {
  /** Unique validator name for lookup. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** Optional configuration parameters. */
  params?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ComponentManifest
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
  validators?: CustomValidatorDefinition[];
  /** Default configuration values. */
  defaultConfig?: Record<string, unknown>;
  /** Allowed external domains for network requests (CSP connect-src). */
  allowedDomains?: string[];
}

// ---------------------------------------------------------------------------
// ComponentRegistration
// ---------------------------------------------------------------------------

/** A registered custom component paired with its manifest metadata. */
export interface ComponentRegistration {
  /** The React component implementing CustomFieldProps. */
  component: React.ComponentType<CustomFieldProps>;
  /** The component's metadata manifest. */
  manifest: ComponentManifest;
}
