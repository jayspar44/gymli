import { describe, it, expect, vi, beforeEach } from 'vitest';

let added = null;
let historyDocs = [];

vi.mock('./firebase.js', () => ({
  db: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy() { return { limit: () => ({ get: async () => ({ docs: historyDocs }) }) }; },
          add: async (w) => { added = w; return { id: 'new1' }; },
        }),
      }),
    }),
  },
}));
vi.mock('./user-service.js', () => ({
  updateStreak: vi.fn(async () => ({ streak: 3 })),
  getProfile: vi.fn(async () => ({ units: 'lbs' })),
}));
vi.mock('./ai-service.js', () => ({ generateWorkoutSummary: vi.fn(async () => 'nice') }));

import { logWorkout } from './workout-service.js';

beforeEach(() => { added = null; historyDocs = []; });

describe('logWorkout kind-aware', () => {
  it('computes timed volume and stores kind', async () => {
    await logWorkout('u1', { exercises: [
      { exerciseId: 'plank', name: 'Plank', kind: 'timed', sets: [{ seconds: 60, completed: true }] },
    ] });
    expect(added.exercises[0].kind).toBe('timed');
    expect(added.exercises[0].volume).toBe(60);
    expect(added.totalVolume).toBe(60);
  });

  it('detects a bodyweight PR by added weight', async () => {
    historyDocs = [{ data: () => ({ date: '2026-05-01', exercises: [
      { exerciseId: 'pull-up', kind: 'bodyweight', bestScore: 10 },
    ] }) }];
    await logWorkout('u1', { exercises: [
      { exerciseId: 'pull-up', name: 'Pull-up', kind: 'bodyweight', sets: [{ addedWeight: 25, reps: 5, completed: true }] },
    ] });
    expect(added.prs.map(p => p.exerciseId)).toContain('pull-up');
  });
});
