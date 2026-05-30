import { describe, it, expect, vi, beforeEach } from 'vitest';

let docs = [];
vi.mock('./firebase.js', () => ({
  db: { collection: () => ({ orderBy: () => ({ get: async () => ({ docs }) }) }) },
}));

import { getCatalog } from './exercise-service.js';

beforeEach(() => { docs = [
  { id: 'barbell-bench-press', data: () => ({ name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] }) },
  { id: 'plank', data: () => ({ name: 'Plank', kind: 'timed' }) },
]; });

describe('getCatalog', () => {
  it('returns compact id/name/kind/aliases entries', async () => {
    const cat = await getCatalog();
    expect(cat).toEqual([
      { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] },
      { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
    ]);
  });
});
