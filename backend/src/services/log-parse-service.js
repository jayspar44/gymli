import { parseLog, GEMINI_MODEL } from './ai-service.js';
import { getCachedCatalog } from './exercise-service.js';
import { validateEnvelope } from './log-envelope.js';
import { resolveExercise } from './exercise-resolver.js';
import { logInteraction } from './interaction-log-service.js';
import { buildCoachingContext, formatContextForAI } from './coaching-context-service.js';

export async function handleParse(uid, { text, session, units, sessionId }) {
  const catalog = await getCachedCatalog();

  let coachingContext = '';
  try { coachingContext = formatContextForAI(await buildCoachingContext(uid)); } catch { /* non-fatal */ }

  let raw;
  try {
    raw = await parseLog({ text, session, units, catalog, coachingContext });
  } catch {
    raw = null;
  }

  const { ok, value } = validateEnvelope(raw);
  let envelope = ok ? value : { reply: "I didn't catch that — try again?", confidence: 0, needsClarification: true, clarification: null, actions: [] };

  // Server-side resolution guard: every mutating action must reference a real catalog id.
  const resolutions = [];
  const guarded = [];
  let unresolved = null;
  for (const action of envelope.actions) {
    if (action.type === 'answer' || action.type === 'set_notes') { guarded.push(action); continue; }
    const r = resolveExercise({ exerciseId: action.exerciseId, query: action.name || action.exerciseId }, catalog);
    resolutions.push({ method: r.method, matchedId: r.exerciseId, wasAmbiguous: r.ambiguous });
    if (r.exerciseId) {
      guarded.push({ ...action, exerciseId: r.exerciseId, name: r.name || action.name, kind: r.kind || action.kind });
    } else {
      unresolved = r;
    }
  }

  if (unresolved) {
    envelope = {
      reply: unresolved.candidates.length ? 'Which exercise did you mean?' : "I couldn't find that exercise.",
      confidence: 0,
      needsClarification: true,
      clarification: unresolved.candidates.length ? { prompt: 'Which exercise did you mean?', options: unresolved.candidates } : null,
      actions: [],
    };
  } else {
    envelope.actions = guarded;
  }

  logInteraction({
    uid, surface: 'session-log', sessionId,
    inputText: text, envelope,
    appliedActions: envelope.actions,
    exerciseResolution: { method: resolutions[0]?.method || 'none', matchedIds: resolutions.map(r => r.matchedId).filter(Boolean), wasAmbiguous: resolutions.some(r => r.wasAmbiguous) },
    model: GEMINI_MODEL,
  });

  return envelope;
}
