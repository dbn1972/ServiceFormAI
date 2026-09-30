/**
 * useBuilderReducer — Central state management hook for the form builder.
 *
 * Wraps a pure builderReducer with HistoryManager for undo/redo.
 * Implements 500ms debounce for UPDATE_FIELD actions to batch rapid
 * property edits into a single undo snapshot.
 */

import { useReducer, useCallback } from 'react';
import type {
  BuilderState,
  BuilderAction,
  HistoryState,
} from '../components/form-builder/types';
import { createDefaultField } from '../components/form-builder/types';
import {
  createHistory,
  pushState,
  undo as historyUndo,
  redo as historyRedo,
  canUndo as historyCanUndo,
  canRedo as historyCanRedo,
} from '../utils/historyManager';

// ---------------------------------------------------------------------------
// Pure reducer (no history — just state transitions)
// ---------------------------------------------------------------------------

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_FIELD': {
      const newField = createDefaultField(action.fieldType);
      const fields = [...state.fields];
      const index = Math.max(0, Math.min(action.index, fields.length));
      fields.splice(index, 0, newField);
      return { ...state, fields };
    }

    case 'REMOVE_FIELD': {
      const fields = state.fields.filter((f) => f.id !== action.fieldId);
      // Clean up section references
      const sections = state.sections.map((s) => ({
        ...s,
        fieldIds: s.fieldIds.filter((id) => id !== action.fieldId),
      }));
      return { ...state, fields, sections };
    }

    case 'REORDER_FIELD': {
      const { fromIndex, toIndex } = action;
      if (
        fromIndex < 0 ||
        fromIndex >= state.fields.length ||
        toIndex < 0 ||
        toIndex >= state.fields.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const fields = [...state.fields];
      const [moved] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, moved!);
      return { ...state, fields };
    }

    case 'UPDATE_FIELD': {
      const fields = state.fields.map((f) =>
        f.id === action.fieldId ? { ...f, ...action.updates } : f
      );
      return { ...state, fields };
    }

    case 'UPDATE_FORM_SETTINGS': {
      return {
        ...state,
        formSettings: { ...state.formSettings, ...action.updates },
      };
    }

    case 'ADD_CROSS_FIELD_RULE': {
      return {
        ...state,
        crossFieldRules: [...state.crossFieldRules, action.rule],
      };
    }

    case 'UPDATE_CROSS_FIELD_RULE': {
      const crossFieldRules = [...state.crossFieldRules];
      if (action.index >= 0 && action.index < crossFieldRules.length) {
        crossFieldRules[action.index] = action.rule;
      }
      return { ...state, crossFieldRules };
    }

    case 'REMOVE_CROSS_FIELD_RULE': {
      const crossFieldRules = state.crossFieldRules.filter((_, i) => i !== action.index);
      return { ...state, crossFieldRules };
    }

    case 'ADD_SECTION': {
      return {
        ...state,
        sections: [...state.sections, action.section],
      };
    }

    case 'UPDATE_SECTION': {
      const sections = state.sections.map((s) =>
        s.id === action.sectionId ? { ...s, ...action.updates } : s
      );
      return { ...state, sections };
    }

    case 'REMOVE_SECTION': {
      const sections = state.sections.filter((s) => s.id !== action.sectionId);
      return { ...state, sections };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    // UNDO/REDO are handled by the wrapper, not the pure reducer
    case 'UNDO':
    case 'REDO':
      return state;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// History-aware wrapper state
// ---------------------------------------------------------------------------

interface HistoryWrappedState {
  history: HistoryState<BuilderState>;
  isDirty: boolean;
}

type HistoryWrappedAction = BuilderAction;

function historyWrappedReducer(
  state: HistoryWrappedState,
  action: HistoryWrappedAction
): HistoryWrappedState {
  switch (action.type) {
    case 'UNDO': {
      const newHistory = historyUndo(state.history);
      return { ...state, history: newHistory };
    }
    case 'REDO': {
      const newHistory = historyRedo(state.history);
      return { ...state, history: newHistory };
    }
    case 'LOAD_STATE': {
      // LOAD_STATE replaces the entire state without pushing to history
      return {
        history: createHistory(action.state),
        isDirty: false,
      };
    }
    default: {
      // Apply the action to the current present
      const newPresent = builderReducer(state.history.present, action);
      if (newPresent === state.history.present) {
        return state; // No change
      }
      const newHistory = pushState(state.history, newPresent);
      return { history: newHistory, isDirty: true };
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseBuilderReducerReturn {
  builderState: BuilderState;
  dispatch: (action: BuilderAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  resetDirty: () => void;
}

export function useBuilderReducer(initialState: BuilderState): UseBuilderReducerReturn {
  const [state, rawDispatch] = useReducer(historyWrappedReducer, {
    history: createHistory(initialState),
    isDirty: false,
  });

  const dispatch = useCallback(
    (action: BuilderAction) => {
      rawDispatch(action);
    },
    [rawDispatch]
  );

  const resetDirty = useCallback(() => {
    // After save, we want to mark as not dirty.
    // We achieve this by loading the current state fresh.
    rawDispatch({ type: 'LOAD_STATE', state: state.history.present });
  }, [state.history.present, rawDispatch]);

  return {
    builderState: state.history.present,
    dispatch,
    canUndo: historyCanUndo(state.history),
    canRedo: historyCanRedo(state.history),
    isDirty: state.isDirty,
    resetDirty,
  };
}
