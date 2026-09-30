/**
 * Unit tests for OfflineStore using fake-indexeddb
 * Validates: Requirements 3.3, 3.4, 4.1, 8.4, 10.6
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { OfflineStore } from '../offlineStore';
import type { SyncQueueEntry } from '../offlineStore';

function createStore(): OfflineStore {
  // Each test gets a fresh IDB instance to avoid state leakage
  (globalThis as any).indexedDB = new IDBFactory();
  return new OfflineStore();
}

function makeQueueEntry(overrides: Partial<Omit<SyncQueueEntry, 'id'>> = {}): Omit<SyncQueueEntry, 'id'> {
  return {
    serviceId: 'svc-1',
    consumerId: 'user-1',
    encryptedFormData: new ArrayBuffer(8),
    iv: new Uint8Array(12),
    submittedAt: new Date().toISOString(),
    idempotencyKey: 'idem-key-1',
    retryCount: 0,
    nextRetryAt: Date.now() - 1000, // in the past so it's immediately eligible
    status: 'pending',
    schemaVersion: 1,
    ...overrides,
  };
}

describe('OfflineStore', () => {
  let store: OfflineStore;

  beforeEach(() => {
    store = createStore();
  });

  // ── Draft operations ──────────────────────────────────────────────────────

  // (a) saveDraft then getDraft returns same entry
  it('saveDraft then getDraft returns the same entry', async () => {
    const encryptedData = new ArrayBuffer(16);
    const iv = new Uint8Array(12).fill(1);

    await store.saveDraft('svc-1', 'user-1', encryptedData, iv, true, 1);
    const draft = await store.getDraft('svc-1', 'user-1');

    expect(draft).not.toBeNull();
    expect(draft!.serviceId).toBe('svc-1');
    expect(draft!.consumerId).toBe('user-1');
    expect(draft!.dirty).toBe(true);
    expect(draft!.schemaVersion).toBe(1);
  });

  // (b) saveDraft for different (serviceId, consumerId) pairs are independent
  it('drafts for different (serviceId, consumerId) pairs are independent', async () => {
    const iv1 = new Uint8Array(12).fill(1);
    const iv2 = new Uint8Array(12).fill(2);
    const data1 = new ArrayBuffer(8);
    const data2 = new ArrayBuffer(16);

    await store.saveDraft('svc-1', 'user-1', data1, iv1, true, 1);
    await store.saveDraft('svc-2', 'user-2', data2, iv2, false, 2);

    const draft1 = await store.getDraft('svc-1', 'user-1');
    const draft2 = await store.getDraft('svc-2', 'user-2');

    expect(draft1!.schemaVersion).toBe(1);
    expect(draft2!.schemaVersion).toBe(2);
    expect(draft1!.dirty).toBe(true);
    expect(draft2!.dirty).toBe(false);
  });

  // ── Sync queue operations ─────────────────────────────────────────────────

  // (c) enqueue then dequeueNext returns entry in FIFO order
  it('enqueue then dequeueNext returns entry in FIFO order', async () => {
    const now = Date.now();
    const entry1 = makeQueueEntry({ nextRetryAt: now - 2000, submittedAt: new Date(now - 2000).toISOString() });
    const entry2 = makeQueueEntry({ nextRetryAt: now - 1000, submittedAt: new Date(now - 1000).toISOString() });

    const id1 = await store.enqueue(entry1);
    const id2 = await store.enqueue(entry2);

    const first = await store.dequeueNext();
    expect(first).not.toBeNull();
    // Should return the one with the lowest nextRetryAt (oldest)
    expect(first!.id).toBe(id1);
    expect(first!.id).not.toBe(id2);
  });

  // (d) dequeueNext returns null when queue is empty
  it('dequeueNext returns null when queue is empty', async () => {
    const result = await store.dequeueNext();
    expect(result).toBeNull();
  });

  // (e) dequeueNext skips entries with nextRetryAt in the future
  it('dequeueNext skips entries with nextRetryAt in the future', async () => {
    const futureEntry = makeQueueEntry({ nextRetryAt: Date.now() + 60_000 });
    await store.enqueue(futureEntry);

    const result = await store.dequeueNext();
    expect(result).toBeNull();
  });

  // ── Schema cache operations ───────────────────────────────────────────────

  // (f) cacheSchema then getCachedSchema returns same schema
  it('cacheSchema then getCachedSchema returns the same schema', async () => {
    const schema = { fields: [{ id: 'name', type: 'text' }] };
    await store.cacheSchema('svc-1', schema, 3);

    const cached = await store.getCachedSchema('svc-1');
    expect(cached).not.toBeNull();
    expect(cached!.serviceId).toBe('svc-1');
    expect(cached!.schemaVersion).toBe(3);
    expect(cached!.schema).toEqual(schema);
  });

  // ── Clear all ─────────────────────────────────────────────────────────────

  // (g) clearAll removes all entries from all stores
  it('clearAll removes all entries from all stores', async () => {
    // Add data to all stores
    await store.saveDraft('svc-1', 'user-1', new ArrayBuffer(8), new Uint8Array(12), true, 1);
    await store.enqueue(makeQueueEntry());
    await store.cacheSchema('svc-1', { fields: [] }, 1);

    // Clear all
    await store.clearAll();

    // Verify all stores are empty
    const draft = await store.getDraft('svc-1', 'user-1');
    const queueEntry = await store.dequeueNext();
    const schema = await store.getCachedSchema('svc-1');

    expect(draft).toBeNull();
    expect(queueEntry).toBeNull();
    expect(schema).toBeNull();
  });
});
