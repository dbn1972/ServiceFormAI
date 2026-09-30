/**
 * BuilderContext — React context for the Visual Form Builder.
 *
 * Provides the BuilderState, dispatch function, undo/redo status,
 * dirty flag, and selected field tracking to all child components.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BuilderState, BuilderAction } from './types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface BuilderContextValue {
  builderState: BuilderState;
  dispatch: (action: BuilderAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface BuilderProviderProps {
  children: ReactNode;
  builderState: BuilderState;
  dispatch: (action: BuilderAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
}

export function BuilderProvider({
  children,
  builderState,
  dispatch,
  canUndo,
  canRedo,
  isDirty,
}: BuilderProviderProps) {
  const [selectedFieldId, setSelectedFieldIdRaw] = useState<string | null>(null);

  const setSelectedFieldId = useCallback((id: string | null) => {
    setSelectedFieldIdRaw(id);
  }, []);

  return (
    <BuilderContext.Provider
      value={{
        builderState,
        dispatch,
        canUndo,
        canRedo,
        isDirty,
        selectedFieldId,
        setSelectedFieldId,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBuilderContext(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) {
    throw new Error('useBuilderContext must be used within a BuilderProvider');
  }
  return ctx;
}

export default BuilderContext;
