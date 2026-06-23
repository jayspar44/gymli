export interface SessionSet {
  completed: boolean;
  [key: string]: unknown;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  kind: string;
  notes: string;
  sets: SessionSet[];
}

export interface SessionState {
  exercises: SessionExercise[];
  currentExerciseId: string | null;
}

export interface AddExerciseAction {
  type: 'add_exercise';
  exerciseId: string;
  name: string;
  kind?: string;
}

export interface LogSetsAction {
  type: 'log_sets';
  exerciseId: string;
  name?: string;
  kind?: string;
  sets?: Array<{ completed?: boolean; [key: string]: unknown }>;
}

export interface SetNotesAction {
  type: 'set_notes';
  exerciseId: string;
  text: string;
}

export interface AnswerAction {
  type: 'answer';
  [key: string]: unknown;
}

export type SessionAction = AddExerciseAction | LogSetsAction | SetNotesAction | AnswerAction;

function findIndex(session: { exercises: Array<{ exerciseId: string }> }, id: string) {
  return session.exercises.findIndex(e => e.exerciseId === id);
}

export function applyAction(session: SessionState, action: SessionAction): SessionState {
  const next: SessionState = { ...session, exercises: session.exercises.map((e) => ({ ...e, sets: [...e.sets] })) };
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
        next.exercises.push({ exerciseId: action.exerciseId, name: action.name ?? action.exerciseId, kind: action.kind || 'weighted', notes: '', sets: [] });
        i = next.exercises.length - 1;
      }
      const newSets = (action.sets || []).map((s) => ({ ...s, completed: s.completed !== false }));
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
