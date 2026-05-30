import { describe, it, expect } from 'vitest';
import { applyAction } from './session-actions';

const base = () => ({ exercises: [], currentExerciseId: null });

describe('applyAction', () => {
  it('add_exercise appends and focuses it', () => {
    const s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    expect(s.exercises).toHaveLength(1);
    expect(s.currentExerciseId).toBe('plank');
    expect(s.exercises[0].kind).toBe('timed');
  });
  it('add_exercise is idempotent on id', () => {
    let s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    s = applyAction(s, { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    expect(s.exercises).toHaveLength(1);
  });
  it('log_sets adds the exercise if missing then appends sets', () => {
    const s = applyAction(base(), { type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] });
    expect(s.exercises[0].exerciseId).toBe('plank');
    expect(s.exercises[0].sets[0]).toMatchObject({ seconds: 60, completed: true });
  });
  it('set_notes sets the note', () => {
    let s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    s = applyAction(s, { type: 'set_notes', exerciseId: 'plank', text: 'tough' });
    expect(s.exercises[0].notes).toBe('tough');
  });
  it('answer does not mutate the session', () => {
    const s0 = base();
    const s1 = applyAction(s0, { type: 'answer', text: 'next is bench' });
    expect(s1.exercises).toEqual([]);
  });
});
