import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ExercisePicker from '../log/ExercisePicker';
import Button from '../ui/Button';
import { createRoutine, updateRoutine } from '../../api/services';

export default function RoutineEditor({ routine, onClose, onSaved }) {
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState(routine?.exercises || []);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(ex) {
    setExercises(prev => [...prev, {
      exerciseId: ex.id,
      name: ex.name,
      kind: ex.kind || 'weighted',
      targetSets: 3,
      targetReps: '8-12',
    }]);
    setPicking(false);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), exercises };
      const saved = routine?.id
        ? await updateRoutine(routine.id, payload)
        : await createRoutine(payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {routine?.id ? 'Edit routine' : 'New routine'}
        </h2>
        <button onClick={onClose}>
          <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
        </button>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Routine name"
        className="mb-4 rounded-xl bg-[var(--color-surface-alt)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
      />

      <div className="flex-1 overflow-y-auto">
        {exercises.map((ex, i) => (
          <div
            key={i}
            className="mb-2 flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3"
          >
            <span className="text-sm text-[var(--color-text)]">{ex.name}</span>
            <button onClick={() => setExercises(prev => prev.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-text-secondary)]"
        >
          <Plus className="h-4 w-4" /> Add exercise
        </button>
      </div>

      <div className="py-4">
        <Button
          size="lg"
          className="w-full"
          disabled={!name.trim() || saving}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save routine'}
        </Button>
      </div>

      {/* ExercisePicker rendered as overlay so editor state is preserved */}
      {picking && (
        <ExercisePicker onSelect={addExercise} onClose={() => setPicking(false)} />
      )}
    </div>
  );
}
