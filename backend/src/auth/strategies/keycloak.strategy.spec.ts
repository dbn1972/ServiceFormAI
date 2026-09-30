import { UnauthorizedException } from '@nestjs/common';
import { exportJWK, generateKeyPair, createLocalJWKSet, SignJWT } from 'jose';
import { KeycloakStrategy } from './keycloak.strategy';
import { TenantUser } from '../../database/entities/tenant-user.entity';

describe('KeycloakStrategy', () => {
  const issuer = 'https://identity.example.gov/realms/serviceformai';
  const audience = 'serviceformai-api';
  let strategy: KeycloakStrategy;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
  let tenantUserRepository: { findOne: jest.Mock; find: jest.Mock };
  let membershipUpdate: jest.Mock;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    const publicJwk = await exportJWK(pair.publicKey);
    publicJwk.kid = 'test-key';
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';
    (globalThis as any).__keycloakTestJwks = createLocalJWKSet({ keys: [publicJwk] });
  });

  beforeEach(() => {
    process.env.KEYCLOAK_ISSUER = issuer;
    process.env.KEYCLOAK_AUDIENCE = audience;
    tenantUserRepository = { findOne: jest.fn(), find: jest.fn() };
    membershipUpdate = jest.fn();
    (tenantUserRepository as any).update = membershipUpdate;
    tenantUserRepository.find.mockResolvedValue([]);
    strategy = new KeycloakStrategy(tenantUserRepository as any);
    Object.defineProperty(strategy, 'jwks', {
      value: (globalThis as any).__keycloakTestJwks,
    });
  });

  async function token(options: {
    tokenIssuer?: string;
    tokenAudience?: string;
    algorithm?: string;
    emailVerified?: boolean;
  } = {}) {
    return new SignJWT({
      email: 'officer@gov.in',
      email_verified: options.emailVerified ?? true,
    })
      .setProtectedHeader({ alg: options.algorithm ?? 'RS256', kid: 'test-key' })
      .setIssuer(options.tokenIssuer ?? issuer)
      .setAudience(options.tokenAudience ?? audience)
      .setSubject('keycloak-subject-1')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(options.algorithm === 'HS256'
        ? new TextEncoder().encode('attacker-shared-secret')
        : privateKey);
  }

  it('derives role and tenant only from an active local membership', async () => {
    tenantUserRepository.findOne.mockResolvedValue({
      id: 'local-user-1',
      email: 'canonical@gov.in',
      role: 'officer',
      tenant_id: 'tenant-1',
      active: true,
      tenant: { status: 'active' },
    } as TenantUser);

    const result = await strategy.authenticate(await token());

    expect(tenantUserRepository.findOne).toHaveBeenCalledWith({
      where: {
        keycloak_issuer: issuer,
        keycloak_subject: 'keycloak-subject-1',
        active: true,
      },
      relations: ['tenant'],
    });
    expect(result).toMatchObject({
      id: 'local-user-1',
      email: 'canonical@gov.in',
      role: 'officer',
      tenantId: 'tenant-1',
      identityProvider: 'keycloak',
    });
  });

  it.each([
    ['wrong issuer', { tokenIssuer: 'https://attacker.example/realm' }],
    ['wrong audience', { tokenAudience: 'other-api' }],
    ['unverified email', { emailVerified: false }],
    ['wrong signing algorithm', { algorithm: 'HS256' }],
  ])('rejects tokens with %s', async (_label, options) => {
    await expect(strategy.authenticate(await token(options))).rejects.toThrow(UnauthorizedException);
    expect(tenantUserRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects a missing or inactive local membership', async () => {
    tenantUserRepository.findOne.mockResolvedValue(null);

    await expect(strategy.authenticate(await token())).rejects.toThrow(UnauthorizedException);
  });

  it('revalidates active tenant membership and returns the current role for platform sessions', async () => {
    tenantUserRepository.findOne.mockResolvedValue({
      id: 'local-user-1',
      email: 'officer@gov.in',
      role: 'reviewer',
      tenant_id: 'tenant-1',
      active: true,
      tenant: { status: 'active' },
    });

    await expect(strategy.getActiveMembership('local-user-1', 'tenant-1')).resolves.toMatchObject({
      id: 'local-user-1',
      role: 'reviewer',
      tenantId: 'tenant-1',
    });
    expect(tenantUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'local-user-1', tenant_id: 'tenant-1', active: true },
      relations: ['tenant'],
    });
  });

  it('links a verified invited email only to the tenant asserted by the trusted issuer', async () => {
    tenantUserRepository.findOne
      .mockResolvedValueOnce(null);
    tenantUserRepository.find.mockResolvedValueOnce([{
        id: 'invited-user-1',
        email: 'officer@gov.in',
        role: 'admin',
        tenant_id: 'tenant-42',
        active: true,
        tenant: { status: 'active' },
      }]);
    membershipUpdate.mockResolvedValue({ affected: 1 });

    const inviteToken = await new SignJWT({
      email: 'officer@gov.in',
      email_verified: true,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('keycloak-subject-1')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const result = await strategy.authenticate(inviteToken);

    expect(membershipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'invited-user-1' }),
      { keycloak_subject: 'keycloak-subject-1', keycloak_issuer: issuer },
    );
    expect(result).toMatchObject({ tenantId: 'tenant-42', role: 'admin' });
  });

  it('rejects an ambiguous email with multiple pending tenant memberships', async () => {
    tenantUserRepository.findOne.mockResolvedValue(null);
    tenantUserRepository.find.mockResolvedValue([
      { id: 'invite-1', tenant_id: 'tenant-1' },
      { id: 'invite-2', tenant_id: 'tenant-2' },
    ]);

    await expect(strategy.authenticate(await token())).rejects.toThrow('administrator resolution');
    expect(membershipUpdate).not.toHaveBeenCalled();
  });
});