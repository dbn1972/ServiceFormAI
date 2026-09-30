import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KeycloakStrategy } from '../strategies/keycloak.strategy';

@Injectable()
export class CitizenOrTenantStaffAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(keycloakStrategy: KeycloakStrategy) {
    super();
    this.keycloakStrategy = keycloakStrategy;
  }

  private readonly keycloakStrategy: KeycloakStrategy;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const token = typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(.+)$/i)?.[1]
      : undefined;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const [encodedHeader] = token.split('.');
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
      if (header.alg === 'RS256') {
        request.user = await this.keycloakStrategy.authenticate(token);
        return true;
      }
      if (header.alg !== 'HS256') {
        throw new UnauthorizedException('Unsupported token algorithm');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }

    await super.canActivate(context);
    const user = request.user;
    if (!user || user.role === 'consumer') {
      if (!user || user.role !== 'consumer') {
        throw new UnauthorizedException();
      }
      return true;
    }

    if (
      user.authSource !== 'keycloak' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.ALLOW_LEGACY_TENANT_PASSWORD_AUTH !== 'true'
    ) {
      throw new UnauthorizedException('Tenant staff must authenticate through the configured identity provider');
    }

    return true;
  }
}