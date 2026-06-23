import { parseLog, GEMINI_MODEL } from './ai-service.js';
import { getCachedCatalog } from './exercise-service.js';
import { validateEnvelope } from './log-envelope.js';
import { resolveExercise } from './exercise-resolver.js';
import { logInteraction } from './interaction-log-service.js';
import { buildCoachingContext, formatContextForAI } from './coaching-context-service.js';
import logger from '../logger.js';

export async function handleParse(uid, { text, session, units, sessionId }) {
  const catalog = await getCachedCatalog();

  let coachingContext = '';
  try { coachingContext = formatContextForAI(await buildCoachingContext(uid)); } catch { /* non-fatal */ }

  let raw;
  let parseError = null;
  try {
    raw = await parseLog({ text, session, units, catalog, coachingContext });
  } catch (err) {
    parseError = err;
    raw = null;
  }

  const { ok, value } = validateEnvelope(raw);
  if (!ok) {
    // Surface WHY a parse fell back so failures are debuggable from logs.
    logger.warn(
      {
        inputText: text,
        parseError: parseError?.message || null,
        rawEnvelope: raw ? JSON.stringify(raw).slice(0, 1500) : null,
      },
      'log parse fell back to clarification'
    );
  }
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
    if (guarded.length > 0) {
      // Partial resolution: some actions resolved, at least one didn't.
      // Apply the resolved actions (needsClarification: false so the client runs applyEnvelopeActions),
      // and surface the ambiguity in the reply text. The clarification field is preserved for
      // any future client that can handle mixed envelopes, but the current client gates action
      // application on !needsClarification so we must keep that false to avoid discarding the
      // resolved sets.
      const clarifyText = unresolved.candidates.length
        ? `Which exercise did you mean for the unrecognised one? (${unresolved.candidates.map(c => c.label).join(', ')})`
        : "I couldn't find one of the exercises — your other sets were logged.";
      envelope = {
        reply: `${envelope.reply || 'Got it.'} ${clarifyText}`.trim(),
        confidence: envelope.confidence || 0,
        needsClarification: false,
        clarification: unresolved.candidates.length
          ? { prompt: 'Which exercise did you mean?', options: unresolved.candidates }
          : null,
        actions: guarded,
      };
    } else {
      // No actions resolved at all — full clarification flow.
      envelope = {
        reply: unresolved.candidates.length ? 'Which exercise did you mean?' : "I couldn't find that exercise.",
        confidence: 0,
        needsClarification: true,
        clarification: unresolved.candidates.length ? { prompt: 'Which exercise did you mean?', options: unresolved.candidates } : null,
        actions: [],
      };
    }
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
