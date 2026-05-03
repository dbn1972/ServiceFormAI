/**
 * Undo/Redo hook for managing state history
 * Useful for form wizards, editors, and any stateful component
 */

import { useState, useCallback } from 'react';

interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistorySize = 50 } = options;

  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  // Set new state and clear future
  const set = useCallback((newPresent: T | ((prev: T) => T)) => {
    setState((currentState: UndoRedoState<T>) => {
      const actualNewPresent = typeof newPresent === 'function'
        ? (newPresent as (prev: T) => T)(currentState.present)
        : newPresent;

      // Don't update if the value hasn't changed
      if (actualNewPresent === currentState.present) {
        return currentState;
      }

      const newPast = [...currentState.past, currentState.present];

      // Limit history size
      if (newPast.length > maxHistorySize) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: actualNewPresent,
        future: [],
      };
    });
  }, [maxHistorySize]);

  // Undo
  const undo = useCallback(() => {
    setState((currentState: UndoRedoState<T>) => {
      if (currentState.past.length === 0) {
        return currentState;
      }

      const newPast = [...currentState.past];
      const newPresent = newPast.pop()!;
      const newFuture = [currentState.present, ...currentState.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState((currentState: UndoRedoState<T>) => {
      if (currentState.future.length === 0) {
        return currentState;
      }

      const newFuture = [...currentState.future];
      const newPresent = newFuture.shift()!;
      const newPast = [...currentState.past, currentState.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  // Reset history
  const reset = useCallback((newPresent?: T) => {
    setState({
      past: [],
      present: newPresent ?? initialState,
      future: [],
    });
  }, [initialState]);

  // Jump to specific history index
  const jump = useCallback((index: number) => {
    setState((currentState: UndoRedoState<T>) => {
      const allStates = [...currentState.past, currentState.present, ...currentState.future];

      if (index < 0 || index >= allStates.length) {
        return currentState;
      }

      return {
        past: allStates.slice(0, index) as T[],
        present: allStates[index] as T,
        future: allStates.slice(index + 1) as T[],
      };
    });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    jump,
    history: {
      past: state.past,
      future: state.future,
    },
  };
}

/**
 * Keyboard shortcuts for undo/redo
 * Call this in components that use useUndoRedo
 */
export function useUndoRedoShortcuts(
  undo: () => void,
  redo: () => void,
  enabled = true
) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl + Z = Undo
    if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    }

    // Cmd/Ctrl + Shift + Z = Redo (or Cmd/Ctrl + Y on Windows)
    if ((cmdOrCtrl && event.key === 'z' && event.shiftKey) || (cmdOrCtrl && event.key === 'y')) {
      event.preventDefault();
      redo();
    }
  }, [enabled, isMac, undo, redo]);

  // Attach event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
  return undefined;
}
