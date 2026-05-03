/**
 * Volume 14 — Global Jest setup for all backend specs.
 * Sets process.env so auth-secrets.ts resolves test-safe defaults without
 * throwing in "development" mode.
 */

process.env.NODE_ENV = 'test';
// Use the hard-coded development default so tests don't need real secrets
process.env.JWT_SECRET = 'your-super-secret-jwt-key';
process.env.JWT_REFRESH_SECRET = 'your-super-secret-refresh-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REDIS_URL = ''; // disabled — queue falls back to DB provider
