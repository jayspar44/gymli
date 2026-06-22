import { test, expect } from '../fixtures/test';
import {
  TestIds, exerciseResultId, setRowWeightId, setRowRepsId, setRowCompleteId,
} from '../../../lib/test-ids';

type WorkoutStub = { id: string };

async function getWorkouts(dataClient: Awaited<ReturnType<typeof import('../fixtures/test-data').createDataClient>>) {
  return (await dataClient.getWorkouts({}) as WorkoutStub[]) ?? [];
}

test('run a guided session, log a set, finish, see volume + set count in summary', async ({
  page, login, dataClient, track,
}) => {
  const before = new Set<string>();

  // Capture pre-existing workout ids so teardown only deletes the one we create.
  track(async () => {
    const after = await getWorkouts(dataClient);
    for (const w of after) {
      if (!before.has(w.id)) await dataClient.deleteWorkout(w.id);
    }
  });

  await login();
  (await getWorkouts(dataClient)).forEach((w) => before.add(w.id));

  // Start a session and add an exercise.
  await page.getByTestId(TestIds.SESSION_ADD_EXERCISE_BTN).click();
  await page.getByTestId(TestIds.EXERCISE_SEARCH_INPUT).fill('bench');
  await page.getByTestId(exerciseResultId(0)).click({ timeout: 15_000 });

  // Log the first set: weight + reps, then mark complete.
  // Set 0 is the only set on the freshly added exercise card.
  await page.getByTestId(setRowWeightId(0)).fill('100');
  await page.getByTestId(setRowRepsId(0, 0)).fill('5');
  await page.getByTestId(setRowCompleteId(0)).click();

  // Finish the workout — TWO-STEP: open the confirmation sheet, then confirm.
  // The header 'End' Pressable has no testID; target it by text.
  await page.getByText('End').click();
  await page.getByTestId(TestIds.SESSION_END_BTN).click();

  // Assert summary state: volume = 100 * 5 = 500 (< 1000 so no 'k' suffix), sets = 1.
  await expect(page.getByTestId(TestIds.SUMMARY_VOLUME)).toContainText('500', { timeout: 20_000 });
  await expect(page.getByTestId(TestIds.SUMMARY_SETS)).toContainText('1');

  await page.getByTestId(TestIds.SUMMARY_DONE_BTN).click();
});
