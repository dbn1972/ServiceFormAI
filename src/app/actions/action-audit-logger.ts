/**
 * Action Audit Logger — client-side audit logger that batches action
 * execution entries and sends them to the backend audit endpoint.
 *
 * Entries never contain the action's `code` property or form field values.
 * If the backend is unavailable, entries are logged to console.warn
 * and not retried.
 */

import type { ActionEvent } from '@serviceformai/validation-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single audit log entry for an action execution. */
export interface ActionAuditEntry {
  actionId: string;
  actionEvent: ActionEvent;
  targetId?: string;
  tenantId: string;
  serviceId: string;
  executionDurationMs: number;
  status: 'success' | 'error' | 'timeout' | 'rate_limited';
  errorCode?: string;
  errorMessage?: string;
  /** Domain only (not full URL) for fetch calls. */
  fetchDomain?: string;
  /** Category for security-relevant events. */
  category?: 'execution' | 'security';
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default batch flush interval in milliseconds. */
const DEFAULT_FLUSH_INTERVAL_MS = 5000;

/** Default maximum batch size before an immediate flush. */
const DEFAULT_MAX_BATCH_SIZE = 20;

/** Backend audit endpoint. */
const AUDIT_ENDPOINT = '/audit/action-executions';

// ---------------------------------------------------------------------------
// ActionAuditLogger
// ---------------------------------------------------------------------------

export interface ActionAuditLoggerConfig {
  /** Flush interval in ms. Defaults to 5000. */
  flushIntervalMs?: number;
  /** Max batch size before immediate flush. Defaults to 20. */
  maxBatchSize?: number;
  /** Override the audit endpoint URL (useful for testing). */
  endpoint?: string;
  /** Optional auth token to include in flush requests. */
  authToken?: string;
}

export class ActionAuditLogger {
  private buffer: ActionAuditEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly endpoint: string;
  private readonly authToken?: string;

  constructor(config?: ActionAuditLoggerConfig) {
    this.flushIntervalMs = config?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.maxBatchSize = config?.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
    this.endpoint = config?.endpoint ?? AUDIT_ENDPOINT;
    this.authToken = config?.authToken;
    this.startFlushTimer();
  }

  /**
   * Log an audit entry. The entry is buffered and sent in the next batch.
   * If the buffer exceeds maxBatchSize, an immediate flush is triggered.
   */
  log(entry: ActionAuditEntry): void {
    // Defensive: ensure no code or field values leak into the entry
    const sanitized: ActionAuditEntry = {
      actionId: entry.actionId,
      actionEvent: entry.actionEvent,
      tenantId: entry.tenantId,
      serviceId: entry.serviceId,
      executionDurationMs: entry.executionDurationMs,
      status: entry.status,
    };

    if (entry.targetId !== undefined) {
      sanitized.targetId = entry.targetId;
    }
    if (entry.errorCode !== undefined) {
      sanitized.errorCode = entry.errorCode;
    }
    if (entry.errorMessage !== undefined) {
      sanitized.errorMessage = entry.errorMessage;
    }
    if (entry.fetchDomain !== undefined) {
      sanitized.fetchDomain = entry.fetchDomain;
    }
    if (entry.category !== undefined) {
      sanitized.category = entry.category;
    }

    this.buffer.push(sanitized);

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  /**
   * Log a security-relevant audit entry.
   * Used for prohibited construct detection, domain allowlist violations,
   * message schema violations, and CSP violations.
   */
  logSecurityEvent(entry: Omit<ActionAuditEntry, 'category'>): void {
    this.log({ ...entry, category: 'security' });
  }

  /**
   * Flush all buffered entries to the backend.
   * If the backend is unavailable, logs to console.warn and discards entries.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0, this.buffer.length);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(entries),
      });

      if (!response.ok) {
        console.warn(
          `[ActionAuditLogger] Backend returned ${response.status}. Entries discarded.`,
          entries,
        );
      }
    } catch {
      console.warn(
        '[ActionAuditLogger] Backend unavailable. Entries logged locally:',
        entries,
      );
    }
  }

  /**
   * Stop the flush timer and flush any remaining entries.
   * Call this when the Action Engine is destroyed.
   */
  async destroy(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
  }

  /** Returns the current number of buffered entries (for testing). */
  get pendingCount(): number {
    return this.buffer.length;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
