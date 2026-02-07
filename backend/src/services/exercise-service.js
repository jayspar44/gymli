import { db } from './firebase.js';

const exercisesRef = db.collection('exercises');

export async function searchExercises({ q, category, muscleGroup, equipment } = {}) {
  let query = exercisesRef.orderBy('name');

  if (category) {
    query = exercisesRef.where('category', '==', category).orderBy('name');
  }

  if (equipment) {
    query = exercisesRef.where('equipment', '==', equipment).orderBy('name');
  }

  const snapshot = await query.get();
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Client-side filtering for text search and muscle group (array contains)
  if (q) {
    const search = q.toLowerCase();
    results = results.filter(ex =>
      ex.name.toLowerCase().includes(search) ||
      (ex.category && ex.category.toLowerCase().includes(search))
    );
  }

  if (muscleGroup) {
    const mg = muscleGroup.toLowerCase();
    results = results.filter(ex =>
      (ex.muscleGroups?.primary || []).some(m => m.toLowerCase() === mg) ||
      (ex.muscleGroups?.secondary || []).some(m => m.toLowerCase() === mg)
    );
  }

  return results;
}

export async function getExerciseById(exerciseId) {
  const doc = await exercisesRef.doc(exerciseId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}
