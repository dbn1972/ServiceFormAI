import { DataSource } from 'typeorm';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { TenantOnboardingService } from './tenant-onboarding.service';

describe('TenantOnboardingService', () => {
  const tenantRepository = {
    findOne: jest.fn(),
    create: jest.fn((value) => ({ id: 'tenant-id', ...value })),
    save: jest.fn(async (value) => value),
  };
  const tenantUserRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const manager = {
    getRepository: jest.fn((entity) =>
      entity === Tenant ? tenantRepository : tenantUserRepository,
    ),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  } as unknown as DataSource;

  let service: TenantOnboardingService;

  beforeEach(() => {
    jest.clearAllMocks();
    tenantRepository.findOne.mockResolvedValue(null);
    service = new TenantOnboardingService(dataSource);
  });

  it('creates the tenant, governance metadata, and pending Keycloak admin in one transaction', async () => {
    const result = await service.submit({
      orgName: 'Pune Municipal Corporation',
      orgType: 'municipality',
      state: 'Maharashtra',
      district: 'Pune',
      municipalityName: 'Pune Municipal Corporation',
      subdomain: 'pune-municipal',
      adminEmail: 'ADMIN@PUNE.GOV.IN',
      adminName: 'Asha Rao',
      adminMobile: '9876543210',
      requestedServices: ['income-cert'],
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(tenantRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tenant-id',
      status: 'onboarding',
      subdomain: 'pune-municipal',
      governance_scope: expect.objectContaining({
        owner_level: 'municipality',
        jurisdiction_model: 'urban_local_body',
        district_name: 'Pune',
      }),
    }));
    const admin = tenantUserRepository.save.mock.calls[0][0];
    expect(admin).toMatchObject({
      tenant_id: 'tenant-id',
      email: 'admin@pune.gov.in',
      role: 'admin',
      keycloak_subject: null,
      keycloak_issuer: null,
      active: true,
    });
    expect(admin.password_hash).toMatch(/^\$2[aby]\$12\$/);
    expect(result).toMatchObject({
      tenantId: 'tenant-id',
      status: 'onboarding',
      provisioningStatus: 'pending_identity_verification',
    });
  });

  it('rejects a duplicate organization before writing an administrator membership', async () => {
    tenantRepository.findOne.mockResolvedValue({ id: 'existing-tenant' });

    await expect(service.submit({
      orgName: 'Existing Municipality',
      orgType: 'municipality',
      state: 'Maharashtra',
      subdomain: 'existing-municipality',
      adminEmail: 'admin@gov.in',
      adminName: 'Admin Person',
      adminMobile: '9876543210',
    })).rejects.toThrow('already exists');
    expect(tenantRepository.save).not.toHaveBeenCalled();
    expect(tenantUserRepository.save).not.toHaveBeenCalled();
  });
});