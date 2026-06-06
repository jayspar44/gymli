import { cn } from '../../utils/cn';

export default function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div className={cn(
      'inline-flex p-1 rounded-xl bg-[var(--color-surface-alt)]',
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
            value === option.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
