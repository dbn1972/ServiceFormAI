import { test, expect, type Page } from '@playwright/test';

const serviceNames = ['Income Certificate', 'Trade Licence', 'Birth Certificate'] as const;

async function loginAsCitizen(page: Page) {
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
}

async function findServiceId(page: Page, serviceName: string) {
  const catalogResponse = page.waitForResponse(
    (response) => response.url().includes('/consumer/services') && response.ok(),
  );
  await page.goto('/services');
  const servicesPayload = await (await catalogResponse).json();
  const serviceRows = servicesPayload.data?.data ?? servicesPayload.data?.services ?? servicesPayload.services ?? [];
  const service = serviceRows.find((candidate: { name?: string }) => candidate.name === serviceName);

  expect(service?.id, `${serviceName} should be present in the live catalog`).toBeTruthy();
  return service.id as string;
}

test.describe('Citizen service application journeys', () => {
  // The isolated preview intentionally uses one fixed OTP phone; serialize its challenges.
  test.describe.configure({ mode: 'serial' });

  for (const serviceName of serviceNames) {
    test(`citizen can open the real ${serviceName} application form`, async ({ page }) => {
      await loginAsCitizen(page);
      const serviceId = await findServiceId(page, serviceName);

      await expect(page.getByRole('heading', { name: serviceName })).toBeVisible();
      await page.goto(`/services/${encodeURIComponent(serviceId)}`);
      await expect(page.getByRole('button', { name: /start application/i })).toBeVisible();

      await page.goto(`/applications/new?serviceId=${encodeURIComponent(serviceId)}`);
      await expect(page.getByRole('heading', { name: serviceName })).toBeVisible();
      await expect(page.getByText('Before you begin')).toBeVisible();
      await expect(page.getByText('live service and schema data from the backend')).toBeVisible();
    });
  }
});