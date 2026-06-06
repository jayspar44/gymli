import { describe, it, expect, vi, beforeEach } from 'vitest';

let added = [];
vi.mock('./firebase.js', () => ({
  db: { collection: (name) => ({ add: async (v) => { added.push({ name, v }); return { id: 'log1' }; } }) },
}));

import { logInteraction } from './interaction-log-service.js';

beforeEach(() => { added = []; });

describe('logInteraction', () => {
  it('writes a record to interactionLogs with createdAt', async () => {
    await logInteraction({ uid: 'u1', surface: 'session-log', inputText: 'bench 225 5,5,4', envelope: { confidence: 0.9 }, model: 'gemini-3-flash-preview' });
    expect(added[0].name).toBe('interactionLogs');
    expect(added[0].v.uid).toBe('u1');
    expect(added[0].v.surface).toBe('session-log');
    expect(added[0].v.createdAt).toBeTruthy();
  });
  it('never throws even if write fails', async () => {
    await expect(logInteraction(null)).resolves.toBeUndefined();
  });
});
