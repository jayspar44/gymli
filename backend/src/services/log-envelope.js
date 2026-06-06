const ACTION_TYPES = new Set(['add_exercise', 'log_sets', 'set_notes', 'answer']);

function cleanAction(a) {
  if (!a || !ACTION_TYPES.has(a.type)) return null;
  switch (a.type) {
    case 'add_exercise':
      return a.exerciseId ? { type: a.type, exerciseId: a.exerciseId, name: a.name || '', kind: a.kind || 'weighted' } : null;
    case 'log_sets':
      return a.exerciseId && Array.isArray(a.sets) ? { type: a.type, exerciseId: a.exerciseId, sets: a.sets } : null;
    case 'set_notes':
      return a.exerciseId ? { type: a.type, exerciseId: a.exerciseId, text: String(a.text || '') } : null;
    case 'answer':
      return { type: a.type, text: String(a.text || '') };
    default:
      return null;
  }
}

export function validateEnvelope(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, value: null };
  const value = {
    reply: String(raw.reply || ''),
    confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0,
    needsClarification: raw.needsClarification === true,
    clarification: raw.clarification && typeof raw.clarification === 'object'
      ? { prompt: String(raw.clarification.prompt || ''), options: Array.isArray(raw.clarification.options) ? raw.clarification.options.filter(o => o && o.exerciseId).map(o => ({ label: String(o.label || ''), exerciseId: o.exerciseId })) : [] }
      : null,
    actions: Array.isArray(raw.actions) ? raw.actions.map(cleanAction).filter(Boolean) : [],
  };
  return { ok: true, value };
}
