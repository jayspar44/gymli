import { db } from './firebase.js';

/**
 * Get the most recent logged data for a set of exercises.
 * Returns a map: { exerciseId: { date, sets: [{weight, reps}], bestWeight, notes } }
 */
export async function getPreviousPerformance(uid, exerciseIds) {
  if (!exerciseIds?.length) return {};

  // Fetch last 20 workouts — should cover all exercises in a plan cycle
  const snap = await db
    .collection('users').doc(uid)
    .collection('workouts')
    .orderBy('date', 'desc')
    .limit(20)
    .get();

  const result = {};
  const found = new Set();

  for (const doc of snap.docs) {
    const workout = doc.data();
    if (!workout.exercises) continue;

    for (const ex of workout.exercises) {
      if (exerciseIds.includes(ex.exerciseId) && !found.has(ex.exerciseId)) {
        result[ex.exerciseId] = {
          date: workout.date,
          kind: ex.kind || 'weighted',
          sets: (ex.sets || [])
            .filter(s => s.completed)
            .map(s => ({ ...s })),
          bestScore: ex.bestScore ?? ex.bestWeight ?? 0,
          // Keep bestWeight alias for any legacy consumers that still read it
          bestWeight: ex.bestScore ?? ex.bestWeight ?? 0,
          notes: ex.notes || null,
        };
        found.add(ex.exerciseId);
      }
    }

    // Early exit if we found all requested exercises
    if (found.size === exerciseIds.length) break;
  }

  return result;
}
