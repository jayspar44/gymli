import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map();

vi.mock('./firebase.js', () => {
  const makeDoc = (col, id) => ({
    id,
    async get() { return { exists: store.has(`${col}/${id}`), id, data: () => store.get(`${col}/${id}`) }; },
    async set(v) { store.set(`${col}/${id}`, v); },
    async update(v) { store.set(`${col}/${id}`, { ...store.get(`${col}/${id}`), ...v }); },
    async delete() { store.delete(`${col}/${id}`); },
  });
  const makeCol = (col) => ({
    _docs: () => [...store.entries()].filter(([k]) => k.startsWith(`${col}/`)),
    doc(id) { return makeDoc(col, id || `auto-${store.size + 1}`); },
    orderBy() { return this; },
    async get() {
      const docs = this._docs().map(([k, v]) => ({ id: k.split('/').pop(), data: () => v }));
      return { empty: docs.length === 0, docs };
    },
  });
  return {
    db: {
      collection: () => ({ doc: () => ({ collection: (c) => makeCol(c) }) }),
    },
  };
});

import { createRoutine, getRoutines, getRoutine, updateRoutine, deleteRoutine } from './routine-service.js';

beforeEach(() => store.clear());

describe('routine-service', () => {
  it('creates a routine with timestamps and id', async () => {
    const r = await createRoutine('u1', { name: 'Push A', exercises: [{ exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', targetSets: 4, targetReps: '6-8' }] });
    expect(r.id).toBeTruthy();
    expect(r.name).toBe('Push A');
    expect(r.exercises).toHaveLength(1);
    expect(r.createdAt).toBeTruthy();
  });

  it('lists and fetches routines', async () => {
    const r = await createRoutine('u1', { name: 'Legs', exercises: [] });
    const list = await getRoutines('u1');
    expect(list.map(x => x.name)).toContain('Legs');
    const one = await getRoutine('u1', r.id);
    expect(one.name).toBe('Legs');
  });

  it('updates and deletes', async () => {
    const r = await createRoutine('u1', { name: 'Old', exercises: [] });
    const upd = await updateRoutine('u1', r.id, { name: 'New' });
    expect(upd.name).toBe('New');
    await deleteRoutine('u1', r.id);
    expect(await getRoutine('u1', r.id)).toBeNull();
  });

  it('rejects a routine with no name', async () => {
    await expect(createRoutine('u1', { exercises: [] })).rejects.toThrow(/name/i);
  });
});
