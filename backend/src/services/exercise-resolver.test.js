import { describe, it, expect } from 'vitest';
import { validateId, fuzzyResolve, resolveExercise } from './exercise-resolver.js';

const catalog = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench', 'bb bench'] },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', kind: 'weighted', aliases: ['db bench'] },
  { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
];

describe('exercise-resolver', () => {
  it('validateId returns the entry or null', () => {
    expect(validateId('plank', catalog).id).toBe('plank');
    expect(validateId('nope', catalog)).toBeNull();
  });
  it('fuzzyResolve matches exact name', () => {
    expect(fuzzyResolve('Plank', catalog).match.id).toBe('plank');
  });
  it('fuzzyResolve matches an alias', () => {
    expect(fuzzyResolve('db bench', catalog).match.id).toBe('dumbbell-bench-press');
  });
  it('fuzzyResolve flags ambiguity for "bench"', () => {
    const r = fuzzyResolve('bench', catalog);
    expect(r.ambiguous).toBe(true);
    expect(r.candidates.length).toBeGreaterThan(1);
  });
  it('resolveExercise trusts a valid model id', () => {
    const r = resolveExercise({ exerciseId: 'plank', query: 'plank' }, catalog);
    expect(r.exerciseId).toBe('plank');
    expect(r.method).toBe('catalog');
  });
  it('resolveExercise falls back to fuzzy when id invalid', () => {
    const r = resolveExercise({ exerciseId: 'bogus', query: 'db bench' }, catalog);
    expect(r.exerciseId).toBe('dumbbell-bench-press');
    expect(r.method).toBe('fuzzy');
  });
  it('resolveExercise returns ambiguous candidates when unsure', () => {
    const r = resolveExercise({ exerciseId: null, query: 'bench' }, catalog);
    expect(r.exerciseId).toBeNull();
    expect(r.ambiguous).toBe(true);
  });
});
