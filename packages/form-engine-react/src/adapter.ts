/**
 * UI Adapter system for @serviceformai/form-engine-react.
 *
 * Provides a pluggable component map so consumers can render form fields
 * with any UI library (MUI, Radix, Chakra, plain HTML, etc.).
 *
 * The defaultAdapter ships plain HTML elements with ARIA attributes.
 * Use createAdapter() to override only the field types you need.
 */

import React from 'react';
import type { FormField, FieldType } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Props passed to every adapter component. */
export interface UIAdapterProps {
  /** The full field definition from the schema. */
  field: FormField;
  /** Current field value. */
  value: any;
  /** Called when the field value changes. */
  onChange: (value: any) => void;
  /** Called when the field loses focus. */
  onBlur: () => void;
  /** First validation error message, or undefined if valid. */
  error: string | undefined;
  /** Whether the field has been interacted with. */
  touched: boolean;
  /** Whether the field is disabled. */
  disabled: boolean;
}

/** Component map: each FieldType maps to a React component. */
export type UIAdapter = {
  [K in FieldType]: React.ComponentType<UIAdapterProps>;
};

// ---------------------------------------------------------------------------
// Shared helpers for default adapter components
// ---------------------------------------------------------------------------

function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}

function shouldShowError(props: UIAdapterProps): boolean {
  return props.touched && props.error !== undefined;
}

function renderError(props: UIAdapterProps): React.ReactElement | null {
  if (!shouldShowError(props)) return null;
  return React.createElement(
    'span',
    {
      id: errorId(props.field.id),
      role: 'alert',
      style: { color: '#c00', fontSize: '0.875em' },
    },
    props.error,
  );
}

function commonAria(props: UIAdapterProps): Record<string, any> {
  const attrs: Record<string, any> = {
    'aria-invalid': shouldShowError(props),
    'aria-required': props.field.required,
  };
  if (shouldShowError(props)) {
    attrs['aria-describedby'] = errorId(props.field.id);
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// Default adapter components — plain HTML, no external CSS
// ---------------------------------------------------------------------------

function TextInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'text',
      value: props.value ?? '',
      placeholder: props.field.placeholder,
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value),
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function EmailInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'email',
      value: props.value ?? '',
      placeholder: props.field.placeholder,
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value),
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function PhoneInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'tel',
      value: props.value ?? '',
      placeholder: props.field.placeholder,
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value),
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function NumberInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'number',
      value: props.value ?? '',
      placeholder: props.field.placeholder,
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        props.onChange(raw === '' ? '' : Number(raw));
      },
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function DateInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'date',
      value: props.value ?? '',
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value),
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function DropdownInput(props: UIAdapterProps): React.ReactElement {
  const options = props.field.options ?? [];
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement(
      'select',
      {
        id: props.field.id,
        value: props.value ?? '',
        disabled: props.disabled,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => props.onChange(e.target.value),
        onBlur: props.onBlur,
        ...commonAria(props),
      },
      React.createElement('option', { value: '' }, props.field.placeholder ?? 'Select…'),
      ...options.map((opt) =>
        React.createElement('option', { key: opt.value, value: opt.value }, opt.label),
      ),
    ),
    renderError(props),
  );
}

function RadioInput(props: UIAdapterProps): React.ReactElement {
  const options = props.field.options ?? [];
  return React.createElement(
    'fieldset',
    {
      ...commonAria(props),
    },
    React.createElement('legend', null, props.field.label),
    ...options.map((opt) =>
      React.createElement(
        'label',
        { key: opt.value, style: { display: 'block' } },
        React.createElement('input', {
          type: 'radio',
          name: props.field.id,
          value: opt.value,
          checked: props.value === opt.value,
          disabled: props.disabled,
          onChange: () => props.onChange(opt.value),
          onBlur: props.onBlur,
        }),
        ' ',
        opt.label,
      ),
    ),
    renderError(props),
  );
}

function CheckboxInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement(
      'label',
      null,
      React.createElement('input', {
        id: props.field.id,
        type: 'checkbox',
        checked: Boolean(props.value),
        disabled: props.disabled,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.checked),
        onBlur: props.onBlur,
        ...commonAria(props),
      }),
      ' ',
      props.field.label,
    ),
    renderError(props),
  );
}

function FileInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('input', {
      id: props.field.id,
      type: 'file',
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        props.onChange(file);
      },
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

function TextareaInput(props: UIAdapterProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    React.createElement('label', { htmlFor: props.field.id }, props.field.label),
    React.createElement('textarea', {
      id: props.field.id,
      value: props.value ?? '',
      placeholder: props.field.placeholder,
      disabled: props.disabled,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => props.onChange(e.target.value),
      onBlur: props.onBlur,
      ...commonAria(props),
    }),
    renderError(props),
  );
}

// ---------------------------------------------------------------------------
// Default adapter
// ---------------------------------------------------------------------------

/** Built-in adapter using plain HTML elements with ARIA attributes. */
export const defaultAdapter: UIAdapter = {
  text: TextInput,
  email: EmailInput,
  phone: PhoneInput,
  number: NumberInput,
  date: DateInput,
  dropdown: DropdownInput,
  radio: RadioInput,
  checkbox: CheckboxInput,
  file: FileInput,
  textarea: TextareaInput,
};

// ---------------------------------------------------------------------------
// createAdapter utility
// ---------------------------------------------------------------------------

/**
 * Merge a partial adapter with the defaultAdapter.
 * Field types present in `components` use the custom component;
 * missing field types fall back to the defaultAdapter.
 */
export function createAdapter(components: Partial<UIAdapter>): UIAdapter {
  return { ...defaultAdapter, ...components };
}
