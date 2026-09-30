import { execFileSync } from 'node:child_process';

export default function globalSetup() {
  const databaseEnv = {
    ...process.env,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_USERNAME: process.env.DB_USERNAME || 'serviceformai',
    DB_PASSWORD: process.env.DB_PASSWORD || 'changeme_in_production',
    DB_NAME: process.env.DB_NAME || 'serviceformai',
  };
  execFileSync('pnpm', ['--dir', 'backend', 'run', 'e2e:setup'], {
    cwd: process.cwd(),
    env: databaseEnv,
    stdio: 'inherit',
  });
}