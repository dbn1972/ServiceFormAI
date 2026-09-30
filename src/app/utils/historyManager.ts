/**
 * HistoryManager — Pure functions for undo/redo stack management.
 *
 * All functions are pure: they take a HistoryState and return a new one.
 * The past array is capped at 50 entries; oldest entries are discarded
 * on overflow. pushState clears the future array.
 */

import type { HistoryState } from '../components/form-builder/types';

const MAX_HISTORY = 50;

/**
 * Create an initial HistoryState with the given present value.
 */
export function createHistory<T>(present: T): HistoryState<T> {
  return {
    past: [],
    present,
    future: [],
  };
}

/**
 * Push a new state onto the history stack.
 * - Current present moves to past.
 * - New present is set.
 * - Future is cleared (new edits discard redo history).
 * - Past is capped at MAX_HISTORY entries.
 */
export function pushState<T>(history: HistoryState<T>, newPresent: T): HistoryState<T> {
  const newPast = [...history.past, history.present];
  // Cap at MAX_HISTORY — discard oldest entries
  if (newPast.length > MAX_HISTORY) {
    newPast.splice(0, newPast.length - MAX_HISTORY);
  }
  return {
    past: newPast,
    present: newPresent,
    future: [],
  };
}

/**
 * Undo: move present to future, pop past to present.
 * Returns unchanged history if past is empty.
 */
export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) {
    return history;
  }
  const newPast = history.past.slice(0, -1);
  const previousPresent = history.past[history.past.length - 1]!;
  return {
    past: newPast,
    present: previousPresent,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo: move present to past, pop future to present.
 * Returns unchanged history if future is empty.
 */
export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) {
    return history;
  }
  const [nextPresent, ...restFuture] = history.future;
  return {
    past: [...history.past, history.present],
    present: nextPresent!,
    future: restFuture,
  };
}

/**
 * Check if undo is possible.
 */
export function canUndo<T>(history: HistoryState<T>): boolean {
  return history.past.length > 0;
}

/**
 * Check if redo is possible.
 */
export function canRedo<T>(history: HistoryState<T>): boolean {
  return history.future.length > 0;
}
