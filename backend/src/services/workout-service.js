import { db } from './firebase.js';
import { updateStreak, getProfile } from './user-service.js';
import { generateWorkoutSummary } from './ai-service.js';
import { exerciseRollup } from './set-metrics.js';

function workoutsRef(uid) {
  return db.collection('users').doc(uid).collection('workouts');
}

export async function logWorkout(uid, workoutData) {
  const date = workoutData.date || new Date().toISOString().split('T')[0];

  // Calculate total volume and detect PRs
  const exercises = workoutData.exercises.map(ex => {
    const kind = ex.kind || 'weighted';
    const sets = ex.sets.map(s => ({ ...s, completed: s.completed !== false }));
    const rollup = exerciseRollup(kind, sets);
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      kind,
      sets,
      volume: rollup.volume,
      bestScore: rollup.best.score,
      bestSet: rollup.best.set,
      hasData: rollup.hasData,
      notes: ex.notes || undefined,
    };
  });

  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);

  // PR detection — fetch recent workouts and filter in code
  const historySnap = await workoutsRef(uid)
    .orderBy('date', 'desc')
    .limit(50)
    .get();

  const prs = [];
  for (const exercise of exercises) {
    if (!exercise.hasData) continue;
    let historicalBest = null;
    for (const doc of historySnap.docs) {
      const w = doc.data();
      if (!w.exercises) continue;
      const match = w.exercises.find(e => e.exerciseId === exercise.exerciseId);
      if (match && typeof match.bestScore === 'number') {
        historicalBest = historicalBest === null ? match.bestScore : Math.max(historicalBest, match.bestScore);
      }
    }
    if (historicalBest !== null && exercise.bestScore > historicalBest) {
      prs.push({ exerciseId: exercise.exerciseId, name: exercise.name, score: exercise.bestScore, previousBest: historicalBest });
    }
  }

  // Update streak
  const updatedProfile = await updateStreak(uid, date);
  const profile = await getProfile(uid);

  // Generate AI summary
  const gymliSummary = await generateWorkoutSummary(
    { exercises, totalVolume, prs: prs.map(p => p.name), duration: workoutData.duration, streak: updatedProfile?.streak || 0 },
    profile
  );

  const workout = {
    date,
    exercises,
    totalVolume,
    prs,
    duration: workoutData.duration || null,
    notes: workoutData.notes || '',
    gymliSummary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ref = await workoutsRef(uid).add(workout);
  return { id: ref.id, ...workout, streak: updatedProfile?.streak || 0 };
}

export async function getWorkouts(uid, { limit = 20, startAfterDate } = {}) {
  let query = workoutsRef(uid).orderBy('date', 'desc').limit(limit);

  if (startAfterDate) {
    query = query.startAfter(startAfterDate);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTodaysWorkout(uid) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [todaySnap, recentSnap, profile] = await Promise.all([
    workoutsRef(uid).where('date', '==', todayStr).limit(1).get(),
    workoutsRef(uid).orderBy('date', 'desc').limit(1).get(),
    getProfile(uid),
  ]);

  const lastDoc = recentSnap.docs[0];
  const lastWorkout = lastDoc ? { id: lastDoc.id, ...lastDoc.data() } : null;

  return {
    alreadyLoggedToday: !todaySnap.empty,
    existingWorkout: todaySnap.empty ? null : { id: todaySnap.docs[0].id, ...todaySnap.docs[0].data() },
    lastWorkout,
    streak: profile?.streak || 0,
    units: profile?.units || 'lbs',
  };
}

export async function updateWorkout(uid, workoutId, data) {
  await workoutsRef(uid).doc(workoutId).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  const doc = await workoutsRef(uid).doc(workoutId).get();
  return { id: doc.id, ...doc.data() };
}

export async function deleteWorkout(uid, workoutId) {
  await workoutsRef(uid).doc(workoutId).delete();
  return { deleted: true };
}
