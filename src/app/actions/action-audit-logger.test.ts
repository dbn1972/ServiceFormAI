import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActionAuditLogger, type ActionAuditEntry } from './action-audit-logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides?: Partial<ActionAuditEntry>): ActionAuditEntry {
  return {
    actionId: 'action-1',
    actionEvent: 'onFieldChange',
    targetId: 'field-1',
    tenantId: 'tenant-1',
    serviceId: 'service-1',
    executionDurationMs: 42,
    status: 'success',
    ...overrides,
  };
}

/** Flush microtasks so that the async flush() promise settles. */
async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => resolve());
  await new Promise<void>((resolve) => resolve());
}

describe('ActionAuditLogger', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('buffers entries and flushes on interval', async () => {
    const logger = new ActionAuditLogger({ flushIntervalMs: 1000 });
    logger.log(makeEntry());
    logger.log(makeEntry({ actionId: 'action-2' }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logger.pendingCount).toBe(2);

    // Advance past the flush interval
    vi.advanceTimersByTime(1001);
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('/audit/action-executions');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body).toHaveLength(2);
    expect(body[0].actionId).toBe('action-1');
    expect(body[1].actionId).toBe('action-2');

    await logger.destroy();
  });

  it('flushes immediately when maxBatchSize is reached', async () => {
    const logger = new ActionAuditLogger({ maxBatchSize: 3, flushIntervalMs: 60000 });

    logger.log(makeEntry({ actionId: 'a1' }));
    logger.log(makeEntry({ actionId: 'a2' }));

    expect(fetchSpy).not.toHaveBeenCalled();

    // Third entry triggers immediate flush
    logger.log(makeEntry({ actionId: 'a3' }));
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body).toHaveLength(3);

    await logger.destroy();
  });

  it('sanitizes entries — never includes code or field values', async () => {
    const logger = new ActionAuditLogger({ maxBatchSize: 1 });

    // Attempt to sneak in extra properties
    const entry = makeEntry();
    (entry as Record<string, unknown>)['code'] = 'console.log("secret")';
    (entry as Record<string, unknown>)['formValues'] = { ssn: '123-45-6789' };

    logger.log(entry);
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body[0]).not.toHaveProperty('code');
    expect(body[0]).not.toHaveProperty('formValues');
    expect(body[0]).toHaveProperty('actionId', 'action-1');

    await logger.destroy();
  });

  it('includes optional fields when present', async () => {
    const logger = new ActionAuditLogger({ maxBatchSize: 1 });

    logger.log(
      makeEntry({
        status: 'error',
        errorCode: 'ACTION_TIMEOUT',
        errorMessage: 'Timed out',
        fetchDomain: 'api.example.gov.in',
      }),
    );
    await flushMicrotasks();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body[0].errorCode).toBe('ACTION_TIMEOUT');
    expect(body[0].errorMessage).toBe('Timed out');
    expect(body[0].fetchDomain).toBe('api.example.gov.in');

    await logger.destroy();
  });

  it('logs to console.warn when backend is unavailable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const logger = new ActionAuditLogger({ maxBatchSize: 1 });
    logger.log(makeEntry());
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Backend unavailable'),
      expect.any(Array),
    );

    await logger.destroy();
    warnSpy.mockRestore();
  });

  it('logs to console.warn when backend returns non-OK status', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const logger = new ActionAuditLogger({ maxBatchSize: 1 });
    logger.log(makeEntry());
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Backend returned 500'),
      expect.any(Array),
    );

    await logger.destroy();
    warnSpy.mockRestore();
  });

  it('does not flush when buffer is empty', async () => {
    const logger = new ActionAuditLogger({ flushIntervalMs: 100 });

    vi.advanceTimersByTime(200);
    await flushMicrotasks();

    expect(fetchSpy).not.toHaveBeenCalled();

    await logger.destroy();
  });

  it('destroy flushes remaining entries and stops timer', async () => {
    const logger = new ActionAuditLogger({ flushIntervalMs: 60000 });

    logger.log(makeEntry());
    logger.log(makeEntry({ actionId: 'action-2' }));

    await logger.destroy();
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body).toHaveLength(2);
  });

  it('supports custom endpoint', async () => {
    const logger = new ActionAuditLogger({
      maxBatchSize: 1,
      endpoint: '/custom/audit',
    });

    logger.log(makeEntry());
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledWith('/custom/audit', expect.any(Object));

    await logger.destroy();
  });

  it('preserves all valid ActionAuditEntry fields', async () => {
    const logger = new ActionAuditLogger({ maxBatchSize: 1 });

    const entry = makeEntry({
      actionId: 'calc-total',
      actionEvent: 'onFormSubmit',
      targetId: undefined,
      tenantId: 'dept-finance',
      serviceId: 'tax-return',
      executionDurationMs: 150,
      status: 'timeout',
    });

    logger.log(entry);
    await flushMicrotasks();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body[0]).toEqual({
      actionId: 'calc-total',
      actionEvent: 'onFormSubmit',
      tenantId: 'dept-finance',
      serviceId: 'tax-return',
      executionDurationMs: 150,
      status: 'timeout',
    });
    // targetId was undefined, so it should not be present
    expect(body[0]).not.toHaveProperty('targetId');

    await logger.destroy();
  });
});
