/**
 * Volume 14 — Shared test helpers for backend integration tests.
 *
 * Provides:
 * - makeRepo()          : mock TypeORM repository factory
 * - makeMockQueue()     : mock QueueService
 * - makeMockCache()     : mock CacheService (passthrough loader)
 * - signTestJwt()       : real JWT signed with test secret
 * - TEST_TENANT_ID      : stable UUID for all test tenants
 * - TEST_CONSUMER_ID    : stable UUID for test consumer
 * - testTenant()        : minimal Tenant entity fixture
 * - testTenantUser()    : minimal TenantUser fixture
 * - testConsumerUser()  : minimal ConsumerUser fixture
 * - testService()       : minimal TenantService fixture
 * - testApplication()   : minimal Application fixture
 * - testQueueMessage()  : minimal QueueMessageEntity fixture
 */

import * as jwt from 'jsonwebtoken';
import { randomUUID as uuidv4 } from 'crypto';

// ─── Stable test UUIDs ────────────────────────────────────────────────────────
export const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_TENANT_ID_2 = '00000000-0000-0000-0000-000000000002';
export const TEST_CONSUMER_ID = '00000000-0000-0000-0001-000000000001';
export const TEST_CONSUMER_ID_2 = '00000000-0000-0000-0001-000000000002';
export const TEST_SERVICE_ID = '00000000-0000-0000-0002-000000000001';
export const TEST_SERVICE_RELEASE_ID = '00000000-0000-0000-0002-000000000002';
export const TEST_APPLICATION_ID = '00000000-0000-0000-0003-000000000001';
export const TEST_USER_ID_ADMIN = '00000000-0000-0000-0004-000000000001';
export const TEST_USER_ID_OFFICER = '00000000-0000-0000-0004-000000000002';
export const TEST_USER_ID_CLERK = '00000000-0000-0000-0004-000000000003';

const JWT_TEST_SECRET = 'your-super-secret-jwt-key';

// ─── JWT factory ─────────────────────────────────────────────────────────────

export interface TestJwtOptions {
  sub?: string;
  email?: string;
  role?: string;
  tenantId?: string;
  consumerSource?: string;
  tokenType?: 'access' | 'refresh';
  expiresIn?: string;
}

export function signTestJwt(options: TestJwtOptions = {}): string {
  const payload = {
    sub: options.sub ?? TEST_USER_ID_ADMIN,
    email: options.email ?? 'admin@test.gov.in',
    role: options.role ?? 'admin',
    tenantId: options.tenantId ?? TEST_TENANT_ID,
    consumerSource: options.consumerSource,
    tokenType: options.tokenType ?? 'access',
  };
  return jwt.sign(payload, JWT_TEST_SECRET, {
    expiresIn: (options.expiresIn ?? '1h') as any,
  });
}

export function signExpiredJwt(options: TestJwtOptions = {}): string {
  const payload = {
    sub: options.sub ?? TEST_USER_ID_ADMIN,
    email: options.email ?? 'admin@test.gov.in',
    role: options.role ?? 'admin',
    tenantId: options.tenantId ?? TEST_TENANT_ID,
    tokenType: options.tokenType ?? 'access',
  };
  return jwt.sign(payload, JWT_TEST_SECRET, { expiresIn: '-1s' as any });
}

export function signRefreshJwt(sub: string): string {
  return jwt.sign({ sub, tokenType: 'refresh' }, JWT_TEST_SECRET, { expiresIn: '7d' as any });
}

// ─── Mock repository factory ──────────────────────────────────────────────────

export function makeRepo<T = any>() {
  return {
    findOne: jest.fn<Promise<T | null>, any>().mockResolvedValue(null),
    find: jest.fn<Promise<T[]>, any>().mockResolvedValue([]),
    findAndCount: jest.fn<Promise<[T[], number]>, any>().mockResolvedValue([[], 0]),
    save: jest.fn<Promise<T>, any>((e: any) => Promise.resolve(e)),
    create: jest.fn<T, any>((e: any) => e),
    insert: jest.fn<Promise<any>, any>(),
    delete: jest.fn<Promise<any>, any>(),
    remove: jest.fn<Promise<any>, any>(),
    update: jest.fn<Promise<any>, any>(),
    count: jest.fn<Promise<number>, any>().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      setOnLocked: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
    }),
    manager: {
      transaction: jest.fn((fn: any) => fn({ save: jest.fn((e: any) => Promise.resolve(e)) })),
    },
  };
}

// ─── Mock QueueService ────────────────────────────────────────────────────────

export function makeMockQueue() {
  return {
    isWritePathEnabled: jest.fn().mockReturnValue(false),
    enqueueWriteCommand: jest.fn().mockResolvedValue({ queued: false, reason: 'disabled' }),
    enqueueEvent: jest.fn().mockResolvedValue({ queued: false, reason: 'disabled' }),
    claimNextMessage: jest.fn().mockResolvedValue(null),
    acknowledgeMessage: jest.fn().mockResolvedValue(undefined),
    failMessage: jest.fn().mockResolvedValue(undefined),
    captureMetricsSnapshot: jest.fn().mockResolvedValue(undefined),
    recordDirectWriteBypass: jest.fn(),
    publishShadowWriteEvent: jest.fn().mockResolvedValue(undefined),
  };
}

/** Queue mock with queue-first path enabled */
export function makeMockQueueEnabled() {
  const mock = makeMockQueue();
  mock.isWritePathEnabled.mockReturnValue(true);
  mock.enqueueWriteCommand.mockResolvedValue({ queued: true, id: uuidv4() });
  return mock;
}

// ─── Mock CacheService ────────────────────────────────────────────────────────

export function makeMockCache() {
  return {
    readThrough: jest.fn((opts: any) => opts.loader()),
    invalidate: jest.fn(),
    invalidateByPrefix: jest.fn(),
    invalidatePrefix: jest.fn(),
    ping: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Mock MetricsService ──────────────────────────────────────────────────────

export function makeMockMetrics() {
  return {
    recordCacheHit: jest.fn(),
    recordCacheMiss: jest.fn(),
    recordNegativeCacheHit: jest.fn(),
    recordDirectDbRead: jest.fn(),
    recordFallbackToDb: jest.fn(),
    recordCacheLatency: jest.fn(),
    recordStaleServed: jest.fn(),
    recordCacheRepopulation: jest.fn(),
    recordCacheError: jest.fn(),
    recordCacheInvalidation: jest.fn(),
    recordQueueEnqueue: jest.fn(),
    recordQueueProcessed: jest.fn(),
    recordQueueFailed: jest.fn(),
    recordQueueError: jest.fn(),
    recordQueueDuplicate: jest.fn(),
    recordQueueCapabilityGap: jest.fn(),
    recordDirectDbWrite: jest.fn(),
    recordPoisonMessage: jest.fn(),
    incrementDlq: jest.fn(),
    incrementQueueRetry: jest.fn(),
    setQueueAvailability: jest.fn(),
    setQueueSnapshot: jest.fn(),
    setCacheAvailability: jest.fn(),
    recordDirectWriteBypass: jest.fn(),
    getSummary: jest.fn().mockReturnValue({ startedAt: new Date().toISOString() }),
  };
}

// ─── Mock WebhookDeliveryService ─────────────────────────────────────────────

export function makeMockWebhook() {
  return {
    deliver: jest.fn().mockResolvedValue(true),
    buildEvent: jest.fn().mockImplementation((type: string, tenantId: string, payload: any) => ({
      id: uuidv4(),
      type,
      tenantId,
      timestamp: new Date().toISOString(),
      payload,
    })),
  };
}

// ─── Mock AuditService ────────────────────────────────────────────────────────

export function makeMockAudit() {
  return {
    log: jest.fn().mockResolvedValue(undefined),
    logRegistration: jest.fn().mockResolvedValue(undefined),
    logAuthSuccess: jest.fn().mockResolvedValue(undefined),
    logAuthFailure: jest.fn().mockResolvedValue(undefined),
    logServiceEvent: jest.fn().mockResolvedValue(undefined),
    logApplicationEvent: jest.fn().mockResolvedValue(undefined),
    logDocumentUpload: jest.fn().mockResolvedValue(undefined),
    logDocumentDownload: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Mock ConsentService ─────────────────────────────────────────────────────

export function makeMockConsent() {
  return {
    recordConsent: jest.fn().mockResolvedValue(undefined),
    hasConsent: jest.fn().mockResolvedValue(true),
  };
}

// ─── Mock TenantService (domain, not entity) ─────────────────────────────────

export function makeMockTenantDomainService() {
  return {
    getTenantById: jest.fn().mockResolvedValue({
      id: TEST_TENANT_ID,
      name: 'Test Municipality',
      status: 'active',
    }),
    getEffectiveConsentPolicy: jest.fn().mockResolvedValue({
      require_consent_before_submission: false,
      consent_purposes: [],
    }),
  };
}

// ─── Entity fixtures ─────────────────────────────────────────────────────────

export function testTenant(overrides: Partial<any> = {}) {
  return {
    id: TEST_TENANT_ID,
    name: 'Test Municipality',
    type: 'government',
    status: 'active',
    api_base_url: null,
    contact_email: 'admin@test.gov.in',
    branding: null,
    auth_policy: null,
    consent_policy: null,
    notification_policy: null,
    integration_policy: null,
    action_policy: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as any;
}

export function testTenantUser(overrides: Partial<any> = {}) {
  return {
    id: TEST_USER_ID_ADMIN,
    tenant_id: TEST_TENANT_ID,
    email: 'admin@test.gov.in',
    password_hash: '$2b$10$placeholder.hash',
    role: 'admin',
    first_name: 'Test',
    last_name: 'Admin',
    active: true,
    ...overrides,
  };
}

export function testConsumerUser(overrides: Partial<any> = {}) {
  return {
    id: TEST_CONSUMER_ID,
    consumer_source: 'direct',
    external_id: 'consumer-ext-001',
    email: 'citizen@example.com',
    phone: '+919876543210',
    password_hash: '$2b$10$placeholder.hash',
    active: true,
    ...overrides,
  };
}

export function testTenantService(overrides: Partial<any> = {}) {
  return {
    id: TEST_SERVICE_ID,
    current_release_id: TEST_SERVICE_RELEASE_ID,
    tenant_id: TEST_TENANT_ID,
    name: 'Birth Certificate',
    category: 'civil-records',
    description: 'Apply for a birth certificate',
    form_schema: {
      version: '1.0',
      fields: [
        { id: 'full_name', type: 'text', label: 'Full Name', required: true },
      ],
    },
    workflow_config: { stages: ['submitted', 'review', 'approved'] },
    eligibility_rules: null,
    required_documents: null,
    backend_api_config: null,
    manifest: null,
    published: true,
    sla_days: 7,
    fees: 0,
    tenant: testTenant(),
    ...overrides,
  };
}

export function testApplication(overrides: Partial<any> = {}) {
  return {
    id: TEST_APPLICATION_ID,
    tenant_id: TEST_TENANT_ID,
    service_id: TEST_SERVICE_ID,
    service_release_id: TEST_SERVICE_RELEASE_ID,
    consumer_id: TEST_CONSUMER_ID,
    consumer_source: 'direct',
    form_data: { full_name: 'Rahul Sharma' },
    status: 'submitted',
    current_stage: 'submitted',
    tracking_number: 'TRK-2026-000001',
    backend_reference_id: null,
    assigned_to: null,
    idempotency_key: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function testConsentRecord(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    consumer_id: TEST_CONSUMER_ID,
    tenant_id: TEST_TENANT_ID,
    purpose: 'service_delivery',
    purpose_description: 'Consent for service delivery',
    resource_type: null,
    resource_id: null,
    status: 'pending',
    request_id: null,
    granted_at: null,
    denied_at: null,
    revoked_at: null,
    expires_at: null,
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function testIntegrationProvider(overrides: Partial<any> = {}): any {
  return {
    id: uuidv4(),
    tenant_id: TEST_TENANT_ID,
    provider: 'digilocker',
    status: 'active',
    config: null,
    credential_refs: null,
    webhook_secret_ref: null,
    last_health_check_at: null,
    last_health_check_ok: null,
    last_error: null,
    consecutive_failures: 0,
    circuit_open_until: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// Mock S3StorageService
export function makeMockS3() {
  return {
    putObject: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn().mockResolvedValue({ body: Buffer.from('file-content'), contentType: 'application/pdf' }),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
    objectExists: jest.fn().mockResolvedValue(false),
    buildDocumentKey: jest.fn().mockReturnValue('documents/tenant/user/doc-id.pdf'),
  };
}

export function testQueueMessage(overrides: Partial<any> = {}) {  return {
    id: uuidv4(),
    provider: 'database',
    type: 'application.persist',
    module: 'consumer.service',
    payload: { applicationId: TEST_APPLICATION_ID },
    idempotency_key: `test:${uuidv4()}`,
    status: 'queued',
    attempts: 0,
    last_error: null,
    claimed_at: null,
    processed_at: null,
    available_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// ─── Auth mock helper ─────────────────────────────────────────────────────────

/** Returns the bearer token header string */
export function bearerToken(token: string) {
  return `Bearer ${token}`;
}

export function adminToken(tenantId = TEST_TENANT_ID) {
  return signTestJwt({ sub: TEST_USER_ID_ADMIN, role: 'admin', tenantId });
}

export function officerToken(tenantId = TEST_TENANT_ID) {
  return signTestJwt({ sub: TEST_USER_ID_OFFICER, role: 'officer', tenantId });
}

export function clerkToken(tenantId = TEST_TENANT_ID) {
  return signTestJwt({ sub: TEST_USER_ID_CLERK, role: 'clerk', tenantId });
}

export function consumerToken(consumerId = TEST_CONSUMER_ID) {
  return signTestJwt({
    sub: consumerId,
    role: 'consumer',
    tenantId: undefined,
    consumerSource: 'direct',
  });
}
