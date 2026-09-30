import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../auth-secrets';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
  tenantId?: string;
  consumerSource?: string;
  authSource?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    // Reject refresh tokens presented as bearer tokens (token type confusion)
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    // Reject password reset tokens presented as bearer tokens
    if ((payload as any).purpose === 'password_reset') {
      throw new UnauthorizedException('Invalid token type');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      consumerSource: payload.consumerSource,
      authSource: payload.authSource,
    };
  }
}
