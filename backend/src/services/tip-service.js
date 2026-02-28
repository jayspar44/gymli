import { buildCoachingContext } from './coaching-context-service.js';

// Simple in-memory cache: { uid: { date, tip } }
const tipCache = new Map();

export async function getDailyTip(uid) {
  const today = new Date().toISOString().slice(0, 10);
  const cached = tipCache.get(uid);
  if (cached?.date === today) return cached.tip;

  const ctx = await buildCoachingContext(uid);
  const tip = generateTip(ctx, today);

  tipCache.set(uid, { date: today, tip });
  return tip;
}

function generateTip(ctx, today) {
  // Priority 1: PR in last workout
  if (ctx.recentPRs.length) {
    const latest = ctx.recentPRs[0];
    const daysAgo = daysBetween(latest.date, today);
    if (daysAgo <= 2) {
      return `New ${latest.name} PR: ${latest.weight} ${ctx.profile.units}. Keep pushing.`;
    }
  }

  // Priority 2: Stalled exercise
  const stalled = ctx.exerciseTrends.find(t => t.trend === 'stalled' && t.sessionsTracked >= 4);
  if (stalled) {
    return `${stalled.name} has plateaued at ${stalled.currentBest} ${ctx.profile.units}. Consider a deload or variation swap.`;
  }

  // Priority 3: Low adherence this week
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek >= 4 && ctx.adherence.completionRate !== null && ctx.adherence.completionRate < 50) {
    return "Lighter week — that's fine. Consistency over time matters more than any single week.";
  }

  // Priority 4: Streak milestones
  const milestones = [90, 60, 30, 14, 7];
  const streak = ctx.adherence.currentStreak;
  for (const m of milestones) {
    if (streak === m) {
      return `${m} days consistent. That's discipline paying off.`;
    }
  }

  // Priority 5: Volume trending up
  if (ctx.recentWorkouts.length >= 2) {
    const recentVol = ctx.recentWorkouts.slice(0, 3).reduce((s, w) => s + w.totalVolume, 0);
    const olderVol = ctx.recentWorkouts.slice(3, 6).reduce((s, w) => s + w.totalVolume, 0);
    if (olderVol > 0 && recentVol > olderVol * 1.05) {
      const pct = Math.round(((recentVol - olderVol) / olderVol) * 100);
      return `Training volume up ${pct}% recently. Strong trend.`;
    }
  }

  // Priority 6: Returning after gap
  if (ctx.recentWorkouts.length && daysBetween(ctx.recentWorkouts[0].date, today) >= 3) {
    return 'Welcome back. Ease into it today.';
  }

  // No tip
  return null;
}

function daysBetween(dateStr, todayStr) {
  const d1 = new Date(dateStr);
  const d2 = new Date(todayStr);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
