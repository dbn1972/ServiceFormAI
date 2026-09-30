import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  offlineStore,
  encryptionService,
  connectivityMonitor,
  syncManager,
  schemaCache,
  initializeOfflinePWA,
  type OfflinePWAServices,
} from '../services/offlinePWA';
import { EncryptionService } from '../services/encryptionService';

// ── Context ───────────────────────────────────────────────────────────────────

const OfflinePWAContext = createContext<OfflinePWAServices | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface OfflinePWAProviderProps {
  children: ReactNode;
}

export function OfflinePWAProvider({ children }: OfflinePWAProviderProps) {
  const isEncryptionAvailable = EncryptionService.isAvailable();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeOfflinePWA().then(() => setInitialized(true));
  }, []);

  const value: OfflinePWAServices = {
    offlineStore,
    encryptionService,
    connectivityMonitor,
    syncManager,
    schemaCache,
    isEncryptionAvailable,
  };

  return (
    <OfflinePWAContext.Provider value={value}>
      {!isEncryptionAvailable && (
        <div
          role="alert"
          className="fixed bottom-0 left-0 right-0 z-40 bg-destructive/10 border-t border-destructive/30 text-destructive text-sm text-center py-2 px-4"
        >
          Offline form saving is unavailable on your browser. Please use a modern browser over HTTPS.
        </div>
      )}
      {initialized && children}
      {!initialized && children}
    </OfflinePWAContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflinePWA(): OfflinePWAServices {
  const ctx = useContext(OfflinePWAContext);
  if (!ctx) {
    throw new Error('useOfflinePWA must be used within an OfflinePWAProvider');
  }
  return ctx;
}
