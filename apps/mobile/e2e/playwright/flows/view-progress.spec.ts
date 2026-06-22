import { test, expect } from '../fixtures/test';
import { TestIds, strengthChipId, progressTabId } from '../../../lib/test-ids';

type WorkoutStub = { id: string };

test('progress overview shows streak + week stats; strength tab chart renders for an exercise', async ({
  page, login, dataClient, track,
}) => {
  // Seed a logged workout so progress has data. Find a real exercise first.
  const [exercise] = await dataClient.searchExercises({ q: 'bench' }) as Array<{ id: string; name: string }>;
  expect(exercise, 'expected at least one exercise match for "bench"').toBeTruthy();

  const logged = (await dataClient.logWorkout({
    name: `E2E Progress ${Date.now()}`,
    exercises: [
      {
        exerciseId: exercise.id,
        sets: [{ weight: 100, reps: 5, completed: true }],
      },
    ],
  })) as WorkoutStub;
  track(async () => { await dataClient.deleteWorkout(logged.id); });

  await login();

  // Go to Progress tab (bottom nav route).
  await page.goto('/progress');

  // Overview: streak calendar + week-stats card render.
  await expect(page.getByTestId(TestIds.STREAK_CALENDAR)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(TestIds.WEEK_STATS_CARD)).toBeVisible();

  // Switch to the Strength tab.
  await page.getByTestId(progressTabId('strength')).click();

  // Select our seeded exercise's chip; the chart renders.
  await page.getByTestId(strengthChipId(exercise.id)).click({ timeout: 15_000 });
  await expect(page.getByTestId(TestIds.EXERCISE_CHART)).toBeVisible({ timeout: 15_000 });
});
