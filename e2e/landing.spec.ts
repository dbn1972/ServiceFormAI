import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/ServiceFormAI OS/i);

    // Check main heading
    await expect(page.getByRole('heading', { name: /government services/i })).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');

    // Check navigation items
    await expect(page.getByRole('link', { name: /features/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /help/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should have theme toggle', async ({ page }) => {
    await page.goto('/');

    // Theme toggle should be present
    const themeToggle = page.getByLabel(/change theme/i);
    await expect(themeToggle).toBeVisible();
  });

  test('should have language selector', async ({ page }) => {
    await page.goto('/');

    // Language selector should be present
    const languageSelector = page.getByLabel(/change language/i);
    await expect(languageSelector).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /log in/i }).first().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /get started/i }).first().click();

    await expect(page).toHaveURL(/\/register/);
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/digilocker integration/i)).toBeVisible();
    await expect(page.getByText(/smart service discovery/i)).toBeVisible();
    await expect(page.getByText(/real-time tracking/i)).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/500\+/)).toBeVisible();
    await expect(page.getByText(/services available/i)).toBeVisible();
    await expect(page.getByText(/10M\+/)).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be visible
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    await expect(focusedElement).toBeTruthy();
  });
});
