import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Flame, Dumbbell, Moon, Play, CheckCircle2, Calendar,
  X, Lightbulb,
} from 'lucide-react';
import {
  getTodaysWorkout, getActivePlan, updatePlan,
  getPreviousPerformance, getDailyTip, getStreakData,
} from '../api/services';
import { useUserProfile } from '../contexts/UserProfileContext';
import WorkoutSession from '../components/workout/WorkoutSession';
import PlanView from '../components/plan/PlanView';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import BottomSheet from '../components/ui/BottomSheet';

// ── Helpers ────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatExerciseName(id) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Map JS getDay() (0=Sun) → our Mon-first index */
function todayIndex() {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;   // 0=Mon … 6=Sun
}

/**
 * Find the next workout day from the weekly schedule starting from tomorrow.
 * Returns { dayLabel, dayName } or null.
 */
function findNextWorkoutDay(weeklySchedule) {
  if (!weeklySchedule) return null;
  const start = todayIndex();
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (start + offset) % 7;
    const dayLabel = DAYS[idx];
    const assignment = weeklySchedule[dayLabel];
    if (assignment && assignment.toLowerCase() !== 'rest') {
      return { dayLabel, dayName: assignment };
    }
  }
  return null;
}

// ── Main Component ─────────────────────────────────────

export default function Today() {
  const navigate = useNavigate();
  const { profile, needsOnboarding } = useUserProfile();
  const firstName = profile?.name?.split(' ')[0] || 'there';

  // Core state
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Secondary data
  const [previousData, setPreviousData] = useState({});
  const [tip, setTip] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);

  // Overlays
  const [showSession, setShowSession] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [fullPlan, setFullPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Day preview bottom sheet
  const [previewDay, setPreviewDay] = useState(null);

  // ── Data fetching ──

  const loadToday = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's workout + active plan + streak in parallel
      const [data, plan, streak] = await Promise.all([
        getTodaysWorkout().catch((err) => {
          if (err.response?.status === 404) return { hasPlan: false };
          throw err;
        }),
        getActivePlan().catch(() => null),
        getStreakData().catch(() => null),
      ]);

      setTodayData(data);
      setActivePlan(plan);
      setStreakInfo(streak);

      // Once we have today's exercises, fetch previous performance + tip in parallel
      const exerciseIds = data?.day?.exercises?.map((ex) => ex.exerciseId) || [];

      const [prevPerf, dailyTip] = await Promise.all([
        exerciseIds.length > 0
          ? getPreviousPerformance(exerciseIds).catch(() => ({}))
          : Promise.resolve({}),
        getDailyTip().then((r) => r.tip).catch(() => null),
      ]);

      setPreviousData(prevPerf);
      setTip(dailyTip);
    } catch {
      setError('Failed to load today\'s workout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // ── Handlers ──

  function handleSessionClose() {
    setShowSession(false);
    loadToday();
  }

  async function handleOpenPlan() {
    setShowPlan(true);
    setPlanLoading(true);
    setSaveSuccess(false);
    try {
      const plan = await getActivePlan();
      setFullPlan(plan);
    } catch {
      setFullPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }

  function handleClosePlan() {
    setShowPlan(false);
    setFullPlan(null);
    setSaveSuccess(false);
  }

  async function handleSavePlan() {
    if (!fullPlan?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updatePlan(fullPlan.id, { days: fullPlan.days });
      setFullPlan(updated);
      setSaveSuccess(true);
      loadToday();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // keep simple
    } finally {
      setSaving(false);
    }
  }

  // ── Derived data ──

  const streak = todayData?.streak ?? streakInfo?.currentStreak ?? 0;
  const totalWorkouts = streakInfo?.totalWorkouts ?? 0;
  const units = todayData?.units || profile?.units || 'lbs';
  const weeklySchedule = activePlan?.weeklySchedule || null;

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

  // ── No plan state ──

  if (!todayData?.hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[var(--color-surface-alt)]">
          <Dumbbell className="w-7 h-7 text-[var(--color-primary)]" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">No plan yet</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Create a training plan to get started.
        </p>
        <Button
          size="lg"
          onClick={() => navigate(needsOnboarding ? '/onboarding' : '/plan-setup')}
        >
          Create Plan
        </Button>
      </div>
    );
  }

  // ── Has plan — build content ──

  const isRestDay = todayData.isRestDay;
  const isCompleted = !isRestDay && todayData.alreadyLogged;
  const day = todayData.day;

  // Subtitle text
  let subtitle = '';
  if (isRestDay) subtitle = 'Rest day';
  else if (isCompleted) subtitle = 'Workout complete';
  else if (day?.name) subtitle = day.name;

  // Next workout for rest day
  const nextWorkout = isRestDay ? findNextWorkoutDay(weeklySchedule) : null;
  const nextDay = nextWorkout
    ? activePlan?.days?.find((d) => d.name === nextWorkout.dayName)
    : null;

  return (
    <>
      <div className="px-4 py-6 space-y-5">
        {/* 1. Greeting + Subtitle */}
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
        </div>

        {/* 2. Stat Strip */}
        <div className="flex items-center gap-6 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{streak}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text)]">{totalWorkouts}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">workouts</span>
          </div>
        </div>

        {/* 3. Today's Workout Card */}
        {isRestDay ? (
          <RestDayCard
            nextWorkout={nextWorkout}
            nextDay={nextDay}
            units={units}
          />
        ) : isCompleted ? (
          <CompletedCard
            existingWorkout={todayData.existingWorkout}
            day={day}
            units={units}
          />
        ) : (
          <ActiveWorkoutCard
            day={day}
            planName={todayData.planName}
            previousData={previousData}
            units={units}
            onStart={() => setShowSession(true)}
          />
        )}

        {/* View Full Plan */}
        <Button variant="secondary" fullWidth onClick={handleOpenPlan}>
          <Calendar className="w-4 h-4" />
          View Full Plan
        </Button>

        {/* 4. Week Strip */}
        {weeklySchedule && (
          <WeekStrip
            weeklySchedule={weeklySchedule}
            activePlan={activePlan}
            todayData={todayData}
            onDayTap={setPreviewDay}
          />
        )}

        {/* 5. AI Tip */}
        {tip && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[var(--color-primary-muted)]">
            <Lightbulb className="w-4 h-4 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[var(--color-text)]">{tip}</p>
          </div>
        )}
      </div>

      {/* Workout session overlay */}
      <AnimatePresence>
        {showSession && day && (
          <WorkoutSession
            day={day}
            units={units}
            onClose={handleSessionClose}
          />
        )}
      </AnimatePresence>

      {/* Full plan overlay */}
      {showPlan && (
        <PlanOverlay
          loading={planLoading}
          plan={fullPlan}
          saving={saving}
          saveSuccess={saveSuccess}
          onPlanChange={setFullPlan}
          onSave={handleSavePlan}
          onClose={handleClosePlan}
        />
      )}

      {/* Day preview bottom sheet */}
      <BottomSheet open={!!previewDay} onClose={() => setPreviewDay(null)}>
        {previewDay && (
          <div className="pb-4">
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
              {previewDay.dayLabel} — {previewDay.dayName}
            </h3>
            {previewDay.exercises?.length > 0 ? (
              <div className="space-y-1 mt-3">
                {previewDay.exercises.map((ex) => (
                  <div key={ex.exerciseId} className="flex items-center justify-between py-2">
                    <span className="text-sm text-[var(--color-text)]">
                      {formatExerciseName(ex.exerciseId)}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                      {ex.sets} &times; {ex.reps}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                No exercises found for this day.
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────

function ActiveWorkoutCard({ day, planName, previousData, units, onStart }) {
  return (
    <Card padding="none">
      <CardHeader className="px-4 pt-4 !mb-0 !pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{day.name}</h3>
            {day.focus && (
              <p className="text-xs text-[var(--color-text-secondary)]">{day.focus}</p>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">{planName}</span>
        </div>
      </CardHeader>

      <div className="px-4">
        {day.exercises.map((ex) => (
          <div
            key={ex.exerciseId}
            className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                {formatExerciseName(ex.exerciseId)}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {ex.sets} &times; {ex.reps}
              </p>
            </div>
            {previousData[ex.exerciseId] && previousData[ex.exerciseId].bestWeight > 0 && (
              <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                {previousData[ex.exerciseId].bestWeight} {units}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-3">
        <Button fullWidth size="lg" onClick={onStart}>
          <Play className="w-4 h-4" fill="currentColor" />
          Start Workout
        </Button>
      </div>
    </Card>
  );
}

function RestDayCard({ nextWorkout, nextDay }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-[var(--color-surface-alt)]">
          <Moon className="w-6 h-6 text-indigo-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">Rest Day</h3>
        {nextWorkout && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Back at it {nextWorkout.dayLabel} with {nextWorkout.dayName}
          </p>
        )}
        {nextDay && nextDay.exercises?.length > 0 && (
          <div className="mt-4 w-full text-left">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Up next
            </p>
            {nextDay.exercises.slice(0, 4).map((ex) => (
              <div
                key={ex.exerciseId}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-[var(--color-text)]">
                  {formatExerciseName(ex.exerciseId)}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                  {ex.sets} &times; {ex.reps}
                </span>
              </div>
            ))}
            {nextDay.exercises.length > 4 && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                +{nextDay.exercises.length - 4} more
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function CompletedCard({ existingWorkout, day, units }) {
  const exerciseCount = existingWorkout?.exercises?.length || day?.exercises?.length || 0;
  const duration = existingWorkout?.duration;
  const totalVolume = existingWorkout?.totalVolume;
  const prs = existingWorkout?.prs || [];

  return (
    <Card>
      <div className="flex flex-col items-center text-center py-4">
        <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-emerald-500/10">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">Workout Complete</h3>

        {/* Summary stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-secondary)]">
          <span>{exerciseCount} exercises</span>
          {duration && <span>{duration} min</span>}
          {totalVolume > 0 && (
            <span>
              {totalVolume.toLocaleString()} {units}
            </span>
          )}
        </div>

        {/* PRs */}
        {prs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {prs.map((pr, i) => (
              <Badge key={i} variant="success">
                PR: {pr.name || formatExerciseName(pr.exerciseId)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function WeekStrip({ weeklySchedule, activePlan, todayData, onDayTap }) {
  const today = todayIndex();

  return (
    <div className="flex gap-1.5">
      {DAYS.map((dayLabel, idx) => {
        const assignment = weeklySchedule[dayLabel];
        const isRest = !assignment || assignment.toLowerCase() === 'rest';
        const isToday = idx === today;
        const isPast = idx < today;
        const isDone = isPast && !isRest; // simplified: assume past non-rest days were done
        const isCompletedToday = isToday && todayData.alreadyLogged;

        // Build indicator style
        let dotClass = 'w-2 h-2 rounded-full';
        if (isDone || isCompletedToday) {
          dotClass += ' bg-emerald-500';
        } else if (isToday) {
          dotClass += ' bg-[var(--color-primary)]';
        } else if (!isRest) {
          dotClass += ' bg-[var(--color-surface-alt)]';
        } else {
          dotClass += ' bg-transparent';
        }

        // Find the day's exercises from the plan for tap preview
        const dayData = !isRest
          ? activePlan?.days?.find((d) => d.name === assignment) || null
          : null;

        function handleTap() {
          if (!isRest && dayData) {
            onDayTap({
              dayLabel,
              dayName: assignment,
              exercises: dayData.exercises || [],
            });
          }
        }

        return (
          <button
            key={dayLabel}
            onClick={handleTap}
            className={
              'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-colors ' +
              (isToday
                ? 'bg-[var(--color-primary-muted)] ring-1 ring-[var(--color-primary)]'
                : 'bg-[var(--color-surface)]')
            }
          >
            <span
              className={
                'text-[10px] font-medium ' +
                (isToday
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)]')
              }
            >
              {dayLabel}
            </span>
            <div className={dotClass} />
          </button>
        );
      })}
    </div>
  );
}

function PlanOverlay({ loading: planLoading, plan, saving, saveSuccess, onPlanChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          {plan?.templateName || 'Your Plan'}
        </h2>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-500 font-medium">Saved</span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {planLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !plan ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Dumbbell className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
            <p className="text-sm text-[var(--color-text-secondary)]">Could not load plan</p>
          </div>
        ) : (
          <PlanView
            plan={plan}
            editable
            onPlanChange={onPlanChange}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
