import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getLoggedExercises } from '../../api/services';

export default function ExerciseSelector({ selected, onSelect }) {
  const [exercises, setExercises] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await getLoggedExercises();
      const list = data.exercises || [];
      setExercises(list);
      if (!selected && list.length > 0) {
        onSelect(list[0].id);
      }
    } catch {
      setExercises([]);
    }
  }

  const selectedExercise = exercises.find(e => e.id === selected);

  if (exercises.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] text-sm text-[var(--color-text)] border border-[var(--color-border)]"
      >
        <span className="truncate">{selectedExercise?.name || 'Select exercise'}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 max-h-48 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex.id); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-alt)] transition-colors ${
                ex.id === selected ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text)]'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
