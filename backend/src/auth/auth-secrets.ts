const DEFAULT_JWT_SECRET = 'your-super-secret-jwt-key';
const DEFAULT_REFRESH_SECRET = 'your-super-secret-refresh-key';

function resolveSecret(envName: string, fallback: string) {
  const value = process.env[envName];
  const isProductionLike = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

  if (value && value !== fallback) {
    return value;
  }

  if (isProductionLike) {
    throw new Error(`${envName} must be configured securely for ${process.env.NODE_ENV}.`);
  }

  return value || fallback;
}

export function getJwtSecret() {
  return resolveSecret('JWT_SECRET', DEFAULT_JWT_SECRET);
}

export function getJwtRefreshSecret() {
  return resolveSecret('JWT_REFRESH_SECRET', DEFAULT_REFRESH_SECRET);
}

export function getJwtExpiry() {
  return (process.env.JWT_EXPIRES_IN || '1h') as any;
}

export function getJwtRefreshExpiry() {
  return (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any;
}
