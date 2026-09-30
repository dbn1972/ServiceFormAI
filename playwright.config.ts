import { defineConfig, devices } from '@playwright/test';

// ── Volume 12 §3 — Test Environment Matrix ────────────────────────────────────
// Covers: Mobile portrait/landscape, Small/Large tablet, Laptop, Desktop, Widescreen
// Browsers: Chrome, Edge, Safari, Firefox
// Themes: Light mode (default), Dark mode via storageState
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // ── Desktop browsers (§3.3) ──────────────────────────────────────────────
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/responsive.spec.ts', '**/dark-mode.spec.ts', '**/income-certificate.spec.ts'],
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/auth.spec.ts', '**/landing.spec.ts'],
    },
    {
      name: 'Desktop Edge',
      use: { ...devices['Desktop Edge'] },
      testMatch: ['**/auth.spec.ts', '**/landing.spec.ts'],
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/auth.spec.ts', '**/landing.spec.ts'],
    },

    // ── Mobile (§3.2 — iPhone, Pixel) ────────────────────────────────────────
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/responsive.spec.ts', '**/auth.spec.ts'],
    },
    {
      name: 'Mobile Safari (iPhone 14)',
      use: { ...devices['iPhone 14'] },
      testMatch: ['**/responsive.spec.ts', '**/auth.spec.ts'],
    },
    {
      name: 'Mobile Landscape (Pixel 5)',
      use: { ...devices['Pixel 5 landscape'] },
      testMatch: ['**/responsive.spec.ts'],
    },

    // ── Tablet (§3.2 — iPad) ─────────────────────────────────────────────────
    {
      name: 'Tablet (iPad Pro)',
      use: { ...devices['iPad Pro'] },
      testMatch: ['**/responsive.spec.ts', '**/admin-journey.spec.ts'],
    },
    {
      name: 'Tablet Landscape (iPad Pro)',
      use: { ...devices['iPad Pro landscape'] },
      testMatch: ['**/responsive.spec.ts'],
    },

    // ── Custom viewport — Large Desktop / Widescreen ─────────────────────────
    {
      name: 'Large Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: ['**/responsive.spec.ts'],
    },
    {
      name: 'Widescreen',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
      },
      testMatch: ['**/responsive.spec.ts'],
    },

    // ── Dark mode project (§10 — Theme checks) ───────────────────────────────
    {
      name: 'Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        storageState: './e2e/fixtures/dark-mode.json',
      },
      testMatch: ['**/dark-mode.spec.ts'],
    },

    // ── Accessibility project (§10 — Accessibility checks) ───────────────────
    {
      name: 'Accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/accessibility.spec.ts'],
    },

    {
      name: 'Income Certificate',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/income-certificate.spec.ts'],
    },
  ],

  webServer: [
    {
      command: 'VITE_API_URL=http://localhost:3101/api/v1 npm run dev -- --host localhost --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'NODE_ENV=test PORT=3101 API_PORT=3101 DB_HOST=${DB_HOST:-localhost} DB_PORT=${DB_PORT:-5432} DB_USERNAME=${DB_USERNAME:-serviceformai} DB_PASSWORD=${DB_PASSWORD:-changeme_in_production} DB_NAME=${DB_NAME:-serviceformai} OTP_TEST_CODE=123456 OTP_PEPPER=serviceformai-e2e-otp-pepper-2026 pnpm --dir backend run start:dev',
      url: 'http://localhost:3101/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
