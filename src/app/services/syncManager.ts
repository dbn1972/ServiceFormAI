import type { OfflineStore, SyncQueueEntry } from './offlineStore';
import type { EncryptionService } from './encryptionService';
import type { ConnectivityMonitor } from './connectivityMonitor';

// ── UUID v4 helper ────────────────────────────────────────────────────────────

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Event types ───────────────────────────────────────────────────────────────

export interface SubmissionSuccessEvent {
  type: 'SUBMISSION_SUCCESS';
  entryId: string;
  serviceId: string;
  consumerId: string;
}

export interface ConflictEvent {
  type: 'CONFLICT';
  entryId: string;
  serviceId: string;
  consumerId: string;
  conflictData: {
    currentVersion: number;
    submittedVersion: number;
    changes: Array<{ field: string; change: string; label: string; detail?: string }> | null;
  };
}

export interface SubmissionFailedEvent {
  type: 'SUBMISSION_FAILED';
  entryId: string;
  reason: string;
}

export type SyncManagerEvent = SubmissionSuccessEvent | ConflictEvent | SubmissionFailedEvent;

// ── SyncManager class ─────────────────────────────────────────────────────────

export class SyncManager extends EventTarget {
  private _processing = false;

  constructor(
    private offlineStore: OfflineStore,
    private encryptionService: EncryptionService,
    private connectivityMonitor: ConnectivityMonitor,
  ) {
    super();
  }

  /**
   * Calculate exponential backoff with ±10% jitter.
   * Returns milliseconds: min(5000 * 2^retryCount, 300000) ± 10%
   */
  static calculateBackoffMs(retryCount: number): number {
    const base = Math.min(5000 * Math.pow(2, retryCount), 300_000);
    const jitter = base * (0.9 + Math.random() * 0.2);
    return Math.round(jitter);
  }

  /**
   * Add a new submission to the sync queue.
   * Encrypts form data and generates an idempotency key.
   */
  async enqueue(
    serviceId: string,
    consumerId: string,
    formData: unknown,
    schemaVersion: number,
  ): Promise<string> {
    const { ciphertext, iv } = await this.encryptionService.encrypt(consumerId, formData);
    const idempotencyKey = uuidv4();

    const entry: Omit<SyncQueueEntry, 'id'> = {
      serviceId,
      consumerId,
      encryptedFormData: ciphertext,
      iv,
      submittedAt: new Date().toISOString(),
      idempotencyKey,
      retryCount: 0,
      nextRetryAt: Date.now(),
      status: 'pending',
      schemaVersion,
    };

    return this.offlineStore.enqueue(entry);
  }

  /**
   * Process the sync queue. Only one concurrent run is allowed.
   */
  async processQueue(): Promise<void> {
    if (this._processing) return;
    this._processing = true;

    try {
      while (true) {
        const entry = await this.offlineStore.dequeueNext();
        if (!entry) break;

        // Mark as in_progress
        await this.offlineStore.updateQueueEntry(entry.id, { status: 'in_progress' });

        try {
          // Decrypt form data
          const formData = await this.encryptionService.decrypt<Record<string, unknown>>(
            entry.consumerId,
            entry.encryptedFormData,
            entry.iv,
          );

          // POST to backend
          const response = await fetch('/consumer/applications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Key': entry.idempotencyKey,
              'X-Schema-Version': String(entry.schemaVersion),
              'X-Submitted-At': entry.submittedAt,
            },
            body: JSON.stringify({
              serviceId: entry.serviceId,
              consumerId: entry.consumerId,
              formData,
            }),
          });

          if (response.ok) {
            // 2xx — success
            await this.offlineStore.updateQueueEntry(entry.id, { status: 'completed' });
            await this.offlineStore.deleteDraft(entry.serviceId, entry.consumerId);
            this.dispatchEvent(
              new CustomEvent<SubmissionSuccessEvent>('sync', {
                detail: {
                  type: 'SUBMISSION_SUCCESS',
                  entryId: entry.id,
                  serviceId: entry.serviceId,
                  consumerId: entry.consumerId,
                },
              }),
            );
          } else if (response.status === 409) {
            // Conflict — schema version mismatch
            const conflictData = await response.json().catch(() => ({}));
            await this.offlineStore.updateQueueEntry(entry.id, { status: 'pending' });
            this.dispatchEvent(
              new CustomEvent<ConflictEvent>('sync', {
                detail: {
                  type: 'CONFLICT',
                  entryId: entry.id,
                  serviceId: entry.serviceId,
                  consumerId: entry.consumerId,
                  conflictData: {
                    currentVersion: conflictData.currentVersion ?? 0,
                    submittedVersion: conflictData.submittedVersion ?? entry.schemaVersion,
                    changes: conflictData.changes ?? null,
                  },
                },
              }),
            );
            break; // Stop processing on conflict
          } else if (response.status === 429) {
            // Rate limited — read Retry-After header
            const retryAfterHeader = response.headers.get('Retry-After');
            const retryAfterMs = retryAfterHeader
              ? parseInt(retryAfterHeader, 10) * 1000
              : SyncManager.calculateBackoffMs(entry.retryCount);
            await this.offlineStore.updateQueueEntry(entry.id, {
              status: 'pending',
              retryCount: entry.retryCount + 1,
              nextRetryAt: Date.now() + retryAfterMs,
            });
          } else if (response.status >= 500) {
            // Server error — exponential backoff
            const newRetryCount = entry.retryCount + 1;
            if (newRetryCount >= 10) {
              await this.offlineStore.updateQueueEntry(entry.id, {
                status: 'failed',
                retryCount: newRetryCount,
                failureReason: `Server error: HTTP ${response.status}`,
              });
              this.dispatchEvent(
                new CustomEvent<SubmissionFailedEvent>('sync', {
                  detail: {
                    type: 'SUBMISSION_FAILED',
                    entryId: entry.id,
                    reason: `Server error: HTTP ${response.status}`,
                  },
                }),
              );
            } else {
              await this.offlineStore.updateQueueEntry(entry.id, {
                status: 'pending',
                retryCount: newRetryCount,
                nextRetryAt: Date.now() + SyncManager.calculateBackoffMs(entry.retryCount),
              });
            }
          } else {
            // 4xx (non-409, non-429) — permanent failure
            const reason = `HTTP ${response.status}`;
            await this.offlineStore.updateQueueEntry(entry.id, {
              status: 'failed',
              failureReason: reason,
            });
            this.dispatchEvent(
              new CustomEvent<SubmissionFailedEvent>('sync', {
                detail: {
                  type: 'SUBMISSION_FAILED',
                  entryId: entry.id,
                  reason,
                },
              }),
            );
          }
        } catch (networkError) {
          // Network error — treat as 5xx
          const newRetryCount = entry.retryCount + 1;
          if (newRetryCount >= 10) {
            const reason = 'Network error after 10 retries';
            await this.offlineStore.updateQueueEntry(entry.id, {
              status: 'failed',
              retryCount: newRetryCount,
              failureReason: reason,
            });
            this.dispatchEvent(
              new CustomEvent<SubmissionFailedEvent>('sync', {
                detail: {
                  type: 'SUBMISSION_FAILED',
                  entryId: entry.id,
                  reason,
                },
              }),
            );
          } else {
            await this.offlineStore.updateQueueEntry(entry.id, {
              status: 'pending',
              retryCount: newRetryCount,
              nextRetryAt: Date.now() + SyncManager.calculateBackoffMs(entry.retryCount),
            });
          }
        }
      }
    } finally {
      this._processing = false;
    }
  }

  /**
   * Register Background Sync API if available, otherwise fall back to
   * processing the queue when connectivity is restored.
   */
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-queue');

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
            this.processQueue();
          }
        });
      } catch {
        // Background Sync not available — fall back to online event
        this.connectivityMonitor.addEventListener('online', () => this.processQueue());
      }
    } else {
      // Fallback: process queue when connectivity is restored
      this.connectivityMonitor.addEventListener('online', () => this.processQueue());
    }
  }

  /**
   * Reset a failed entry and retry it immediately.
   */
  async retryEntry(entryId: string): Promise<void> {
    await this.offlineStore.updateQueueEntry(entryId, {
      retryCount: 0,
      nextRetryAt: Date.now(),
      status: 'pending',
    });
    await this.processQueue();
  }

  /**
   * Delete a queue entry (for failed entries the user wants to discard).
   */
  async deleteEntry(entryId: string): Promise<void> {
    await this.offlineStore.deleteQueueEntry(entryId);
  }
}
