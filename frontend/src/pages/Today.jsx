import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Dumbbell, Moon, Play, CheckCircle2 } from 'lucide-react';
import { getTodaysWorkout } from '../api/services';
import WorkoutSession from '../components/workout/WorkoutSession';

const GREETINGS = [
  'The forge awaits, warrior!',
  'Time to move some iron!',
  'Another day, another battle won.',
  'The anvil is hot — let\'s go!',
  'Rise and grind, warrior!',
];

export default function Today() {
  const navigate = useNavigate();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSession, setShowSession] = useState(false);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  useEffect(() => {
    loadToday();
  }, []);

  async function loadToday() {
    try {
      setLoading(true);
      const data = await getTodaysWorkout();
      setTodayData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setTodayData({ hasPlan: false });
      } else {
        setError('Failed to load today\'s workout');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSessionClose() {
    setShowSession(false);
    loadToday(); // Refresh
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={loadToday} className="mt-2 text-sm text-[var(--color-primary)]">Retry</button>
      </div>
    );
  }

  // No plan — prompt setup
  if (!todayData?.hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[var(--color-surface-alt)]">
          <Dumbbell className="w-7 h-7 text-[var(--color-primary)]" strokeWidth={1.5} />
        </div>
        <h2
          className="text-lg tracking-wider font-semibold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          No Battle Plan Yet
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Let Gymli forge a training plan for you.
        </p>
        <button
          onClick={() => navigate('/plan-setup')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-sm transition-all active:scale-[0.98]"
        >
          Create Plan
        </button>
      </div>
    );
  }

  // Rest day
  if (todayData.isRestDay) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[var(--color-surface-alt)]">
          <Moon className="w-7 h-7 text-indigo-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Rest Day</h2>
        <p className="text-sm text-[var(--color-text-secondary)] italic">
          &ldquo;{todayData.message}&rdquo;
        </p>
        {todayData.streak > 0 && (
          <div className="flex items-center gap-1.5 mt-4 text-sm text-[var(--color-primary)]">
            <Flame className="w-4 h-4" />
            {todayData.streak} day streak
          </div>
        )}
      </div>
    );
  }

  // Active workout day
  return (
    <>
      <div className="px-4 py-6">
        {/* Greeting + streak */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Today</h2>
            {todayData.streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/.1 text-[var(--color-primary)]">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{todayData.streak}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] italic">&ldquo;{greeting}&rdquo;</p>
        </div>

        {/* Today's workout card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{todayData.day?.name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">{todayData.day?.focus}</p>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">{todayData.planName}</span>
            </div>
          </div>

          {/* Exercise preview */}
          <div className="px-4 py-2">
            {todayData.day?.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-sm text-[var(--color-text)]">
                  {ex.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                  {ex.sets} × {ex.reps}
                </span>
              </div>
            ))}
          </div>

          {/* Start / Completed */}
          <div className="px-4 py-3 border-t border-[var(--color-border)]">
            {todayData.alreadyLogged ? (
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Completed today</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSession(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                Start Workout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Workout session overlay */}
      {showSession && todayData.day && (
        <WorkoutSession
          day={todayData.day}
          units={todayData.units || 'lbs'}
          onClose={handleSessionClose}
        />
      )}
    </>
  );
}
