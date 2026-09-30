import { OfflineStore } from './offlineStore';
import { EncryptionService } from './encryptionService';
import { ConnectivityMonitor } from './connectivityMonitor';
import { SyncManager } from './syncManager';
import { SchemaCache } from './schemaCache';

// ── Singleton instances ───────────────────────────────────────────────────────

export const offlineStore = new OfflineStore();
export const encryptionService = new EncryptionService(offlineStore);
export const connectivityMonitor = new ConnectivityMonitor();
export const syncManager = new SyncManager(offlineStore, encryptionService, connectivityMonitor);
export const schemaCache = new SchemaCache(offlineStore);

// ── Initialization ────────────────────────────────────────────────────────────

let initialized = false;

export async function initializeOfflinePWA(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Start connectivity monitoring
  connectivityMonitor.start();

  // Register background sync (or fallback to online event)
  await syncManager.registerBackgroundSync();
}

// ── React hook (re-exported from context) ────────────────────────────────────
// The actual hook is in OfflinePWAContext.tsx — this file just exports the singletons.

export type OfflinePWAServices = {
  offlineStore: OfflineStore;
  encryptionService: EncryptionService;
  connectivityMonitor: ConnectivityMonitor;
  syncManager: SyncManager;
  schemaCache: SchemaCache;
  isEncryptionAvailable: boolean;
};
