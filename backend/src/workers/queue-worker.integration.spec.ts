/**
 * Volume 14 — Queue Worker Service Integration Tests
 *
 * Tests the QueueWorkerService message processing logic — the full handler chain
 * from claimed message → DB persistence → notification. Uses mocked repositories
 * and queue service, testing the handler logic in isolation.
 *
 * Coverage:
 *  A. application.persist: idempotent create + notification
 *  B. application.persist: skip on duplicate (idempotency)
 *  C. service.persist.create: creates new service from payload
 *  D. service.persist.update: updates existing service fields
 *  E. service.persist.delete: removes service, idempotent on missing
 *  F. audit.log: persists audit entry; failure is non-fatal (no rethrow)
 *  G. application.submitted: notifies via webhook (legacy shadow)
 *  H. Unknown message type: warns but does not throw
 *  I. Handler failure: metrics recorded, failMessage called
 *  J. Metrics: recordQueueProcessed called after acknowledgement
 *
 * Run: cd backend && npx jest queue-worker.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { QueueWorkerService } from './queue-worker.service';
import { QueueService } from '../scalability/queue.service';
import { ScalabilityMetricsService } from '../scalability/scalability-metrics.service';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';

import {
  makeRepo,
  makeMockMetrics,
  TEST_TENANT_ID,
  TEST_SERVICE_ID,
  TEST_APPLICATION_ID,
  TEST_CONSUMER_ID,
  testTenant,
  testTenantService,
  testApplication,
  testConsumerUser,
} from '../test/test-helpers';

// ─── Module factory ──────────────────────────────────────────────────────────

async function buildWorker() {
  const tenantRepo = makeRepo();
  const serviceRepo = makeRepo();
  const applicationRepo = makeRepo();
  const consumerRepo = makeRepo();
  const auditLogRepo = makeRepo();
  const outboxRepo = makeRepo();
  const metrics = makeMockMetrics();
  const repositories = new Map<any, any>([
    [OutboxEvent, outboxRepo],
  ]);
  const dataSource = {
    transaction: jest.fn(async (callback) => callback({
      getRepository: (entity) => repositories.get(entity),
    })),
  };

  const mockQueue: Partial<QueueService> = {
    claimNextMessage: jest.fn().mockResolvedValue(null),
    acknowledgeMessage: jest.fn().mockResolvedValue(undefined),
    failMessage: jest.fn().mockResolvedValue(undefined),
    isWritePathEnabled: jest.fn().mockReturnValue(false),
    enqueueWriteCommand: jest.fn().mockResolvedValue({ queued: true }),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      QueueWorkerService,
      { provide: QueueService, useValue: mockQueue },
      { provide: ScalabilityMetricsService, useValue: metrics },
      { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
      { provide: getRepositoryToken(TenantService), useValue: serviceRepo },
      { provide: getRepositoryToken(Application), useValue: applicationRepo },
      { provide: getRepositoryToken(ConsumerUser), useValue: consumerRepo },
      { provide: getRepositoryToken(AuditLog), useValue: auditLogRepo },
      { provide: getRepositoryToken(OutboxEvent), useValue: outboxRepo },
      { provide: getDataSourceToken(), useValue: dataSource },
    ],
  }).compile();

  // Do NOT init (would start the loop) — access service directly
  const worker = module.get<QueueWorkerService>(QueueWorkerService);

  return {
    worker,
    tenantRepo,
    serviceRepo,
    applicationRepo,
    consumerRepo,
    auditLogRepo,
    metrics,
    mockQueue,
    outboxRepo,
  };
}

describe('QueueWorkerService transactional outbox', () => {
  it('enqueues an outbox row idempotently and marks it published', async () => {
    const { worker, outboxRepo, mockQueue } = await buildWorker();
    const event = {
      id: 'event-1',
      event_type: 'application.status-updated',
      aggregate_type: 'application',
      aggregate_id: TEST_APPLICATION_ID,
      tenant_id: TEST_TENANT_ID,
      payload: { applicationId: TEST_APPLICATION_ID, status: 'under_review' },
      idempotency_key: `application.status:${TEST_APPLICATION_ID}:v2`,
      status: 'pending',
      created_at: new Date(),
    };
    outboxRepo.findOne.mockResolvedValue(event);
    outboxRepo.save.mockImplementation(async (value: any) => value);

    await expect(worker.processPendingOutboxEvent()).resolves.toBe(true);

    expect(mockQueue.enqueueWriteCommand).toHaveBeenCalledWith({
      type: 'application.status-updated',
      module: 'transactional-outbox',
      payload: event.payload,
      idempotencyKey: event.idempotency_key,
    });
    expect(outboxRepo.save).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'published' }));
  });
});

describe('QueueWorkerService — service archive event', () => {
  it('routes service.archived through service mutation delivery', async () => {
    const { worker, tenantRepo } = await buildWorker();
    tenantRepo.findOne.mockResolvedValue({ notification_policy: null });

    await processMessage(worker, 'service.archived', {
      serviceId: TEST_SERVICE_ID,
      tenantId: TEST_TENANT_ID,
    });

    expect(tenantRepo.findOne).toHaveBeenCalledWith({ where: { id: TEST_TENANT_ID } });
  });
});

/** Helper to invoke processMessage via a reflected private method */
async function processMessage(worker: QueueWorkerService, type: string, payload: Record<string, unknown>) {
  // Access the private processMessage method for white-box testing
  const processMsg = (worker as any).processMessage.bind(worker);
  const claimed = {
    raw: JSON.stringify({ type, payload }),
    message: {
      id: 'test-msg-id',
      type,
      module: 'test',
      payload,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      idempotencyKey: `test:${type}:${Date.now()}`,
    },
  };
  return processMsg(claimed);
}

// ─── A. application.persist — happy path ─────────────────────────────────────

describe('QueueWorkerService — application.persist', () => {
  let worker: QueueWorkerService;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let tenantRepo: ReturnType<typeof makeRepo>;
  let consumerRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    ({ worker, applicationRepo, tenantRepo, consumerRepo } = await buildWorker());
  });

  it('persists new application from queue payload', async () => {
    applicationRepo.findOne.mockResolvedValue(null); // not yet persisted
    applicationRepo.create.mockReturnValue(testApplication());
    applicationRepo.save.mockResolvedValue(testApplication());
    tenantRepo.findOne.mockResolvedValue(testTenant());
    consumerRepo.findOne.mockResolvedValue(testConsumerUser());

    await processMessage(worker, 'application.persist', {
      applicationId: TEST_APPLICATION_ID,
      tenantId: TEST_TENANT_ID,
      serviceId: TEST_SERVICE_ID,
      consumerId: TEST_CONSUMER_ID,
      consumerSource: 'direct',
      formData: { full_name: 'Test Citizen' },
      eligibilityResult: {
        version: 1,
        mode: 'human_review',
        outcome: 'review_required',
        requiresHumanDecision: true,
        results: [],
      },
      status: 'submitted',
      currentStage: 'Submitted',
      trackingNumber: 'TRK-2026-000001',
      idempotencyKey: null,
    });

    expect(applicationRepo.save).toHaveBeenCalled();
    expect(applicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      eligibility_result: expect.objectContaining({
        outcome: 'review_required',
        requiresHumanDecision: true,
      }),
    }));
  });

  it('skips write when application already exists (idempotent)', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication()); // already persisted
    tenantRepo.findOne.mockResolvedValue(testTenant());
    consumerRepo.findOne.mockResolvedValue(testConsumerUser());

    await processMessage(worker, 'application.persist', {
      applicationId: TEST_APPLICATION_ID,
      tenantId: TEST_TENANT_ID,
      serviceId: TEST_SERVICE_ID,
      consumerId: TEST_CONSUMER_ID,
      consumerSource: 'direct',
      formData: {},
      status: 'submitted',
      currentStage: 'Submitted',
      trackingNumber: 'TRK-2026-000001',
      idempotencyKey: null,
    });

    expect(applicationRepo.save).not.toHaveBeenCalled(); // idempotency: skip if exists
  });
});

// ─── B. service.persist.create ───────────────────────────────────────────────

describe('QueueWorkerService — service.persist.create', () => {
  let worker: QueueWorkerService;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    ({ worker, serviceRepo } = await buildWorker());
  });

  it('creates a new service from the queue payload', async () => {
    serviceRepo.findOne.mockResolvedValue(null); // not yet created
    serviceRepo.create.mockReturnValue(testTenantService());
    serviceRepo.save.mockResolvedValue(testTenantService());

    await processMessage(worker, 'service.persist.create', {
      serviceId: TEST_SERVICE_ID,
      tenantId: TEST_TENANT_ID,
      name: 'Driving Licence',
      category: 'transport',
      description: 'Apply for driving licence',
      formSchema: { fields: [] },
      workflowConfig: { stages: ['submitted'] },
      published: false,
      slaDays: 30,
      fees: 500,
    });

    expect(serviceRepo.save).toHaveBeenCalled();
  });

  it('skips create when service already exists (idempotent)', async () => {
    serviceRepo.findOne.mockResolvedValue(testTenantService()); // already exists

    await processMessage(worker, 'service.persist.create', {
      serviceId: TEST_SERVICE_ID,
      tenantId: TEST_TENANT_ID,
      name: 'Duplicate Service',
      category: 'test',
      formSchema: {},
      workflowConfig: {},
    });

    expect(serviceRepo.save).not.toHaveBeenCalled();
  });
});

describe('QueueWorkerService — service.persist.update publication boundary', () => {
  it('cannot publish a draft through a queued update command', async () => {
    const { worker, serviceRepo } = await buildWorker();
    const draft = testTenantService({ published: false, archived: false });
    serviceRepo.findOne.mockResolvedValue(draft);

    await processMessage(worker, 'service.persist.update', {
      serviceId: TEST_SERVICE_ID,
      tenantId: TEST_TENANT_ID,
      published: true,
      name: 'Edited draft',
    });

    expect(serviceRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Edited draft',
      published: false,
    }));
  });
});

// ─── C. service.persist.delete ───────────────────────────────────────────────

describe('QueueWorkerService — service.persist.delete', () => {
  let worker: QueueWorkerService;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    ({ worker, serviceRepo } = await buildWorker());
  });

  it('archives service when it exists', async () => {
    const svc = testTenantService();
    serviceRepo.findOne.mockResolvedValue(svc);
    serviceRepo.save = jest.fn().mockImplementation(async (value) => value);

    await processMessage(worker, 'service.persist.delete', {
      serviceId: TEST_SERVICE_ID,
      tenantId: TEST_TENANT_ID,
    });

    expect(serviceRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      id: TEST_SERVICE_ID,
      published: false,
      archived: true,
    }));
  });

  it('is idempotent — does not throw when service already deleted', async () => {
    serviceRepo.findOne.mockResolvedValue(null); // already deleted
    serviceRepo.remove = jest.fn();

    await expect(
      processMessage(worker, 'service.persist.delete', {
        serviceId: TEST_SERVICE_ID,
        tenantId: TEST_TENANT_ID,
      }),
    ).resolves.not.toThrow();

    expect(serviceRepo.remove).not.toHaveBeenCalled();
  });
});

// ─── D. audit.log — non-fatal failure ────────────────────────────────────────

describe('QueueWorkerService — audit.log', () => {
  let worker: QueueWorkerService;
  let auditLogRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    ({ worker, auditLogRepo } = await buildWorker());
  });

  it('persists audit log entry', async () => {
    auditLogRepo.create.mockReturnValue({ event_type: 'auth.login.success' });
    auditLogRepo.save.mockResolvedValue({ id: 'audit-001' });

    await processMessage(worker, 'audit.log', {
      eventType: 'auth.login.success',
      actorId: TEST_TENANT_ID,
      actorRole: 'admin',
      tenantId: TEST_TENANT_ID,
      ipAddress: '127.0.0.1',
      success: true,
    });

    expect(auditLogRepo.save).toHaveBeenCalled();
  });

  it('does NOT rethrow when audit log save fails (non-fatal)', async () => {
    auditLogRepo.create.mockReturnValue({});
    auditLogRepo.save.mockRejectedValue(new Error('DB constraint violation'));

    // Must NOT throw — audit failure should be swallowed
    await expect(
      processMessage(worker, 'audit.log', {
        eventType: 'auth.login.success',
        actorId: TEST_TENANT_ID,
        actorRole: 'admin',
        tenantId: TEST_TENANT_ID,
        success: true,
      }),
    ).resolves.not.toThrow();
  });
});

// ─── E. Unknown message type ─────────────────────────────────────────────────

describe('QueueWorkerService — unknown message type', () => {
  it('does not throw for unregistered message types', async () => {
    const { worker } = await buildWorker();

    await expect(
      processMessage(worker, 'completely.unknown.type', { data: 'test' }),
    ).resolves.not.toThrow();
  });
});

// ─── F. Metrics on failure ────────────────────────────────────────────────────

describe('QueueWorkerService — metrics on handler failure', () => {
  it('records queue failure metric when handler throws', async () => {
    const { worker, applicationRepo, metrics } = await buildWorker();

    // Make application lookup throw a DB error
    applicationRepo.findOne.mockRejectedValue(new Error('Database connection lost'));

    await expect(
      processMessage(worker, 'application.persist', {
        applicationId: TEST_APPLICATION_ID,
        tenantId: TEST_TENANT_ID,
        serviceId: TEST_SERVICE_ID,
        consumerId: TEST_CONSUMER_ID,
        consumerSource: 'direct',
        formData: {},
        status: 'submitted',
        currentStage: 'Submitted',
        trackingNumber: 'TRK-2026-000001',
        idempotencyKey: null,
      }),
    ).rejects.toThrow('Database connection lost');

    expect(metrics.recordQueueFailed).toHaveBeenCalledWith('application.persist');
  });
});
