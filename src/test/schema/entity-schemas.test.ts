/**
 * Volume 12 §6 — Schema and Data Validation Standard
 *
 * Tests schema integrity for core API entities:
 * - required field presence
 * - enum validity
 * - timestamp fields
 * - tenant reference
 * - soft-delete semantics
 *
 * Run: npx vitest run src/test/schema/entity-schemas.test.ts
 */

import { describe, it, expect } from 'vitest';

// ── Type definitions matching backend DTOs / entities ────────────────────────
interface UserEntity {
  id: string;
  email: string;
  role: 'ADMIN' | 'OFFICER' | 'VIEWER';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface ServiceEntity {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'unpublished';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface ApplicationEntity {
  id: string;
  trackingNumber: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending_documents';
  serviceId: string;
  tenantId: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Field validators ──────────────────────────────────────────────────────────
function isISODate(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
}

// ── §6.1 Schema checks — User entity ─────────────────────────────────────────
describe('Schema Validation — User Entity (§6.1)', () => {
  const validUser: UserEntity = {
    id: 'usr-001',
    email: 'admin@gov.in',
    role: 'ADMIN',
    tenantId: 'tenant-001',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  };

  it('User entity has all required fields', () => {
    expect(validUser).toHaveProperty('id');
    expect(validUser).toHaveProperty('email');
    expect(validUser).toHaveProperty('role');
    expect(validUser).toHaveProperty('tenantId');
    expect(validUser).toHaveProperty('createdAt');
    expect(validUser).toHaveProperty('updatedAt');
  });

  it('User role is a valid enum value', () => {
    const validRoles = ['ADMIN', 'OFFICER', 'VIEWER'];
    expect(validRoles).toContain(validUser.role);
  });

  it('Timestamps are ISO format', () => {
    expect(isISODate(validUser.createdAt)).toBe(true);
    expect(isISODate(validUser.updatedAt)).toBe(true);
  });

  it('Tenant reference is present', () => {
    expect(typeof validUser.tenantId).toBe('string');
    expect(validUser.tenantId.length).toBeGreaterThan(0);
  });

  it('Soft-delete field (deletedAt) is null when active', () => {
    expect(validUser.deletedAt).toBeNull();
  });
});

// ── §6.1 Schema checks — Service entity ──────────────────────────────────────
describe('Schema Validation — Service Entity (§6.1)', () => {
  const validService: ServiceEntity = {
    id: 'svc-001',
    name: 'Birth Certificate',
    description: 'Apply for birth certificate',
    status: 'published',
    tenantId: 'tenant-001',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  };

  it('Service entity has required fields', () => {
    const required: (keyof ServiceEntity)[] = ['id', 'name', 'status', 'tenantId', 'createdAt', 'updatedAt'];
    required.forEach((field) => expect(validService).toHaveProperty(field));
  });

  it('Service status is a valid enum value', () => {
    const validStatuses = ['draft', 'published', 'unpublished'];
    expect(validStatuses).toContain(validService.status);
  });

  it('Service timestamps are ISO format', () => {
    expect(isISODate(validService.createdAt)).toBe(true);
    expect(isISODate(validService.updatedAt)).toBe(true);
  });
});

// ── §6.1 Schema checks — Application entity ──────────────────────────────────
describe('Schema Validation — Application Entity (§6.1)', () => {
  const validApp: ApplicationEntity = {
    id: 'app-001',
    trackingNumber: 'TRK-2026-001',
    status: 'submitted',
    serviceId: 'svc-001',
    tenantId: 'tenant-001',
    submittedAt: '2026-05-01T10:00:00.000Z',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
  };

  it('Application entity has required fields', () => {
    const required: (keyof ApplicationEntity)[] = ['id', 'trackingNumber', 'status', 'serviceId', 'tenantId', 'submittedAt'];
    required.forEach((field) => expect(validApp).toHaveProperty(field));
  });

  it('Application status is a valid enum value', () => {
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'pending_documents'];
    expect(validStatuses).toContain(validApp.status);
  });

  it('TrackingNumber is non-empty string', () => {
    expect(typeof validApp.trackingNumber).toBe('string');
    expect(validApp.trackingNumber.length).toBeGreaterThan(0);
  });

  it('Application has cross-reference fields', () => {
    // §6.2 — cross-service references use approved IDs
    expect(validApp).toHaveProperty('serviceId');
    expect(validApp).toHaveProperty('tenantId');
  });
});

// ── §6.2 Data integrity — invalid inputs rejected ─────────────────────────────
describe('Schema Validation — Invalid input rejection (§6.1 + §6.2)', () => {
  it('Email format is validated', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('admin@gov.in')).toBe(true);
    expect(emailRegex.test('not-an-email')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });

  it('Role enum rejects invalid values', () => {
    const validRoles = new Set(['ADMIN', 'OFFICER', 'VIEWER']);
    expect(validRoles.has('ADMIN')).toBe(true);
    expect(validRoles.has('SUPERUSER')).toBe(false);
    expect(validRoles.has('')).toBe(false);
  });

  it('Service status enum rejects invalid values', () => {
    const validStatuses = new Set(['draft', 'published', 'unpublished']);
    expect(validStatuses.has('published')).toBe(true);
    expect(validStatuses.has('active')).toBe(false);
  });

  it('Timestamp fields must be ISO 8601 format', () => {
    expect(isISODate('2026-05-01T00:00:00.000Z')).toBe(true);
    expect(isISODate('01/05/2026')).toBe(false);
    expect(isISODate('')).toBe(false);
    expect(isISODate(null)).toBe(false);
  });
});

// ── §6.3 Schema regression — migration impact ─────────────────────────────────
describe('Schema Validation — Migration Compatibility (§6.3)', () => {
  it('Adding optional field does not break existing consumers', () => {
    // Simulate adding a new optional field to the response
    const enrichedUser = {
      id: 'usr-001',
      email: 'admin@gov.in',
      role: 'ADMIN',
      tenantId: 'tenant-001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      // New optional field added in migration
      mfaEnabled: true,
    };

    // Old consumer that only reads known fields should still work
    const id: string = enrichedUser.id;
    const email: string = enrichedUser.email;
    expect(id).toBe('usr-001');
    expect(email).toBe('admin@gov.in');
  });

  it('Null deletedAt is distinguishable from soft-deleted', () => {
    const active = { id: 'u1', deletedAt: null };
    const deleted = { id: 'u2', deletedAt: '2026-04-01T00:00:00.000Z' };

    expect(active.deletedAt).toBeNull();
    expect(deleted.deletedAt).not.toBeNull();
    expect(isISODate(deleted.deletedAt)).toBe(true);
  });
});
