import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { IsNull, Repository } from 'typeorm';
import { TenantUser } from '../../database/entities/tenant-user.entity';

type KeycloakPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  tenant_id?: string;
  iss?: string;
  aud?: string | string[];
};

@Injectable()
export class KeycloakStrategy {
  private readonly issuer = process.env.KEYCLOAK_ISSUER;
  private readonly audience = process.env.KEYCLOAK_AUDIENCE;
  private readonly jwks = this.createJwks();

  constructor(
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
  ) {}

  async authenticate(token: string) {
    if (!this.issuer || !this.audience || !this.jwks) {
      throw new UnauthorizedException('Tenant staff identity provider is not configured');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      });
      const claims = payload as KeycloakPayload;
      if (!claims.sub || !claims.email || claims.email_verified !== true) {
        throw new UnauthorizedException('Invalid tenant staff identity');
      }

      let membership = await this.tenantUserRepository.findOne({
        where: {
          keycloak_issuer: this.issuer,
          keycloak_subject: claims.sub,
          active: true,
        },
        relations: ['tenant'],
      });

      if (!membership) {
        const invitations = await this.tenantUserRepository.find({
          where: {
            email: claims.email.trim().toLowerCase(),
            active: true,
            keycloak_subject: IsNull(),
            keycloak_issuer: IsNull(),
          },
          relations: ['tenant'],
        });
        if (invitations.length === 1) {
          const invitation = invitations[0];
          const linked = await this.tenantUserRepository.update(
            {
              id: invitation.id,
              keycloak_subject: IsNull(),
              keycloak_issuer: IsNull(),
            },
            {
              keycloak_subject: claims.sub,
              keycloak_issuer: this.issuer,
            },
          );
          if (linked.affected === 1) {
            membership = invitation;
          } else {
            membership = await this.tenantUserRepository.findOne({
              where: {
                keycloak_issuer: this.issuer,
                keycloak_subject: claims.sub,
                active: true,
              },
              relations: ['tenant'],
            });
          }
        } else if (invitations.length > 1) {
          throw new UnauthorizedException('Tenant staff membership requires administrator resolution');
        }
      }

      if (!membership || membership.tenant?.status !== 'active') {
        throw new UnauthorizedException('Tenant staff membership is inactive or missing');
      }

      return {
        id: membership.id,
        email: membership.email,
        role: membership.role,
        tenantId: membership.tenant_id,
        identityProvider: 'keycloak' as const,
        subject: claims.sub,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid tenant staff token');
    }
  }

  async getActiveMembership(userId: string, tenantId: string) {
    const membership = await this.tenantUserRepository.findOne({
      where: { id: userId, tenant_id: tenantId, active: true },
      relations: ['tenant'],
    });
    if (!membership || membership.tenant?.status !== 'active') {
      throw new UnauthorizedException('Tenant staff membership is inactive or missing');
    }
    return {
      id: membership.id,
      email: membership.email,
      role: membership.role,
      tenantId: membership.tenant_id,
      identityProvider: 'keycloak' as const,
    };
  }

  private createJwks() {
    if (!this.issuer) {
      return null;
    }
    try {
      const issuerUrl = new URL(this.issuer);
      if (issuerUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        return null;
      }
      return createRemoteJWKSet(
        new URL(`${issuerUrl.href.replace(/\/$/, '')}/protocol/openid-connect/certs`),
      );
    } catch {
      return null;
    }
  }
}