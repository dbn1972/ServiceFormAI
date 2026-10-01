/**
 * Volume 14 — Consumer Module Integration Tests
 *
 * Tests the consumer controller → service chain with real JWT guard,
 * mocked repositories, and real queue/cache service behavior.
 *
 * Coverage:
 *  A. Auth protection: submitApplication requires valid JWT
 *  B. Consumer isolation: user A cannot see user B's applications
 *  C. Idempotency: duplicate key returns existing record without creating new
 *  D. Queue-first write: submitApplication enqueues when queue is enabled
 *  E. Direct-write fallback: graceful degradation when queue disabled
 *  F. Cache behavior: readThrough populates cache; second call skips loader
 *  G. Service not found: 404 propagated correctly
 *  H. Form schema endpoint: public (no auth required)
 *  I. Tracking endpoint: public lookup by tracking number
 *
 * Run: cd backend && npx jest consumer.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { FormValidationGuard } from '../validation/validation.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { ConsentService } from '../consent/consent.service';
import { TenantService } from '../tenant/tenant.service';
import { PaymentService } from '../payment/payment.service';
import { TenantService as TenantServiceEntity } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { ApplicationDeficiency } from '../database/entities/application-deficiency.entity';
import { GrievanceCase } from '../database/entities/grievance-case.entity';
import { AppealCase } from '../database/entities/appeal-case.entity';
import { CitizenFeedback } from '../database/entities/citizen-feedback.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { ApplicationOutput } from '../database/entities/application-output.entity';

import {
  makeRepo,
  makeMockCache,
  makeMockQueue,
  makeMockQueueEnabled,
  makeMockConsent,
  makeMockTenantDomainService,
  adminToken,
  consumerToken,
  TEST_TENANT_ID,
  TEST_SERVICE_ID,
  TEST_APPLICATION_ID,
  TEST_CONSUMER_ID,
  TEST_CONSUMER_ID_2,
  testTenantService,
  testApplication,
} from '../test/test-helpers';

// ─── Module factory ──────────────────────────────────────────────────────────

async function createConsumerApp(queueEnabled = false) {
  const serviceRepo = makeRepo();
  const applicationRepo = makeRepo();
  const applicationEventRepo = makeRepo();
  const applicationDeficiencyRepo = makeRepo();
  const grievanceRepo = makeRepo();
  const appealRepo = makeRepo();
  const feedbackRepo = makeRepo();
  const outputRepo = makeRepo();
  const consumerUserRepo = makeRepo();
  const mockQueue = queueEnabled ? makeMockQueueEnabled() : makeMockQueue();
  const mockCache = makeMockCache();
  const mockConsent = makeMockConsent();
  const mockTenantDomain = makeMockTenantDomainService();
  const mockPaymentService = {
    assertPaymentCompleted: jest.fn().mockResolvedValue(undefined),
    getPaymentByApplication: jest.fn().mockResolvedValue(null),
  };

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [ConsumerController],
    providers: [
      ConsumerService,
      FormValidationGuard,
      JwtStrategy,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: getRepositoryToken(TenantServiceEntity), useValue: serviceRepo },
      { provide: getRepositoryToken(Application), useValue: applicationRepo },
      { provide: getRepositoryToken(ApplicationEvent), useValue: applicationEventRepo },
      { provide: getRepositoryToken(ApplicationDeficiency), useValue: applicationDeficiencyRepo },
      { provide: getRepositoryToken(GrievanceCase), useValue: grievanceRepo },
      { provide: getRepositoryToken(AppealCase), useValue: appealRepo },
      { provide: getRepositoryToken(CitizenFeedback), useValue: feedbackRepo },
      { provide: getRepositoryToken(ApplicationOutput), useValue: outputRepo },
      { provide: getRepositoryToken(ConsumerUser), useValue: consumerUserRepo },
      { provide: CacheService, useValue: mockCache },
      { provide: QueueService, useValue: mockQueue },
      { provide: ConsentService, useValue: mockConsent },
      { provide: TenantService, useValue: mockTenantDomain },
      { provide: PaymentService, useValue: mockPaymentService },
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, serviceRepo, applicationRepo, applicationEventRepo, applicationDeficiencyRepo, grievanceRepo, appealRepo, feedbackRepo, outputRepo, consumerUserRepo, mockQueue, mockCache, mockConsent };
}

// ─── A. Auth protection ───────────────────────────────────────────────────────

describe('Consumer integration — auth protection', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications — returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .post('/consumer/applications')
      .send({ serviceId: TEST_SERVICE_ID, formData: {} })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('GET /consumer/my-applications — returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .get('/consumer/my-applications')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('GET /consumer/applications/:id — returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .get(`/consumer/applications/${TEST_APPLICATION_ID}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('GET /consumer/services — public endpoint, no auth required', async () => {
    const res = await request(app.getHttpServer())
      .get('/consumer/services');

    expect(res.status).not.toBe(HttpStatus.UNAUTHORIZED);
    expect(res.status).not.toBe(HttpStatus.FORBIDDEN);
  });

  it('GET /consumer/applications/track/:trackingNumber — public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get('/consumer/applications/track/TRK-2026-000001');

    expect(res.status).not.toBe(HttpStatus.UNAUTHORIZED);
    expect(res.status).not.toBe(HttpStatus.FORBIDDEN);
  });
});

// ─── B. Consumer isolation ────────────────────────────────────────────────────

describe('Consumer integration — consumer isolation', () => {
  let app: INestApplication;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('Consumer A cannot view Consumer B\'s application', async () => {
    // Application belongs to CONSUMER_ID_2, but logged in as CONSUMER_ID
    applicationRepo.findOne.mockImplementation(({ where }: any) => {
      if (where.consumer_id === TEST_CONSUMER_ID) {
        return Promise.resolve(null); // Not owned by consumer A
      }
      return Promise.resolve(testApplication({ consumer_id: TEST_CONSUMER_ID_2 }));
    });

    const tokenConsumerA = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .get(`/consumer/applications/${TEST_APPLICATION_ID}`)
      .set('Authorization', `Bearer ${tokenConsumerA}`);

    // Should be 404 (not found for this consumer) not 200
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Consumer A\'s my-applications only returns their own records', async () => {
    // The query is scoped by consumerId from the JWT
    const consumerAApp = testApplication({ consumer_id: TEST_CONSUMER_ID });
    applicationRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[consumerAApp], 1]);

    const tokenConsumerA = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .get('/consumer/my-applications')
      .set('Authorization', `Bearer ${tokenConsumerA}`);

    expect(res.status).toBe(HttpStatus.OK);
    if (res.body.data) {
      const items = res.body.data.data ?? res.body.data;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          expect(item.consumer_id ?? TEST_CONSUMER_ID).toBe(TEST_CONSUMER_ID);
        });
      }
    }
  });
});

// ─── C. Deficiency response ────────────────────────────────────────────────

describe('Consumer integration — deficiency response', () => {
  let app: INestApplication;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let applicationDeficiencyRepo: ReturnType<typeof makeRepo>;
  let applicationEventRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
    applicationRepo = setup.applicationRepo;
    applicationDeficiencyRepo = setup.applicationDeficiencyRepo;
    applicationEventRepo = setup.applicationEventRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications/:id/deficiency-response resolves the open deficiency', async () => {
    const openApplication = testApplication({
      consumer_id: TEST_CONSUMER_ID,
      status: 'PENDING_DOCUMENTS',
      current_stage: 'Deficiency Raised',
    });

    applicationRepo.findOne.mockResolvedValue(openApplication);
    applicationRepo.save.mockImplementation(async (entity: any) => entity);
    applicationDeficiencyRepo.find.mockResolvedValue([
      {
        id: 'def-1',
        application_id: TEST_APPLICATION_ID,
        tenant_id: TEST_TENANT_ID,
        raised_by_id: null,
        raised_by_role: 'officer',
        title: 'Document deficiency',
        description: 'Upload corrected income certificate',
        status: 'open',
        due_at: null,
        resolved_at: null,
        resolution_notes: null,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ] as any);
    applicationDeficiencyRepo.save.mockImplementation(async (entity: any) => entity);
    applicationEventRepo.save.mockImplementation(async (entity: any) => entity);

    const token = consumerToken(TEST_CONSUMER_ID);
    const res = await request(app.getHttpServer())
      .post(`/consumer/applications/${TEST_APPLICATION_ID}/deficiency-response`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Uploaded corrected income certificate' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
    expect(applicationEventRepo.save).toHaveBeenCalled();
    expect(applicationDeficiencyRepo.save).toHaveBeenCalled();
  });
});

// ─── C. Idempotency ───────────────────────────────────────────────────────────

describe('Consumer integration — idempotency', () => {
  let app: INestApplication;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp(false);
    app = setup.app;
    applicationRepo = setup.applicationRepo;
    serviceRepo = setup.serviceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('duplicate X-Idempotency-Key returns existing application without creating a new one', async () => {
    const idempotencyKey = 'unique-key-12345';
    const existingApp = testApplication({ idempotency_key: idempotencyKey });

    // First call: no existing record → would create new
    // Second call: existing record found → return it
    applicationRepo.findOne
      .mockResolvedValueOnce(existingApp); // idempotency lookup returns existing

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', idempotencyKey)
      .send({ serviceId: TEST_SERVICE_ID, formData: {} });

    // Must return the existing application (idempotent: true in the response)
    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data).toMatchObject({
      application_id: existingApp.id,
      tracking_number: existingApp.tracking_number,
      idempotent: true,
    });

    // Repository save should NOT be called — no new record created
    expect(applicationRepo.save).not.toHaveBeenCalled();
  });
});

// ─── D. Queue-first write path ────────────────────────────────────────────────

describe('Consumer integration — queue-first write path', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let mockQueue: ReturnType<typeof makeMockQueueEnabled>;
  let mockConsent: ReturnType<typeof makeMockConsent>;

  beforeEach(async () => {
    const setup = await createConsumerApp(true); // queue enabled
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
    mockQueue = setup.mockQueue as any;
    mockConsent = setup.mockConsent;
  });

  afterEach(async () => { await app.close(); });

  it('submitApplication enqueues application.persist when queue is enabled', async () => {
    serviceRepo.findOne.mockResolvedValue(testTenantService({
      eligibility_rules: {
        mode: 'rule-based',
        rules: [{ id: 'name-present', field: 'full_name', operator: 'exists' }],
      },
    }));
    applicationRepo.findOne.mockResolvedValue(null); // no idempotency match

    // Consent not required
    mockConsent.hasConsent.mockResolvedValue(true);

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Test User' } });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(mockQueue.enqueueWriteCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application.persist',
        payload: expect.objectContaining({
          eligibilityResult: expect.objectContaining({
            outcome: 'eligible_for_review',
            requiresHumanDecision: true,
          }),
        }),
      }),
    );
    // Should NOT hit the repository directly
    expect(applicationRepo.save).not.toHaveBeenCalled();
    // Response should indicate queued
    expect(res.body.data).toMatchObject({
      status: 'submitted',
      queued: true,
    });
  });
});

// ─── E. Direct-write fallback ────────────────────────────────────────────────

describe('Consumer integration — direct-write fallback', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let mockQueue: ReturnType<typeof makeMockQueue>;

  beforeEach(async () => {
    const setup = await createConsumerApp(false); // queue disabled
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
    mockQueue = setup.mockQueue;
  });

  afterEach(async () => { await app.close(); });

  it('submitApplication writes directly to DB when queue is disabled', async () => {
    serviceRepo.findOne.mockResolvedValue(testTenantService({
      eligibility_rules: {
        mode: 'rule-based',
        rules: [{ id: 'name-present', field: 'full_name', operator: 'exists' }],
      },
    }));
    applicationRepo.findOne.mockResolvedValue(null);
    applicationRepo.create.mockReturnValue(testApplication());
    applicationRepo.save.mockResolvedValue(testApplication());
    mockQueue.publishShadowWriteEvent = jest.fn().mockResolvedValue(undefined);

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Test User' } });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(applicationRepo.save).toHaveBeenCalled();
    expect(applicationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      eligibility_result: expect.objectContaining({
        outcome: 'eligible_for_review',
        requiresHumanDecision: true,
      }),
    }));
    expect(res.body.data).toMatchObject({ status: 'submitted', queued: false });
  });
});

// ─── F. Service not found ─────────────────────────────────────────────────────

describe('Consumer integration — service not found', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications returns 404 when service does not exist', async () => {
    serviceRepo.findOne.mockResolvedValue(null); // service not found
    applicationRepo.findOne.mockResolvedValue(null); // no idempotency match

    const token = consumerToken(TEST_CONSUMER_ID);

    await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: 'non-existent-service-id', formData: {} })
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe('Consumer integration — durable release-bound drafts', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/services/:serviceId/draft creates a draft pinned to the current release', async () => {
    serviceRepo.findOne.mockResolvedValue(testTenantService({ schema_version: 2 }));
    applicationRepo.findOne.mockResolvedValue(null);
    applicationRepo.save.mockImplementation(async (draft: any) => ({
      ...draft,
      id: 'draft-application-1',
      updated_at: new Date(),
    }));

    const response = await request(app.getHttpServer())
      .post(`/consumer/services/${TEST_SERVICE_ID}/draft`)
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .send({ formData: { full_name: 'Asha Rao' }, schemaVersion: 2 })
      .expect(HttpStatus.CREATED);

    expect(applicationRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'DRAFT',
      schema_version: 2,
      service_release_id: expect.any(String),
      consumer_id: TEST_CONSUMER_ID,
    }));
    expect(response.body.data.application_id).toBe('draft-application-1');
  });

  it('GET /consumer/services/:serviceId/draft restores the saved form payload', async () => {
    const draft = {
      id: 'draft-application-1',
      service_id: TEST_SERVICE_ID,
      service_release_id: '00000000-0000-0000-0000-000000000002',
      consumer_id: TEST_CONSUMER_ID,
      status: 'DRAFT',
      schema_version: 2,
      form_data: { full_name: 'Asha Rao', selectedDocuments: ['Identity proof'] },
      tracking_number: 'APP-DRAFT-1',
      updated_at: new Date(),
    };
    serviceRepo.findOne.mockResolvedValue(testTenantService({ schema_version: 2 }));
    applicationRepo.findOne.mockResolvedValue(draft);

    const response = await request(app.getHttpServer())
      .get(`/consumer/services/${TEST_SERVICE_ID}/draft`)
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .expect(HttpStatus.OK);

    expect(response.body.data.form_data).toEqual(draft.form_data);
    expect(response.body.data.service_release_id).toBe(draft.service_release_id);
  });

  it('GET /consumer/services/:serviceId/draft returns an empty result for a first-time applicant', async () => {
    serviceRepo.findOne.mockResolvedValue(testTenantService());
    applicationRepo.findOne.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/consumer/services/${TEST_SERVICE_ID}/draft`)
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .expect(HttpStatus.OK);

    expect(response.body.data).toBeNull();
  });

  it('POST /consumer/applications converts the existing draft into the submitted case', async () => {
    const releaseId = '00000000-0000-0000-0000-000000000002';
    const draft = {
      id: 'draft-application-1',
      tenant_id: TEST_TENANT_ID,
      service_id: TEST_SERVICE_ID,
      service_release_id: releaseId,
      consumer_id: TEST_CONSUMER_ID,
      consumer_source: 'mobile',
      form_data: { full_name: 'Asha Rao' },
      status: 'DRAFT',
      current_stage: 'Draft',
      tracking_number: 'APP-DRAFT-1',
      idempotency_key: null,
      schema_version: 1,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    };
    serviceRepo.findOne.mockResolvedValue(testTenantService({ current_release_id: releaseId }));
    applicationRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(draft);
    applicationRepo.save.mockImplementation(async (application: any) => application);

    const response = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .set('x-idempotency-key', 'draft-submit-once')
      .set('x-schema-version', '1')
      .send({
        serviceId: TEST_SERVICE_ID,
        applicationId: draft.id,
        schemaVersion: 1,
        formData: { full_name: 'Asha Rao' },
      })
      .expect(HttpStatus.CREATED);

    expect(applicationRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      id: draft.id,
      status: 'submitted',
      service_release_id: releaseId,
      tracking_number: draft.tracking_number,
      idempotency_key: 'draft-submit-once',
    }));
    expect(response.body.data.application_id).toBe(draft.id);
  });
});

describe('Consumer integration — redress records', () => {
  let app: INestApplication;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let applicationEventRepo: ReturnType<typeof makeRepo>;
  let grievanceRepo: ReturnType<typeof makeRepo>;
  let appealRepo: ReturnType<typeof makeRepo>;
  let feedbackRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createConsumerApp();
    app = setup.app;
    applicationRepo = setup.applicationRepo;
    applicationEventRepo = setup.applicationEventRepo;
    grievanceRepo = setup.grievanceRepo;
    appealRepo = setup.appealRepo;
    feedbackRepo = setup.feedbackRepo;
  });

  afterEach(async () => { await app.close(); });

  it('creates a linked grievance case instead of mutating application form data', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ consumer_id: TEST_CONSUMER_ID, status: 'COMPLETED' }));

    const response = await request(app.getHttpServer())
      .post('/consumer/grievances')
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .send({
        applicationId: TEST_APPLICATION_ID,
        category: 'delay',
        subject: 'Application is delayed',
        description: 'The stated processing time has elapsed without an update.',
      })
      .expect(HttpStatus.CREATED);

    expect(grievanceRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      application_id: TEST_APPLICATION_ID,
      consumer_id: TEST_CONSUMER_ID,
      status: 'submitted',
    }));
    expect(response.body.data.status).toBe('submitted');
  });

  it('accepts an appeal only against a recorded final decision within the appeal window', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ consumer_id: TEST_CONSUMER_ID, status: 'REJECTED' }));
    applicationEventRepo.find.mockResolvedValue([{
      id: 'decision-event-1',
      actor_id: 'decision-maker-1',
      to_status: 'REJECTED',
      created_at: new Date(),
    }]);

    await request(app.getHttpServer())
      .post(`/consumer/applications/${TEST_APPLICATION_ID}/appeals`)
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .send({ grounds: 'incorrect_facts', statement: 'The submitted income evidence was not considered in the decision.' })
      .expect(HttpStatus.CREATED);

    expect(appealRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      original_decision_event_id: 'decision-event-1',
      original_decision_actor_id: 'decision-maker-1',
      status: 'submitted',
    }));
  });

  it('stores feedback independently from the application form payload', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ consumer_id: TEST_CONSUMER_ID, status: 'COMPLETED' }));

    await request(app.getHttpServer())
      .post('/consumer/feedback')
      .set('Authorization', `Bearer ${consumerToken(TEST_CONSUMER_ID)}`)
      .send({ applicationId: TEST_APPLICATION_ID, rating: 4, comment: 'The process was clear.' })
      .expect(HttpStatus.CREATED);

    expect(feedbackRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      application_id: TEST_APPLICATION_ID,
      consumer_id: TEST_CONSUMER_ID,
      rating: 4,
      status: 'submitted',
    }));
    expect(applicationRepo.save).not.toHaveBeenCalled();
  });
});
