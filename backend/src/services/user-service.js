import { db } from './firebase.js';

const usersRef = db.collection('users');

export async function getProfile(uid) {
  const doc = await usersRef.doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    onboardingComplete: data.onboardingComplete !== undefined
      ? data.onboardingComplete
      : !!data.createdAt,
  };
}

export async function createOrUpdateProfile(uid, data) {
  const existing = await usersRef.doc(uid).get();

  if (existing.exists) {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await usersRef.doc(uid).update(updateData);
    const updated = await usersRef.doc(uid).get();
    return { id: updated.id, ...updated.data() };
  }

  const newProfile = {
    displayName: data.displayName || '',
    email: data.email || '',
    photoURL: data.photoURL || '',
    experienceLevel: data.experienceLevel || 'beginner',
    goals: data.goals || '',
    availableDays: data.availableDays || [],
    bodyweight: data.bodyweight || null,
    units: data.units || 'lbs',
    streak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    onboardingComplete: data.onboardingComplete || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await usersRef.doc(uid).set(newProfile);
  return { id: uid, ...newProfile };
}

export async function updateStreak(uid, workoutDate) {
  const profile = await getProfile(uid);
  if (!profile) return;

  const today = workoutDate || new Date().toISOString().split('T')[0];
  const lastDate = profile.lastWorkoutDate;

  let newStreak = profile.streak || 0;

  if (!lastDate) {
    newStreak = 1;
  } else if (lastDate === today) {
    // Same day, no change
    return profile;
  } else {
    const last = new Date(lastDate);
    const current = new Date(today);
    const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, profile.longestStreak || 0);

  await usersRef.doc(uid).update({
    streak: newStreak,
    longestStreak,
    lastWorkoutDate: today,
    totalWorkouts: (profile.totalWorkouts || 0) + 1,
    updatedAt: new Date().toISOString(),
  });

  return { ...profile, streak: newStreak, longestStreak, lastWorkoutDate: today };
}
