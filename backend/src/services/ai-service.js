import { GoogleGenAI } from '@google/genai';
import logger from '../logger.js';

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

export async function generatePlan(template, userProfile) {
  const client = getAI();
  if (!client) {
    return { customized: false, plan: template };
  }

  const prompt = `You are Gymli, the AI gym companion. A warrior has chosen the "${template.name}" training template.

Their profile:
- Experience: ${userProfile.experienceLevel || 'beginner'}
- Goals: ${userProfile.goals || 'general fitness'}
- Available days: ${userProfile.availableDays?.join(', ') || 'flexible'}
- Bodyweight: ${userProfile.bodyweight || 'unknown'} ${userProfile.units || 'lbs'}

The base template has ${template.days.length} training days: ${template.days.map(d => d.name).join(', ')}.

Customize this plan for the warrior. Return a JSON object with:
{
  "gymliMessage": "A short motivational message from Gymli about this plan (2-3 sentences, in character)",
  "weeklySchedule": {
    "Mon": "day name or Rest",
    "Tue": "day name or Rest",
    "Wed": "day name or Rest",
    "Thu": "day name or Rest",
    "Fri": "day name or Rest",
    "Sat": "day name or Rest",
    "Sun": "day name or Rest"
  },
  "adjustments": ["list of any exercise swaps or set/rep changes you recommend"]
}

Only return valid JSON, nothing else.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text;
    const customization = JSON.parse(text);

    return {
      customized: true,
      plan: template,
      ...customization,
    };
  } catch (error) {
    logger.error(error, 'Failed to generate plan with AI');
    return { customized: false, plan: template };
  }
}

export async function generateWorkoutSummary(workoutData, userProfile) {
  const client = getAI();
  if (!client) {
    return 'Great workout! Keep pushing forward.';
  }

  const exerciseList = workoutData.exercises
    .map(ex => `${ex.name}: ${ex.sets.length} sets, best set ${ex.sets.reduce((best, s) => s.weight > (best.weight || 0) ? s : best, {}).weight || 0} ${userProfile?.units || 'lbs'} x ${ex.sets.reduce((best, s) => s.weight > (best.weight || 0) ? s : best, {}).reps || 0}`)
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
