import { test, expect } from '../fixtures/test';
import { TestIds } from '../../../lib/test-ids';

test('editing the display name shows a debounced "Saved" indicator (no sign-out)', async ({
  page, login, dataClient, track,
}) => {
  // Remember the original name; restore it in teardown.
  const original = (await dataClient.getProfile()) as { displayName?: string };
  const originalName = original.displayName ?? '';
  track(async () => { await dataClient.updateProfile({ displayName: originalName }); });

  const newName = `E2E ${Date.now()}`;

  await login();
  await page.goto('/profile');

  const input = page.getByTestId(TestIds.PROFILE_DISPLAY_NAME_INPUT);
  await input.fill(newName);

  // Debounced autosave -> "Saved" indicator appears. No sign-out.
  await expect(page.getByTestId(TestIds.PROFILE_SAVED_INDICATOR)).toBeVisible({ timeout: 15_000 });
  // Still on profile (not bounced to login).
  await expect(input).toBeVisible();
});
