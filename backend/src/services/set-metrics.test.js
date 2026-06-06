import { describe, it, expect } from 'vitest';
import { setVolume, setScore, exerciseRollup } from './set-metrics.js';

describe('set-metrics', () => {
  it('weighted volume and score', () => {
    expect(setVolume('weighted', { weight: 100, reps: 5 })).toBe(500);
    expect(setScore('weighted', { weight: 100, reps: 5 })).toBe(100);
  });
  it('bodyweight uses added weight', () => {
    expect(setVolume('bodyweight', { addedWeight: 25, reps: 8 })).toBe(200);
    expect(setScore('bodyweight', { addedWeight: 25, reps: 8 })).toBe(25);
  });
  it('assisted scores less-assist higher', () => {
    expect(setScore('assisted', { assistWeight: 40, reps: 10 })).toBe(-40);
    expect(setVolume('assisted', { assistWeight: 40, reps: 10 })).toBe(10);
  });
  it('timed and distance', () => {
    expect(setVolume('timed', { seconds: 60 })).toBe(60);
    expect(setScore('timed', { seconds: 60 })).toBe(60);
    expect(setVolume('distance', { distance: 5, seconds: 1470 })).toBe(5);
    expect(setScore('distance', { distance: 5 })).toBe(5);
  });
  it('rollup picks best completed set and sums volume', () => {
    const r = exerciseRollup('weighted', [
      { weight: 100, reps: 5, completed: true },
      { weight: 120, reps: 3, completed: true },
      { weight: 999, reps: 1, completed: false },
    ]);
    expect(r.volume).toBe(100 * 5 + 120 * 3);
    expect(r.best.score).toBe(120);
    expect(r.hasData).toBe(true);
  });
  it('rollup with no completed sets has no data', () => {
    const r = exerciseRollup('weighted', [{ weight: 100, reps: 5, completed: false }]);
    expect(r.hasData).toBe(false);
    expect(r.volume).toBe(0);
  });
});
