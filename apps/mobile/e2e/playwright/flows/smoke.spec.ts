import { test, expect } from '../fixtures/test';
import { TestIds } from '../../../lib/test-ids';

test('app boots and shows the login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(TestIds.LOGIN_EMAIL)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId(TestIds.LOGIN_SUBMIT)).toBeVisible();
});
