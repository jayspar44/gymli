import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTodaysWorkout, getRoutines, getDailyTip, getStreakData,
} from '../api/services';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';

// ── Main Component ─────────────────────────────────────

export default function Today() {
  const navigate = useNavigate();

  // Core state
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Secondary data
  const [routines, setRoutines] = useState([]);
  const [tip, setTip] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);

  // ── Data fetching ──

  const loadToday = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [today, fetchedRoutines, streak] = await Promise.all([
        getTodaysWorkout().catch(() => null),
        getRoutines().catch(() => []),
        getStreakData().catch(() => null),
      ]);
      setTodayData(today);
      setRoutines(fetchedRoutines);
      setStreakInfo(streak);
      const tip = await getDailyTip().then(r => r.tip).catch(() => null);
      setTip(tip);
    } catch {
      setError('Failed to load today');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // ── Loading state ──

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton variant="heading" />
        <div className="flex gap-6">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-20" />
        </div>
        <Skeleton variant="card" />
        <Skeleton variant="text" className="w-full h-10" />
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={loadToday} className="mt-2 text-sm text-[var(--color-primary)]">
          Retry
        </button>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Today</h1>
          {streakInfo?.currentStreak ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{streakInfo.currentStreak} day streak</p>
          ) : null}
        </div>
      </header>

      {todayData?.alreadyLoggedToday ? (
        <div className="rounded-2xl bg-[var(--color-surface-alt)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">Workout complete for today</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {todayData.existingWorkout?.exercises?.length || 0} exercises logged
          </p>
        </div>
      ) : (
        <Button size="lg" onClick={() => navigate('/log?start=empty')}>Start workout</Button>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Routines</h2>
        {routines.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">No routines yet. Build one from the Log tab.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {routines.map(r => (
              <button key={r.id}
                onClick={() => navigate(`/log?routine=${r.id}`)}
                className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3 text-left">
                <span className="text-sm font-medium text-[var(--color-text)]">{r.name}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{r.exercises?.length || 0} exercises</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {tip ? <p className="text-xs text-[var(--color-text-secondary)]">{tip}</p> : null}
    </div>
  );
}
