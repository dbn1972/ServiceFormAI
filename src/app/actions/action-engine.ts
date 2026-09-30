/**
 * Action Engine — orchestrates the lifecycle of custom form actions.
 *
 * Parses action definitions from a FormSchema, dispatches form events
 * to the Sandbox Worker, applies sandbox responses back to the form
 * state via callbacks, and enforces rate limiting and sequential execution.
 */

import type {
  ActionDefinition,
  ActionEvent,
} from '@serviceformai/validation-engine';
import type {
  SandboxRequest,
  SandboxResponse,
  SandboxApiCall,
} from './sandbox-types';
import type { ActionAuditEntry } from './action-audit-logger';
import { createSandboxWorker } from './sandbox-worker';
import { RateLimiter } from './rate-limiter';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ActionEngineConfig {
  tenantId: string;
  serviceId: string;
  fetchAllowlist: string[];
  onFieldUpdate: (fieldId: string, value: unknown) => void;
  onFieldVisibility: (fieldId: string, visible: boolean) => void;
  onShowMessage: (
    text: string,
    type: 'info' | 'warning' | 'error' | 'success',
  ) => void;
  onAuditLog?: (entry: ActionAuditEntry) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Key for grouping actions by event + target. */
function actionKey(event: ActionEvent, targetId?: string): string {
  return targetId ? `${event}::${targetId}` : event;
}

/** HTML-entity-encode dangerous characters to prevent XSS. */
function sanitizeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Recursively sanitize all string values in a value tree. */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(v);
    }
    return result;
  }
  return value;
}

/** Validate that a message from the Worker conforms to SandboxResponse. */
function isValidSandboxResponse(msg: unknown): msg is SandboxResponse {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  if (m.type !== 'result') return false;
  if (typeof m.requestId !== 'string') return false;
  if (
    m.status !== 'success' &&
    m.status !== 'error' &&
    m.status !== 'timeout'
  )
    return false;
  if (!Array.isArray(m.apiCalls)) return false;
  if (typeof m.executionDurationMs !== 'number') return false;
  return true;
}

/** Generate a unique request ID. */
let requestCounter = 0;
function generateRequestId(): string {
  return `req-${Date.now()}-${++requestCounter}`;
}

// ---------------------------------------------------------------------------
// ActionEngine
// ---------------------------------------------------------------------------

export class ActionEngine {
  private readonly actions: ActionDefinition[];
  private readonly config: ActionEngineConfig;
  private readonly rateLimiter = new RateLimiter();

  /** Actions grouped by event+target key. */
  private actionMap = new Map<string, ActionDefinition[]>();

  /** Per-field sequential execution queues. */
  private fieldQueues = new Map<string, Promise<void>>();

  /** Pending response callbacks keyed by requestId. */
  private pendingRequests = new Map<
    string,
    {
      resolve: (response: SandboxResponse) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  private worker: Worker | null = null;
  private workerCrashCount = 0;
  private disabled = false;
  private destroyed = false;

  constructor(actions: ActionDefinition[], config: ActionEngineConfig) {
    this.actions = actions;
    this.config = config;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /** Parse action definitions, group by event+target, create the Worker. */
  init(): void {
    // Group enabled actions by event+target
    this.actionMap.clear();
    for (const action of this.actions) {
      if (action.enabled === false) continue;
      const key = actionKey(action.event, action.targetId);
      const group = this.actionMap.get(key);
      if (group) {
        group.push(action);
      } else {
        this.actionMap.set(key, [action]);
      }
    }

    this.startWorker();
  }

  /** Terminate the Worker and release resources. */
  destroy(): void {
    this.destroyed = true;
    this.terminateWorker();
    this.rateLimiter.reset();
    this.fieldQueues.clear();
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
    }
    this.pendingRequests.clear();
  }

  // ── Dispatch ──────────────────────────────────────────────────────────

  /**
   * Dispatch a form event. Returns a promise that resolves when all
   * matching actions have completed (or been rate-limited/skipped).
   *
   * For `onFormSubmit`, returns `false` if any action called
   * `showMessage` with type `error` (submission should be blocked).
   */
  async dispatch(
    event: ActionEvent,
    args: Record<string, unknown>,
  ): Promise<boolean> {
    if (this.disabled || this.destroyed) return true;

    const key = actionKey(event, args.fieldId as string | undefined);
    const actions = this.actionMap.get(key);
    if (!actions || actions.length === 0) return true;

    const fieldId = (args.fieldId as string) ?? event;
    let hasError = false;

    // Queue execution sequentially per field
    const execute = async (): Promise<void> => {
      for (const action of actions) {
        if (this.disabled || this.destroyed) break;

        // Rate limit check (use targetId or event as the key)
        const rateLimitKey = action.targetId ?? action.event;
        if (!this.rateLimiter.allow(rateLimitKey)) {
          this.logAudit(action, 0, 'rate_limited', 'ACTION_RATE_LIMITED');
          continue;
        }

        const result = await this.executeAction(action, args);
        if (result) {
          const blocked = this.applyResponse(action, result);
          if (blocked) hasError = true;
          this.logAudit(
            action,
            result.executionDurationMs,
            result.status,
            result.error?.code,
            result.error?.message,
          );
        }
      }
    };

    // Chain onto the field's queue for sequential execution
    const prev = this.fieldQueues.get(fieldId) ?? Promise.resolve();
    const next = prev.then(execute);
    this.fieldQueues.set(fieldId, next);

    await next;

    // For onFormSubmit: return false if any error message was shown
    if (event === 'onFormSubmit' && hasError) return false;
    return true;
  }

  // ── Worker Management ─────────────────────────────────────────────────

  private startWorker(): void {
    if (this.destroyed) return;

    try {
      this.worker = createSandboxWorker();
      this.worker.onmessage = (e: MessageEvent) => this.handleMessage(e.data);
      this.worker.onerror = () => this.handleWorkerCrash();
    } catch {
      this.disabled = true;
    }
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
  }

  private handleWorkerCrash(): void {
    this.terminateWorker();

    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.resolve({
        type: 'result',
        requestId,
        status: 'error',
        apiCalls: [],
        error: { code: 'WORKER_CRASH', message: 'Sandbox Worker crashed' },
        executionDurationMs: 0,
      });
    }
    this.pendingRequests.clear();

    this.workerCrashCount++;
    if (this.workerCrashCount <= 1) {
      // Attempt one restart
      this.startWorker();
    } else {
      // Restart failed — disable actions
      this.disabled = true;
    }
  }

  // ── Execution ─────────────────────────────────────────────────────────

  private executeAction(
    action: ActionDefinition,
    args: Record<string, unknown>,
  ): Promise<SandboxResponse | null> {
    if (!this.worker) return Promise.resolve(null);

    const requestId = generateRequestId();

    const request: SandboxRequest = {
      type: 'execute',
      requestId,
      code: action.code,
      event: action.event,
      args: {
        fieldId: args.fieldId as string | undefined,
        value: args.value,
        previousValue: args.previousValue,
        buttonId: args.buttonId as string | undefined,
      },
      formValues: (args.formValues as Record<string, unknown>) ?? {},
      allowlist: this.config.fetchAllowlist,
    };

    return new Promise<SandboxResponse | null>((resolve) => {
      // Safety timeout: if the Worker doesn't respond within 5s, give up
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve({
          type: 'result',
          requestId,
          status: 'timeout',
          apiCalls: [],
          error: {
            code: 'ACTION_TIMEOUT',
            message: 'Action execution timed out',
          },
          executionDurationMs: 5000,
        });
      }, 5000);

      this.pendingRequests.set(requestId, { resolve, timer });
      this.worker!.postMessage(request);
    });
  }

  // ── Message Handling ──────────────────────────────────────────────────

  private handleMessage(data: unknown): void {
    // Validate response schema
    if (!isValidSandboxResponse(data)) {
      console.warn(
        '[ActionEngine] Security warning: received non-conforming message from Worker. Discarding.',
        data,
      );
      // Log security audit event for message schema violation
      if (this.config.onAuditLog) {
        this.config.onAuditLog({
          actionId: 'unknown',
          actionEvent: 'onFormLoad',
          tenantId: this.config.tenantId,
          serviceId: this.config.serviceId,
          executionDurationMs: 0,
          status: 'error',
          errorCode: 'MESSAGE_SCHEMA_VIOLATION',
          errorMessage: 'Received non-conforming message from Sandbox Worker',
          category: 'security',
        });
      }
      return;
    }

    const pending = this.pendingRequests.get(data.requestId);
    if (!pending) return; // Stale or unknown request

    clearTimeout(pending.timer);
    this.pendingRequests.delete(data.requestId);
    pending.resolve(data);
  }

  // ── Response Application ──────────────────────────────────────────────

  /**
   * Apply the sandbox response's API calls via the configured callbacks.
   * Returns `true` if any showMessage call had type `error`.
   */
  private applyResponse(
    _action: ActionDefinition,
    response: SandboxResponse,
  ): boolean {
    let hasError = false;

    for (const call of response.apiCalls) {
      if (!isValidApiCall(call)) continue;

      switch (call.fn) {
        case 'setFieldValue': {
          const sanitizedValue = sanitizeValue(call.args.value);
          this.config.onFieldUpdate(call.args.fieldId, sanitizedValue);
          break;
        }
        case 'showField': {
          this.config.onFieldVisibility(call.args.fieldId, true);
          break;
        }
        case 'hideField': {
          this.config.onFieldVisibility(call.args.fieldId, false);
          break;
        }
        case 'showMessage': {
          const sanitizedText = sanitizeHtml(call.args.text);
          this.config.onShowMessage(sanitizedText, call.args.type);
          if (call.args.type === 'error') hasError = true;
          break;
        }
      }
    }

    return hasError;
  }

  // ── Audit Logging ─────────────────────────────────────────────────────

  private logAudit(
    action: ActionDefinition,
    executionDurationMs: number,
    status: 'success' | 'error' | 'timeout' | 'rate_limited',
    errorCode?: string,
    errorMessage?: string,
  ): void {
    if (!this.config.onAuditLog) return;

    // Security-relevant error codes that should be logged with security category
    const securityErrorCodes = new Set([
      'ACTION_PROHIBITED_CONSTRUCT',
      'DOMAIN_NOT_ALLOWLISTED',
      'NO_ALLOWLIST_CONFIGURED',
      'REDIRECT_NOT_ALLOWLISTED',
      'HTTPS_REQUIRED',
      'MESSAGE_SCHEMA_VIOLATION',
      'WORKER_CRASH',
    ]);

    const entry: ActionAuditEntry = {
      actionId: action.id,
      actionEvent: action.event,
      targetId: action.targetId,
      tenantId: this.config.tenantId,
      serviceId: this.config.serviceId,
      executionDurationMs,
      status,
    };

    if (errorCode) {
      entry.errorCode = errorCode;
      if (securityErrorCodes.has(errorCode)) {
        entry.category = 'security';
      }
    }
    if (errorMessage) entry.errorMessage = errorMessage;

    this.config.onAuditLog(entry);
  }
}

// ---------------------------------------------------------------------------
// API Call Validation
// ---------------------------------------------------------------------------

function isValidApiCall(call: unknown): call is SandboxApiCall {
  if (typeof call !== 'object' || call === null) return false;
  const c = call as Record<string, unknown>;
  const validFns = ['setFieldValue', 'showField', 'hideField', 'showMessage'];
  if (typeof c.fn !== 'string' || !validFns.includes(c.fn)) return false;
  if (typeof c.args !== 'object' || c.args === null) return false;

  const args = c.args as Record<string, unknown>;

  switch (c.fn) {
    case 'setFieldValue':
      return typeof args.fieldId === 'string';
    case 'showField':
    case 'hideField':
      return typeof args.fieldId === 'string';
    case 'showMessage':
      return (
        typeof args.text === 'string' &&
        typeof args.type === 'string' &&
        ['info', 'warning', 'error', 'success'].includes(args.type)
      );
    default:
      return false;
  }
}
