import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface DraftEntry {
  id: string; // `${serviceId}:${consumerId}`
  serviceId: string;
  consumerId: string;
  encryptedData: ArrayBuffer; // AES-GCM encrypted JSON
  iv: Uint8Array;
  dirty: boolean;
  lastSavedAt: number; // Unix ms
  schemaVersion: number;
}

export interface SyncQueueEntry {
  id: string; // UUID
  serviceId: string;
  consumerId: string;
  encryptedFormData: ArrayBuffer; // AES-GCM encrypted JSON
  iv: Uint8Array;
  submittedAt: string; // ISO 8601 original timestamp
  idempotencyKey: string; // UUID v4
  retryCount: number;
  nextRetryAt: number; // Unix ms
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  failureReason?: string;
  schemaVersion: number;
}

export interface CachedSchema {
  serviceId: string;
  schema: object; // Plaintext — schemas are not PII
  schemaVersion: number;
  cachedAt: number; // Unix ms
}

export interface EncryptionKeyEntry {
  consumerId: string;
  cryptoKey: CryptoKey; // non-exportable AES-GCM key
}

// ── Typed error ──────────────────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  constructor(message = 'IndexedDB quota exceeded') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

// ── Schema ───────────────────────────────────────────────────────────────────

interface OfflineStoreSchema extends DBSchema {
  drafts: {
    key: string;
    value: DraftEntry;
    indexes: { 'by-consumer': string; 'by-service': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueEntry;
    indexes: { 'by-status': string; 'by-consumer': string; 'by-next-retry': number };
  };
  schemas: {
    key: string;
    value: CachedSchema;
    indexes: { 'by-cached-at': number };
  };
  encryption_keys: {
    key: string;
    value: EncryptionKeyEntry;
  };
}

// ── UUID v4 helper ────────────────────────────────────────────────────────────

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── OfflineStore class ────────────────────────────────────────────────────────

export class OfflineStore {
  private db: IDBPDatabase<OfflineStoreSchema> | null = null;

  async open(): Promise<IDBPDatabase<OfflineStoreSchema>> {
    if (this.db) return this.db;
    this.db = await openDB<OfflineStoreSchema>('offline-store', 1, {
      upgrade(db) {
        // drafts store
        const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
        draftsStore.createIndex('by-consumer', 'consumerId');
        draftsStore.createIndex('by-service', 'serviceId');

        // sync_queue store
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('by-status', 'status');
        queueStore.createIndex('by-consumer', 'consumerId');
        queueStore.createIndex('by-next-retry', 'nextRetryAt');

        // schemas store
        const schemasStore = db.createObjectStore('schemas', { keyPath: 'serviceId' });
        schemasStore.createIndex('by-cached-at', 'cachedAt');

        // encryption_keys store
        db.createObjectStore('encryption_keys', { keyPath: 'consumerId' });
      },
    });
    return this.db;
  }

  // ── Draft operations ────────────────────────────────────────────────────────

  async saveDraft(
    serviceId: string,
    consumerId: string,
    encryptedData: ArrayBuffer,
    iv: Uint8Array,
    dirty: boolean,
    schemaVersion: number,
  ): Promise<void> {
    try {
      const db = await this.open();
      const entry: DraftEntry = {
        id: `${serviceId}:${consumerId}`,
        serviceId,
        consumerId,
        encryptedData,
        iv,
        dirty,
        lastSavedAt: Date.now(),
        schemaVersion,
      };
      await db.put('drafts', entry);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async getDraft(serviceId: string, consumerId: string): Promise<DraftEntry | null> {
    try {
      const db = await this.open();
      const entry = await db.get('drafts', `${serviceId}:${consumerId}`);
      return entry ?? null;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async deleteDraft(serviceId: string, consumerId: string): Promise<void> {
    try {
      const db = await this.open();
      await db.delete('drafts', `${serviceId}:${consumerId}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  // ── Sync queue operations ───────────────────────────────────────────────────

  async enqueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<string> {
    try {
      const db = await this.open();
      const id = uuidv4();
      await db.put('sync_queue', { ...entry, id });
      return id;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async dequeueNext(): Promise<SyncQueueEntry | null> {
    try {
      const db = await this.open();
      const now = Date.now();
      // Use by-next-retry index to find oldest pending entry with nextRetryAt <= now
      const tx = db.transaction('sync_queue', 'readonly');
      const index = tx.store.index('by-next-retry');
      // Iterate from the beginning (lowest nextRetryAt) up to now
      let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
      while (cursor) {
        if (cursor.value.status === 'pending') {
          return cursor.value;
        }
        cursor = await cursor.continue();
      }
      return null;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async updateQueueEntry(id: string, updates: Partial<SyncQueueEntry>): Promise<void> {
    try {
      const db = await this.open();
      const existing = await db.get('sync_queue', id);
      if (!existing) return;
      await db.put('sync_queue', { ...existing, ...updates, id });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async getQueueByConsumer(consumerId: string): Promise<SyncQueueEntry[]> {
    try {
      const db = await this.open();
      return db.getAllFromIndex('sync_queue', 'by-consumer', consumerId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async deleteQueueEntry(id: string): Promise<void> {
    try {
      const db = await this.open();
      await db.delete('sync_queue', id);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  // ── Schema cache operations ─────────────────────────────────────────────────

  async cacheSchema(serviceId: string, schema: object, version: number): Promise<void> {
    try {
      const db = await this.open();
      const entry: CachedSchema = {
        serviceId,
        schema,
        schemaVersion: version,
        cachedAt: Date.now(),
      };
      await db.put('schemas', entry);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async getCachedSchema(serviceId: string): Promise<CachedSchema | null> {
    try {
      const db = await this.open();
      const entry = await db.get('schemas', serviceId);
      return entry ?? null;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  // ── Encryption key operations ───────────────────────────────────────────────

  async getEncryptionKey(consumerId: string): Promise<CryptoKey | null> {
    try {
      const db = await this.open();
      const entry = await db.get('encryption_keys', consumerId);
      return entry?.cryptoKey ?? null;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async saveEncryptionKey(consumerId: string, cryptoKey: CryptoKey): Promise<void> {
    try {
      const db = await this.open();
      await db.put('encryption_keys', { consumerId, cryptoKey });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  async deleteEncryptionKey(consumerId: string): Promise<void> {
    try {
      const db = await this.open();
      await db.delete('encryption_keys', consumerId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  // ── Clear all ───────────────────────────────────────────────────────────────

  async clearAll(): Promise<void> {
    try {
      const db = await this.open();
      const tx = db.transaction(['drafts', 'sync_queue', 'schemas', 'encryption_keys'], 'readwrite');
      await Promise.all([
        tx.objectStore('drafts').clear(),
        tx.objectStore('sync_queue').clear(),
        tx.objectStore('schemas').clear(),
        tx.objectStore('encryption_keys').clear(),
      ]);
      await tx.done;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }
}
