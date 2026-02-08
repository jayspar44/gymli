import { Check } from 'lucide-react';

export default function SetRow({ setIndex, set, units, onChange }) {
  function handleChange(field, value) {
    onChange(setIndex, { ...set, [field]: value });
  }

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-6 text-xs text-[var(--color-text-secondary)] text-center font-mono">
        {setIndex + 1}
      </span>

      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={set.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="0"
            className="w-full py-2 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm text-center outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-secondary)]">
            {units}
          </span>
        </div>

        <div className="relative w-16">
          <input
            type="number"
            value={set.reps || ''}
            onChange={(e) => handleChange('reps', e.target.value)}
            placeholder="0"
            className="w-full py-2 px-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm text-center outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-secondary)]">
            reps
          </span>
        </div>
      </div>

      <button
        onClick={() => handleChange('completed', !set.completed)}
        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 ${
          set.completed
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
