import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantUser } from '../database/entities/tenant-user.entity';
import { TenantOnboardingDto } from './dto/tenant-onboarding.dto';

@Injectable()
export class TenantOnboardingService {
  constructor(private readonly dataSource: DataSource) {}

  async submit(dto: TenantOnboardingDto) {
    const email = dto.adminEmail.trim().toLowerCase();
    const name = dto.orgName.trim();
    const role = 'admin';
    const passwordHash = await bcrypt.hash(randomBytes(48).toString('base64url'), 12);

    try {
      const tenant = await this.dataSource.transaction(async (manager) => {
        const tenantRepository = manager.getRepository(Tenant);
        const userRepository = manager.getRepository(TenantUser);
        const existing = await tenantRepository.findOne({
          where: [{ name }, { subdomain: dto.subdomain }],
        });
        if (existing) {
          throw new ConflictException('An organization with this name or portal address already exists');
        }

        const ownerLevel = dto.orgType === 'district-office'
          ? 'district_office'
          : dto.orgType === 'municipality'
            ? 'municipality'
            : dto.orgType === 'panchayat'
              ? 'panchayat'
              : dto.orgType === 'central-ministry'
                ? 'ministry'
                : dto.orgType === 'state-dept'
                  ? 'department'
                  : 'department';
        const tenant = tenantRepository.create({
          name,
          subdomain: dto.subdomain,
          type: 'government',
          status: 'onboarding',
          contact_email: email,
          governance_scope: {
            owner_level: ownerLevel,
            monitoring_mode: dto.orgType === 'central-ministry' ? 'central' : 'state',
            jurisdiction_model: dto.orgType === 'municipality'
              ? 'urban_local_body'
              : dto.orgType === 'panchayat'
                ? 'rural_local_body'
                : 'state',
            state_name: dto.state,
            district_name: dto.district,
            municipality_name: dto.municipalityName,
          },
          onboarding_metadata: {
            organization_type: dto.orgType,
            initial_admin_mobile: `+91${dto.adminMobile}`,
            office_name: dto.officeName,
            requested_services: dto.requestedServices ?? [],
            provisioning_status: 'pending_identity_verification',
          },
        });
        await tenantRepository.save(tenant);

        const nameParts = dto.adminName.trim().split(/\s+/);
        const membership = userRepository.create({
          tenant_id: tenant.id,
          email,
          password_hash: passwordHash,
          role,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || null,
          keycloak_subject: null,
          keycloak_issuer: null,
          active: true,
        });
        await userRepository.save(membership);

        return tenant;
      });

      return {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        status: tenant.status,
        provisioningStatus: 'pending_identity_verification',
        adminEmail: email,
      };
    } catch (error) {
      if ((error as any)?.code === '23505') {
        throw new ConflictException('An organization with this name or portal address already exists');
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ServiceUnavailableException('Unable to submit tenant onboarding request');
    }
  }
}