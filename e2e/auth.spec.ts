import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  test('should show email login form', async ({ page }) => {
    await page.getByRole('button', { name: /email/i }).click();

    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /email/i }).click();

    // Try to submit without filling fields
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should display SSO options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /digilocker/i })).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
  });

  test('should be accessible with keyboard', async ({ page }) => {
    // Tab through login options
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to select login method with Enter
    await page.keyboard.press('Enter');

    // Form should be visible
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toBeVisible();
  });

  test('should toggle between login methods', async ({ page }) => {
    // Click email login
    await page.getByRole('button', { name: /email/i }).click();
    await expect(page.getByLabel(/email address/i)).toBeVisible();

    // Click mobile login
    await page.getByRole('button', { name: /mobile/i }).click();
    await expect(page.getByLabel(/mobile number/i)).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for accessible navigation
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();

    // Check for accessible buttons
    await expect(page.getByRole('button', { name: /google/i })).toHaveAttribute(
      'aria-label',
      /google/i
    );
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing services', async ({ page }) => {
    await page.goto('/services');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing applications', async ({ page }) => {
    await page.goto('/applications');

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test('should show registration form fields', async ({ page }) => {
    await page.getByRole('button', { name: /email/i }).click();

    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/mobile number/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should navigate back to login', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
