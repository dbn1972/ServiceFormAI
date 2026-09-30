import { test, expect } from '@playwright/test';

test('citizen can open the real Income Certificate application form', async ({ page }) => {
  const mobile = process.env.E2E_MOBILE || '9876543210';
  const otp = process.env.OTP_TEST_CODE || '123456';

  await page.goto('/login');
  await page.getByRole('tab', { name: 'OTP' }).click();
  await page.getByLabel('Mobile Number').fill(mobile);
  await page.getByRole('button', { name: /send otp/i }).click();
  await expect(page.getByLabel('Enter OTP')).toBeVisible();
  await page.getByLabel('Enter OTP').fill(otp);
  await page.getByRole('button', { name: /log in to your account/i }).click();

  if (await page.getByRole('heading', { name: 'Welcome to ServiceFormAI' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /^continue$/i }).click();
    await page.getByRole('button', { name: /^continue$/i }).click();
    await page.getByRole('button', { name: /continue to consent/i }).click();
    await page.getByRole('button', { name: /continue to dashboard/i }).click();
  }

  const catalogResponse = page.waitForResponse(
    (response) => response.url().includes('/consumer/services') && response.ok(),
  );
  await page.goto('/services');
  const servicesPayload = await (await catalogResponse).json();
  const services = servicesPayload.data?.services ?? servicesPayload.services ?? [];
  const incomeCertificate = services.find(
    (service: { name?: string }) => service.name === 'Income Certificate',
  );

  expect(incomeCertificate?.id).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Income Certificate' })).toBeVisible();

  await page.goto(`/applications/new?serviceId=${encodeURIComponent(incomeCertificate.id)}`);
  await expect(page.getByRole('heading', { name: 'Income Certificate' })).toBeVisible();
  await expect(page.getByText('Service Intro')).toBeVisible();
});