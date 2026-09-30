/**
 * FormProvider — React context for sharing form engine state and UI adapter
 * with deeply nested field components.
 *
 * Two separate contexts are used:
 *   1. FormEngineContext  — carries the FormEngineInstance
 *   2. UIAdapterContext   — carries the UIAdapter (or falls back to defaultAdapter)
 */

import React, { createContext, useContext } from 'react';
import type { FormEngineInstance } from './useFormEngine';
import type { UIAdapter } from './adapter';
import { defaultAdapter } from './adapter';

// ---------------------------------------------------------------------------
// Contexts (not exported — consumers use the hooks below)
// ---------------------------------------------------------------------------

const FormEngineContext = createContext<FormEngineInstance | null>(null);
const UIAdapterContext = createContext<UIAdapter>(defaultAdapter);

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Props accepted by the FormProvider component. */
export interface FormProviderProps {
  /** The FormEngineInstance returned by useFormEngine. */
  engine: FormEngineInstance;
  /** Optional UI adapter. Falls back to defaultAdapter when omitted. */
  ui?: UIAdapter;
  /** Child components that can access form state via useFormContext / useUIAdapter. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// FormProvider component
// ---------------------------------------------------------------------------

/**
 * Provides form engine state and an optional UI adapter to descendant
 * components via React context.
 *
 * @example
 * ```tsx
 * const engine = useFormEngine(schema);
 * return (
 *   <FormProvider engine={engine} ui={myAdapter}>
 *     <FormField fieldId="name" />
 *   </FormProvider>
 * );
 * ```
 */
export function FormProvider(props: FormProviderProps): React.ReactElement {
  const { engine, ui, children } = props;

  return React.createElement(
    FormEngineContext.Provider,
    { value: engine },
    React.createElement(
      UIAdapterContext.Provider,
      { value: ui ?? defaultAdapter },
      children,
    ),
  );
}

// ---------------------------------------------------------------------------
// Context hooks
// ---------------------------------------------------------------------------

/**
 * Returns the FormEngineInstance from the nearest FormProvider ancestor.
 * Throws a descriptive error if called outside a FormProvider.
 */
export function useFormContext(): FormEngineInstance {
  const ctx = useContext(FormEngineContext);
  if (ctx === null) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return ctx;
}

/**
 * Returns the UIAdapter from the nearest FormProvider ancestor.
 * Falls back to the defaultAdapter if no adapter was provided.
 */
export function useUIAdapter(): UIAdapter {
  return useContext(UIAdapterContext);
}
