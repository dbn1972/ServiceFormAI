/**
 * AutoSaveManager — localStorage-based auto-save for the form builder.
 *
 * Keyed by `form-builder:${tenantId}:${serviceId}`.
 * Stores { state: BuilderState, timestamp: number } as JSON.
 * Returns false if localStorage write fails (quota exceeded).
 */

import type { BuilderState } from '../components/form-builder/types';

const KEY_PREFIX = 'form-builder';

function makeKey(tenantId: string, serviceId: string): string {
  return `${KEY_PREFIX}:${tenantId}:${serviceId}`;
}

export interface AutoSavedData {
  state: BuilderState;
  timestamp: number;
}

/**
 * Save BuilderState to localStorage.
 * Returns true on success, false on failure (e.g., quota exceeded).
 */
export function autoSaveSave(
  tenantId: string,
  serviceId: string,
  state: BuilderState
): boolean {
  try {
    const data: AutoSavedData = {
      state,
      timestamp: Date.now(),
    };
    localStorage.setItem(makeKey(tenantId, serviceId), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load auto-saved BuilderState from localStorage.
 * Returns null if no data found or data is corrupt.
 */
export function autoSaveLoad(
  tenantId: string,
  serviceId: string
): AutoSavedData | null {
  try {
    const raw = localStorage.getItem(makeKey(tenantId, serviceId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.state || typeof data.timestamp !== 'number') return null;
    return data as AutoSavedData;
  } catch {
    return null;
  }
}

/**
 * Clear auto-saved state from localStorage.
 */
export function autoSaveClear(tenantId: string, serviceId: string): void {
  try {
    localStorage.removeItem(makeKey(tenantId, serviceId));
  } catch {
    // Ignore errors
  }
}

/**
 * Get the timestamp of the last auto-save.
 * Returns null if no data found.
 */
export function autoSaveGetLastSaveTime(
  tenantId: string,
  serviceId: string
): number | null {
  try {
    const raw = localStorage.getItem(makeKey(tenantId, serviceId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return typeof data?.timestamp === 'number' ? data.timestamp : null;
  } catch {
    return null;
  }
}

/**
 * Convenience object matching the AutoSaveManager interface from the design.
 */
export const autoSaveManager = {
  save: autoSaveSave,
  load: autoSaveLoad,
  clear: autoSaveClear,
  getLastSaveTime: autoSaveGetLastSaveTime,
};
