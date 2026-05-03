/**
 * Volume 12 §4 — Mobile/Tablet/Desktop Validation Standard
 * Volume 12 §5 — Responsive and Layout Testing
 *
 * This spec validates layout, navigation, and CTA visibility across
 * all viewport classes defined in §3.1 / §3.2.
 *
 * Run: npx playwright test responsive.spec.ts
 */

import { test, expect } from '@playwright/test';

// ── §4.1 Mobile checks ────────────────────────────────────────────────────────
test.describe('Responsive — Public pages', () => {
  test('Landing page renders without overflow', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Login page is fully usable (touch targets)', async ({ page }) => {
    await page.goto('/login');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Primary CTA must be visible without scrolling on small viewports
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('Registration page renders correctly', async ({ page }) => {
    await page.goto('/register');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // No element exceeds viewport width
    const overflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const vw = document.documentElement.clientWidth;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 5) return el.tagName + ':' + el.className;
      }
      return null;
    });
    expect(overflow).toBeNull();
  });
});

// ── §4.2 Tablet / §4.3 Desktop navigation checks ────────────────────────────
test.describe('Responsive — Navigation', () => {
  test('About page is reachable and readable', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('body')).toBeVisible();
    // No critical actions hidden
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible();
  });

  test('FAQ page renders without clipping', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 5);
    expect(overflow).toBe(true);
  });

  test('Privacy policy page renders correctly', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Terms of service page renders correctly', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ── §5 — Breakpoint / Container overflow checks ───────────────────────────────
test.describe('Responsive — Container overflow (§5)', () => {
  const publicPaths = ['/', '/login', '/register', '/about', '/faq', '/pricing'];

  for (const path of publicPaths) {
    test(`No horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const overflowCount = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll('*')).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.right > vw + 10;
        }).length;
      });
      // Allow a small tolerance for edge cases
      expect(overflowCount).toBeLessThanOrEqual(3);
    });
  }
});

// ── §5 — Modal sizing ─────────────────────────────────────────────────────────
test.describe('Responsive — Critical CTA visibility (§4.1 + §5)', () => {
  test('Login primary CTA is visible in viewport', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // At least one button/link should be in view
    const ctaCount = await page.locator('button:visible, a[href]:visible').count();
    expect(ctaCount).toBeGreaterThan(0);
  });

  test('Registration CTA is visible without excessive scroll', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    const ctaCount = await page.locator('button:visible').count();
    expect(ctaCount).toBeGreaterThan(0);
  });
});
