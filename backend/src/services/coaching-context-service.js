import { db } from './firebase.js';
import { getProfile } from './user-service.js';

/**
 * Build a structured coaching context for AI calls.
 * Assembled once per chat session, cached by caller.
 */
export async function buildCoachingContext(uid) {
  const [profile, workoutsSnap] = await Promise.all([
    getProfile(uid),
    db.collection('users').doc(uid).collection('workouts')
      .orderBy('date', 'desc').limit(15).get(),
  ]);

  const recentWorkouts = workoutsSnap.docs.map(d => {
    const w = d.data();
    return {
      date: w.date,
      exercises: (w.exercises || []).map(e => ({
        name: e.name,
        kind: e.kind || 'weighted',
        sets: (e.sets || []).filter(s => s.completed).map(s => ({ ...s })),
        bestScore: e.bestScore ?? e.bestWeight ?? 0,
      })),
      totalVolume: w.totalVolume || 0,
      duration: w.duration || null,
    };
  });

  const exerciseTrends = computeTrends(recentWorkouts);

  // Recent PRs (from workout docs in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const recentPRs = [];
  for (const w of recentWorkouts) {
    if (w.date < thirtyDaysStr) break;
    const raw = workoutsSnap.docs.find(d => d.data().date === w.date)?.data();
    if (raw?.prs?.length) {
      for (const pr of raw.prs) {
        recentPRs.push({ name: pr.name, score: pr.score ?? pr.weight, date: w.date });
      }
    }
  }

  // Adherence
  const completionRate = null;

  return {
    profile: {
      name: profile?.displayName || 'there',
      experience: profile?.experienceLevel || 'beginner',
      goals: profile?.goals || '',
      units: profile?.units || 'lbs',
      bodyweight: profile?.bodyweight || null,
    },
    plan: null,
    recentWorkouts: recentWorkouts.slice(0, 10),
    exerciseTrends,
    adherence: {
      completionRate,
      currentStreak: profile?.streak || 0,
      totalWorkouts: profile?.totalWorkouts || 0,
    },
    recentPRs,
  };
}

function computeTrends(workouts) {
  const exerciseMap = {};

  for (const w of workouts) {
    for (const e of w.exercises) {
      if (!exerciseMap[e.name]) exerciseMap[e.name] = [];
      exerciseMap[e.name].push({ date: w.date, bestScore: e.bestScore });
    }
  }

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksStr = twoWeeksAgo.toISOString().slice(0, 10);

  return Object.entries(exerciseMap).map(([name, entries]) => {
    const recent = entries.filter(e => e.date >= twoWeeksStr);
    const older = entries.filter(e => e.date < twoWeeksStr);

    const recentBest = Math.max(0, ...recent.map(e => e.bestScore));
    const olderBest = Math.max(0, ...older.map(e => e.bestScore));

    let trend = 'flat';
    if (recentBest > olderBest) trend = 'improving';
    else if (recentBest < olderBest) trend = 'declining';
    else if (recent.length >= 3 && older.length >= 1) trend = 'stalled';

    return {
      name,
      trend,
      currentBest: recentBest,
      previousBest: olderBest,
      sessionsTracked: entries.length,
    };
  });
}

/**
 * Format coaching context as a text block for Gemini system prompt injection.
 */
export function formatContextForAI(ctx) {
  const lines = [];

  lines.push(`User: ${ctx.profile.name} (${ctx.profile.experience})`);
  if (ctx.profile.goals) lines.push(`Goals: ${ctx.profile.goals}`);
  if (ctx.profile.bodyweight) lines.push(`Bodyweight: ${ctx.profile.bodyweight} ${ctx.profile.units}`);

  if (ctx.plan) {
    lines.push(`\nPlan: ${ctx.plan.name} (${ctx.plan.daysPerWeek} days/week)`);
  }

  if (ctx.adherence.completionRate !== null) {
    lines.push(`Adherence: ${ctx.adherence.completionRate}% (last 4 weeks)`);
  }
  lines.push(`Streak: ${ctx.adherence.currentStreak} days | Total workouts: ${ctx.adherence.totalWorkouts}`);

  if (ctx.recentWorkouts.length) {
    lines.push('\nRecent workouts:');
    for (const w of ctx.recentWorkouts.slice(0, 8)) {
      const exercises = w.exercises.map(e => {
        const kind = e.kind || 'weighted';
        const setsStr = e.sets.map(s => {
          switch (kind) {
            case 'timed': return `${s.seconds ?? 0}s`;
            case 'distance': return `${s.distance ?? 0}`;
            case 'bodyweight': return `+${s.addedWeight ?? 0}x${s.reps ?? 0}`;
            case 'assisted': return `-${s.assistWeight ?? 0}x${s.reps ?? 0}`;
            case 'weighted':
            default: return `${s.weight ?? 0}x${s.reps ?? 0}`;
          }
        }).join(', ');
        return `${e.name} [${setsStr}]`;
      }).join('; ');
      lines.push(`  ${w.date}: ${exercises} (vol: ${w.totalVolume})`);
    }
  }

  if (ctx.exerciseTrends.length) {
    lines.push('\nExercise trends:');
    for (const t of ctx.exerciseTrends) {
      lines.push(`  ${t.name}: ${t.trend} (current best: ${t.currentBest}, previous: ${t.previousBest})`);
    }
  }

  if (ctx.recentPRs.length) {
    lines.push('\nRecent PRs:');
    for (const pr of ctx.recentPRs) {
      lines.push(`  ${pr.name}: ${pr.score} (${pr.date})`);
    }
  }

  return lines.join('\n');
}
