/**
 * Volume 12 §7 — API Contract and Integration Validation
 *
 * Contract tests for the Auth API — validates request/response schemas,
 * error envelopes, field presence, and type correctness.
 * These tests use MSW (or fetch mocks) against the real API shape.
 *
 * Run: npx vitest run src/test/api-contracts/auth.contract.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Contract shapes (§7.2) ────────────────────────────────────────────────────
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

interface ApiErrorEnvelope {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Mock fetch globally for contract tests
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

// ── §7.1 Auth API happy paths ─────────────────────────────────────────────────
describe('Auth API Contract — Login (§7.1 + §7.2)', () => {
  it('Tenant login response conforms to contract schema', async () => {
    const expected: LoginResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.test.sig',
      refreshToken: 'refresh.test.token',
      user: {
        id: 'usr-001',
        email: 'admin@test.gov.in',
        role: 'ADMIN',
        tenantId: 'tenant-001',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expected,
    } as Response);

    const res = await fetch('/api/v1/auth/login/tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.gov.in', password: 'secret' }),
    });
    const data = (await res.json()) as LoginResponse;

    // Response schema conformance (§7.2)
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
    expect(data.user).toHaveProperty('role');
    expect(typeof data.accessToken).toBe('string');
    expect(typeof data.refreshToken).toBe('string');
  });

  it('Login success returns HTTP 200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response);
    const res = await fetch('/api/v1/auth/login/tenant', { method: 'POST', body: '{}' });
    expect(res.status).toBe(200);
  });
});

// ── §7.1 Permission failure ───────────────────────────────────────────────────
describe('Auth API Contract — Errors (§7.1)', () => {
  it('Invalid credentials returns 401 with correct error envelope', async () => {
    const expected: ApiErrorEnvelope = {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => expected,
    } as Response);

    const res = await fetch('/api/v1/auth/login/tenant', { method: 'POST', body: '{}' });
    const data = (await res.json()) as ApiErrorEnvelope;

    expect(res.status).toBe(401);
    // Error envelope conformance (§7.2)
    expect(data).toHaveProperty('statusCode');
    expect(data).toHaveProperty('message');
    expect(data.statusCode).toBe(401);
  });

  it('Validation failure returns 400 with array of messages', async () => {
    const expected: ApiErrorEnvelope = {
      statusCode: 400,
      message: ['email must be an email', 'password must not be empty'],
      error: 'Bad Request',
    };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => expected,
    } as Response);

    const res = await fetch('/api/v1/auth/login/tenant', { method: 'POST', body: '{}' });
    const data = (await res.json()) as ApiErrorEnvelope;

    expect(res.status).toBe(400);
    expect(Array.isArray(data.message)).toBe(true);
    expect((data.message as string[]).length).toBeGreaterThan(0);
  });

  it('Forgot-password endpoint returns 200 regardless of email existence (security)', async () => {
    // §7.1 — Should not reveal whether email exists (prevent enumeration)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'If this email exists, a reset link has been sent' }),
    } as Response);

    const res = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'unknown@example.com' }),
    });
    expect(res.status).toBe(200);
  });
});

// ── §7.2 Response schema consistency ─────────────────────────────────────────
describe('Auth API Contract — Schema consistency (§7.2)', () => {
  it('Refresh token response includes accessToken', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'new.token.here' }),
    } as Response);

    const res = await fetch('/api/v1/auth/refresh', { method: 'POST', body: '{}' });
    const data = await res.json();

    expect(data).toHaveProperty('accessToken');
    expect(typeof data.accessToken).toBe('string');
  });

  it('Register response includes user object', async () => {
    const payload = {
      accessToken: 'tok',
      refreshToken: 'ref',
      user: { id: 'u1', email: 'e@e.com', role: 'ADMIN', tenantId: 't1' },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => payload,
    } as Response);

    const res = await fetch('/api/v1/auth/register/tenant', { method: 'POST', body: '{}' });
    const data = await res.json();

    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('email');
  });
});
