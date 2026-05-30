import { db } from './firebase.js';

function routinesRef(uid) {
  return db.collection('users').doc(uid).collection('routines');
}

function normalizeExercises(exercises = []) {
  return exercises.map(e => ({
    exerciseId: e.exerciseId,
    name: e.name || e.exerciseId,
    kind: e.kind || 'weighted',
    targetSets: e.targetSets ?? 3,
    targetReps: e.targetReps ?? '8-12',
  }));
}

export async function createRoutine(uid, data) {
  if (!data?.name || !String(data.name).trim()) {
    throw new Error('Routine name is required');
  }
  const now = new Date().toISOString();
  const routine = {
    name: String(data.name).trim(),
    exercises: normalizeExercises(data.exercises),
    createdAt: now,
    updatedAt: now,
  };
  const ref = routinesRef(uid).doc();
  await ref.set(routine);
  return { id: ref.id, ...routine };
}

export async function getRoutines(uid) {
  const snap = await routinesRef(uid).orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getRoutine(uid, routineId) {
  const doc = await routinesRef(uid).doc(routineId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateRoutine(uid, routineId, data) {
  const patch = { ...data, updatedAt: new Date().toISOString() };
  if (data.exercises) patch.exercises = normalizeExercises(data.exercises);
  await routinesRef(uid).doc(routineId).update(patch);
  return getRoutine(uid, routineId);
}

export async function deleteRoutine(uid, routineId) {
  await routinesRef(uid).doc(routineId).delete();
  return { deleted: true };
}
