import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ActionDefinition } from '@serviceformai/validation-engine';
import type { SandboxResponse } from './sandbox-types';
import { ActionEngine, type ActionEngineConfig } from './action-engine';

// ---------------------------------------------------------------------------
// Mock the sandbox-worker module
// ---------------------------------------------------------------------------

let mockWorkerInstance: {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: (() => void) | null;
};

vi.mock('./sandbox-worker', () => ({
  createSandboxWorker: vi.fn(() => {
    mockWorkerInstance = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    return mockWorkerInstance;
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAction(overrides?: Partial<ActionDefinition>): ActionDefinition {
  return {
    id: 'action-1',
    event: 'onFieldChange',
    targetId: 'field-1',
    code: 'setFieldValue("field-2", getFieldValue("field-1") + 1)',
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<ActionEngineConfig>): ActionEngineConfig {
  return {
    tenantId: 'tenant-1',
    serviceId: 'service-1',
    fetchAllowlist: ['api.example.gov.in'],
    onFieldUpdate: vi.fn(),
    onFieldVisibility: vi.fn(),
    onShowMessage: vi.fn(),
    onAuditLog: vi.fn(),
    ...overrides,
  };
}

/** Flush microtasks so that promise chains settle. */
async function tick(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

/**
 * Simulate the Worker responding to the most recent postMessage call.
 * Captures the requestId from the posted message and triggers onmessage.
 */
function simulateWorkerResponse(
  apiCalls: SandboxResponse['apiCalls'] = [],
  status: SandboxResponse['status'] = 'success',
  error?: SandboxResponse['error'],
): void {
  const calls = mockWorkerInstance.postMessage.mock.calls;
  const lastCall = calls[calls.length - 1];
  const requestId = lastCall[0].requestId as string;

  const response: SandboxResponse = {
    type: 'result',
    requestId,
    status,
    apiCalls,
    executionDurationMs: 10,
    ...(error ? { error } : {}),
  };

  mockWorkerInstance.onmessage?.({ data: response } as MessageEvent);
}

/**
 * Helper: dispatch an event and wait for the worker to receive the message,
 * then simulate a response. Returns the dispatch promise.
 */
async function dispatchAndRespond(
  engine: ActionEngine,
  event: Parameters<ActionEngine['dispatch']>[0],
  args: Parameters<ActionEngine['dispatch']>[1],
  apiCalls: SandboxResponse['apiCalls'] = [],
  status: SandboxResponse['status'] = 'success',
  error?: SandboxResponse['error'],
): Promise<boolean> {
  const promise = engine.dispatch(event, args);
  await tick(); // let the promise chain start and postMessage to be called
  simulateWorkerResponse(apiCalls, status, error);
  await tick(); // let the response be processed
  return promise;
}

describe('ActionEngine', () => {
  let engine: ActionEngine;
  let config: ActionEngineConfig;

  beforeEach(() => {
    vi.useFakeTimers();
    config = makeConfig();
  });

  afterEach(() => {
    engine?.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Initialization ────────────────────────────────────────────────────

  describe('init()', () => {
    it('creates a sandbox worker on init', () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      expect(mockWorkerInstance).toBeDefined();
      expect(mockWorkerInstance.onmessage).toBeTypeOf('function');
    });

    it('skips disabled actions', async () => {
      const disabledAction = makeAction({ enabled: false });
      engine = new ActionEngine([disabledAction], config);
      engine.init();

      const result = await engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      expect(mockWorkerInstance.postMessage).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('groups actions by event+target', async () => {
      const action1 = makeAction({ id: 'a1', event: 'onFieldChange', targetId: 'field-1' });
      const action2 = makeAction({ id: 'a2', event: 'onFieldChange', targetId: 'field-1' });
      const action3 = makeAction({ id: 'a3', event: 'onFieldBlur', targetId: 'field-1' });

      engine = new ActionEngine([action1, action2, action3], config);
      engine.init();

      // Dispatch onFieldChange for field-1 — should trigger 2 actions sequentially
      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      // Let the first action be posted
      await tick();
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);
      simulateWorkerResponse();

      // Let the second action be posted
      await tick();
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(2);
      simulateWorkerResponse();

      await promise;
    });
  });

  // ── Dispatch ──────────────────────────────────────────────────────────

  describe('dispatch()', () => {
    it('sends a SandboxRequest to the Worker', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 42,
        previousValue: 41,
        formValues: { 'field-1': 42 },
      });

      await tick();

      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);
      const request = mockWorkerInstance.postMessage.mock.calls[0][0];
      expect(request.type).toBe('execute');
      expect(request.event).toBe('onFieldChange');
      expect(request.args.fieldId).toBe('field-1');
      expect(request.args.value).toBe(42);
      expect(request.args.previousValue).toBe(41);
      expect(request.formValues).toEqual({ 'field-1': 42 });
      expect(request.allowlist).toEqual(['api.example.gov.in']);

      simulateWorkerResponse();
      await promise;
    });

    it('returns true when no actions match the event', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const result = await engine.dispatch('onFormLoad', {});
      expect(result).toBe(true);
      expect(mockWorkerInstance.postMessage).not.toHaveBeenCalled();
    });

    it('returns true when engine is disabled', async () => {
      engine = new ActionEngine([makeAction()], config);
      // Don't init — engine has no worker
      const result = await engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });
      expect(result).toBe(true);
    });
  });

  // ── Response Application ──────────────────────────────────────────────

  describe('response application', () => {
    it('calls onFieldUpdate for setFieldValue API calls', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 10, formValues: { 'field-1': 10 } },
        [{ fn: 'setFieldValue', args: { fieldId: 'field-2', value: 11 } }],
      );

      expect(config.onFieldUpdate).toHaveBeenCalledWith('field-2', 11);
    });

    it('calls onFieldVisibility for showField/hideField API calls', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [
          { fn: 'showField', args: { fieldId: 'field-3' } },
          { fn: 'hideField', args: { fieldId: 'field-4' } },
        ],
      );

      expect(config.onFieldVisibility).toHaveBeenCalledWith('field-3', true);
      expect(config.onFieldVisibility).toHaveBeenCalledWith('field-4', false);
    });

    it('calls onShowMessage for showMessage API calls', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [{ fn: 'showMessage', args: { text: 'Hello', type: 'info' } }],
      );

      expect(config.onShowMessage).toHaveBeenCalledWith('Hello', 'info');
    });
  });

  // ── HTML Sanitization ─────────────────────────────────────────────────

  describe('HTML sanitization', () => {
    it('sanitizes string values from setFieldValue', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [
          {
            fn: 'setFieldValue',
            args: { fieldId: 'field-2', value: '<script>alert("xss")</script>' },
          },
        ],
      );

      expect(config.onFieldUpdate).toHaveBeenCalledWith(
        'field-2',
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('sanitizes showMessage text', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [
          {
            fn: 'showMessage',
            args: { text: 'Value is <b>bold</b> & "quoted"', type: 'warning' },
          },
        ],
      );

      expect(config.onShowMessage).toHaveBeenCalledWith(
        'Value is &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;',
        'warning',
      );
    });

    it('sanitizes single quotes in strings', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [
          {
            fn: 'setFieldValue',
            args: { fieldId: 'field-2', value: "it's a test" },
          },
        ],
      );

      expect(config.onFieldUpdate).toHaveBeenCalledWith(
        'field-2',
        'it&#x27;s a test',
      );
    });

    it('does not sanitize non-string values', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [{ fn: 'setFieldValue', args: { fieldId: 'field-2', value: 42 } }],
      );

      expect(config.onFieldUpdate).toHaveBeenCalledWith('field-2', 42);
    });
  });

  // ── SandboxResponse Validation ────────────────────────────────────────

  describe('message validation', () => {
    it('discards non-conforming messages and logs security warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine = new ActionEngine([makeAction()], config);
      engine.init();

      mockWorkerInstance.onmessage?.({
        data: { type: 'invalid', foo: 'bar' },
      } as MessageEvent);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security warning'),
        expect.anything(),
      );

      warnSpy.mockRestore();
    });

    it('discards messages with missing required fields', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine = new ActionEngine([makeAction()], config);
      engine.init();

      // Missing status
      mockWorkerInstance.onmessage?.({
        data: { type: 'result', requestId: 'req-1', apiCalls: [], executionDurationMs: 10 },
      } as MessageEvent);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('discards messages with invalid status', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine = new ActionEngine([makeAction()], config);
      engine.init();

      mockWorkerInstance.onmessage?.({
        data: {
          type: 'result',
          requestId: 'req-1',
          status: 'unknown',
          apiCalls: [],
          executionDurationMs: 10,
        },
      } as MessageEvent);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('ignores invalid API calls in the response', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      await tick();

      const requestId =
        mockWorkerInstance.postMessage.mock.calls[0][0].requestId;

      mockWorkerInstance.onmessage?.({
        data: {
          type: 'result',
          requestId,
          status: 'success',
          apiCalls: [
            { fn: 'unknownFn', args: {} },
            { fn: 'setFieldValue', args: { fieldId: 'field-2', value: 'ok' } },
          ],
          executionDurationMs: 5,
        },
      } as MessageEvent);

      await promise;
      expect(config.onFieldUpdate).toHaveBeenCalledTimes(1);
      expect(config.onFieldUpdate).toHaveBeenCalledWith('field-2', 'ok');
    });
  });

  // ── onFormSubmit Blocking ─────────────────────────────────────────────

  describe('onFormSubmit blocking', () => {
    it('blocks submission when an action shows an error message', async () => {
      const action = makeAction({
        event: 'onFormSubmit',
        targetId: undefined,
      });
      engine = new ActionEngine([action], config);
      engine.init();

      const result = await dispatchAndRespond(
        engine,
        'onFormSubmit',
        { formValues: {} },
        [
          {
            fn: 'showMessage',
            args: { text: 'Validation failed', type: 'error' },
          },
        ],
      );

      expect(result).toBe(false);
    });

    it('allows submission when no error messages are shown', async () => {
      const action = makeAction({
        event: 'onFormSubmit',
        targetId: undefined,
      });
      engine = new ActionEngine([action], config);
      engine.init();

      const result = await dispatchAndRespond(
        engine,
        'onFormSubmit',
        { formValues: {} },
        [{ fn: 'showMessage', args: { text: 'All good', type: 'success' } }],
      );

      expect(result).toBe(true);
    });

    it('allows submission when actions produce no messages', async () => {
      const action = makeAction({
        event: 'onFormSubmit',
        targetId: undefined,
      });
      engine = new ActionEngine([action], config);
      engine.init();

      const result = await dispatchAndRespond(
        engine,
        'onFormSubmit',
        { formValues: {} },
        [],
      );

      expect(result).toBe(true);
    });
  });

  // ── Rate Limiting ─────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('drops invocations that exceed the rate limit and logs audit', async () => {
      const action = makeAction();
      engine = new ActionEngine([action], config);
      engine.init();

      // Exhaust the rate limiter (10 allowed per second)
      for (let i = 0; i < 10; i++) {
        await dispatchAndRespond(
          engine,
          'onFieldChange',
          { fieldId: 'field-1', value: i, formValues: {} },
        );
      }

      // 11th should be rate-limited
      await engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 11,
        formValues: {},
      });

      // Worker should have been called 10 times, not 11
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(10);

      // Audit log should have been called for the rate-limited invocation
      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rate_limited',
          errorCode: 'ACTION_RATE_LIMITED',
        }),
      );
    });
  });

  // ── Audit Logging ─────────────────────────────────────────────────────

  describe('audit logging', () => {
    it('logs successful action executions', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
      );

      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          actionId: 'action-1',
          actionEvent: 'onFieldChange',
          targetId: 'field-1',
          tenantId: 'tenant-1',
          serviceId: 'service-1',
          status: 'success',
        }),
      );
    });

    it('logs error action executions with error details', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
        [],
        'error',
        { code: 'ACTION_ERROR', message: 'Something went wrong' },
      );

      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          errorCode: 'ACTION_ERROR',
          errorMessage: 'Something went wrong',
        }),
      );
    });

    it('does not throw when onAuditLog is not provided', async () => {
      const configNoAudit = makeConfig({ onAuditLog: undefined });
      engine = new ActionEngine([makeAction()], configNoAudit);
      engine.init();

      const result = await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
      );

      expect(result).toBe(true);
    });
  });

  // ── Sequential Execution ──────────────────────────────────────────────

  describe('sequential execution', () => {
    it('executes actions for the same field sequentially', async () => {
      const action1 = makeAction({ id: 'a1' });
      const action2 = makeAction({ id: 'a2' });
      engine = new ActionEngine([action1, action2], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      // Let the first action be posted
      await tick();
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);

      // Respond to first action
      simulateWorkerResponse();

      // Let the second action be posted
      await tick();
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(2);

      // Respond to second action
      simulateWorkerResponse();

      await promise;
    });
  });

  // ── Worker Crash Recovery ─────────────────────────────────────────────

  describe('worker crash recovery', () => {
    it('attempts one restart on worker crash', () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const firstWorker = mockWorkerInstance;

      // Simulate crash
      firstWorker.onerror?.();

      // A new worker should have been created
      expect(mockWorkerInstance).not.toBe(firstWorker);
      expect(mockWorkerInstance.onmessage).toBeTypeOf('function');
    });

    it('disables actions after second crash', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      // First crash — restart
      mockWorkerInstance.onerror?.();

      // Second crash — disable
      mockWorkerInstance.onerror?.();

      // Dispatch should return true immediately (disabled)
      const result = await engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      expect(result).toBe(true);
    });
  });

  // ── Destroy ───────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('terminates the worker', () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const worker = mockWorkerInstance;
      engine.destroy();

      expect(worker.terminate).toHaveBeenCalled();
    });

    it('prevents further dispatches after destroy', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();
      engine.destroy();

      const result = await engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      expect(result).toBe(true);
    });
  });

  // ── Disabled Actions ──────────────────────────────────────────────────

  describe('disabled actions', () => {
    it('skips actions with enabled: false', async () => {
      const enabledAction = makeAction({ id: 'enabled', enabled: true });
      const disabledAction = makeAction({ id: 'disabled', enabled: false });

      engine = new ActionEngine([enabledAction, disabledAction], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
      );

      // Only the enabled action should be dispatched
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);

      // Audit should only log the enabled action
      expect(config.onAuditLog).toHaveBeenCalledTimes(1);
      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'enabled' }),
      );
    });

    it('treats actions without enabled property as enabled', async () => {
      const action = makeAction({ enabled: undefined });
      engine = new ActionEngine([action], config);
      engine.init();

      await dispatchAndRespond(
        engine,
        'onFieldChange',
        { fieldId: 'field-1', value: 'test', formValues: {} },
      );

      expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);
    });
  });

  // ── Timeout Handling ──────────────────────────────────────────────────

  describe('timeout handling', () => {
    it('resolves with timeout status when worker does not respond', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      // Let the dispatch chain start
      await tick();

      // Advance past the 5-second safety timeout
      vi.advanceTimersByTime(5001);
      await tick();

      await promise;

      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'timeout',
          errorCode: 'ACTION_TIMEOUT',
        }),
      );
    }, 10000);
  });
});
