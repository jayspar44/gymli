import { describe, it, expect } from 'vitest';
import { validateEnvelope } from './log-envelope.js';

describe('validateEnvelope', () => {
  it('accepts a well-formed envelope', () => {
    const { ok, value } = validateEnvelope({
      reply: '✓ logged', confidence: 0.9, needsClarification: false, clarification: null,
      actions: [{ type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] }],
    });
    expect(ok).toBe(true);
    expect(value.actions).toHaveLength(1);
  });
  it('coerces missing fields to safe defaults', () => {
    const { ok, value } = validateEnvelope({ reply: 'hi' });
    expect(ok).toBe(true);
    expect(value.confidence).toBe(0);
    expect(value.needsClarification).toBe(false);
    expect(value.actions).toEqual([]);
  });
  it('drops unknown action types', () => {
    const { value } = validateEnvelope({ reply: 'x', actions: [{ type: 'hack' }, { type: 'answer', text: 'hi' }] });
    expect(value.actions).toEqual([{ type: 'answer', text: 'hi' }]);
  });
  it('rejects non-object input', () => {
    expect(validateEnvelope('nope').ok).toBe(false);
    expect(validateEnvelope(null).ok).toBe(false);
  });
});
