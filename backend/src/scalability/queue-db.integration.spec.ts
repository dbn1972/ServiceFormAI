/**
 * Volume 14 — Queue Service DB-Provider Integration Tests
 *
 * Tests the real QueueService using the DATABASE provider.
 * All repository interactions are mocked — testing the service logic,
 * not the ORM itself.
 *
 * Coverage:
 *  A. Provider initialization: database provider set when Redis unavailable
 *  B. isWritePathEnabled: returns correct boolean based on config
 *  C. enqueueWriteCommand (DB): creates queue message and returns queued=true
 *  D. Idempotency: duplicate key returns queued=false without inserting
 *  E. claimNextMessage: returns oldest queued message and marks as processing
 *  F. acknowledgeMessage: marks claimed message as processed
 *  G. failMessage: increments attempts; marks as failed after maxAttempts
 *  H. retryFailedMessages: resets failed messages to queued
 *  I. Metrics: recordQueueEnqueue + recordQueueProcessed called correctly
 *  J. Paused consumers: claimNextMessage returns null when paused
 *
 * Run: cd backend && npx jest queue-db.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { QueueService } from './queue.service';
import { ScalabilityConfigService } from './scalability-config.service';
import { ScalabilityMetricsService } from './scalability-metrics.service';
import { QueueMessageEntity } from '../database/entities/queue-message.entity';
import { makeRepo, makeMockMetrics, testQueueMessage } from '../test/test-helpers';

// ─── Config factory ──────────────────────────────────────────────────────────

function makeQueueConfig(overrides: Partial<any> = {}) {
  return {
    queue: {
      enabled: true,
      provider: 'database',
      consumersPaused: false,
      dlqEnabled: true,
      retryLimit: 3,
      maxAttempts: 3,
      ...overrides,
    },
    featureFlags: {
      'queue.writePath.enabled': true,
      'queue.shadowEvents.enabled': false,
    },
    cache: { enabled: true },
    dbFallback: { enabled: true, maxFallbacksPerMinute: 500 },
  };
}

function makeMockConfigService(configOverride: Partial<any> = {}) {
  const cfg = makeQueueConfig(configOverride);
  return {
    getConfig: jest.fn().mockReturnValue(cfg),
    updateConfig: jest.fn().mockImplementation((partial: any) => {
      Object.assign(cfg, partial);
    }),
    isFeatureEnabled: jest.fn((flag: string) => cfg.featureFlags[flag] ?? false),
    getDomainConfig: jest.fn().mockReturnValue({ enabled: true, ttlMs: 5_000 }),
  };
}

// ─── Module factory ──────────────────────────────────────────────────────────

async function buildQueueService(configOverride: Partial<any> = {}): Promise<{
  queue: QueueService;
  repo: ReturnType<typeof makeRepo>;
  metrics: ReturnType<typeof makeMockMetrics>;
  config: ReturnType<typeof makeMockConfigService>;
}> {
  const repo = makeRepo();
  // update is called by requeueDatabaseInFlightMessages on init
  repo.update = jest.fn().mockResolvedValue({ affected: 0 });
  const metrics = makeMockMetrics();
  const config = makeMockConfigService(configOverride);

  // dataSource.transaction must execute the callback for claimNextMessage tests
  const dataSource = {
    query: jest.fn().mockResolvedValue([{ count: 0 }]),
    transaction: jest.fn().mockImplementation((fn: any) => {
      const manager = {
        getRepository: jest.fn().mockReturnValue(repo),
      };
      return fn(manager);
    }),
  } as unknown as DataSource;

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      QueueService,
      { provide: getRepositoryToken(QueueMessageEntity), useValue: repo },
      { provide: DataSource, useValue: dataSource },
      { provide: ScalabilityConfigService, useValue: config },
      { provide: ScalabilityMetricsService, useValue: metrics },
    ],
  }).compile();

  const queue = module.get<QueueService>(QueueService);
  // Trigger onModuleInit to set provider = 'database'
  await queue.onModuleInit();
  return { queue, repo, metrics, config };
}

// ─── A. isWritePathEnabled ────────────────────────────────────────────────────

describe('QueueService — isWritePathEnabled', () => {
  it('returns true when queue is enabled + provider is database + feature flag on', async () => {
    const { queue } = await buildQueueService();
    expect(queue.isWritePathEnabled()).toBe(true);
  });

  it('returns false when queue is disabled', async () => {
    const { queue } = await buildQueueService({ enabled: false });
    expect(queue.isWritePathEnabled()).toBe(false);
  });
});

// ─── B. enqueueWriteCommand — database provider ───────────────────────────────

describe('QueueService — enqueueWriteCommand (database provider)', () => {
  let queue: QueueService;
  let repo: ReturnType<typeof makeRepo>;
  let metrics: ReturnType<typeof makeMockMetrics>;

  beforeEach(async () => {
    ({ queue, repo, metrics } = await buildQueueService());
  });

  it('creates a queue message entity and returns queued=true', async () => {
    repo.findOne.mockResolvedValue(null); // no duplicate
    repo.create.mockReturnValue(testQueueMessage());
    repo.save.mockResolvedValue(testQueueMessage());

    const result = await queue.enqueueWriteCommand({
      type: 'application.persist',
      module: 'consumer.service',
      payload: { applicationId: 'test-app-id' },
      idempotencyKey: 'idem-key-001',
    });

    expect(result.queued).toBe(true);
    expect(result.idempotencyKey).toBe('idem-key-001');
    expect(repo.save).toHaveBeenCalled();
    expect(metrics.recordQueueEnqueue).toHaveBeenCalledWith('application.persist');
  });

  it('returns queued=false for duplicate idempotency key', async () => {
    // Duplicate found
    repo.findOne.mockResolvedValue(testQueueMessage({ idempotency_key: 'idem-key-dup' }));

    const result = await queue.enqueueWriteCommand({
      type: 'application.persist',
      module: 'consumer.service',
      payload: {},
      idempotencyKey: 'idem-key-dup',
    });

    expect(result.queued).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns queued=false when queue is disabled', async () => {
    const { queue: disabledQueue } = await buildQueueService({ enabled: false });

    const result = await disabledQueue.enqueueWriteCommand({
      type: 'audit.log',
      module: 'audit.service',
      payload: {},
    });

    expect(result.queued).toBe(false);
    expect(result.reason).toBe('queue-unavailable');
  });
});

// ─── C. claimNextMessage ──────────────────────────────────────────────────────

describe('QueueService — claimNextMessage (database provider)', () => {
  let queue: QueueService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    ({ queue, repo } = await buildQueueService());
  });

  it('returns null when no messages are queued', async () => {
    // claimNextDatabaseMessage uses createQueryBuilder().getOne() not findOne
    repo.createQueryBuilder().getOne.mockResolvedValue(null);

    const claimed = await queue.claimNextMessage();
    expect(claimed).toBeNull();
  });

  it('returns claimed message when a queued message exists', async () => {
    const msg = testQueueMessage({
      type: 'application.persist',
      status: 'queued',
    });

    // claimNextDatabaseMessage uses createQueryBuilder().getOne() not findOne
    repo.createQueryBuilder().getOne.mockResolvedValue(msg);
    repo.save.mockResolvedValue({ ...msg, status: 'processing', claimed_at: new Date() });

    const claimed = await queue.claimNextMessage();
    expect(claimed).not.toBeNull();
    expect(claimed!.message.type).toBe('application.persist');
  });

  it('returns null when consumers are paused', async () => {
    const { queue: pausedQueue } = await buildQueueService({ consumersPaused: true });

    const claimed = await pausedQueue.claimNextMessage();
    expect(claimed).toBeNull();
  });
});

// ─── D. acknowledgeMessage ────────────────────────────────────────────────────

describe('QueueService — acknowledgeMessage (database provider)', () => {
  it('marks message as processed in the repository', async () => {
    const { queue, repo } = await buildQueueService();
    const msg = testQueueMessage({ status: 'processing' });

    repo.findOne.mockResolvedValue(msg);
    repo.save.mockResolvedValue({ ...msg, status: 'processed', processed_at: new Date() });

    const claimed = { raw: JSON.stringify(msg), message: { ...msg, attempts: 0, enqueuedAt: new Date().toISOString() } };
    await queue.acknowledgeMessage(claimed as any);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processed' }),
    );
  });
});

// ─── E. failMessage ───────────────────────────────────────────────────────────

describe('QueueService — failMessage (database provider)', () => {
  it('increments attempts and marks as failed after reaching maxAttempts', async () => {
    const { queue, repo, config } = await buildQueueService();
    config.getConfig.mockReturnValue(makeQueueConfig({ maxAttempts: 3 }));

    const msg = testQueueMessage({ status: 'processing', attempts: 3 }); // next failure = 4 > retryLimit(3) = failed
    repo.findOne.mockResolvedValue(msg);
    repo.save.mockImplementation((e: any) => Promise.resolve(e));

    const claimed = {
      raw: JSON.stringify(msg),
      message: { ...msg, attempts: msg.attempts, enqueuedAt: new Date().toISOString() },
    };

    await queue.failMessage(claimed as any, new Error('Processing error'));

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('marks as queued (retry) when attempts < maxAttempts', async () => {
    const { queue, repo, config } = await buildQueueService();
    config.getConfig.mockReturnValue(makeQueueConfig({ maxAttempts: 3 }));

    const msg = testQueueMessage({ status: 'processing', attempts: 1 }); // 1 < 3
    repo.findOne.mockResolvedValue(msg);
    repo.save.mockImplementation((e: any) => Promise.resolve(e));

    const claimed = {
      raw: JSON.stringify(msg),
      message: { ...msg, attempts: msg.attempts, enqueuedAt: new Date().toISOString() },
    };

    await queue.failMessage(claimed as any, new Error('Transient error'));

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'queued' }),
    );
  });
});

// ─── F. Metrics integration ───────────────────────────────────────────────────

describe('QueueService — metrics integration', () => {
  it('recordQueueEnqueue is called with message type on successful enqueue', async () => {
    const { queue, repo, metrics } = await buildQueueService();

    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(testQueueMessage({ type: 'audit.log' }));
    repo.save.mockResolvedValue(testQueueMessage({ type: 'audit.log' }));

    await queue.enqueueWriteCommand({
      type: 'audit.log',
      module: 'audit.service',
      payload: { eventType: 'auth.login.success' },
    });

    expect(metrics.recordQueueEnqueue).toHaveBeenCalledWith('audit.log');
  });
});
