import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Timer } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import WorkoutSummary from './WorkoutSummary';
import LogInput from './LogInput';
import LogFeed from './LogFeed';
import { logWorkout, getPreviousPerformance, createRoutine, parseLog } from '../../api/services';
import { applyAction } from '../../utils/session-actions';
import { cn } from '../../utils/cn';
import { emptySet } from '../../utils/set-fields';
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
  const [feed, setFeed] = useState([]);
  const [parsing, setParsing] = useState(false);
  const timerRef = useRef(null);
  const lastCompletionRef = useRef(0);
  const pillStripRef = useRef(null);
  const sessionId = useRef('s-' + Math.round(performance.now())).current;

  // Initialize exercises from plan day
  useEffect(() => {
    const initialized = day.exercises.map(ex => {
      const kind = ex.kind || 'weighted';
      return {
        exerciseId: ex.exerciseId,
        name: ex.name || ex.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        kind,
        targetSets: ex.sets,
        targetReps: ex.reps,
        notes: '',
        sets: Array.from({ length: ex.sets }, () => emptySet(kind)),
      };
    });
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
          kind: ex.kind,
          notes: ex.notes || undefined,
          sets: ex.sets.map(s => ({ ...s, completed: !!s.completed })),
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

  function applyEnvelopeActions(actions) {
    setExercises(prev => {
      let session = { exercises: prev.map(e => ({ ...e })), currentExerciseId: prev[currentIndex]?.exerciseId || null };
      for (const a of actions) session = applyAction(session, a);
      return session.exercises;
    });
  }

  async function handleLogInput(text) {
    setFeed(f => [...f, { from: 'user', text }]);
    setParsing(true);
    try {
      const session = {
        exercises: exercises.map(e => ({ exerciseId: e.exerciseId, name: e.name, kind: e.kind, sets: e.sets })),
        currentExerciseId: exercises[currentIndex]?.exerciseId || null,
      };
      const env = await parseLog({ text, session, units, sessionId });
      setFeed(f => [...f, { from: 'gymli', text: env.reply || '…', clarification: env.needsClarification ? env.clarification : null }]);
      // Apply actions whenever no clarification is needed. The backend already guards
      // exercise resolution, and the grid stays editable, so we never silently drop a
      // low-confidence parse — surfacing it in the grid beats a misleading no-op.
      if (!env.needsClarification) {
        applyEnvelopeActions(env.actions || []);
      }
    } catch {
      setFeed(f => [...f, { from: 'gymli', text: 'Something went wrong — try again.' }]);
    } finally {
      setParsing(false);
    }
  }

  function handleClarify(option) {
    applyEnvelopeActions([{ type: 'add_exercise', exerciseId: option.exerciseId, name: option.label, kind: 'weighted' }]);
    setFeed(f => [...f, { from: 'gymli', text: `Added ${option.label}.` }]);
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const currentExercise = exercises[currentIndex];

  const completedExerciseCount = exercises.filter(ex => ex.sets.some(s => s.completed)).length;
  const totalExercises = exercises.length;

  async function handleSaveAsRoutine() {
    await createRoutine({
      name: day?.name || 'My Routine',
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        kind: ex.kind || 'weighted',
        targetSets: ex.sets.length,
        targetReps: ex.targetReps || '8-12',
      })),
    });
  }

  if (result) {
    return <WorkoutSummary result={result} onClose={onClose} onSaveAsRoutine={handleSaveAsRoutine} />;
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

      {/* Split layout: scrollable exercise grid (top) + feed + input (bottom) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Current exercise — scrollable */}
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

        {/* Conversational log feed */}
        <div className="max-h-[34vh] overflow-y-auto border-t border-[var(--color-border)]">
          <LogFeed entries={feed} onClarify={handleClarify} />
        </div>

        {/* Conversational log input */}
        <LogInput onSend={handleLogInput} disabled={parsing} />
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
