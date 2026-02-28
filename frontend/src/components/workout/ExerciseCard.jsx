import { useState } from 'react';
import { Plus, Minus, FileText } from 'lucide-react';
import SetRow from './SetRow';
import Card from '../ui/Card';

export default function ExerciseCard({ exercise, units, previous, onChange, onUpdateNotes }) {
  const [showNotes, setShowNotes] = useState(false);

  function handleSetChange(setIndex, updatedSet) {
    const newSets = [...exercise.sets];
    newSets[setIndex] = updatedSet;
    onChange({ ...exercise, sets: newSets });
  }

  function addSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1] || { weight: '', reps: '', completed: false };
    onChange({
      ...exercise,
      sets: [...exercise.sets, { weight: lastSet.weight, reps: lastSet.reps, completed: false }],
    });
  }

  function removeSet() {
    if (exercise.sets.length <= 1) return;
    onChange({ ...exercise, sets: exercise.sets.slice(0, -1) });
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h4 className="text-sm font-semibold text-[var(--color-text)]">
          {exercise.name}
        </h4>
        {exercise.targetReps && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Target: {exercise.targetSets} x {exercise.targetReps}
          </p>
        )}
        {previous && previous.sets && previous.sets.length > 0 && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Last: {previous.sets[0].weight}{units} x {previous.sets.map(s => s.reps).join(', ')}
          </p>
        )}
      </div>

      {/* Sets */}
      <div className="px-4 py-2">
        {/* Header row */}
        <div className="flex items-center gap-2 pb-1 mb-1 border-b border-[var(--color-border)]">
          <span className="w-6 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">Set</span>
          <div className="flex-1 flex gap-2">
            <span className="flex-1 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">Weight</span>
            <span className="w-16 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">Reps</span>
          </div>
          <span className="w-8 text-[10px] text-[var(--color-text-secondary)] text-center">&#10003;</span>
        </div>

        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            setIndex={i}
            set={set}
            units={units}
            onChange={handleSetChange}
          />
        ))}
      </div>

      {/* Add/Remove set + Notes */}
      <div className="px-4 py-2 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={removeSet}
            disabled={exercise.sets.length <= 1}
            className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
          >
            <Minus className="w-3 h-3" /> Remove
          </button>
          <button
            onClick={addSet}
            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Set
          </button>
        </div>

        {/* Per-exercise notes */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-2"
        >
          <FileText className="w-3.5 h-3.5" />
          {exercise.notes ? 'Edit note' : 'Add note'}
        </button>
        {showNotes && (
          <textarea
            value={exercise.notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="How did this feel?"
            className="mt-2 w-full rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] p-2 outline-none focus:border-[var(--color-primary)] resize-none"
            rows={2}
          />
        )}
      </div>
    </Card>
  );
}
