/**
 * Volume 12 §9 — Module-by-Module Quality Model
 * Volume 12 §7 — API Contract and Integration Validation (Backend)
 *
 * Unit tests for AuthService — validates business logic,
 * error handling, and service contract correctness.
 *
 * Run: cd backend && npx jest auth.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';
import { RefreshTokenNonce } from '../database/entities/refresh-token-nonce.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockConsumerRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockNonceRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

// ── Test Suite ────────────────────────────────────────────────────────────────
describe('AuthService (Volume 12 §9 — Auth module)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(TenantUser), useValue: mockUserRepo },
        { provide: getRepositoryToken(ConsumerUser), useValue: mockConsumerRepo },
        { provide: getRepositoryToken(RefreshTokenNonce), useValue: mockNonceRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── §7.1 Happy path ─────────────────────────────────────────────────────────
  describe('loginTenantUser', () => {
    it('returns tokens and user on valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      const hashed = await bcrypt.hash('password123', 10);

      mockUserRepo.findOne.mockResolvedValue({
        id: 'usr-001',
        email: 'admin@gov.in',
        password_hash: hashed,
        role: 'ADMIN',
        tenant_id: 'tenant-001',
        active: true,
        tenant: { id: 'tenant-001', active: true },
      });
      mockNonceRepo.save.mockResolvedValue({});

      const result = await service.loginTenantUser({ email: 'admin@gov.in', password: 'password123', tenantId: 'tenant-001' });

      expect(result).toHaveProperty('tokens.accessToken');
      expect(result).toHaveProperty('tokens.refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('admin@gov.in');
    });

    // ── §7.1 Permission / validation failures ───────────────────────────────
    it('throws UnauthorizedException for unknown email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.loginTenantUser({ email: 'unknown@example.com', password: 'any', tenantId: 'tenant-001' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const bcrypt = await import('bcrypt');
      const hashed = await bcrypt.hash('correct-password', 10);

      mockUserRepo.findOne.mockResolvedValue({
        id: 'usr-001',
        email: 'admin@gov.in',
        password_hash: hashed,
        role: 'ADMIN',
        active: true,
        tenant: { id: 'tenant-001', active: true },
      });

      await expect(
        service.loginTenantUser({ email: 'admin@gov.in', password: 'wrong-password', tenantId: 'tenant-001' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive user', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'usr-001',
        email: 'admin@gov.in',
        password_hash: 'hash',
        role: 'ADMIN',
        active: false,
        tenant: { id: 'tenant-001', active: true },
      });

      await expect(
        service.loginTenantUser({ email: 'admin@gov.in', password: 'any', tenantId: 'tenant-001' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── Forgot password (§9 — security) ────────────────────────────────────────
  describe('forgotPassword', () => {
    it('does not reveal if email exists (returns reset token regardless)', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      // forgotPassword(email, tenantId?) — does not throw, returns resetToken
      const result = await service.forgotPassword('no-one@example.com');
      // If user not found, returns a placeholder token (security: no info leak)
      expect(result).toHaveProperty('resetToken');
    });

    it('generates JWT reset token for known user', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'usr-001',
        email: 'admin@gov.in',
        role: 'ADMIN',
        tenant_id: 'tenant-001',
        active: true,
      });

      const result = await service.forgotPassword('admin@gov.in', 'tenant-001');
      expect(result).toHaveProperty('resetToken');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  // ── Reset password (§9 — security) ─────────────────────────────────────────
  describe('resetPassword', () => {
    it('throws on invalid/expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(
        service.resetPassword('expired.token', 'NewPass123!')
      ).rejects.toThrow();
    });
  });
});
