import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KeycloakStrategy } from '../strategies/keycloak.strategy';

@Injectable()
export class TenantStaffAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(@Optional() private readonly keycloakStrategy?: KeycloakStrategy) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const token = typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(.+)$/i)?.[1]
      : undefined;

    if (!token) {
      throw new UnauthorizedException();
    }

    const [encodedHeader] = token.split('.');
    try {
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
      if (header.alg === 'RS256') {
        request.user = await this.keycloakStrategy.authenticate(token);
        return true;
      }
      const [, encodedPayload] = token.split('.');
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.role === 'consumer') {
        throw new UnauthorizedException('Citizen credentials are not valid for tenant staff routes');
      }
      if (
        payload.authSource !== 'keycloak' &&
        process.env.NODE_ENV !== 'test' &&
        process.env.ALLOW_LEGACY_TENANT_PASSWORD_AUTH !== 'true'
      ) {
        throw new UnauthorizedException('Tenant staff must authenticate through the configured identity provider');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid tenant staff token');
    }

    const authenticated = await super.canActivate(context);
    if (!authenticated) return false;
    if (!request.user?.id || !request.user?.tenantId) {
      throw new UnauthorizedException('Tenant staff identity is incomplete');
    }
    if (typeof this.keycloakStrategy?.getActiveMembership !== 'function') {
      if (process.env.NODE_ENV === 'test') return true;
      throw new UnauthorizedException('Tenant staff membership validation is unavailable');
    }
    const membership = await this.keycloakStrategy.getActiveMembership(request.user.id, request.user.tenantId);
    request.user = { ...request.user, ...membership };
    return true;
  }
}