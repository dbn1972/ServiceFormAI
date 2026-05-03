import { useEffect, useState, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  debounceMs?: number;
  storageKey: string;
  onSave?: (data: any) => Promise<void>;
}

/**
 * Auto-save hook that persists data to localStorage with debouncing
 * Can be extended to save to backend API when available
 *
 * @param data - Data to save
 * @param options - Configuration options
 * @returns Current save status
 */
export function useAutoSave<T>(data: T, options: UseAutoSaveOptions): AutoSaveStatus {
  const { debounceMs = 500, storageKey, onSave } = options;
  const [status, setStatus] = useState<AutoSaveStatus>('idle');

  const saveToStorage = useCallback(async (dataToSave: T) => {
    try {
      setStatus('saving');

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));

      // If backend save function provided, call it
      if (onSave) {
        await onSave(dataToSave);
      }

      setStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');

      // Reset to idle after 3 seconds on error
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [storageKey, onSave]);

  useEffect(() => {
    // Skip if data is null/undefined
    if (!data) return;

    const timer = setTimeout(() => {
      saveToStorage(data);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, debounceMs, saveToStorage]);

  return status;
}

/**
 * Hook to load saved data from localStorage
 *
 * @param storageKey - Key to load from localStorage
 * @returns Saved data or null
 */
export function useLoadSavedData<T>(storageKey: string): T | null {
  const [savedData, setSavedData] = useState<T | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSavedData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [storageKey]);

  return savedData;
}

/**
 * Hook to clear saved data from localStorage
 *
 * @param storageKey - Key to clear
 */
export function useClearSavedData(storageKey: string) {
  return useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);
}
