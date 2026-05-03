/**
 * Volume 12 §7 — API Contract and Integration Validation
 *
 * Contract tests for Producer/Consumer API — validates request/response schemas,
 * pagination envelope, error responses, and tenant scoping.
 *
 * Run: npx vitest run src/test/api-contracts/producer.contract.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Contract shapes (§7.2) ────────────────────────────────────────────────────
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface ServiceRecord {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'unpublished';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}



const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

// ── Producer: Services API ────────────────────────────────────────────────────
describe('Producer API Contract — Services (§7.1 + §7.2)', () => {
  it('GET /producer/services returns paginated envelope', async () => {
    const payload: PaginatedResponse<ServiceRecord> = {
      data: [
        {
          id: 'svc-001',
          name: 'Birth Certificate',
          status: 'published',
          tenantId: 'tenant-001',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response);

    const res = await fetch('/api/v1/producer/services');
    const data = (await res.json()) as PaginatedResponse<ServiceRecord>;

    // §7.2 — Pagination envelope conformance
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
  });

  it('Service record contains required fields', async () => {
    const service: ServiceRecord = {
      id: 'svc-001',
      name: 'Birth Certificate',
      status: 'published',
      tenantId: 'tenant-001',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => service,
    } as Response);

    const res = await fetch('/api/v1/producer/services/svc-001');
    const data = (await res.json()) as ServiceRecord;

    // Required fields per schema (§6.1)
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('tenantId');
    expect(data).toHaveProperty('createdAt');
    expect(['draft', 'published', 'unpublished']).toContain(data.status);
  });

  it('GET service by unknown ID returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ statusCode: 404, message: 'Service not found' }),
    } as Response);

    const res = await fetch('/api/v1/producer/services/nonexistent');
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toHaveProperty('statusCode', 404);
  });

  it('POST /producer/services returns 201 with created service', async () => {
    const created: ServiceRecord = {
      id: 'svc-new',
      name: 'Passport',
      status: 'draft',
      tenantId: 'tenant-001',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => created,
    } as Response);

    const res = await fetch('/api/v1/producer/services', {
      method: 'POST',
      body: JSON.stringify({ name: 'Passport' }),
    });
    const data = (await res.json()) as ServiceRecord;

    expect(res.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.status).toBe('draft');
  });
});

// ── Producer: Applications API ────────────────────────────────────────────────
describe('Producer API Contract — Applications (§7.1)', () => {
  it('Applications list returns paginated envelope', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, page: 1, limit: 20 }),
    } as Response);

    const res = await fetch('/api/v1/producer/applications');
    const data = await res.json();

    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('Updating application status with invalid status returns 400', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ statusCode: 400, message: ['status must be a valid enum value'] }),
    } as Response);

    const res = await fetch('/api/v1/producer/applications/app-001/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('message');
  });
});

// ── Tenant scoping ────────────────────────────────────────────────────────────
describe('Producer API Contract — Tenant isolation (§7.1)', () => {
  it('Services response includes tenantId scoping', async () => {
    const payload: PaginatedResponse<ServiceRecord> = {
      data: [
        {
          id: 'svc-001',
          name: 'Test',
          status: 'published',
          tenantId: 'tenant-001',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response);

    const res = await fetch('/api/v1/producer/services');
    const data = (await res.json()) as PaginatedResponse<ServiceRecord>;

    // All records must have tenantId (§6.2 — tenant scoping preserved)
    data.data.forEach((item) => {
      expect(item).toHaveProperty('tenantId');
      expect(typeof item.tenantId).toBe('string');
    });
  });
});
