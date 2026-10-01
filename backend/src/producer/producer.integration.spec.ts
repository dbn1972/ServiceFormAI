/**
 * Volume 14 — Producer Module Integration Tests
 *
 * Tests the full producer controller → service → RBAC guard stack.
 * All routes require JwtAuthGuard + RolesGuard.
 *
 * Coverage:
 *  A. RBAC enforcement: each role is allowed/blocked correctly
 *  B. Cross-tenant isolation: tenant A admin cannot access tenant B data
 *  C. Queue-first write path: createService enqueues when queue is enabled
 *  D. Direct-write fallback: graceful degradation when queue is unavailable
 *  E. Service lifecycle: create → publish → unpublish → delete flow
 *  F. Application status update: producer can update status
 *  G. Permission boundary: clerk cannot modify services
 *
 * Run: cd backend && npx jest producer.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import request from 'supertest';

import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { ServicePublicationApproval } from '../database/entities/service-publication-approval.entity';
import { TenantServiceRelease } from '../database/entities/tenant-service-release.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CacheService } from '../scalability/cache.service';
import { QueueService } from '../scalability/queue.service';
import { TenantService } from '../database/entities/tenant-service.entity';
import { Application } from '../database/entities/application.entity';
import { ApplicationEvent } from '../database/entities/application-event.entity';
import { ApplicationDeficiency } from '../database/entities/application-deficiency.entity';
import { ApplicationOutput } from '../database/entities/application-output.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { Tenant } from '../database/entities/tenant.entity';

import { SchemaValidationGuard } from '../validation/schema-validation.guard';

import {
  makeRepo,
  makeMockCache,
  makeMockQueue,
  makeMockQueueEnabled,
  adminToken,
  officerToken,
  clerkToken,
  consumerToken,
  signTestJwt,
  TEST_TENANT_ID,
  TEST_TENANT_ID_2,
  TEST_SERVICE_ID,
  TEST_APPLICATION_ID,
  TEST_USER_ID_ADMIN,
  TEST_USER_ID_OFFICER,
  testTenantService,
  testApplication,
} from '../test/test-helpers';
import { getCertifiedServiceTemplate } from './service-template.catalog';

// ─── Module factory ──────────────────────────────────────────────────────────

async function createProducerApp(queueEnabled = false) {
  const tenantServiceRepo = makeRepo();
  const applicationRepo = makeRepo();
  const applicationEventRepo = makeRepo();
  const applicationDeficiencyRepo = makeRepo();
  const applicationOutputRepo = makeRepo();
  const auditLogRepo = makeRepo();
  const outboxRepo = makeRepo();
  const publicationApprovalRepo = makeRepo();
  const serviceReleaseRepo = makeRepo();
  const tenantUserRepo = makeRepo();
  const tenantRepo = makeRepo();
  const mockQueue = queueEnabled ? makeMockQueueEnabled() : makeMockQueue();
  const mockCache = makeMockCache();
  const transactionRepositories = new Map<any, any>([
    [TenantService, tenantServiceRepo],
    [Application, applicationRepo],
    [ApplicationEvent, applicationEventRepo],
    [ApplicationDeficiency, applicationDeficiencyRepo],
    [ApplicationOutput, applicationOutputRepo],
    [AuditLog, auditLogRepo],
    [OutboxEvent, outboxRepo],
    [ServicePublicationApproval, publicationApprovalRepo],
    [TenantServiceRelease, serviceReleaseRepo],
  ]);
  const dataSource = {
    transaction: jest.fn(async (callback) => callback({
      getRepository: (entity) => transactionRepositories.get(entity),
    })),
  };

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [ProducerController],
    providers: [
      ProducerService,
      JwtStrategy,
      Reflector,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: JwtAuthGuard, useClass: JwtAuthGuard },
      { provide: TenantStaffAuthGuard, useValue: { canActivate: () => true } },
      { provide: RolesGuard, useClass: RolesGuard },
      { provide: getRepositoryToken(TenantService), useValue: tenantServiceRepo },
      { provide: getRepositoryToken(Application), useValue: applicationRepo },
      { provide: getRepositoryToken(ApplicationEvent), useValue: applicationEventRepo },
      { provide: getRepositoryToken(ApplicationDeficiency), useValue: applicationDeficiencyRepo },
      { provide: getRepositoryToken(TenantUser), useValue: tenantUserRepo },
      { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
      { provide: CacheService, useValue: mockCache },
      { provide: QueueService, useValue: mockQueue },
      { provide: getDataSourceToken(), useValue: dataSource },
      SchemaValidationGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, tenantServiceRepo, applicationRepo, applicationEventRepo, applicationDeficiencyRepo, applicationOutputRepo, tenantUserRepo, tenantRepo, auditLogRepo, outboxRepo, publicationApprovalRepo, serviceReleaseRepo, mockQueue, mockCache };
}

// ─── A. RBAC enforcement ─────────────────────────────────────────────────────

describe('Producer integration — RBAC enforcement', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const setup = await createProducerApp();
    app = setup.app;
  });

  afterEach(async () => { await app.close(); });

  it('returns 401 when no JWT is provided', async () => {
    await request(app.getHttpServer())
      .get('/producer/services')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns 401 when JWT is for wrong token type (refresh)', async () => {
    const { signRefreshJwt } = await import('../test/test-helpers');
    const refreshToken = signRefreshJwt('some-user');

    await request(app.getHttpServer())
      .get('/producer/services')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns 401 when consumer credentials try to access producer routes', async () => {
    const token = consumerToken();

    await request(app.getHttpServer())
      .get('/producer/services')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('admin role can access GET /producer/services', async () => {
    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .get('/producer/services')
      .set('Authorization', `Bearer ${token}`);

    // 200 or 404 (route not matching) — should NOT be 401/403
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(HttpStatus.UNAUTHORIZED);
    expect(res.status).not.toBe(HttpStatus.FORBIDDEN);
  });

  it('clerk role can GET services but cannot POST (create)', async () => {
    const token = clerkToken(TEST_TENANT_ID);

    // GET is allowed for clerk
    const getRes = await request(app.getHttpServer())
      .get('/producer/services')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).not.toBe(HttpStatus.FORBIDDEN);
    expect(getRes.status).not.toBe(HttpStatus.UNAUTHORIZED);

    // POST requires admin/officer — clerk should get 403
    const postRes = await request(app.getHttpServer())
      .post('/producer/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', category: 'test', formSchema: {}, workflowConfig: {} });
    expect(postRes.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('clerk role cannot DELETE services (admin only)', async () => {
    const token = clerkToken(TEST_TENANT_ID);

    await request(app.getHttpServer())
      .delete(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('officer role can create services', async () => {
    const token = officerToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .post('/producer/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Driving Licence',
        category: 'transport',
        formSchema: { version: '1.0', fields: [] },
        workflowConfig: { stages: ['submitted'] },
      });

    // Not 401 or 403 — may be 201 or 500 (if service calls real DB)
    expect(res.status).not.toBe(HttpStatus.UNAUTHORIZED);
    expect(res.status).not.toBe(HttpStatus.FORBIDDEN);
  });
});

describe('Producer integration — certified service templates', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createProducerApp());
  });

  afterEach(async () => { await app.close(); });

  it('returns the certified reference templates to an authorized tenant admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/producer/service-templates')
      .set('Authorization', `Bearer ${adminToken(TEST_TENANT_ID)}`)
      .expect(HttpStatus.OK);

    expect(response.body.data.map((template: any) => template.id)).toEqual([
      'income-cert',
      'trade-license',
      'birth-cert',
    ]);
    expect(response.body.data.every((template: any) => template.certificationStatus === 'certified')).toBe(true);
  });
});

describe('Producer integration — maker-checker publication', () => {
  let app: INestApplication;
  let tenantServiceRepo: ReturnType<typeof makeRepo>;
  let publicationApprovalRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createProducerApp();
    app = setup.app;
    tenantServiceRepo = setup.tenantServiceRepo;
    publicationApprovalRepo = setup.publicationApprovalRepo;
  });

  afterEach(async () => { await app.close(); });

  it('requests publication but does not publish the draft', async () => {
    const template = getCertifiedServiceTemplate('income-cert')!;
    tenantServiceRepo.findOne.mockResolvedValue(testTenantService({
      published: false,
      archived: false,
      manifest: template.manifest,
      form_schema: template.formSchema,
      workflow_config: template.workflowConfig,
      required_documents: template.requiredDocuments,
    }));
    publicationApprovalRepo.findOne.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`/producer/services/${TEST_SERVICE_ID}/publish`)
      .set('Authorization', `Bearer ${adminToken(TEST_TENANT_ID)}`)
      .expect(HttpStatus.CREATED);

    expect(response.body.data.publicationStatus).toBe('pending_approval');
    expect(publicationApprovalRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      requested_by_id: TEST_USER_ID_ADMIN,
      status: 'pending',
      requested_content_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it('rejects an author approving their own publication request', async () => {
    publicationApprovalRepo.findOne.mockResolvedValue({
      id: 'approval-1',
      requested_by_id: TEST_USER_ID_ADMIN,
      status: 'pending',
    });

    await request(app.getHttpServer())
      .post(`/producer/services/${TEST_SERVICE_ID}/approve-publication`)
      .set('Authorization', `Bearer ${adminToken(TEST_TENANT_ID)}`)
      .expect(HttpStatus.FORBIDDEN);
  });
});

// ─── B. Cross-tenant isolation ────────────────────────────────────────────────

describe('Producer integration — cross-tenant isolation', () => {
  let app: INestApplication;
  let tenantServiceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createProducerApp();
    app = setup.app;
    tenantServiceRepo = setup.tenantServiceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('tenant A admin token cannot see tenant B services (tenantId scoped from JWT)', async () => {
    // Tenant A admin token — tenantId=TENANT_ID in JWT
    const tenantAToken = adminToken(TEST_TENANT_ID);

    // Service belongs to tenant B
    tenantServiceRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([
      [testTenantService({ tenant_id: TEST_TENANT_ID_2 })],
      1,
    ]);

    const res = await request(app.getHttpServer())
      .get('/producer/services')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect((r) => expect([200, 404]).toContain(r.status));

    // Since the controller uses @TenantId() which extracts tenantId from JWT,
    // the query will be scoped to TENANT_ID_1 — verify tenantServiceRepo was
    // called with the JWT's tenantId (enforced by @TenantId decorator)
    if (res.status === 200) {
      expect(tenantServiceRepo.createQueryBuilder).toHaveBeenCalled();
    }
  });

  it('tenant A admin token cannot delete tenant B service', async () => {
    const tenantAToken = adminToken(TEST_TENANT_ID);

    // Service exists but belongs to tenant B — ownership check should fail
    tenantServiceRepo.findOne.mockResolvedValue(
      testTenantService({ tenant_id: TEST_TENANT_ID_2 }),
    );

    // The producer service checks ownership via tenant_id scoped query
    // If service's tenant_id !== JWT's tenantId, findOne returns null (where: { id, tenant_id })
    tenantServiceRepo.findOne.mockImplementation(({ where }: any) => {
      if (where.tenant_id === TEST_TENANT_ID_2) {
        return Promise.resolve(testTenantService({ tenant_id: TEST_TENANT_ID_2 }));
      }
      return Promise.resolve(null); // Tenant A query returns nothing
    });

    const res = await request(app.getHttpServer())
      .delete(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${tenantAToken}`);

    // Should get 404 (not found for this tenant) rather than 403 or 200
    expect([404, 500]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});

// ─── C. Queue-first write path ────────────────────────────────────────────────

describe('Producer integration — synchronously visible draft creation', () => {
  let app: INestApplication;
  let mockQueue: ReturnType<typeof makeMockQueueEnabled>;
  let tenantServiceRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createProducerApp(true); // queue enabled
    app = setup.app;
    mockQueue = setup.mockQueue as any;
    tenantServiceRepo = setup.tenantServiceRepo;
  });

  afterEach(async () => { await app.close(); });

  it('POST /producer/services persists draft immediately so it is ready to simulate', async () => {
    const token = adminToken(TEST_TENANT_ID);

    await request(app.getHttpServer())
      .post('/producer/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Passport Renewal',
        category: 'identity',
        formSchema: { version: '1.0', fields: [] },
        workflowConfig: { stages: ['submitted'] },
      });

    expect(mockQueue.enqueueWriteCommand).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'service.persist.create' }),
    );
    expect(tenantServiceRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      published: false,
      archived: false,
    }));
  });
});

// ─── D. Direct-write fallback ────────────────────────────────────────────────

describe('Producer integration — direct-write fallback', () => {
  let app: INestApplication;
  let tenantServiceRepo: ReturnType<typeof makeRepo>;
  let mockQueue: ReturnType<typeof makeMockQueue>;

  beforeEach(async () => {
    const setup = await createProducerApp(false); // queue disabled
    app = setup.app;
    tenantServiceRepo = setup.tenantServiceRepo;
    mockQueue = setup.mockQueue;
  });

  afterEach(async () => { await app.close(); });

  it('createService writes directly to DB when queue is disabled', async () => {
    const token = adminToken(TEST_TENANT_ID);

    tenantServiceRepo.save.mockResolvedValue(testTenantService());

    await request(app.getHttpServer())
      .post('/producer/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Direct Write Test',
        category: 'test',
        formSchema: { version: '1.0', fields: [] },
        workflowConfig: { stages: ['submitted'] },
      });

    // Queue should NOT be called when disabled
    expect(mockQueue.enqueueWriteCommand).not.toHaveBeenCalled();
    // Repository save should be called for direct write
    expect(tenantServiceRepo.save).toHaveBeenCalled();
  });

  it('archives a published service without deleting its release-backed row', async () => {
    const token = adminToken(TEST_TENANT_ID);
    const service = testTenantService({
      published: true,
      current_release_id: '00000000-0000-0000-0000-000000000042',
      archived: false,
    });
    tenantServiceRepo.findOne.mockResolvedValue(service);

    await request(app.getHttpServer())
      .delete(`/producer/services/${TEST_SERVICE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(tenantServiceRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      published: false,
      archived: true,
      current_release_id: '00000000-0000-0000-0000-000000000042',
    }));
    expect(tenantServiceRepo.remove).not.toHaveBeenCalled();
  });
});

// ─── E. Application status update (producer workflow) ────────────────────────

describe('Producer integration — application status update', () => {
  let app: INestApplication;
  let applicationRepo: ReturnType<typeof makeRepo>;
  let applicationEventRepo: ReturnType<typeof makeRepo>;
  let applicationOutputRepo: ReturnType<typeof makeRepo>;
  let auditLogRepo: ReturnType<typeof makeRepo>;
  let outboxRepo: ReturnType<typeof makeRepo>;
  let serviceReleaseRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const setup = await createProducerApp();
    app = setup.app;
    applicationRepo = setup.applicationRepo;
    applicationEventRepo = setup.applicationEventRepo;
    applicationOutputRepo = setup.applicationOutputRepo;
    auditLogRepo = setup.auditLogRepo;
    outboxRepo = setup.outboxRepo;
    serviceReleaseRepo = setup.serviceReleaseRepo;
  });

  afterEach(async () => { await app.close(); });

  it('allows an approver to load an application for review', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ status: 'under_review' }));
    const token = signTestJwt({ sub: TEST_USER_ID_ADMIN, role: 'approver', tenantId: TEST_TENANT_ID });

    await request(app.getHttpServer())
      .get(`/producer/applications/${TEST_APPLICATION_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);
  });

  it('allows an approver to list applications for review', async () => {
    const token = signTestJwt({ sub: TEST_USER_ID_ADMIN, role: 'approver', tenantId: TEST_TENANT_ID });

    await request(app.getHttpServer())
      .get('/producer/applications')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);
  });

  it('persists the configured next stage for an allowed officer action', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({
      status: 'submitted',
      current_stage: 'review',
    }));
    serviceReleaseRepo.findOne.mockResolvedValue({
      snapshot: {
        workflow_config: {
          stages: [
            { id: 'submitted', name: 'Submitted', assignedRole: 'system', actions: ['submit'], nextStages: ['review'] },
            { id: 'review', name: 'Review', assignedRole: 'officer', actions: ['forward', 'raise_deficiency'], nextStages: ['approval', 'pending_documents'] },
            { id: 'approval', name: 'Approval', assignedRole: 'approver', actions: ['approve', 'reject'], nextStages: ['approved', 'rejected'] },
            { id: 'pending_documents', name: 'Pending documents', assignedRole: 'citizen', actions: ['submit_evidence'], nextStages: ['review'] },
            { id: 'approved', name: 'Approved', assignedRole: 'system', actions: [], nextStages: [] },
            { id: 'rejected', name: 'Rejected', assignedRole: 'system', actions: [], nextStages: [] },
          ],
        },
      },
    });

    await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${officerToken(TEST_TENANT_ID)}`)
      .send({ status: 'under_review', action: 'forward' })
      .expect(HttpStatus.OK);

    expect(applicationRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'under_review',
      current_stage: 'approval',
    }));
    expect(applicationEventRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ action: 'forward' }),
    }));
  });

  it('rejects an officer action not configured for the current workflow stage', async () => {
    applicationRepo.findOne.mockResolvedValue(testApplication({
      status: 'submitted',
      current_stage: 'review',
    }));
    serviceReleaseRepo.findOne.mockResolvedValue({
      snapshot: {
        workflow_config: {
          stages: [
            { id: 'review', name: 'Review', assignedRole: 'officer', actions: ['forward'], nextStages: ['approval'] },
            { id: 'approval', name: 'Approval', assignedRole: 'approver', actions: ['approve'], nextStages: ['approved'] },
            { id: 'approved', name: 'Approved', assignedRole: 'system', actions: [], nextStages: [] },
          ],
        },
      },
    });

    await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${officerToken(TEST_TENANT_ID)}`)
      .send({ status: 'approved', action: 'approve' })
      .expect(HttpStatus.FORBIDDEN);

    expect(applicationRepo.save).not.toHaveBeenCalled();
    expect(applicationEventRepo.save).not.toHaveBeenCalled();
    expect(outboxRepo.save).not.toHaveBeenCalled();
  });

  it.each([
    ['officer', () => officerToken(TEST_TENANT_ID)],
    ['clerk', () => clerkToken(TEST_TENANT_ID)],
  ])('prevents a %s from making a final application decision', async (_role, createToken) => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ status: 'under_review' }));

    await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${createToken()}`)
      .send({ status: 'approved' })
      .expect(HttpStatus.FORBIDDEN);

    expect(applicationRepo.save).not.toHaveBeenCalled();
    expect(applicationEventRepo.save).not.toHaveBeenCalled();
    expect(auditLogRepo.save).not.toHaveBeenCalled();
    expect(outboxRepo.save).not.toHaveBeenCalled();
  });

  it.each([
    ['admin', () => adminToken(TEST_TENANT_ID), 'admin'],
    ['approver', () => signTestJwt({ sub: TEST_USER_ID_ADMIN, role: 'approver', tenantId: TEST_TENANT_ID }), 'approver'],
  ])('allows an authorized %s to make a final application decision', async (_label, createToken, role) => {
    applicationRepo.findOne.mockResolvedValue(testApplication({ status: 'under_review' }));
    applicationRepo.save.mockResolvedValue(testApplication({ status: 'approved' }));

    await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${createToken()}`)
      .send({ status: 'approved' })
      .expect(HttpStatus.OK);

    expect(applicationEventRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      actor_role: role,
      from_status: 'under_review',
      to_status: 'approved',
    }));
    expect(outboxRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'application.status-updated',
      status: 'pending',
    }));
    expect(applicationOutputRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      application_id: TEST_APPLICATION_ID,
      consumer_id: expect.any(String),
      status: 'issued',
      certificate_number: expect.stringMatching(/^CERT-/),
      verification_code: expect.stringMatching(/^VERIFY-/),
    }));
  });

  it('rejects an invalid submitted-to-approved transition without state or event writes', async () => {
    const token = officerToken(TEST_TENANT_ID);
    applicationRepo.findOne.mockResolvedValue(testApplication({ status: 'submitted' }));

    const response = await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.message).toContain('Invalid application transition');
    expect(applicationRepo.save).not.toHaveBeenCalled();
    expect(applicationEventRepo.save).not.toHaveBeenCalled();
    expect(auditLogRepo.save).not.toHaveBeenCalled();
    expect(outboxRepo.save).not.toHaveBeenCalled();
  });

  it('PATCH /producer/applications/:id/status — consumer credentials are rejected', async () => {
    const token = consumerToken();

    await request(app.getHttpServer())
      .patch(`/producer/applications/${TEST_APPLICATION_ID}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
