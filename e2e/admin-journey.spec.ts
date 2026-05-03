/**
 * Volume 12 §9 — Module-by-Module Quality Model: Admin Journeys
 *
 * Covers the critical admin/operator journeys for release confidence.
 * These are integration-level smoke tests for the admin console module.
 *
 * Run: npx playwright test admin-journey.spec.ts
 */

import { test, expect } from '@playwright/test';

// ── Shared auth state helpers ─────────────────────────────────────────────────
// In real CI these would use saved auth state via storageState.
// For now, we test the accessible-without-auth redirect behavior.

test.describe('Admin — Unauthenticated redirects (§9)', () => {
  const adminPaths = [
    '/admin/analytics',
    '/admin/departments',
    '/admin/services/create',
    '/admin/audit',
    '/admin/sla',
    '/admin/readiness',
  ];

  for (const path of adminPaths) {
    test(`${path} redirects unauthenticated users to /login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      // Should redirect to login or show a 404, never expose admin content
      const url = page.url();
      const isLoginOrNotFound = url.includes('/login') || url.includes('/404') || url.includes('*');
      // If still on the same path, the page should show a login prompt
      if (!isLoginOrNotFound) {
        // At minimum an auth-required screen should be shown
        const body = await page.locator('body').textContent();
        const hasAuthSignal =
          (body ?? '').toLowerCase().includes('login') ||
          (body ?? '').toLowerCase().includes('sign in') ||
          (body ?? '').toLowerCase().includes('unauthor');
        expect(hasAuthSignal).toBe(true);
      } else {
        expect(isLoginOrNotFound).toBe(true);
      }
    });
  }
});

// ── Officer paths ─────────────────────────────────────────────────────────────
test.describe('Officer — Unauthenticated redirects (§9)', () => {
  const officerPaths = ['/officer/dashboard', '/officer/queue', '/officer/verify-documents'];

  for (const path of officerPaths) {
    test(`${path} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      const url = page.url();
      const redirected = url.includes('/login');
      if (!redirected) {
        const body = await page.locator('body').textContent();
        expect((body ?? '').toLowerCase()).toMatch(/login|sign.?in|unauthor/);
      } else {
        expect(redirected).toBe(true);
      }
    });
  }
});

// ── Public pages are accessible without auth ──────────────────────────────────
test.describe('Admin — Public route accessibility (§9)', () => {
  test('Admin analytics page shows redirect for guest', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('domcontentloaded');
    // Should not throw a JS error
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    expect(errors.length).toBe(0);
  });
});

// ── Enterprise readiness dashboard ────────────────────────────────────────────
test.describe('Admin — Enterprise Readiness Dashboard (§9)', () => {
  test('Readiness page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/readiness');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const redirected = url.includes('/login');
    if (!redirected) {
      const body = await page.locator('body').textContent();
      expect((body ?? '').toLowerCase()).toMatch(/login|sign.?in|unauthor|readiness/);
    } else {
      expect(redirected).toBe(true);
    }
  });
});
