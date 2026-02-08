import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import WorkoutSummary from './WorkoutSummary';
import { logWorkout } from '../../api/services';

export default function WorkoutSession({ day, units, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Initialize exercises from plan day
    const initialized = day.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      targetSets: ex.sets,
      targetReps: ex.reps,
      sets: Array.from({ length: ex.sets }, () => ({
        weight: '',
        reps: '',
        completed: false,
      })),
    }));
    setExercises(initialized);
  }, [day]);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function handleExerciseChange(updated) {
    const newExercises = [...exercises];
    newExercises[currentIndex] = updated;
    setExercises(newExercises);

    // Auto-show rest timer when a set is completed
    const lastSet = updated.sets[updated.sets.length - 1];
    const completedCount = updated.sets.filter(s => s.completed).length;
    const prevCompletedCount = exercises[currentIndex]?.sets.filter(s => s.completed).length || 0;
    if (completedCount > prevCompletedCount && !lastSet?.completed) {
      setShowRestTimer(true);
    }
  }

  async function handleFinish() {
    setSaving(true);
    const duration = Math.round(elapsedSeconds / 60);

    try {
      const workoutResult = await logWorkout({
        exercises: exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets.map(s => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            completed: !!s.completed,
          })),
        })),
        duration,
      });

      setResult({ ...workoutResult, duration });
    } catch (err) {
      console.error('Failed to save workout:', err);
      // Still show summary with local data
      setResult({
        exercises,
        duration,
        totalVolume: exercises.reduce((sum, ex) =>
          sum + ex.sets.reduce((s, set) =>
            s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0),
        prs: [],
      });
    } finally {
      setSaving(false);
    }
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const currentExercise = exercises[currentIndex];

  if (result) {
    return <WorkoutSummary result={result} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Timer className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="font-mono font-medium text-[var(--color-text)]">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <button
          onClick={handleFinish}
          disabled={saving}
          className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Finish'}
        </button>
      </div>

      {/* Exercise navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {currentIndex + 1} / {exercises.length}
        </span>
        <button
          onClick={() => setCurrentIndex(i => Math.min(exercises.length - 1, i + 1))}
          disabled={currentIndex === exercises.length - 1}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] disabled:opacity-30"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current exercise */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentExercise && (
          <ExerciseCard
            exercise={currentExercise}
            units={units}
            onChange={handleExerciseChange}
          />
        )}

        {/* Quick nav dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {exercises.map((ex, i) => {
            const completed = ex.sets.every(s => s.completed);
            const partial = ex.sets.some(s => s.completed);
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-150 ${
                  i === currentIndex
                    ? 'w-4 bg-[var(--color-primary)]'
                    : completed
                      ? 'bg-emerald-500'
                      : partial
                        ? 'bg-[var(--color-primary)]/.5'
                        : 'bg-[var(--color-border)]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer duration={90} onDismiss={() => setShowRestTimer(false)} />
      )}
    </div>
  );
}
