import { test, expect } from '../fixtures/test';
import { TestIds, exerciseResultId, routineRowId } from '../../../lib/test-ids';

test('create a routine and see it in the Log list with correct name + exercise count', async ({
  page, login, dataClient, track,
}) => {
  const routineName = `E2E Routine ${Date.now()}`;

  // Failure-safe teardown: delete any routine matching our unique name.
  track(async () => {
    const routines = await dataClient.getRoutines();
    for (const r of routines.filter((x) => x.name === routineName)) {
      await dataClient.deleteRoutine(r.id);
    }
  });

  await login();

  // Open Log tab -> New routine.
  await page.getByTestId(TestIds.NEW_ROUTINE_BTN).click();

  // Name the routine.
  await page.getByTestId(TestIds.ROUTINE_NAME_INPUT).fill(routineName);

  // Add one exercise via the picker.
  await page.getByTestId(TestIds.ROUTINE_ADD_EXERCISE_BTN).click();
  await page.getByTestId(TestIds.EXERCISE_SEARCH_INPUT).fill('bench');
  await page.getByTestId(exerciseResultId(0)).click({ timeout: 15_000 });

  // Save.
  await page.getByTestId(TestIds.ROUTINE_SAVE_BTN).click();

  // Assert: routine row appears with the name and an exercise count of 1.
  const row = page.getByTestId(routineRowId(routineName));
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText(routineName);
  await expect(row).toContainText('1 exercise');
});
