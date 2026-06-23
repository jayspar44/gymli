import { test, expect } from '../fixtures/test';
import { TestIds, setRowWeightId, setRowRepsId } from '../../../lib/test-ids';

type WorkoutStub = { id: string };

async function getWorkouts(dataClient: Awaited<ReturnType<typeof import('../fixtures/test-data').createDataClient>>) {
  return (await dataClient.getWorkouts({}) as WorkoutStub[]) ?? [];
}

// AI flow: real Gemini call. Assert on resulting app STATE only; ignore reply wording.
test('conversational log "bench 225 5,5,4" produces a set row with weight 225 and reps 5/5/4', async ({
  page, login, dataClient, track,
}) => {
  const before = new Set<string>();
  track(async () => {
    const after = await getWorkouts(dataClient);
    for (const w of after) {
      if (!before.has(w.id)) await dataClient.deleteWorkout(w.id);
    }
  });

  await login();
  (await getWorkouts(dataClient)).forEach((w) => before.add(w.id));

  // Open the conversational log input on the session screen and submit.
  await page.getByTestId(TestIds.LOG_INPUT).fill('bench 225 5,5,4');
  await page.getByTestId(TestIds.LOG_SEND_BTN).click();

  // Generous timeout for the real Gemini parse. Assert STATE, not AI text.
  // "bench 225 5,5,4" → 3 sets: set 0 = 225×5, set 1 = 225×5, set 2 = 225×4.
  // Each set has exactly ONE reps field (fieldIndex 0) for a WEIGHTED exercise.
  await expect(page.getByTestId(setRowWeightId(0))).toHaveValue('225', { timeout: 45_000 });
  await expect(page.getByTestId(setRowRepsId(0, 0))).toHaveValue('5');
  await expect(page.getByTestId(setRowWeightId(1))).toHaveValue('225');
  await expect(page.getByTestId(setRowRepsId(1, 0))).toHaveValue('5');
  await expect(page.getByTestId(setRowWeightId(2))).toHaveValue('225');
  await expect(page.getByTestId(setRowRepsId(2, 0))).toHaveValue('4');
});
