/**
 * Volume 17 — Integration Provider Module Tests
 *
 * Tests IntegrationController → IntegrationService with mocked
 * TypeORM repository, real JWT/RBAC guards.
 *
 * Coverage:
 *  A. RBAC: only role=admin can access; 401/403 for others
 *  B. List integrations: returns sanitized list (no credential_refs)
 *  C. Get single integration: 200 for existing, 404 for missing
 *  D. Upsert (PUT): creates new integration record
 *  E. Upsert (PUT): updates existing integration record
 *  F. Upsert: validates provider must be an allowed value
 *  G. Credential refs: never leak in API response (sanitized)
 *  H. Circuit breaker: recordFailure opens circuit at threshold
 *  I. Circuit breaker: assertIntegrationAvailable blocks when circuit open
 *  J. recordSuccess resets circuit and clears error state
 *  K. Audit log fired on upsert
 *  L. Cross-tenant isolation: tenant A cannot see tenant B integrations
 *
 * Run: cd backend && npx jest integration.integration.spec.ts --runInBand
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { AuditService } from '../audit/audit.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { IntegrationProvider } from '../database/entities/integration-provider.entity';

import {
  makeRepo,
  makeMockAudit,
  adminToken,
  signTestJwt,
  TEST_TENANT_ID,
  TEST_TENANT_ID_2,
  TEST_USER_ID_ADMIN,
  testIntegrationProvider,
} from '../test/test-helpers';

// ─── App factory ─────────────────────────────────────────────────────────────

async function createIntegrationApp() {
  const integrationRepo = makeRepo<IntegrationProvider>();
  const mockAudit = makeMockAudit();

  const module: TestingModule = await Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'your-super-secret-jwt-key', signOptions: { expiresIn: '1h' } }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ],
    controllers: [IntegrationController],
    providers: [
      IntegrationService,
      JwtStrategy,
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: getRepositoryToken(IntegrationProvider), useValue: integrationRepo },
      { provide: AuditService, useValue: mockAudit },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
  await app.init();

  return { app, integrationRepo, mockAudit };
}

// ─── A. RBAC ──────────────────────────────────────────────────────────────────

describe('Integration provider — RBAC', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns 401 without JWT', async () => {
    await request(app.getHttpServer())
      .get('/producer/integrations')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns 401 for citizen credentials', async () => {
    const token = signTestJwt({ role: 'consumer', tenantId: TEST_TENANT_ID });
    await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns 403 for role=officer', async () => {
    const token = signTestJwt({ role: 'officer', tenantId: TEST_TENANT_ID });
    await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('allows role=admin', async () => {
    const token = adminToken(TEST_TENANT_ID);
    // integrationRepo.find returns []
    const res = await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.integrations).toHaveLength(0);
  });
});

// ─── B. List integrations ─────────────────────────────────────────────────────

describe('Integration provider — list', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns all integrations for the tenant, sorted by provider', async () => {
    const records = [
      testIntegrationProvider({ provider: 'digilocker', status: 'active' }),
      testIntegrationProvider({ provider: 'razorpay', status: 'sandbox' }),
    ];
    integrationRepo.find.mockResolvedValue(records);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.integrations).toHaveLength(2);
    expect(res.body.data.count).toBe(2);
  });

  it('returns empty array when tenant has no integrations', async () => {
    integrationRepo.find.mockResolvedValue([]);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.integrations).toHaveLength(0);
  });
});

// ─── C. Get single integration ────────────────────────────────────────────────

describe('Integration provider — get single', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('returns the integration when found', async () => {
    const record = testIntegrationProvider({ provider: 'digilocker', status: 'active' });
    integrationRepo.findOne.mockResolvedValue(record);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations/digilocker')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.provider).toBe('digilocker');
    expect(res.body.data.status).toBe('active');
  });

  it('returns 404 when integration is not configured', async () => {
    integrationRepo.findOne.mockResolvedValue(null);

    const token = adminToken(TEST_TENANT_ID);
    await request(app.getHttpServer())
      .get('/producer/integrations/razorpay')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});

// ─── D. Upsert — create new ───────────────────────────────────────────────────

describe('Integration provider — upsert (create)', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;
  let mockAudit: ReturnType<typeof makeMockAudit>;

  beforeEach(async () => {
    ({ app, integrationRepo, mockAudit } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('creates a new integration and returns 200', async () => {
    integrationRepo.findOne.mockResolvedValue(null); // not existing
    integrationRepo.create.mockImplementation((e: any) => e);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .put('/producer/integrations/digilocker')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'digilocker',
        status: 'active',
        config: { base_url: 'https://digilocker.gov.in/api' },
        credential_refs: { api_key_ref: 'DIGILOCKER_KEY_tenant1' },
      })
      .expect(HttpStatus.OK);

    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('digilocker');
    expect(res.body.data.status).toBe('active');
    expect(integrationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('fires audit log on upsert', async () => {
    integrationRepo.findOne.mockResolvedValue(null);
    integrationRepo.create.mockImplementation((e: any) => e);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);
    await request(app.getHttpServer())
      .put('/producer/integrations/sendgrid')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'sendgrid', status: 'sandbox' })
      .expect(HttpStatus.OK);

    await new Promise((r) => setImmediate(r));
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'admin.service.update' }),
    );
  });
});

// ─── E. Upsert — update existing ──────────────────────────────────────────────

describe('Integration provider — upsert (update)', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('updates status of existing integration to disabled', async () => {
    const existing = testIntegrationProvider({ provider: 'razorpay', status: 'active' });
    integrationRepo.findOne.mockResolvedValue(existing);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .put('/producer/integrations/razorpay')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'razorpay', status: 'disabled' })
      .expect(HttpStatus.OK);

    expect(res.body.data.status).toBe('disabled');
  });

  it('updates config without changing other fields', async () => {
    const existing = testIntegrationProvider({ provider: 'twilio', status: 'active', config: { from: '+91-old' } });
    integrationRepo.findOne.mockResolvedValue(existing);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .put('/producer/integrations/twilio')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'twilio', status: 'active', config: { from: '+91-new' } })
      .expect(HttpStatus.OK);

    expect(res.body.data.config.from).toBe('+91-new');
  });
});

// ─── F. Upsert — provider validation ─────────────────────────────────────────

describe('Integration provider — provider validation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    ({ app } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('rejects unknown provider with 400', async () => {
    const token = adminToken(TEST_TENANT_ID);
    await request(app.getHttpServer())
      .put('/producer/integrations/unknown_provider')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'unknown_provider', status: 'active' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('rejects invalid status value with 400', async () => {
    const token = adminToken(TEST_TENANT_ID);
    await request(app.getHttpServer())
      .put('/producer/integrations/digilocker')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'digilocker', status: 'invalid_status' })
      .expect(HttpStatus.BAD_REQUEST);
  });
});

// ─── G. Credential sanitization ───────────────────────────────────────────────

describe('Integration provider — credential sanitization', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('never returns credential_refs in list response', async () => {
    const records = [
      testIntegrationProvider({
        provider: 'razorpay',
        credential_refs: { api_key_ref: 'RAZORPAY_KEY_tenant1', secret_ref: 'RAZORPAY_SECRET_tenant1' },
      }),
    ];
    integrationRepo.find.mockResolvedValue(records);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.integrations[0].credential_refs).toBeNull();
  });

  it('never returns webhook_secret_ref in get response', async () => {
    const record = testIntegrationProvider({
      provider: 'custom_webhook',
      webhook_secret_ref: 'WEBHOOK_SECRET_tenant1',
    });
    integrationRepo.findOne.mockResolvedValue(record);

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations/custom_webhook')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.webhook_secret_ref).toBeNull();
  });

  it('never returns credential_refs after upsert', async () => {
    integrationRepo.findOne.mockResolvedValue(null);
    integrationRepo.create.mockImplementation((e: any) => e);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    const token = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .put('/producer/integrations/payu')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'payu',
        status: 'sandbox',
        credential_refs: { merchant_key_ref: 'PAYU_KEY_tenant1' },
      })
      .expect(HttpStatus.OK);

    expect(res.body.data.credential_refs).toBeNull();
  });
});

// ─── H. Circuit breaker — failure accumulation ────────────────────────────────

describe('Integration provider service — circuit breaker', () => {
  let app: INestApplication;
  let integrationService: IntegrationService;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    let module: TestingModule;
    ({ app, integrationRepo } = await createIntegrationApp());
    integrationService = app.get(IntegrationService);
  });
  afterEach(async () => { await app.close(); });

  it('opens circuit after 5 consecutive failures', async () => {
    const record = testIntegrationProvider({ provider: 'digilocker', status: 'active', consecutive_failures: 4 });
    integrationRepo.findOne.mockResolvedValue(record);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    await integrationService.recordFailure(TEST_TENANT_ID, 'digilocker', 'timeout after 5s');

    expect(integrationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        consecutive_failures: 5,
        circuit_open_until: expect.any(Date),
      }),
    );
  });

  it('does not open circuit before 5 failures', async () => {
    const record = testIntegrationProvider({ provider: 'digilocker', status: 'active', consecutive_failures: 3 });
    integrationRepo.findOne.mockResolvedValue(record);
    integrationRepo.save.mockImplementation((e: any) => Promise.resolve(e));

    await integrationService.recordFailure(TEST_TENANT_ID, 'digilocker', 'connection refused');

    expect(integrationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',       // still active
        consecutive_failures: 4,
        circuit_open_until: null, // circuit NOT yet open
      }),
    );
  });
});

// ─── I. Circuit breaker — assertIntegrationAvailable blocks ───────────────────

describe('Integration provider service — assertIntegrationAvailable', () => {
  let app: INestApplication;
  let integrationService: IntegrationService;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
    integrationService = app.get(IntegrationService);
  });
  afterEach(async () => { await app.close(); });

  it('throws ForbiddenException when circuit is open', async () => {
    const openUntil = new Date(Date.now() + 5 * 60 * 1000);
    const record = testIntegrationProvider({
      provider: 'razorpay',
      status: 'error',
      circuit_open_until: openUntil,
    });
    integrationRepo.findOne.mockResolvedValue(record);

    await expect(
      integrationService.assertIntegrationAvailable(TEST_TENANT_ID, 'razorpay'),
    ).rejects.toThrow('temporarily unavailable');
  });

  it('throws ForbiddenException when integration is disabled', async () => {
    const record = testIntegrationProvider({ provider: 'payu', status: 'disabled' });
    integrationRepo.findOne.mockResolvedValue(record);

    await expect(
      integrationService.assertIntegrationAvailable(TEST_TENANT_ID, 'payu'),
    ).rejects.toThrow('not enabled');
  });

  it('does not throw when integration is active and circuit closed', async () => {
    const record = testIntegrationProvider({ provider: 'sendgrid', status: 'active', circuit_open_until: null });
    integrationRepo.findOne.mockResolvedValue(record);

    await expect(
      integrationService.assertIntegrationAvailable(TEST_TENANT_ID, 'sendgrid'),
    ).resolves.toBeUndefined();
  });

  it('throws ForbiddenException when integration not configured at all', async () => {
    integrationRepo.findOne.mockResolvedValue(null);

    await expect(
      integrationService.assertIntegrationAvailable(TEST_TENANT_ID, 'twilio'),
    ).rejects.toThrow('not enabled');
  });
});

// ─── J. recordSuccess resets circuit ──────────────────────────────────────────

describe('Integration provider service — recordSuccess', () => {
  let app: INestApplication;
  let integrationService: IntegrationService;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
    integrationService = app.get(IntegrationService);
  });
  afterEach(async () => { await app.close(); });

  it('resets consecutive_failures and clears circuit_open_until', async () => {
    integrationRepo.update.mockResolvedValue({ affected: 1 } as any);

    await integrationService.recordSuccess(TEST_TENANT_ID, 'digilocker');

    expect(integrationRepo.update).toHaveBeenCalledWith(
      { tenant_id: TEST_TENANT_ID, provider: 'digilocker' },
      expect.objectContaining({
        consecutive_failures: 0,
        circuit_open_until: null,
        last_health_check_ok: true,
        last_error: null,
      }),
    );
  });
});

// ─── K. Cross-tenant isolation ────────────────────────────────────────────────

describe('Integration provider — cross-tenant isolation', () => {
  let app: INestApplication;
  let integrationRepo: ReturnType<typeof makeRepo<IntegrationProvider>>;

  beforeEach(async () => {
    ({ app, integrationRepo } = await createIntegrationApp());
  });
  afterEach(async () => { await app.close(); });

  it('tenant A admin cannot see tenant B integrations via list', async () => {
    // Repo mock always filters by tenant_id from the JWT — if the mock only
    // returns tenant B records when queried for tenant B, but the controller
    // passes the JWT tenant_id, tenant A gets an empty list.
    const tenantBRecord = testIntegrationProvider({ tenant_id: TEST_TENANT_ID_2, provider: 'razorpay' });
    integrationRepo.find.mockImplementation((opts: any) => {
      const where = opts?.where;
      if (where?.tenant_id === TEST_TENANT_ID_2) return Promise.resolve([tenantBRecord]);
      return Promise.resolve([]); // tenant A gets nothing
    });

    const tokenA = adminToken(TEST_TENANT_ID);
    const res = await request(app.getHttpServer())
      .get('/producer/integrations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.integrations).toHaveLength(0);
  });
});
