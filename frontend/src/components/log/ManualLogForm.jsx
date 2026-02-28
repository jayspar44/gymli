import { useState } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ExercisePicker from './ExercisePicker';
import { logWorkout } from '../../api/services';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ManualLogForm({ units = 'lbs', onSaved, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  function handleExerciseSelected(ex) {
    setExercises(prev => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        sets: [{ weight: '', reps: '', completed: true }],
      },
    ]);
    setExpandedIndex(exercises.length);
    setShowPicker(false);
  }

  function updateSet(exIndex, setIndex, field, value) {
    const updated = [...exercises];
    updated[exIndex] = {
      ...updated[exIndex],
      sets: updated[exIndex].sets.map((s, i) =>
        i === setIndex ? { ...s, [field]: value } : s
      ),
    };
    setExercises(updated);
  }

  function addSet(exIndex) {
    const updated = [...exercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1] || { weight: '', reps: '', completed: true };
    updated[exIndex] = {
      ...updated[exIndex],
      sets: [...updated[exIndex].sets, { weight: lastSet.weight, reps: '', completed: true }],
    };
    setExercises(updated);
  }

  function removeSet(exIndex, setIndex) {
    const updated = [...exercises];
    if (updated[exIndex].sets.length <= 1) return;
    updated[exIndex] = {
      ...updated[exIndex],
      sets: updated[exIndex].sets.filter((_, i) => i !== setIndex),
    };
    setExercises(updated);
  }

  function removeExercise(index) {
    setExercises(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  }

  async function handleSave() {
    if (exercises.length === 0) return;
    setSaving(true);
    try {
      await logWorkout({
        exercises: exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets.map(s => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            completed: true,
          })),
        })),
        notes: notes.trim() || undefined,
        manual: true,
      });
      onSaved?.();
    } catch (err) {
      console.error('Failed to save workout:', err);
    } finally {
      setSaving(false);
    }
  }

  const hasData = exercises.some(ex => ex.sets.some(s => s.weight || s.reps));

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-[var(--color-text)]">
          Log Workout
        </h3>
        <button
          onClick={handleSave}
          disabled={saving || !hasData}
          className="text-sm font-semibold text-[var(--color-primary)] disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Add exercises to log your workout
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, exIndex) => {
              const isExpanded = expandedIndex === exIndex;
              return (
                <Card key={exIndex} padding="none" className="overflow-hidden">
                  {/* Exercise header */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : exIndex)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{ex.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeExercise(exIndex); }}
                        className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded sets */}
                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-[var(--color-border)]">
                      {/* Set header */}
                      <div className="flex items-center gap-2 py-2 mb-1">
                        <span className="w-8 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">Set</span>
                        <span className="flex-1 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">
                          Weight ({units})
                        </span>
                        <span className="w-16 text-[10px] text-[var(--color-text-secondary)] text-center uppercase">Reps</span>
                        <span className="w-8" />
                      </div>

                      {ex.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-2 mb-2">
                          <span className="w-8 text-xs text-[var(--color-text-secondary)] text-center font-mono">
                            {setIndex + 1}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={set.weight}
                            onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                            placeholder="0"
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] text-sm text-center text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)] transition-colors"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                            placeholder="0"
                            className="w-16 px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] text-sm text-center text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)] transition-colors"
                          />
                          <button
                            onClick={() => removeSet(exIndex, setIndex)}
                            disabled={ex.sets.length <= 1}
                            className="w-8 flex items-center justify-center text-[var(--color-text-secondary)] disabled:opacity-20"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addSet(exIndex)}
                        className="flex items-center justify-center gap-1 w-full py-2 mt-1 text-xs text-[var(--color-primary)] font-medium"
                      >
                        <Plus className="w-3 h-3" /> Add Set
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {exercises.length > 0 && (
          <div className="mt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] resize-none outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Add exercise button */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0" style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowPicker(true)}
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </Button>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={handleExerciseSelected}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
