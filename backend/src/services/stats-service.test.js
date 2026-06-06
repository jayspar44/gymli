import { describe, it, expect, vi, beforeEach } from 'vitest';

let workoutDocs = [];

vi.mock('./firebase.js', () => ({
  db: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy() { return { get: async () => ({ docs: workoutDocs }) }; },
        }),
      }),
    }),
  },
}));

vi.mock('./user-service.js', () => ({
  getProfile: vi.fn(async () => ({ streak: 5, longestStreak: 10, totalWorkouts: 20 })),
}));

vi.mock('./ai-service.js', () => ({
  generateInsights: vi.fn(async () => ['Keep it up!']),
}));

import { getExerciseProgress } from './stats-service.js';

beforeEach(() => { workoutDocs = []; });

describe('getExerciseProgress kind-aware', () => {
  it('weighted exercise returns correct maxWeight from bestScore', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-05-01',
        exercises: [{
          exerciseId: 'bench-press',
          kind: 'weighted',
          bestScore: 120,
          volume: 1800,
          sets: [
            { weight: 100, reps: 5, completed: true },
            { weight: 120, reps: 3, completed: true },
          ],
        }],
      }) },
    ];

    const pts = await getExerciseProgress('u1', 'bench-press');
    expect(pts).toHaveLength(1);
    expect(pts[0].maxWeight).toBe(120);
    expect(pts[0].totalVolume).toBe(1800);
    expect(pts[0].kind).toBe('weighted');
  });

  it('timed exercise returns seconds as maxWeight (non-zero for non-weighted)', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-05-10',
        exercises: [{
          exerciseId: 'plank',
          kind: 'timed',
          bestScore: 90,
          volume: 270,
          sets: [
            { seconds: 60, completed: true },
            { seconds: 90, completed: true },
            { seconds: 90, completed: false },
          ],
        }],
      }) },
    ];

    const pts = await getExerciseProgress('u1', 'plank');
    expect(pts).toHaveLength(1);
    // bestScore drives maxWeight — so chart plots 90s (non-zero)
    expect(pts[0].maxWeight).toBe(90);
    expect(pts[0].totalVolume).toBe(270);
    expect(pts[0].kind).toBe('timed');
  });

  it('bodyweight exercise returns addedWeight as maxWeight', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-05-15',
        exercises: [{
          exerciseId: 'pull-up',
          kind: 'bodyweight',
          bestScore: 25,
          volume: 200,
          sets: [
            { addedWeight: 25, reps: 8, completed: true },
          ],
        }],
      }) },
    ];

    const pts = await getExerciseProgress('u1', 'pull-up');
    expect(pts).toHaveLength(1);
    expect(pts[0].maxWeight).toBe(25);
    expect(pts[0].kind).toBe('bodyweight');
  });

  it('falls back to set-metrics when bestScore not stored (old docs)', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-04-01',
        exercises: [{
          exerciseId: 'plank',
          kind: 'timed',
          // no bestScore / volume (old doc)
          sets: [
            { seconds: 45, completed: true },
            { seconds: 60, completed: true },
          ],
        }],
      }) },
    ];

    const pts = await getExerciseProgress('u1', 'plank');
    expect(pts).toHaveLength(1);
    // Should derive max via setScore: max(45,60) = 60
    expect(pts[0].maxWeight).toBe(60);
    // And derive volume via setVolume(timed): 45+60 = 105
    expect(pts[0].totalVolume).toBe(105);
  });

  it('skips exercises with no matching exerciseId', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-05-20',
        exercises: [{ exerciseId: 'squat', kind: 'weighted', bestScore: 200, sets: [{ weight: 200, reps: 5, completed: true }] }],
      }) },
    ];
    const pts = await getExerciseProgress('u1', 'bench-press');
    expect(pts).toHaveLength(0);
  });

  it('defaults kind to weighted for old docs without kind field', async () => {
    workoutDocs = [
      { data: () => ({
        date: '2026-03-01',
        exercises: [{
          exerciseId: 'deadlift',
          // no kind field
          bestScore: 180,
          sets: [{ weight: 180, reps: 3, completed: true }],
        }],
      }) },
    ];

    const pts = await getExerciseProgress('u1', 'deadlift');
    expect(pts).toHaveLength(1);
    expect(pts[0].kind).toBe('weighted');
    expect(pts[0].maxWeight).toBe(180);
  });
});
