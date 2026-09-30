/**
 * FormField — Renders a single form field by resolving the appropriate
 * UI adapter component and wiring up form state from context.
 *
 * Includes FormFieldErrorBoundary to catch render errors in adapter
 * components and display a safe fallback.
 */

import React from 'react';
import { useFormContext, useUIAdapter } from './FormProvider';
import type { UIAdapterProps } from './adapter';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Props accepted by the FormField component. */
export interface FormFieldProps {
  /** The field ID to render (must match a field in the schema). */
  fieldId: string;
  /** When true, the field is rendered in a disabled state. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  fieldId: string;
  fieldType: string;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render errors thrown by adapter components and displays
 * a safe fallback message.
 */
export class FormFieldErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error(
        `FormFieldErrorBoundary caught error for field "${this.props.fieldId}" (type: ${this.props.fieldType}):`,
        error,
        info,
      );
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        { role: 'alert', style: { color: '#c00', fontSize: '0.875em' } },
        `Error rendering field: ${this.props.fieldId} (type: ${this.props.fieldType})`,
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------

/**
 * Renders a single form field by:
 * 1. Reading form state from the nearest FormProvider (useFormContext)
 * 2. Reading the UI adapter from the nearest FormProvider (useUIAdapter)
 * 3. Looking up the field in visibleFields
 * 4. Resolving the adapter component for the field's type
 * 5. Passing standardised UIAdapterProps to the adapter
 * 6. Wrapping the adapter in FormFieldErrorBoundary
 */
export function FormField(props: FormFieldProps): React.ReactElement | null {
  const { fieldId, disabled = false } = props;
  const engine = useFormContext();
  const adapter = useUIAdapter();

  // Look up the field in visibleFields
  const field = engine.visibleFields.find((f) => f.id === fieldId);

  if (!field) {
    // Check if the field exists at all in the schema (via values/errors keys)
    // If not, warn in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // We can't directly access the schema, but if the field has never been
      // in values, it likely doesn't exist in the schema at all.
      // A field that exists but is hidden would still have a default value.
      if (!(fieldId in engine.values)) {
        console.warn(
          `FormField: field "${fieldId}" does not exist in the schema.`,
        );
      }
    }
    return null;
  }

  const AdapterComponent = adapter[field.type];

  const adapterProps: UIAdapterProps = {
    field,
    value: engine.values[fieldId],
    onChange: (value: any) => engine.setFieldValue(fieldId, value),
    onBlur: () => engine.touchField(fieldId),
    error: engine.errors[fieldId],
    touched: engine.touched[fieldId] ?? false,
    disabled,
  };

  return React.createElement(
    FormFieldErrorBoundary,
    { fieldId, fieldType: field.type },
    React.createElement(AdapterComponent, adapterProps),
  );
}
