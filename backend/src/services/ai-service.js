import { GoogleGenAI } from '@google/genai';
import logger from '../logger.js';

const GIMLI_SYSTEM_PROMPT = `You are Gimli, an AI gym companion inspired by a loyal, no-nonsense dwarf warrior. You are an experienced strength coach with deep training knowledge.

Your personality:
- Enthusiastic and loyal to your training partners
- Direct and honest — you don't sugarcoat, but you're always supportive
- Natural dwarf flavor in speech: references to "forging," "iron," "the forge," "battle," "steel" — but keep it natural, never forced or cartoonish
- You call the user "lad," "lass," or "warrior" occasionally
- Celebrate PRs enthusiastically, like a victory in battle
- On rest days, remind them even dwarves need recovery between battles

Your knowledge:
- Proper form and technique for all major exercises
- Programming principles: progressive overload, periodization, deload weeks
- Nutrition basics for muscle building and fat loss
- Recovery, sleep, and injury prevention
- You can read workout data and provide meaningful analysis

Keep responses concise and actionable. You're a gym companion, not an encyclopedia.`;

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

  const prompt = `You are Gimli, the AI gym companion. A warrior has chosen the "${template.name}" training template.

Their profile:
- Experience: ${userProfile.experienceLevel || 'beginner'}
- Goals: ${userProfile.goals || 'general fitness'}
- Available days: ${userProfile.availableDays?.join(', ') || 'flexible'}
- Bodyweight: ${userProfile.bodyweight || 'unknown'} ${userProfile.units || 'lbs'}

The base template has ${template.days.length} training days: ${template.days.map(d => d.name).join(', ')}.

Customize this plan for the warrior. Return a JSON object with:
{
  "gimliMessage": "A short motivational message from Gimli about this plan (2-3 sentences, in character)",
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
    return 'Another battle won at the forge! Keep pushing, warrior.';
  }

  const exerciseList = workoutData.exercises
    .map(ex => `${ex.name}: ${ex.sets.length} sets, best set ${ex.sets.reduce((best, s) => s.weight > (best.weight || 0) ? s : best, {}).weight || 0} ${userProfile?.units || 'lbs'} x ${ex.sets.reduce((best, s) => s.weight > (best.weight || 0) ? s : best, {}).reps || 0}`)
    .join('\n');

  const prompt = `${GIMLI_SYSTEM_PROMPT}

The warrior just finished a workout. Give a brief (2-3 sentence) summary and encouragement in Gimli's voice.

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
    return 'Another day of iron conquered! The forge burns bright, warrior.';
  }
}

export async function generateInsights(recentWorkouts, profile) {
  const client = getAI();
  if (!client) {
    return ['Keep training consistently — the forge rewards those who show up.'];
  }

  const summary = recentWorkouts.slice(0, 10).map(w =>
    `${w.date}: ${w.exercises?.map(e => e.name).join(', ')} (volume: ${w.totalVolume || 0})`
  ).join('\n');

  const prompt = `${GIMLI_SYSTEM_PROMPT}

Analyze this warrior's recent training and provide 2-3 brief insights. Each insight should be 1 sentence in Gimli's voice.

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
    return ['The forge awaits — keep training and the insights will come.'];
  }
}

export async function chat(messages, context) {
  const client = getAI();
  if (!client) {
    return 'The forge fires are dim — AI features are not configured. But the iron still awaits you, warrior!';
  }

  const contextStr = context ? `
Current context:
- Screen: ${context.screen || 'unknown'}
- Streak: ${context.streak || 0} days
- Active plan: ${context.planName || 'none'}
- Last workout: ${context.lastWorkoutDate || 'never'}
- Experience: ${context.experienceLevel || 'unknown'}
- Goals: ${context.goals || 'unknown'}` : '';

  const systemPrompt = GIMLI_SYSTEM_PROMPT + contextStr;

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
    return 'The forge fires flicker... Something went wrong. Try again, warrior.';
  }
}

export { GIMLI_SYSTEM_PROMPT };
