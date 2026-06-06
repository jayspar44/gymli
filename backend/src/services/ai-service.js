import { GoogleGenAI } from '@google/genai';
import logger from '../logger.js';

export const GEMINI_MODEL = 'gemini-3-flash-preview';

const GYMLI_SYSTEM_PROMPT = `You are Gymli, an AI strength training coach built into the Gymli workout app. You are knowledgeable, direct, and encouraging — like a smart training partner.

Guidelines:
- Be concise. 2-4 sentences max unless the user asks for detail.
- Reference the user's actual data when available (weights, trends, PRs, volume).
- Give specific, actionable advice. "Try 82.5kg next session" is better than "keep pushing."
- If you don't have enough data to answer, say so honestly.
- No roleplay, no character voice. Just be a helpful coach.
- Use the user's preferred units (provided in context).`;

let ai = null;

function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not set — AI features disabled');
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function generateWorkoutSummary(workoutData, userProfile) {
  const client = getAI();
  if (!client) {
    return 'Great workout! Keep pushing forward.';
  }

  const exerciseList = workoutData.exercises
    .map(ex => `${ex.name}: ${ex.sets.length} sets${typeof ex.bestScore === 'number' ? ` (best ${ex.bestScore})` : ''}`)
    .join('\n');

  const prompt = `${GYMLI_SYSTEM_PROMPT}

The user just finished a workout. Give a brief (2-3 sentence) summary and encouragement.

Workout details:
- Duration: ${workoutData.duration || 'unknown'} minutes
- Exercises:\n${exerciseList}
${workoutData.prs?.length ? `- PRs hit: ${workoutData.prs.join(', ')}` : '- No PRs this session'}
- Current streak: ${workoutData.streak || 0} days

Be specific about their performance. Celebrate PRs. Keep it short.`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { temperature: 0.8, maxOutputTokens: 200 },
    });
    return response.text;
  } catch (error) {
    logger.error(error, 'Failed to generate workout summary');
    return 'Solid session. Keep showing up and the results will follow.';
  }
}

export async function generateInsights(recentWorkouts, profile) {
  const client = getAI();
  if (!client) {
    return ['Keep training consistently — results come from showing up.'];
  }

  const summary = recentWorkouts.slice(0, 10).map(w =>
    `${w.date}: ${w.exercises?.map(e => e.name).join(', ')} (volume: ${w.totalVolume || 0})`
  ).join('\n');

  const prompt = `${GYMLI_SYSTEM_PROMPT}

Analyze this user's recent training and provide 2-3 brief insights. Each insight should be 1 actionable sentence.

Recent workouts:\n${summary}
Experience: ${profile?.experienceLevel || 'unknown'}
Goals: ${profile?.goals || 'general'}

Return as JSON array of strings. Only valid JSON.`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 300,
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    logger.error(error, 'Failed to generate insights');
    return ['Keep training and the insights will come.'];
  }
}

export async function chat(messages, context, coachingContext) {
  const client = getAI();
  if (!client) {
    return 'AI features are not configured. Check your Gemini API key.';
  }

  let systemPrompt = GYMLI_SYSTEM_PROMPT;
  if (coachingContext) {
    systemPrompt += '\n\n--- USER DATA ---\n' + coachingContext;
  }
  if (context?.screen) {
    systemPrompt += `\n\nThe user is currently on the "${context.screen}" screen of the app.`;
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        maxOutputTokens: 500,
      },
    });
    return response.text;
  } catch (error) {
    logger.error(error, 'Chat failed');
    return 'Something went wrong generating a response. Please try again.';
  }
}

export { GYMLI_SYSTEM_PROMPT };

const LOG_SYSTEM_PROMPT = `You are Gymli's logging engine. Convert the user's message into a JSON command envelope that logs sets, adds exercises, sets notes, or answers a brief question.

Return ONLY valid JSON with this exact shape:
{
  "reply": "short confirmation or answer shown in the feed",
  "confidence": 0.0-1.0,
  "needsClarification": boolean,
  "clarification": null | { "prompt": "...", "options": [{ "label": "...", "exerciseId": "..." }] },
  "actions": [
    { "type": "add_exercise", "exerciseId": "<catalog id>", "name": "<name>", "kind": "<kind>" },
    { "type": "log_sets", "exerciseId": "<catalog id>", "sets": [ /* kind-aware: weighted {weight,reps}; bodyweight {addedWeight,reps}; assisted {assistWeight,reps}; timed {seconds}; distance {distance,seconds} */ ] },
    { "type": "set_notes", "exerciseId": "<catalog id>", "text": "..." },
    { "type": "answer", "text": "..." }
  ]
}

Rules:
- Resolve exercises to an id from the CATALOG. If multiple plausible matches, set needsClarification=true with options and DO NOT log.
- Use the exercise's kind to choose set fields. Respect the user's units; never invent numbers.
- "set 3", "last one", "next set" refer to the current exercise in SESSION.
- Lower confidence when the exercise is unclear or numbers are ambiguous.
- For pure questions (what's next, was that a PR), use a single "answer" action and no mutations. Keep replies under 2 sentences.`;

export async function parseLog({ text, session, units, catalog, coachingContext }) {
  const client = getAI();
  if (!client) {
    return { reply: 'AI logging is not configured.', confidence: 0, needsClarification: false, clarification: null, actions: [] };
  }
  const catalogText = catalog.map(c => `${c.id} | ${c.name} | ${c.kind}${c.aliases?.length ? ' | ' + c.aliases.join(',') : ''}`).join('\n');
  const sessionText = JSON.stringify(session || {});
  const system = `${LOG_SYSTEM_PROMPT}

UNITS: ${units || 'lbs'}
${coachingContext ? `\n--- USER DATA ---\n${coachingContext}\n` : ''}
--- CATALOG (id | name | kind | aliases) ---
${catalogText}
--- SESSION ---
${sessionText}`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  });
  return JSON.parse(response.text);
}
