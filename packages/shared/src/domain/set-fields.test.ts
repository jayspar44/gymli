import { describe, it, expect } from 'vitest';
import { fieldsForKind, emptySet } from './set-fields';

describe('set-fields', () => {
  it('weighted has weight + reps', () => {
    expect(fieldsForKind('weighted').map(f => f.key)).toEqual(['weight', 'reps']);
  });
  it('timed has seconds', () => {
    expect(fieldsForKind('timed').map(f => f.key)).toEqual(['seconds']);
  });
  it('distance has distance + seconds', () => {
    expect(fieldsForKind('distance').map(f => f.key)).toEqual(['distance', 'seconds']);
  });
  it('emptySet matches the field keys plus completed', () => {
    expect(emptySet('bodyweight')).toEqual({ addedWeight: '', reps: '', completed: false });
  });
});
