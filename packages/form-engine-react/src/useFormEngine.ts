/**
 * useFormEngine — React hook for schema-driven form state management.
 *
 * Wraps the pure state functions from @serviceformai/form-engine-core
 * into React state via useReducer. Provides field interactions, validation,
 * submission handling, server error merging, and multi-step navigation.
 */

import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import type {
  FormSchema,
  FormField,
  FormStep,
  FormData,
} from '@serviceformai/form-engine-core';
import {
  createFormState,
  setFieldValue as coreSetFieldValue,
  validateFormState,
} from '@serviceformai/form-engine-core';
import type { FormState } from '@serviceformai/form-engine-core';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Options accepted by the useFormEngine hook. */
export interface UseFormEngineOptions {
  /** Initial values to overlay on top of schema defaults. */
  initialValues?: FormData;
  /** When true, validate a field on every value change (not just blur). */
  validateOnChange?: boolean;
}

/** The object returned by useFormEngine — all state + interaction methods. */
export interface FormEngineInstance {
  // State
  readonly values: FormData;
  readonly errors: Record<string, string>;
  readonly touched: Record<string, boolean>;
  readonly visibleFields: FormField[];
  readonly submitting: boolean;

  // Field interactions
  setFieldValue: (fieldId: string, value: any) => void;
  touchField: (fieldId: string) => void;
  setServerErrors: (errors: Record<string, string>) => void;

  // Submission
  handleSubmit: (onSubmit: (data: FormData) => Promise<void> | void) => Promise<void>;

  // Multi-step
  readonly steps: FormStep[] | undefined;
  readonly currentStepId: string | undefined;
  goToStep: (stepId: string) => boolean;
  nextStep: () => boolean;
  prevStep: () => void;
}

// ---------------------------------------------------------------------------
// Reducer types
// ---------------------------------------------------------------------------

interface HookState {
  formState: FormState;
  submitting: boolean;
  currentStepId: string | undefined;
}

type HookAction =
  | { type: 'SET_VALUE'; schema: FormSchema; fieldId: string; value: any }
  | { type: 'TOUCH_FIELD'; fieldId: string }
  | { type: 'VALIDATE_FIELD'; schema: FormSchema; fieldId: string }
  | { type: 'VALIDATE_ALL'; schema: FormSchema; stepId?: string }
  | { type: 'SET_SERVER_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'GO_TO_STEP'; stepId: string }
  | { type: 'RESET'; formState: FormState; currentStepId: string | undefined };

// ---------------------------------------------------------------------------
// Pure reducer
// ---------------------------------------------------------------------------

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'SET_VALUE': {
      const newFormState = coreSetFieldValue(
        action.schema,
        state.formState,
        action.fieldId,
        action.value,
      );
      if (newFormState === state.formState) return state;
      return { ...state, formState: newFormState };
    }

    case 'TOUCH_FIELD': {
      const current = state.formState.touched;
      if (current[action.fieldId] === true) return state;
      const newTouched = { ...current, [action.fieldId]: true as const };
      return {
        ...state,
        formState: {
          ...state.formState,
          touched: Object.freeze(newTouched),
        } as FormState,
      };
    }

    case 'VALIDATE_FIELD': {
      const validated = validateFormState(action.schema, state.formState, {
        fieldId: action.fieldId,
      });
      // Merge: keep existing errors for other fields, update only this field
      const mergedErrors: Record<string, string> = { ...state.formState.errors };
      // Remove old error for this field
      delete mergedErrors[action.fieldId];
      // Add new error if present
      if (action.fieldId in validated.errors) {
        mergedErrors[action.fieldId] = validated.errors[action.fieldId];
      }
      return {
        ...state,
        formState: {
          ...state.formState,
          errors: Object.freeze(mergedErrors),
        } as FormState,
      };
    }

    case 'VALIDATE_ALL': {
      const validated = validateFormState(action.schema, state.formState, {
        stepId: action.stepId,
      });
      return { ...state, formState: validated };
    }

    case 'SET_SERVER_ERRORS': {
      const merged: Record<string, string> = {
        ...state.formState.errors,
        ...action.errors,
      };
      return {
        ...state,
        formState: {
          ...state.formState,
          errors: Object.freeze(merged),
        } as FormState,
      };
    }

    case 'SET_SUBMITTING': {
      if (state.submitting === action.submitting) return state;
      return { ...state, submitting: action.submitting };
    }

    case 'GO_TO_STEP': {
      if (state.currentStepId === action.stepId) return state;
      return { ...state, currentStepId: action.stepId };
    }

    case 'RESET': {
      return {
        formState: action.formState,
        submitting: false,
        currentStepId: action.currentStepId,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// No-op instance (returned when schema is null/undefined)
// ---------------------------------------------------------------------------

const EMPTY_VALUES: FormData = Object.freeze({});
const EMPTY_ERRORS: Record<string, string> = Object.freeze({});
const EMPTY_TOUCHED: Record<string, boolean> = Object.freeze({});
const EMPTY_VISIBLE: FormField[] = Object.freeze([]) as unknown as FormField[];

const noopVoid = () => {};
const noopFalse = () => false;
const noopPromise = async () => {};

const NOOP_INSTANCE: FormEngineInstance = {
  values: EMPTY_VALUES,
  errors: EMPTY_ERRORS,
  touched: EMPTY_TOUCHED,
  visibleFields: EMPTY_VISIBLE,
  submitting: false,
  setFieldValue: noopVoid,
  touchField: noopVoid,
  setServerErrors: noopVoid,
  handleSubmit: noopPromise,
  steps: undefined,
  currentStepId: undefined,
  goToStep: noopFalse,
  nextStep: noopFalse,
  prevStep: noopVoid,
};

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * React hook that manages form state, validation, visibility, submission,
 * and multi-step navigation for a given FormSchema.
 *
 * @param schema   The FormSchema describing the form. Pass null/undefined
 *                 to get a no-op instance (useful for loading states).
 * @param options  Optional configuration: initialValues, validateOnChange.
 * @returns A FormEngineInstance with all state and interaction methods.
 */
export function useFormEngine(
  schema: FormSchema | null | undefined,
  options?: UseFormEngineOptions,
): FormEngineInstance {
  // Warn in development when schema is missing
  const warnedRef = useRef(false);
  if (!schema && !warnedRef.current) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.warn(
        'useFormEngine: schema is null or undefined. Returning a no-op instance.',
      );
    }
    warnedRef.current = true;
  }
  // Reset warning flag when schema becomes available
  if (schema) {
    warnedRef.current = false;
  }

  // Keep a stable reference to options to avoid re-creating callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Keep a stable reference to schema for callbacks
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  // Compute initial state
  const initialHookState = useMemo((): HookState => {
    if (!schema) {
      return {
        formState: {
          values: EMPTY_VALUES,
          touched: EMPTY_TOUCHED,
          errors: EMPTY_ERRORS,
          visibleFieldIds: Object.freeze([]),
        } as FormState,
        submitting: false,
        currentStepId: undefined,
      };
    }
    const formState = createFormState(schema, options?.initialValues);
    const currentStepId =
      schema.steps && schema.steps.length > 0 ? schema.steps[0].id : undefined;
    return { formState, submitting: false, currentStepId };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only compute once on mount

  const [state, dispatch] = useReducer(reducer, initialHookState);

  // Re-initialise when schema reference changes
  const prevSchemaRef = useRef(schema);
  useEffect(() => {
    if (schema === prevSchemaRef.current) return;
    prevSchemaRef.current = schema;

    if (!schema) {
      dispatch({
        type: 'RESET',
        formState: {
          values: EMPTY_VALUES,
          touched: EMPTY_TOUCHED,
          errors: EMPTY_ERRORS,
          visibleFieldIds: Object.freeze([]),
        } as FormState,
        currentStepId: undefined,
      });
      return;
    }

    const formState = createFormState(schema, optionsRef.current?.initialValues);
    const currentStepId =
      schema.steps && schema.steps.length > 0 ? schema.steps[0].id : undefined;
    dispatch({ type: 'RESET', formState, currentStepId });
  }, [schema]);

  // Derive visibleFields from state.formState.visibleFieldIds + schema
  const visibleFields = useMemo((): FormField[] => {
    if (!schema) return EMPTY_VISIBLE;
    const idSet = new Set(state.formState.visibleFieldIds);
    return schema.fields.filter((f) => idSet.has(f.id));
  }, [schema, state.formState.visibleFieldIds]);

  // --- Stable callbacks ---

  const setFieldValue = useCallback(
    (fieldId: string, value: any) => {
      const s = schemaRef.current;
      if (!s) return;

      dispatch({ type: 'SET_VALUE', schema: s, fieldId, value });

      // If field is touched and validateOnChange is true, validate
      // We read touched from the current state via a ref-free approach:
      // dispatch VALIDATE_FIELD after SET_VALUE — the reducer will use
      // the latest state. We check touched here from the current render.
      const isTouched = state.formState.touched[fieldId] === true;
      if (isTouched && optionsRef.current?.validateOnChange) {
        dispatch({ type: 'VALIDATE_FIELD', schema: s, fieldId });
      }
    },
    [state.formState.touched],
  );

  const touchField = useCallback(
    (fieldId: string) => {
      const s = schemaRef.current;
      if (!s) return;

      dispatch({ type: 'TOUCH_FIELD', fieldId });
      dispatch({ type: 'VALIDATE_FIELD', schema: s, fieldId });
    },
    [],
  );

  const setServerErrors = useCallback(
    (errors: Record<string, string>) => {
      dispatch({ type: 'SET_SERVER_ERRORS', errors });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (onSubmit: (data: FormData) => Promise<void> | void): Promise<void> => {
      const s = schemaRef.current;
      if (!s) return;

      // Validate all visible fields (or current step)
      const stepId = state.currentStepId;
      dispatch({ type: 'VALIDATE_ALL', schema: s, stepId });

      // We need to compute validation result synchronously to check validity
      const validated = validateFormState(s, state.formState, {
        stepId,
      });

      const hasErrors = Object.keys(validated.errors).length > 0;
      if (hasErrors) {
        // Update state with validation errors (dispatch already happened,
        // but we need to ensure the errors are set)
        return;
      }

      dispatch({ type: 'SET_SUBMITTING', submitting: true });
      try {
        await onSubmit(state.formState.values);
      } catch (err) {
        throw err;
      } finally {
        dispatch({ type: 'SET_SUBMITTING', submitting: false });
      }
    },
    [state.formState, state.currentStepId],
  );

  // --- Multi-step navigation ---

  const steps = schema?.steps;

  const goToStep = useCallback(
    (stepId: string): boolean => {
      const s = schemaRef.current;
      if (!s || !s.steps || s.steps.length === 0) return false;

      // Check target step exists
      const targetExists = s.steps.some((step) => step.id === stepId);
      if (!targetExists) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`useFormEngine: goToStep called with non-existent stepId "${stepId}".`);
        }
        return false;
      }

      // Validate current step before navigating
      const currentStepId = state.currentStepId;
      if (currentStepId) {
        const validated = validateFormState(s, state.formState, {
          stepId: currentStepId,
        });
        const hasErrors = Object.keys(validated.errors).length > 0;
        if (hasErrors) {
          dispatch({ type: 'VALIDATE_ALL', schema: s, stepId: currentStepId });
          return false;
        }
      }

      dispatch({ type: 'GO_TO_STEP', stepId });
      return true;
    },
    [state.formState, state.currentStepId],
  );

  const nextStep = useCallback((): boolean => {
    const s = schemaRef.current;
    if (!s || !s.steps || s.steps.length === 0) return false;

    const currentIdx = s.steps.findIndex(
      (step) => step.id === state.currentStepId,
    );
    if (currentIdx < 0 || currentIdx >= s.steps.length - 1) return false;

    const nextStepId = s.steps[currentIdx + 1].id;

    // Validate current step before advancing
    const validated = validateFormState(s, state.formState, {
      stepId: state.currentStepId,
    });
    const hasErrors = Object.keys(validated.errors).length > 0;
    if (hasErrors) {
      dispatch({ type: 'VALIDATE_ALL', schema: s, stepId: state.currentStepId });
      return false;
    }

    dispatch({ type: 'GO_TO_STEP', stepId: nextStepId });
    return true;
  }, [state.formState, state.currentStepId]);

  const prevStep = useCallback((): void => {
    const s = schemaRef.current;
    if (!s || !s.steps || s.steps.length === 0) return;

    const currentIdx = s.steps.findIndex(
      (step) => step.id === state.currentStepId,
    );
    if (currentIdx <= 0) return;

    const prevStepId = s.steps[currentIdx - 1].id;
    dispatch({ type: 'GO_TO_STEP', stepId: prevStepId });
  }, [state.currentStepId]);

  // --- Return no-op instance when schema is missing ---
  if (!schema) {
    return NOOP_INSTANCE;
  }

  // --- Build and return the FormEngineInstance ---
  return {
    values: state.formState.values,
    errors: state.formState.errors as Record<string, string>,
    touched: state.formState.touched as Record<string, boolean>,
    visibleFields,
    submitting: state.submitting,
    setFieldValue,
    touchField,
    setServerErrors,
    handleSubmit,
    steps,
    currentStepId: state.currentStepId,
    goToStep,
    nextStep,
    prevStep,
  };
}
