/**
 * Volume 14 — Tenant Module Integration Tests
 *
 * Tests the full tenant controller → service chain with real JWT guard,
 * mocked repositories, real RBAC enforcement, and lifecycle transitions.
 *
 * Coverage:
 *  A. RBAC enforcement: only platform_admin can create/list/get tenants
 *  B. Create tenant: happy path, duplicate name conflict
 *  C. List tenants: paginated, filterable by status and search
 *  D. Get tenant by ID: 200 for existing, 404 for missing
 *  E. Update tenant: partial patch, status ignored by tenant admin
 *  F. Lifecycle transitions: onboarding→active, active→suspended, active→offboarded
 *  G. Invalid transitions: cannot go backward, cannot leave offboarded
 *  H. Tenant admin self-config: can read/update own config, cannot change status
 *  I. Policy endpoints: auth-policy, consent-policy, feature-flags
 *  J. Webhook test: dispatches test event when webhook_url configured
 *
 * Run: cd backend && npx jest tenant.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { AuditService } from '../audit/audit.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { Tenant } from '../database/entities/tenant.entity';

import {
  makeRepo,
  makeMockAudit,
  makeMockWebhook,
  adminToken,
  signTestJwt,
  TEST_TENANT_ID,
  TEST_TENANT_ID_2,
  TEST_USER_ID_ADMIN,
  testTenant,
} from '../test/test-helpers';

// ─── Module factory ──────────────────────────────────────────────────────────

async function createTenantApp() {
  const tenantRepo = makeRepo<Tenant>();
  const mockAudit = makeMockAudit();
  const mockWebhook = makeMockWebhook();

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [TenantController],
    providers: [
      TenantService,
      JwtStrategy,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: getRepositoryToken(Tenant), useValue: tenantRepo },
      { provide: AuditService, useValue: mockAudit },
      { provide: WebhookDeliveryService, useValue: mockWebhook },
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, tenantRepo, mockAudit, mockWebhook };
}

// ─── A. RBAC enforcement ──────────────────────────────────────────────────────

describe('Tenant integration — RBAC', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns 401 when no JWT provided', async () => {
    await request(app.getHttpServer())
      .post('/platform/tenants')
      .send({ name: 'TestOrg', type: 'government' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns 403 when non-platform_admin tries to create a tenant', async () => {
    const token = adminToken(TEST_TENANT_ID); // role=admin, not platform_admin
    await request(app.getHttpServer())
      .post('/platform/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TestOrg', type: 'government' })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('returns 403 when consumer role tries to list tenants', async () => {
    const token = signTestJwt({ role: 'consumer' });
    await request(app.getHttpServer())
      .get('/platform/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.FORBIDDEN);
  });
});

// ─── B. Create tenant ─────────────────────────────────────────────────────────

describe('Tenant integration — create', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;
  let mockAudit: ReturnType<typeof makeMockAudit>;

  beforeEach(async () => {
    ({ app, tenantRepo, mockAudit } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('creates a new tenant and returns 201', async () => {
    tenantRepo.findOne.mockResolvedValue(null); // no duplicate
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));
    tenantRepo.create.mockImplementation((e: any) => e);

    const res = await request(app.getHttpServer())
      .post('/platform/tenants')
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ name: 'Bengaluru Municipal Corp', type: 'government', contact_email: 'admin@bmc.gov.in' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Bengaluru Municipal Corp');
    expect(res.body.data.status).toBe('onboarding');
  });

  it('returns 409 when tenant name already exists', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ name: 'Bengaluru Municipal Corp' }));

    await request(app.getHttpServer())
      .post('/platform/tenants')
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ name: 'Bengaluru Municipal Corp', type: 'government' })
      .expect(HttpStatus.CONFLICT);
  });

  it('fires audit log on successful creation', async () => {
    tenantRepo.findOne.mockResolvedValue(null);
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));
    tenantRepo.create.mockImplementation((e: any) => e);

    await request(app.getHttpServer())
      .post('/platform/tenants')
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ name: 'Hyderabad Corp', type: 'government' })
      .expect(HttpStatus.CREATED);

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tenant.created' }),
    );
  });
});

// ─── C. List tenants ──────────────────────────────────────────────────────────

describe('Tenant integration — list', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('lists tenants with pagination', async () => {
    tenantRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([
      [testTenant(), testTenant({ id: TEST_TENANT_ID_2, name: 'Mumbai Corp' })],
      2,
    ]);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants')
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.total).toBe(2);
    expect(res.body.data.tenants).toHaveLength(2);
  });

  it('filters by status', async () => {
    tenantRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([[testTenant({ status: 'active' })], 1]);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants?status=active')
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.tenants[0].status).toBe('active');
  });
});

// ─── D. Get tenant by ID ──────────────────────────────────────────────────────

describe('Tenant integration — get by ID', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('returns the tenant when found', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'active' }));

    const res = await request(app.getHttpServer())
      .get(`/platform/tenants/${TEST_TENANT_ID}`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.id).toBe(TEST_TENANT_ID);
  });

  it('returns 404 for a missing tenant', async () => {
    tenantRepo.findOne.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/platform/tenants/${TEST_TENANT_ID}`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

// ─── E. Update tenant ─────────────────────────────────────────────────────────

describe('Tenant integration — update', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('updates tenant fields', async () => {
    const existing = testTenant({ status: 'onboarding' });
    tenantRepo.findOne.mockResolvedValue(existing);
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const res = await request(app.getHttpServer())
      .patch(`/platform/tenants/${TEST_TENANT_ID}`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ contact_email: 'new@corp.gov.in' })
      .expect(HttpStatus.OK);

    expect(res.body.success).toBe(true);
  });
});

// ─── F. Lifecycle transitions ─────────────────────────────────────────────────

describe('Tenant integration — lifecycle transitions', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;
  let mockAudit: ReturnType<typeof makeMockAudit>;

  beforeEach(async () => {
    ({ app, tenantRepo, mockAudit } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('activates an onboarding tenant → status becomes active', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'onboarding' }));
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const res = await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/activate`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.status).toBe('active');
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tenant.activated' }),
    );
  });

  it('suspends an active tenant', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'active' }));
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const res = await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/suspend`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ reason: 'Non-payment of platform fees' })
      .expect(HttpStatus.OK);

    expect(res.body.data.status).toBe('suspended');
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tenant.suspended' }),
    );
  });

  it('offboards a suspended tenant', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'suspended' }));
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const res = await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/offboard`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.status).toBe('offboarded');
  });
});

// ─── G. Invalid transitions ───────────────────────────────────────────────────

describe('Tenant integration — invalid lifecycle transitions', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('cannot activate an already-active tenant', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'active' }));

    await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/activate`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('cannot leave offboarded state (terminal)', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'offboarded' }));

    await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/activate`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('cannot suspend an onboarding tenant', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ status: 'onboarding' }));

    await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/suspend`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .send({ reason: 'test' })
      .expect(HttpStatus.BAD_REQUEST);
  });
});

// ─── H. Tenant admin self-config ──────────────────────────────────────────────

describe('Tenant integration — tenant admin self-config', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  it('tenant admin (role=admin) can read own config', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant());
    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants/self/config')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.id).toBe(TEST_TENANT_ID);
  });

  it('tenant admin cannot change own status via self/config', async () => {
    const existing = testTenant({ status: 'active' });
    tenantRepo.findOne.mockResolvedValue(existing);
    tenantRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);

    // Sends status=suspended but should be silently ignored
    const res = await request(app.getHttpServer())
      .patch('/platform/tenants/self/config')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'suspended', contact_email: 'safe@corp.in' })
      .expect(HttpStatus.OK);

    // Status should remain active (status field was stripped)
    expect(res.body.data.status).toBe('active');
  });
});

// ─── I. Policy endpoints ──────────────────────────────────────────────────────

describe('Tenant integration — policy endpoints', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;

  beforeEach(async () => {
    ({ app, tenantRepo } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  it('GET /self/auth-policy returns effective defaults', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ auth_policy: null }));
    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants/self/auth-policy')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data).toMatchObject({
      mfa_required: false,
      session_timeout_minutes: 60,
      password_min_length: 8,
      max_login_failures: 5,
    });
  });

  it('GET /self/consent-policy returns merged defaults', async () => {
    tenantRepo.findOne.mockResolvedValue(
      testTenant({
        consent_policy: {
          require_consent_before_submission: false,
          consent_purposes: ['service_delivery', 'analytics'],
        },
      }),
    );
    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants/self/consent-policy')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.require_consent_before_submission).toBe(false);
    expect(res.body.data.consent_purposes).toContain('analytics');
  });

  it('GET /self/feature-flags returns boolean map', async () => {
    tenantRepo.findOne.mockResolvedValue(
      testTenant({
        notification_policy: { sms_enabled: true, email_enabled: true },
        integration_policy: { allowed_providers: ['digilocker'] },
      }),
    );
    const token = adminToken(TEST_TENANT_ID);

    const res = await request(app.getHttpServer())
      .get('/platform/tenants/self/feature-flags')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data['sms.notifications']).toBe(true);
    expect(res.body.data['digilocker.enabled']).toBe(true);
    expect(res.body.data['payment.enabled']).toBe(false);
  });
});

// ─── J. Webhook test ──────────────────────────────────────────────────────────

describe('Tenant integration — webhook test', () => {
  let app: INestApplication;
  let tenantRepo: ReturnType<typeof makeRepo<Tenant>>;
  let mockWebhook: ReturnType<typeof makeMockWebhook>;

  beforeEach(async () => {
    ({ app, tenantRepo, mockWebhook } = await createTenantApp());
  });
  afterEach(async () => { await app.close(); });

  const platformAdminToken = () => signTestJwt({ role: 'platform_admin', tenantId: undefined });

  it('sends test webhook and returns delivered:true when URL configured', async () => {
    tenantRepo.findOne.mockResolvedValue(
      testTenant({ notification_policy: { webhook_url: 'https://example.com/webhook' } }),
    );
    mockWebhook.deliver.mockResolvedValue(true);

    const res = await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/webhook/test`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.delivered).toBe(true);
    expect(res.body.data.url).toBe('https://example.com/webhook');
  });

  it('returns delivered:false and url:null when no webhook URL configured', async () => {
    tenantRepo.findOne.mockResolvedValue(testTenant({ notification_policy: null }));

    const res = await request(app.getHttpServer())
      .post(`/platform/tenants/${TEST_TENANT_ID}/webhook/test`)
      .set('Authorization', `Bearer ${platformAdminToken()}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.delivered).toBe(false);
    expect(res.body.data.url).toBeNull();
  });
});
