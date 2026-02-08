import { db } from './firebase.js';
import { updateStreak, getProfile } from './user-service.js';
import { getActivePlan } from './plan-service.js';
import { generateWorkoutSummary } from './ai-service.js';

function workoutsRef(uid) {
  return db.collection('users').doc(uid).collection('workouts');
}

export async function logWorkout(uid, workoutData) {
  const date = workoutData.date || new Date().toISOString().split('T')[0];

  // Calculate total volume and detect PRs
  const exercises = workoutData.exercises.map(ex => {
    const sets = ex.sets.map(s => ({
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0,
      completed: s.completed !== false,
    }));

    const completedSets = sets.filter(s => s.completed);
    const volume = completedSets.reduce((sum, s) => sum + (s.reps * s.weight), 0);
    const bestSet = completedSets.reduce((best, s) =>
      (s.weight > (best?.weight || 0)) ? s : best, null);

    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets,
      volume,
      bestWeight: bestSet?.weight || 0,
      bestReps: bestSet?.reps || 0,
    };
  });

  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);

  // Detect PRs by comparing to historical best
  const prs = [];
  for (const exercise of exercises) {
    const history = await workoutsRef(uid)
      .where('exercises', '!=', null)
      .orderBy('exercises')
      .orderBy('date', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ docs: [] }));

    let historicalBest = 0;
    for (const doc of history.docs) {
      const data = doc.data();
      const matchingEx = data.exercises?.find(e => e.exerciseId === exercise.exerciseId);
      if (matchingEx && matchingEx.bestWeight > historicalBest) {
        historicalBest = matchingEx.bestWeight;
      }
    }

    if (exercise.bestWeight > historicalBest && historicalBest > 0) {
      prs.push({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        weight: exercise.bestWeight,
        previousBest: historicalBest,
      });
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
  const plan = await getActivePlan(uid);
  if (!plan) return { hasPlan: false, isRestDay: true, message: 'No active plan. Set one up first!' };

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = dayNames[today.getDay()];

  // Check weekly schedule
  let todayDayName = null;
  if (plan.weeklySchedule) {
    const assignment = plan.weeklySchedule[todayName];
    if (!assignment || assignment.toLowerCase() === 'rest') {
      return { hasPlan: true, isRestDay: true, planName: plan.templateName, message: 'Rest day — even dwarves need recovery between battles.' };
    }
    todayDayName = assignment;
  } else {
    // No weekly schedule — use day index rotation
    const dayIndex = today.getDay() % plan.days.length;
    todayDayName = plan.days[dayIndex]?.name;
  }

  const todaysDay = plan.days.find(d => d.name === todayDayName) || plan.days[0];

  // Check if already logged today
  const todayStr = today.toISOString().split('T')[0];
  const existing = await workoutsRef(uid)
    .where('date', '==', todayStr)
    .limit(1)
    .get();

  const profile = await getProfile(uid);

  return {
    hasPlan: true,
    isRestDay: false,
    planName: plan.templateName,
    day: todaysDay,
    alreadyLogged: !existing.empty,
    existingWorkout: existing.empty ? null : { id: existing.docs[0].id, ...existing.docs[0].data() },
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
