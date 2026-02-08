import { db } from './firebase.js';
import { getProfile } from './user-service.js';
import { generateInsights } from './ai-service.js';


function workoutsRef(uid) {
  return db.collection('users').doc(uid).collection('workouts');
}

export async function getExerciseProgress(uid, exerciseId) {
  const snap = await workoutsRef(uid)
    .orderBy('date', 'asc')
    .get();

  const dataPoints = [];

  snap.docs.forEach(doc => {
    const workout = doc.data();
    const exercise = workout.exercises?.find(e => e.exerciseId === exerciseId);
    if (!exercise) return;

    const completedSets = exercise.sets?.filter(s => s.completed !== false) || [];
    if (completedSets.length === 0) return;

    const maxWeight = Math.max(...completedSets.map(s => Number(s.weight) || 0));
    const maxReps = Math.max(...completedSets.map(s => Number(s.reps) || 0));
    const totalVolume = completedSets.reduce(
      (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0
    );

    dataPoints.push({
      date: workout.date,
      maxWeight,
      maxReps,
      totalVolume,
      sets: completedSets.length,
    });
  });

  return dataPoints;
}

export async function getVolumeStats(uid, period = 'week') {
  const now = new Date();
  const weeksBack = period === 'month' ? 12 : 8;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - weeksBack * 7);

  const snap = await workoutsRef(uid)
    .where('date', '>=', startDate.toISOString().split('T')[0])
    .orderBy('date', 'asc')
    .get();

  const weeklyData = {};

  snap.docs.forEach(doc => {
    const workout = doc.data();
    const date = new Date(workout.date);
    // Get Monday of that week
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const weekKey = monday.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { week: weekKey, totalVolume: 0, workouts: 0 };
    }

    weeklyData[weekKey].totalVolume += workout.totalVolume || 0;
    weeklyData[weekKey].workouts += 1;
  });

  return Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));
}

export async function getStreakData(uid) {
  const profile = await getProfile(uid);

  // Get last 90 days of workouts for calendar
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 90);

  const snap = await workoutsRef(uid)
    .where('date', '>=', startDate.toISOString().split('T')[0])
    .orderBy('date', 'asc')
    .get();

  const calendar = {};
  snap.docs.forEach(doc => {
    const workout = doc.data();
    const date = workout.date;
    if (!calendar[date]) {
      calendar[date] = { date, count: 0, volume: 0 };
    }
    calendar[date].count += 1;
    calendar[date].volume += workout.totalVolume || 0;
  });

  return {
    currentStreak: profile?.streak || 0,
    longestStreak: profile?.longestStreak || 0,
    totalWorkouts: profile?.totalWorkouts || 0,
    calendar: Object.values(calendar),
  };
}

export async function getInsightsData(uid) {
  const profile = await getProfile(uid);

  // Get recent workouts
  const snap = await workoutsRef(uid)
    .orderBy('date', 'desc')
    .limit(15)
    .get();

  const workouts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (workouts.length === 0) {
    return {
      insights: ['Start logging workouts and Gimli will have wisdom to share!'],
      generated: new Date().toISOString(),
    };
  }

  const insights = await generateInsights(workouts, profile);

  return {
    insights,
    generated: new Date().toISOString(),
  };
}

export async function getLoggedExercises(uid) {
  const snap = await workoutsRef(uid)
    .orderBy('date', 'desc')
    .limit(50)
    .get();

  const exerciseMap = new Map();
  snap.docs.forEach(doc => {
    const workout = doc.data();
    workout.exercises?.forEach(ex => {
      if (!exerciseMap.has(ex.exerciseId)) {
        exerciseMap.set(ex.exerciseId, { id: ex.exerciseId, name: ex.name });
      }
    });
  });

  return Array.from(exerciseMap.values());
}
