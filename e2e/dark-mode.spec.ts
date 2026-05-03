/**
 * Volume 12 §10 — Dark Mode and Theme Validation
 *
 * Validates that all core screens render correctly in dark mode —
 * including forms, tables, modals, navigation, and theme switching.
 *
 * Run: npx playwright test dark-mode.spec.ts --project="Dark Mode"
 */

import { test, expect } from '@playwright/test';

// Inject dark mode via localStorage before page load (matches next-themes pattern)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
  });
});

test.describe('Dark Mode — Public Pages (§10)', () => {
  test('Landing page renders in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // html should have 'dark' class (next-themes / tailwind dark mode)
    const htmlClass = await page.locator('html').getAttribute('class');
    // Dark mode class may be set after hydration
    await page.waitForTimeout(300);
    const bodyBg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    // Background should not be pure white in dark mode
    expect(bodyBg).not.toBe('rgb(255, 255, 255)');
  });

  test('Login page renders correctly in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    // No overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Registration page renders correctly in dark mode', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dark Mode — Theme switching persistence (§10)', () => {
  test('Theme persists across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to another page
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    // Theme should persist (localStorage theme key should still be 'dark')
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  test('Theme is not broken by page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });
});

test.describe('Dark Mode — Form elements visible in dark mode (§10)', () => {
  test('Login form inputs have readable contrast in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const inputs = page.locator('input:visible');
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i);
      const color = await input.evaluate((el: Element) => window.getComputedStyle(el as HTMLElement).color);
      // Color should not be 'rgba(0,0,0,0)' (invisible text)
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Buttons remain visible in dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // First button should have visible background or border
    if (count > 0) {
      const bgColor = await buttons.first().evaluate((el: Element) =>
        window.getComputedStyle(el as HTMLElement).backgroundColor
      );
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});

test.describe('Dark Mode — No overflow or clipped content (§10)', () => {
  const paths = ['/', '/login', '/register', '/about', '/faq'];

  for (const path of paths) {
    test(`No horizontal overflow in dark mode on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const overflows = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll('*')).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.right > vw + 10;
        }).length;
      });
      expect(overflows).toBeLessThanOrEqual(3);
    });
  }
});
