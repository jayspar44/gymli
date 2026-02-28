import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Timer } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import WorkoutSummary from './WorkoutSummary';
import { logWorkout, getPreviousPerformance } from '../../api/services';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import BottomSheet from '../ui/BottomSheet';

export default function WorkoutSession({ day, units, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [previousData, setPreviousData] = useState({});
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const timerRef = useRef(null);
  const lastCompletionRef = useRef(0);
  const pillStripRef = useRef(null);

  // Initialize exercises from plan day
  useEffect(() => {
    const initialized = day.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      targetSets: ex.sets,
      targetReps: ex.reps,
      notes: '',
      sets: Array.from({ length: ex.sets }, () => ({
        weight: '',
        reps: '',
        completed: false,
      })),
    }));
    setExercises(initialized);
  }, [day]);

  // Load previous performance on mount
  useEffect(() => {
    const ids = day.exercises.map(e => e.exerciseId);
    if (ids.length) {
      getPreviousPerformance(ids).then(setPreviousData).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill weights from previous session
  useEffect(() => {
    if (Object.keys(previousData).length === 0) return;
    setExercises(prevExercises => prevExercises.map(ex => {
      const prevPerf = previousData[ex.exerciseId];
      if (!prevPerf?.sets?.length) return ex;
      return {
        ...ex,
        sets: ex.sets.map((set, i) => ({
          ...set,
          weight: set.weight || prevPerf.sets[i]?.weight || prevPerf.sets[0]?.weight || '',
        })),
      };
    }));
  }, [previousData]);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Scroll pill strip when current index changes
  useEffect(() => {
    if (pillStripRef.current) {
      const pills = pillStripRef.current.children;
      if (pills[currentIndex]) {
        pills[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  function handleExerciseChange(updated) {
    const newExercises = [...exercises];
    const prevExercise = exercises[currentIndex];
    newExercises[currentIndex] = updated;
    setExercises(newExercises);

    // Check if a new set was just completed
    const completedCount = updated.sets.filter(s => s.completed).length;
    const prevCompletedCount = prevExercise?.sets.filter(s => s.completed).length || 0;

    if (completedCount > prevCompletedCount) {
      const now = Date.now();
      const gap = now - lastCompletionRef.current;
      lastCompletionRef.current = now;

      // Only show rest timer if gap > 5 seconds (not rapid corrections)
      // and not all sets are done
      const allDone = updated.sets.every(s => s.completed);
      if (gap > 5000 && !allDone) {
        setShowRestTimer(true);
      }
    }
  }

  function handleUpdateNotes(notes) {
    const newExercises = [...exercises];
    newExercises[currentIndex] = { ...newExercises[currentIndex], notes };
    setExercises(newExercises);
  }

  async function handleFinish() {
    setShowFinishSheet(false);
    setSaving(true);
    const duration = Math.round(elapsedSeconds / 60);

    try {
      const workoutResult = await logWorkout({
        exercises: exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          notes: ex.notes || undefined,
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

  const completedExerciseCount = exercises.filter(ex => ex.sets.some(s => s.completed)).length;
  const totalExercises = exercises.length;

  if (result) {
    return <WorkoutSummary result={result} onClose={onClose} />;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Timer className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="font-mono font-medium text-[var(--color-text)] tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <button
          onClick={() => setShowFinishSheet(true)}
          disabled={saving}
          className="text-sm font-semibold text-[var(--color-text-secondary)] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'End'}
        </button>
      </div>

      {/* Exercise navigation — pill strip */}
      <div
        ref={pillStripRef}
        className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-[var(--color-border)] flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {exercises.map((ex, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              i === currentIndex
                ? 'bg-[var(--color-primary)] text-white'
                : i < currentIndex || ex.sets.some(s => s.completed)
                  ? 'bg-[var(--color-success-muted)] text-[var(--color-success)]'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
            )}
          >
            {ex.name.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      {/* Current exercise */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {currentExercise && (
          <ExerciseCard
            exercise={currentExercise}
            units={units}
            previous={previousData[currentExercise.exerciseId]}
            onChange={handleExerciseChange}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </div>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer duration={90} onDismiss={() => setShowRestTimer(false)} />
      )}

      {/* Finish confirmation bottom sheet */}
      <BottomSheet open={showFinishSheet} onClose={() => setShowFinishSheet(false)}>
        <div className="py-4 space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-text)]">End workout?</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {completedExerciseCount} of {totalExercises} exercises completed
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowFinishSheet(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleFinish}>End Workout</Button>
          </div>
        </div>
      </BottomSheet>
    </motion.div>
  );
}
