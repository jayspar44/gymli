import type { Page } from '@playwright/test';
import { TestIds } from '../../../lib/test-ids';
import { env } from './env';

// Drives the real login UI with env creds. Login is a precondition, NOT asserted.
export async function loginViaUi(page: Page): Promise<void> {
  await page.goto('/');
  const email = page.getByTestId(TestIds.LOGIN_EMAIL);
  await email.waitFor({ state: 'visible', timeout: 30_000 });
  await email.fill(env.email);
  await page.getByTestId(TestIds.LOGIN_PASSWORD).fill(env.password);
  await page.getByTestId(TestIds.LOGIN_SUBMIT).click();
  // Login succeeded once the login form is gone (tab UI present).
  await email.waitFor({ state: 'hidden', timeout: 30_000 });
}
