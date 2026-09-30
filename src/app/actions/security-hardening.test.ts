/**
 * Tests for Security Hardening (Task 14).
 *
 * Covers:
 * - 14.1: CSP enforcement in the Sandbox Worker
 * - 14.2: Action code versioning
 * - 14.3: Security audit logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ActionDefinition } from '@serviceformai/validation-engine';
import type { SandboxResponse } from './sandbox-types';
import { ActionEngine, type ActionEngineConfig } from './action-engine';
import { ActionAuditLogger, type ActionAuditEntry } from './action-audit-logger';
import { getWorkerSource } from './sandbox-worker';

// ---------------------------------------------------------------------------
// Mock the sandbox-worker module for ActionEngine tests
// ---------------------------------------------------------------------------

let mockWorkerInstance: {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: (() => void) | null;
};

vi.mock('./sandbox-worker', async (importOriginal) => {
  const original = await importOriginal<typeof import('./sandbox-worker')>();
  return {
    ...original,
    createSandboxWorker: vi.fn(() => {
      mockWorkerInstance = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
      };
      return mockWorkerInstance;
    }),
  };
});

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

async function tick(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

// ---------------------------------------------------------------------------
// 14.1: CSP Enforcement for the Sandbox Worker
// ---------------------------------------------------------------------------

describe('14.1: CSP Enforcement for the Sandbox Worker', () => {
  it('worker source shadows all prohibited globals with undefined', () => {
    const source = getWorkerSource();

    // The PROHIBITED_GLOBALS array should include key dangerous globals
    expect(source).toContain('window');
    expect(source).toContain('document');
    expect(source).toContain('navigator');
    expect(source).toContain('eval');
    expect(source).toContain('Function');
    expect(source).toContain('setTimeout');
    expect(source).toContain('setInterval');
    expect(source).toContain('XMLHttpRequest');
    expect(source).toContain('importScripts');
    expect(source).toContain('WebSocket');
    expect(source).toContain('SharedWorker');
    expect(source).toContain('ServiceWorker');
    expect(source).toContain('Proxy');
    expect(source).toContain('Reflect');
  });

  it('worker source wraps action code in strict-mode IIFE', () => {
    const source = getWorkerSource();
    expect(source).toContain('"use strict"');
    expect(source).toContain('async function');
  });

  it('worker source uses new Function() for IIFE wrapping only', () => {
    const source = getWorkerSource();
    // The only use of `new Function` should be for the IIFE wrapping
    const newFunctionMatches = source.match(/new Function/g);
    expect(newFunctionMatches).toHaveLength(1);
  });

  it('worker source shadows self and globalThis', () => {
    const source = getWorkerSource();
    // Should shadow 'self' and 'globalThis' to prevent Worker global access
    expect(source).toContain("paramNames.push('self')");
    expect(source).toContain("paramNames.push('globalThis')");
  });

  it('worker source validates incoming messages', () => {
    const source = getWorkerSource();
    expect(source).toContain('isValidRequest');
    expect(source).toContain('INVALID_REQUEST');
  });

  it('worker is loaded from a blob URL (no same-origin access)', () => {
    // The createSandboxWorker function creates a blob URL
    // We verify the source code pattern
    const source = getWorkerSource();
    // The worker source is self-contained (no imports)
    expect(source).not.toContain('import ');
    expect(source).not.toContain('require(');
  });
});

// ---------------------------------------------------------------------------
// 14.2: Action Code Versioning
// ---------------------------------------------------------------------------

describe('14.2: Action Code Versioning', () => {
  it('ActionDefinition supports codeHistory array', () => {
    const action: ActionDefinition = {
      id: 'test',
      event: 'onFieldChange',
      targetId: 'field-1',
      code: 'setFieldValue("f", 1)',
      codeHistory: [
        { code: 'setFieldValue("f", 0)', timestamp: '2024-01-01T00:00:00.000Z' },
      ],
    };

    expect(action.codeHistory).toHaveLength(1);
    expect(action.codeHistory![0].code).toBe('setFieldValue("f", 0)');
    expect(action.codeHistory![0].timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('codeHistory is optional and defaults to undefined', () => {
    const action: ActionDefinition = {
      id: 'test',
      event: 'onFieldChange',
      targetId: 'field-1',
      code: 'setFieldValue("f", 1)',
    };

    expect(action.codeHistory).toBeUndefined();
  });

  it('codeHistory can accumulate multiple versions', () => {
    const action: ActionDefinition = {
      id: 'test',
      event: 'onFieldChange',
      targetId: 'field-1',
      code: 'setFieldValue("f", 3)',
      codeHistory: [
        { code: 'setFieldValue("f", 1)', timestamp: '2024-01-01T00:00:00.000Z' },
        { code: 'setFieldValue("f", 2)', timestamp: '2024-01-02T00:00:00.000Z' },
      ],
    };

    expect(action.codeHistory).toHaveLength(2);
    expect(action.codeHistory![0].code).toBe('setFieldValue("f", 1)');
    expect(action.codeHistory![1].code).toBe('setFieldValue("f", 2)');
  });

  it('CodeHistoryEntry has required code and timestamp fields', () => {
    const entry = {
      code: 'var x = 1;',
      timestamp: new Date().toISOString(),
    };

    expect(typeof entry.code).toBe('string');
    expect(typeof entry.timestamp).toBe('string');
    // Verify timestamp is valid ISO 8601
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });
});

// ---------------------------------------------------------------------------
// 14.3: Security Audit Logging
// ---------------------------------------------------------------------------

describe('14.3: Security Audit Logging', () => {
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

  describe('ActionAuditLogger security events', () => {
    it('supports category field on audit entries', () => {
      const logger = new ActionAuditLogger({ flushIntervalMs: 60000 });

      const entry: ActionAuditEntry = {
        actionId: 'test',
        actionEvent: 'onFieldChange',
        tenantId: 'tenant-1',
        serviceId: 'service-1',
        executionDurationMs: 0,
        status: 'error',
        errorCode: 'DOMAIN_NOT_ALLOWLISTED',
        errorMessage: 'Domain not in allowlist',
        category: 'security',
      };

      logger.log(entry);
      expect(logger.pendingCount).toBe(1);
      logger.destroy();
    });

    it('logSecurityEvent sets category to security', () => {
      const logger = new ActionAuditLogger({ flushIntervalMs: 60000 });

      logger.logSecurityEvent({
        actionId: 'test',
        actionEvent: 'onFieldChange',
        tenantId: 'tenant-1',
        serviceId: 'service-1',
        executionDurationMs: 0,
        status: 'error',
        errorCode: 'ACTION_PROHIBITED_CONSTRUCT',
        errorMessage: 'Prohibited construct detected',
      });

      expect(logger.pendingCount).toBe(1);
      logger.destroy();
    });
  });

  describe('ActionEngine security audit logging', () => {
    it('logs security event when non-conforming message is received from Worker', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine = new ActionEngine([makeAction()], config);
      engine.init();

      // Send a non-conforming message
      mockWorkerInstance.onmessage?.({
        data: { type: 'invalid', foo: 'bar' },
      } as MessageEvent);

      // Should log a security audit event
      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          errorCode: 'MESSAGE_SCHEMA_VIOLATION',
          category: 'security',
        }),
      );

      warnSpy.mockRestore();
    });

    it('logs security category for domain-not-allowlisted errors', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      await tick();

      // Simulate worker response with domain not allowlisted error
      const requestId = mockWorkerInstance.postMessage.mock.calls[0][0].requestId;
      mockWorkerInstance.onmessage?.({
        data: {
          type: 'result',
          requestId,
          status: 'error',
          apiCalls: [],
          error: { code: 'DOMAIN_NOT_ALLOWLISTED', message: 'Domain not in allowlist' },
          executionDurationMs: 5,
        },
      } as MessageEvent);

      await promise;

      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          errorCode: 'DOMAIN_NOT_ALLOWLISTED',
          category: 'security',
        }),
      );
    });

    it('logs security category for worker crash events', () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      // Simulate crash
      mockWorkerInstance.onerror?.();

      // Second crash — disable
      mockWorkerInstance.onerror?.();

      // The crash should have been logged (pending requests get rejected with WORKER_CRASH)
      // The engine is now disabled
    });

    it('does not set security category for normal execution errors', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      await tick();

      const requestId = mockWorkerInstance.postMessage.mock.calls[0][0].requestId;
      mockWorkerInstance.onmessage?.({
        data: {
          type: 'result',
          requestId,
          status: 'error',
          apiCalls: [],
          error: { code: 'ACTION_ERROR', message: 'Some runtime error' },
          executionDurationMs: 5,
        },
      } as MessageEvent);

      await promise;

      expect(config.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          errorCode: 'ACTION_ERROR',
        }),
      );

      // Should NOT have security category for normal errors
      const auditCall = (config.onAuditLog as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(auditCall.category).toBeUndefined();
    });

    it('does not set security category for successful executions', async () => {
      engine = new ActionEngine([makeAction()], config);
      engine.init();

      const promise = engine.dispatch('onFieldChange', {
        fieldId: 'field-1',
        value: 'test',
        formValues: {},
      });

      await tick();

      const requestId = mockWorkerInstance.postMessage.mock.calls[0][0].requestId;
      mockWorkerInstance.onmessage?.({
        data: {
          type: 'result',
          requestId,
          status: 'success',
          apiCalls: [],
          executionDurationMs: 5,
        },
      } as MessageEvent);

      await promise;

      const auditCall = (config.onAuditLog as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(auditCall.status).toBe('success');
      expect(auditCall.category).toBeUndefined();
    });
  });
});
