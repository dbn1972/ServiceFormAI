/**
 * Backend Integration Tests — Schema Versioning (Task 16.1)
 *
 * Tests:
 *  (a) Submit application with matching X-Schema-Version → HTTP 201 success
 *  (b) Submit application with old X-Schema-Version → HTTP 409 with conflict body
 *  (c) Submit application without X-Schema-Version → HTTP 201 (backward compatible)
 *  (d) PUT /producer/services/:id increments schema_version and retains last 2 history entries
 *  (e) After 3 schema updates, schema_version_history has exactly 2 entries
 *
 * Validates: Requirements 6.6, 13.1, 13.2, 13.3, 13.4, 13.5
 *
 * Run: cd backend && npx jest consumer-schema-versioning.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { ProducerController } from '../producer/producer.controller';
import { ProducerService } from '../producer/producer.service';
import { FormValidationGuard } from '../validation/validation.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { ConsentService } from '../consent/consent.service';
import { TenantService as TenantDomainService } from '../tenant/tenant.service';
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
import { TenantUser } from '../database/entities/tenant-user.entity';
import { Tenant } from '../database/entities/tenant.entity';

import {
  makeRepo,
  makeMockCache,
  makeMockQueue,
  makeMockConsent,
  makeMockTenantDomainService,
  consumerToken,
  adminToken,
  TEST_TENANT_ID,
  TEST_SERVICE_ID,
  TEST_CONSUMER_ID,
  testTenantService,
  testApplication,
} from '../test/test-helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeServiceWithVersion(version: number, history: any[] = []) {
  return testTenantService({
    schema_version: version,
    schema_version_history: history,
    form_schema: {
      version: '1.0',
      fields: [
        { id: 'full_name', type: 'text', label: 'Full Name', required: false },
        { id: 'dob', type: 'date', label: 'Date of Birth', required: false },
      ],
    },
  });
}

// ─── App factory ─────────────────────────────────────────────────────────────

async function createApp() {
  const serviceRepo = makeRepo();
  const applicationRepo = makeRepo();
  const applicationEventRepo = makeRepo();
  const applicationDeficiencyRepo = makeRepo();
  const grievanceRepo = makeRepo();
  const appealRepo = makeRepo();
  const feedbackRepo = makeRepo();
  const consumerUserRepo = makeRepo();
  const tenantUserRepo = makeRepo();
  const tenantRepo = makeRepo();
  const mockQueue = makeMockQueue();
  const mockCache = makeMockCache();
  const mockConsent = makeMockConsent();
  const mockTenantDomain = makeMockTenantDomainService();
  const mockPaymentService = {
    assertPaymentCompleted: jest.fn().mockResolvedValue(undefined),
    getPaymentByApplication: jest.fn().mockResolvedValue(null),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback({
      getRepository: (entity) => entity === TenantServiceEntity ? serviceRepo : makeRepo(),
    })),
  };

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [ConsumerController, ProducerController],
    providers: [
      ConsumerService,
      ProducerService,
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
      { provide: getRepositoryToken(ApplicationOutput), useValue: makeRepo() },
      { provide: getRepositoryToken(ConsumerUser), useValue: consumerUserRepo },
      { provide: getRepositoryToken(TenantUser), useValue: tenantUserRepo },
      { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
      { provide: CacheService, useValue: mockCache },
      { provide: QueueService, useValue: mockQueue },
      { provide: ConsentService, useValue: mockConsent },
      { provide: TenantDomainService, useValue: mockTenantDomain },
      { provide: PaymentService, useValue: mockPaymentService },
      { provide: getDataSourceToken(), useValue: dataSource },
      { provide: TenantStaffAuthGuard, useValue: { canActivate: () => true } },
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, serviceRepo, applicationRepo, consumerUserRepo, mockQueue, mockCache };
}

// ─── (a) Matching schema version → 201 ───────────────────────────────────────

describe('Schema versioning — matching version succeeds', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications with matching X-Schema-Version returns 201', async () => {
    const service = makeServiceWithVersion(3);
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);
    applicationRepo.create.mockReturnValue(testApplication());
    applicationRepo.save.mockResolvedValue(testApplication());

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Schema-Version', '3')
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Rahul Sharma' } });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ status: 'submitted' });
  });

  it('POST /consumer/applications with matching schemaVersion in body returns 201', async () => {
    const service = makeServiceWithVersion(2);
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);
    applicationRepo.create.mockReturnValue(testApplication());
    applicationRepo.save.mockResolvedValue(testApplication());

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Priya Patel' }, schemaVersion: 2 });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
  });
});

// ─── (b) Old schema version → 409 ────────────────────────────────────────────

describe('Schema versioning — mismatched version returns 409', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications with old X-Schema-Version returns 409 with conflict body', async () => {
    const oldSchema = {
      version: '1.0',
      fields: [
        { id: 'full_name', type: 'text', label: 'Full Name', required: false },
      ],
    };
    const service = makeServiceWithVersion(3, [
      { version: 1, schema: oldSchema, updatedAt: '2024-01-01T00:00:00.000Z' },
      { version: 2, schema: oldSchema, updatedAt: '2024-02-01T00:00:00.000Z' },
    ]);
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Schema-Version', '2')
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Rahul Sharma' } });

    expect(res.status).toBe(HttpStatus.CONFLICT);
    const body = res.body;
    // NestJS wraps ConflictException response in the message field
    const conflictData = body.message ?? body;
    expect(conflictData).toMatchObject({
      statusCode: 409,
      error: 'Schema version mismatch',
      currentVersion: 3,
      submittedVersion: 2,
    });
    expect(Array.isArray(conflictData.changes)).toBe(true);
  });

  it('409 response includes changes array with added field', async () => {
    const oldSchema = {
      version: '1.0',
      fields: [
        { id: 'full_name', type: 'text', label: 'Full Name', required: false },
      ],
    };
    // Current schema has an extra field 'dob'
    const service = {
      ...makeServiceWithVersion(2, [
        { version: 1, schema: oldSchema, updatedAt: '2024-01-01T00:00:00.000Z' },
      ]),
      form_schema: {
        version: '1.0',
        fields: [
          { id: 'full_name', type: 'text', label: 'Full Name', required: false },
          { id: 'dob', type: 'date', label: 'Date of Birth', required: false },
        ],
      },
    };
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Schema-Version', '1')
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Rahul Sharma' } });

    expect(res.status).toBe(HttpStatus.CONFLICT);
    const conflictData = res.body.message ?? res.body;
    const changes = conflictData.changes as any[];
    const addedChange = changes.find((c: any) => c.field === 'dob');
    expect(addedChange).toBeDefined();
    expect(addedChange.change).toBe('added');
  });

  it('409 response has null changes when submitted version is too old (not in history)', async () => {
    const service = makeServiceWithVersion(5, [
      { version: 3, schema: { fields: [] }, updatedAt: '2024-01-01T00:00:00.000Z' },
      { version: 4, schema: { fields: [] }, updatedAt: '2024-02-01T00:00:00.000Z' },
    ]);
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Schema-Version', '1')
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Rahul Sharma' } });

    expect(res.status).toBe(HttpStatus.CONFLICT);
    const conflictData = res.body.message ?? res.body;
    expect(conflictData.changes).toBeNull();
  });
});

// ─── (c) No schema version → 201 (backward compatible) ───────────────────────

describe('Schema versioning — no version header is backward compatible', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;
  let applicationRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
    applicationRepo = setup.applicationRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /consumer/applications without X-Schema-Version returns 201', async () => {
    const service = makeServiceWithVersion(3);
    serviceRepo.findOne.mockResolvedValue(service);
    applicationRepo.findOne.mockResolvedValue(null);
    applicationRepo.create.mockReturnValue(testApplication());
    applicationRepo.save.mockResolvedValue(testApplication());

    const token = consumerToken(TEST_CONSUMER_ID);

    const res = await request(app.getHttpServer())
      .post('/consumer/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: TEST_SERVICE_ID, formData: { full_name: 'Rahul Sharma' } });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
  });
});

// ─── (d) PUT /producer/services/:id increments schema_version ────────────────

describe('Schema versioning — producer service update increments version', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('PUT /producer/services/:id increments schema_version when formSchema changes', async () => {
    const initialService = {
      ...makeServiceWithVersion(1, []),
      id: TEST_SERVICE_ID,
      tenant_id: TEST_TENANT_ID,
      published: false,
    };

    serviceRepo.findOne.mockResolvedValue({ ...initialService });
    serviceRepo.save.mockImplementation((s: any) => Promise.resolve(s));

    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .put(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        formSchema: {
          version: '1.0',
          fields: [
            { id: 'full_name', type: 'text', label: 'Full Name', required: true },
            { id: 'email', type: 'email', label: 'Email', required: false },
          ],
        },
      });

    expect(res.status).toBe(HttpStatus.OK);

    // Verify save was called with incremented schema_version
    expect(serviceRepo.save).toHaveBeenCalled();
    const savedService = serviceRepo.save.mock.calls[0][0];
    expect(savedService.schema_version).toBe(2);
    expect(Array.isArray(savedService.schema_version_history)).toBe(true);
    expect(savedService.schema_version_history).toHaveLength(1);
    expect(savedService.schema_version_history[0].version).toBe(1);
  });

  it('PUT /producer/services/:id does NOT increment schema_version when formSchema is not changed', async () => {
    const initialService = {
      ...makeServiceWithVersion(2, [{ version: 1, schema: {}, updatedAt: '2024-01-01T00:00:00.000Z' }]),
      id: TEST_SERVICE_ID,
      tenant_id: TEST_TENANT_ID,
      published: false,
    };

    serviceRepo.findOne.mockResolvedValue({ ...initialService });
    serviceRepo.save.mockImplementation((s: any) => Promise.resolve(s));

    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .put(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name Only' });

    expect(res.status).toBe(HttpStatus.OK);

    const savedService = serviceRepo.save.mock.calls[0][0];
    // schema_version should remain 2 since formSchema was not updated
    expect(savedService.schema_version).toBe(2);
  });
});

// ─── (e) After 3 schema updates, history has exactly 2 entries ───────────────

describe('Schema versioning — history trimmed to last 2 entries', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('after 3 schema updates, schema_version_history has exactly 2 entries', async () => {
    // Simulate a service that has already been updated twice (history has 2 entries)
    const serviceAfterTwoUpdates = {
      ...makeServiceWithVersion(3, [
        { version: 1, schema: { fields: [{ id: 'f1', type: 'text', label: 'F1' }] }, updatedAt: '2024-01-01T00:00:00.000Z' },
        { version: 2, schema: { fields: [{ id: 'f1', type: 'text', label: 'F1' }, { id: 'f2', type: 'text', label: 'F2' }] }, updatedAt: '2024-02-01T00:00:00.000Z' },
      ]),
      id: TEST_SERVICE_ID,
      tenant_id: TEST_TENANT_ID,
      published: false,
    };

    serviceRepo.findOne.mockResolvedValue({ ...serviceAfterTwoUpdates });
    serviceRepo.save.mockImplementation((s: any) => Promise.resolve(s));

    const token = adminToken(TEST_TENANT_ID);

    // Third update
    const res = await request(app.getHttpServer())
      .put(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        formSchema: {
          version: '1.0',
          fields: [
            { id: 'f1', type: 'text', label: 'F1' },
            { id: 'f2', type: 'text', label: 'F2' },
            { id: 'f3', type: 'text', label: 'F3' },
          ],
        },
      });

    expect(res.status).toBe(HttpStatus.OK);

    const savedService = serviceRepo.save.mock.calls[0][0];
    expect(savedService.schema_version).toBe(4);
    // History must be trimmed to last 2 entries
    expect(savedService.schema_version_history).toHaveLength(2);
    // The oldest entry (version 1) should have been evicted
    const versions = savedService.schema_version_history.map((s: any) => s.version);
    expect(versions).not.toContain(1);
    expect(versions).toContain(2);
    expect(versions).toContain(3);
  });
});

// ─── (f) GET /consumer/services/:id includes schema_version ──────────────────

describe('Schema versioning — GET service includes schema_version', () => {
  let app: INestApplication;
  let serviceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createApp();
    app = setup.app;
    serviceRepo = setup.serviceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('GET /consumer/services/:id response includes schema_version', async () => {
    const service = makeServiceWithVersion(5);
    serviceRepo.findOne.mockResolvedValue(service);

    const res = await request(app.getHttpServer())
      .get(`/consumer/services/${TEST_SERVICE_ID}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.data).toHaveProperty('schema_version', 5);
  });

  it('GET /consumer/services/:id defaults schema_version to 1 when not set', async () => {
    const service = { ...testTenantService(), schema_version: undefined };
    serviceRepo.findOne.mockResolvedValue(service);

    const res = await request(app.getHttpServer())
      .get(`/consumer/services/${TEST_SERVICE_ID}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.data).toHaveProperty('schema_version', 1);
  });
});
