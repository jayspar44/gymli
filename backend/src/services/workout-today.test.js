import { describe, it, expect, vi, beforeEach } from 'vitest';

let todayDocs = [];
let recentDocs = [];

vi.mock('./firebase.js', () => ({
  db: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          where() { return { limit: () => ({ get: async () => ({ empty: todayDocs.length === 0, docs: todayDocs }) }) }; },
          orderBy() { return { limit: () => ({ get: async () => ({ docs: recentDocs }) }) }; },
        }),
      }),
    }),
  },
}));
vi.mock('./user-service.js', () => ({
  updateStreak: vi.fn(),
  getProfile: vi.fn(async () => ({ streak: 7, units: 'kg' })),
}));
vi.mock('./ai-service.js', () => ({ generateWorkoutSummary: vi.fn() }));

import { getTodaysWorkout } from './workout-service.js';

beforeEach(() => { todayDocs = []; recentDocs = []; });

describe('getTodaysWorkout (plan-free)', () => {
  it('reports nothing logged with last workout when history exists', async () => {
    recentDocs = [{ id: 'w1', data: () => ({ date: '2026-05-28', exercises: [] }) }];
    const r = await getTodaysWorkout('u1');
    expect(r.alreadyLoggedToday).toBe(false);
    expect(r.existingWorkout).toBeNull();
    expect(r.lastWorkout).toEqual({ id: 'w1', date: '2026-05-28', exercises: [] });
    expect(r.streak).toBe(7);
    expect(r.units).toBe('kg');
  });

  it('reports already-logged when today has a doc', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    todayDocs = [{ id: 'today1', data: () => ({ date: todayStr }) }];
    recentDocs = todayDocs;
    const r = await getTodaysWorkout('u1');
    expect(r.alreadyLoggedToday).toBe(true);
    expect(r.existingWorkout.id).toBe('today1');
  });
});
