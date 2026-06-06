function findIndex(session: { exercises: Array<{ exerciseId: string }> }, id: string) {
  return session.exercises.findIndex(e => e.exerciseId === id);
}

export function applyAction(session: any, action: any) {
  const next = { ...session, exercises: session.exercises.map((e: any) => ({ ...e, sets: [...e.sets] })) };
  switch (action.type) {
    case 'add_exercise': {
      if (findIndex(next, action.exerciseId) === -1) {
        next.exercises.push({ exerciseId: action.exerciseId, name: action.name, kind: action.kind || 'weighted', notes: '', sets: [] });
      }
      next.currentExerciseId = action.exerciseId;
      return next;
    }
    case 'log_sets': {
      let i = findIndex(next, action.exerciseId);
      if (i === -1) {
        next.exercises.push({ exerciseId: action.exerciseId, name: action.exerciseId, kind: action.kind || 'weighted', notes: '', sets: [] });
        i = next.exercises.length - 1;
      }
      const newSets = (action.sets || []).map((s: any) => ({ ...s, completed: s.completed !== false }));
      next.exercises[i] = { ...next.exercises[i], sets: [...next.exercises[i].sets, ...newSets] };
      next.currentExerciseId = action.exerciseId;
      return next;
    }
    case 'set_notes': {
      const i = findIndex(next, action.exerciseId);
      if (i !== -1) next.exercises[i] = { ...next.exercises[i], notes: action.text };
      return next;
    }
    case 'answer':
    default:
      return next;
  }
}
