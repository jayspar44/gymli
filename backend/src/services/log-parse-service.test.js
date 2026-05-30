import { describe, it, expect, vi, beforeEach } from 'vitest';

const catalog = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] },
  { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
];

const parseLogMock = vi.fn();
const logInteractionMock = vi.fn(async () => {});

vi.mock('./ai-service.js', () => ({ parseLog: (...a) => parseLogMock(...a), GEMINI_MODEL: 'gemini-3-flash-preview' }));
vi.mock('./exercise-service.js', () => ({ getCachedCatalog: async () => catalog }));
vi.mock('./interaction-log-service.js', () => ({ logInteraction: (...a) => logInteractionMock(...a) }));
vi.mock('./coaching-context-service.js', () => ({ buildCoachingContext: async () => ({}), formatContextForAI: () => 'ctx' }));

import { handleParse } from './log-parse-service.js';

beforeEach(() => { parseLogMock.mockReset(); logInteractionMock.mockReset(); });

describe('handleParse', () => {
  it('passes through a valid envelope and logs the interaction', async () => {
    parseLogMock.mockResolvedValue({ reply: '✓', confidence: 0.95, needsClarification: false, clarification: null, actions: [{ type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] }] });
    const out = await handleParse('u1', { text: 'plank 60s', session: {}, units: 'lbs' });
    expect(out.actions[0].exerciseId).toBe('plank');
    expect(logInteractionMock).toHaveBeenCalledOnce();
  });

  it('forces clarification when an action id is not in the catalog and is unresolvable', async () => {
    parseLogMock.mockResolvedValue({ reply: '', confidence: 0.8, needsClarification: false, clarification: null, actions: [{ type: 'log_sets', exerciseId: 'bogus-id', sets: [{ weight: 100, reps: 5 }] }] });
    const out = await handleParse('u1', { text: 'frobnicate 100x5', session: {}, units: 'lbs' });
    expect(out.needsClarification).toBe(true);
    expect(out.actions).toEqual([]);
  });

  it('never throws to the caller if the model output is garbage', async () => {
    parseLogMock.mockResolvedValue('not json object');
    const out = await handleParse('u1', { text: 'x', session: {}, units: 'lbs' });
    expect(out.needsClarification).toBe(true);
    expect(out.reply).toBeTruthy();
  });
});
