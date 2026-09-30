/**
 * Unit tests for SyncManager
 * Validates: Requirements 4.1, 4.3, 5.2, 5.3, 5.5, 5.6
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncManager } from '../syncManager';
import type { OfflineStore, SyncQueueEntry } from '../offlineStore';
import type { EncryptionService } from '../encryptionService';
import type { ConnectivityMonitor } from '../connectivityMonitor';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: 'entry-1',
    serviceId: 'svc-1',
    consumerId: 'user-1',
    encryptedFormData: new ArrayBuffer(8),
    iv: new Uint8Array(12),
    submittedAt: new Date().toISOString(),
    idempotencyKey: 'idem-key-1',
    retryCount: 0,
    nextRetryAt: Date.now() - 1000,
    status: 'pending',
    schemaVersion: 1,
    ...overrides,
  };
}

function createMocks() {
  const offlineStore = {
    enqueue: vi.fn().mockResolvedValue('entry-1'),
    dequeueNext: vi.fn().mockResolvedValue(null),
    updateQueueEntry: vi.fn().mockResolvedValue(undefined),
    deleteDraft: vi.fn().mockResolvedValue(undefined),
    deleteQueueEntry: vi.fn().mockResolvedValue(undefined),
    getQueueByConsumer: vi.fn().mockResolvedValue([]),
  } as unknown as OfflineStore;

  const encryptionService = {
    encrypt: vi.fn().mockResolvedValue({ ciphertext: new ArrayBuffer(8), iv: new Uint8Array(12) }),
    decrypt: vi.fn().mockResolvedValue({ field: 'value' }),
  } as unknown as EncryptionService;

  const connectivityMonitor = {
    isOnline: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as ConnectivityMonitor;

  return { offlineStore, encryptionService, connectivityMonitor };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SyncManager.calculateBackoffMs', () => {
  // (a) calculateBackoffMs(0) returns ~5000ms
  it('calculateBackoffMs(0) returns approximately 5000ms', () => {
    const result = SyncManager.calculateBackoffMs(0);
    // With ±10% jitter: 4500 to 5500
    expect(result).toBeGreaterThanOrEqual(4500);
    expect(result).toBeLessThanOrEqual(5500);
  });

  // (b) calculateBackoffMs(6) returns ~300000ms (capped)
  it('calculateBackoffMs(6) returns approximately 300000ms (capped)', () => {
    // 5000 * 2^6 = 320000 > 300000, so it should be capped at 300000 ± 10%
    const result = SyncManager.calculateBackoffMs(6);
    expect(result).toBeGreaterThanOrEqual(270_000);
    expect(result).toBeLessThanOrEqual(330_000);
  });

  // (c) calculateBackoffMs(n) is always within ±10% of min(5000 * 2^n, 300000)
  it('calculateBackoffMs(n) is always within ±10% of expected value', () => {
    for (let n = 0; n <= 9; n++) {
      const expected = Math.min(5000 * Math.pow(2, n), 300_000);
      const result = SyncManager.calculateBackoffMs(n);
      expect(result).toBeGreaterThanOrEqual(expected * 0.9);
      expect(result).toBeLessThanOrEqual(expected * 1.1);
    }
  });
});

describe('SyncManager.processQueue', () => {
  let mocks: ReturnType<typeof createMocks>;
  let manager: SyncManager;

  beforeEach(() => {
    mocks = createMocks();
    manager = new SyncManager(
      mocks.offlineStore,
      mocks.encryptionService,
      mocks.connectivityMonitor,
    );
    vi.stubGlobal('fetch', vi.fn());
  });

  // (d) processQueue() processes entries in FIFO order
  it('processes entries in FIFO order (dequeueNext called repeatedly)', async () => {
    const entry1 = makeEntry({ id: 'e1' });
    const entry2 = makeEntry({ id: 'e2' });

    // Return entry1 first, then entry2, then null
    mocks.offlineStore.dequeueNext = vi
      .fn()
      .mockResolvedValueOnce(entry1)
      .mockResolvedValueOnce(entry2)
      .mockResolvedValue(null);

    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));

    await manager.processQueue();

    const calls = vi.mocked(mocks.offlineStore.updateQueueEntry).mock.calls;
    // First call should be for entry1 (in_progress), then completed
    expect(calls[0][0]).toBe('e1');
    expect(calls[1][0]).toBe('e1');
  });

  // (e) on 2xx response: entry marked completed, draft deleted
  it('on 2xx response: marks entry completed and deletes draft', async () => {
    const entry = makeEntry();
    mocks.offlineStore.dequeueNext = vi
      .fn()
      .mockResolvedValueOnce(entry)
      .mockResolvedValue(null);

    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }));

    await manager.processQueue();

    const updateCalls = vi.mocked(mocks.offlineStore.updateQueueEntry).mock.calls;
    const completedCall = updateCalls.find(([, updates]) => updates.status === 'completed');
    expect(completedCall).toBeDefined();
    expect(mocks.offlineStore.deleteDraft).toHaveBeenCalledWith(entry.serviceId, entry.consumerId);
  });

  // (f) on 5xx response: retryCount incremented, nextRetryAt updated
  it('on 5xx response: increments retryCount and updates nextRetryAt', async () => {
    const entry = makeEntry({ retryCount: 0 });
    mocks.offlineStore.dequeueNext = vi
      .fn()
      .mockResolvedValueOnce(entry)
      .mockResolvedValue(null);

    vi.mocked(fetch).mockResolvedValue(new Response('Server Error', { status: 500 }));

    await manager.processQueue();

    const updateCalls = vi.mocked(mocks.offlineStore.updateQueueEntry).mock.calls;
    const retryCall = updateCalls.find(([, updates]) => updates.retryCount === 1);
    expect(retryCall).toBeDefined();
    expect(retryCall![1].nextRetryAt).toBeGreaterThan(Date.now() - 1000);
  });

  // (g) on 10th retry failure: entry marked failed
  it('on 10th retry failure: marks entry as failed', async () => {
    const entry = makeEntry({ retryCount: 9 });
    mocks.offlineStore.dequeueNext = vi
      .fn()
      .mockResolvedValueOnce(entry)
      .mockResolvedValue(null);

    vi.mocked(fetch).mockResolvedValue(new Response('Server Error', { status: 500 }));

    await manager.processQueue();

    const updateCalls = vi.mocked(mocks.offlineStore.updateQueueEntry).mock.calls;
    const failedCall = updateCalls.find(([, updates]) => updates.status === 'failed');
    expect(failedCall).toBeDefined();
  });

  // (h) on 409: loop breaks, CONFLICT event emitted
  it('on 409: breaks loop and emits CONFLICT event', async () => {
    const entry = makeEntry();
    mocks.offlineStore.dequeueNext = vi
      .fn()
      .mockResolvedValueOnce(entry)
      .mockResolvedValue(null);

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ currentVersion: 2, submittedVersion: 1, changes: [] }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const conflictEvents: Event[] = [];
    manager.addEventListener('sync', (e) => conflictEvents.push(e));

    await manager.processQueue();

    expect(conflictEvents.length).toBe(1);
    const detail = (conflictEvents[0] as CustomEvent).detail;
    expect(detail.type).toBe('CONFLICT');
  });

  // (i) concurrent processQueue() calls: second call returns immediately
  it('concurrent processQueue() calls: second call returns immediately without processing', async () => {
    let resolveFirst!: () => void;
    const firstProcessing = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    mocks.offlineStore.dequeueNext = vi.fn().mockImplementation(() => firstProcessing.then(() => null));

    const p1 = manager.processQueue();
    const p2 = manager.processQueue(); // Should return immediately

    resolveFirst();
    await Promise.all([p1, p2]);

    // dequeueNext should only be called once (from the first call)
    expect(mocks.offlineStore.dequeueNext).toHaveBeenCalledTimes(1);
  });
});
