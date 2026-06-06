import { cn } from '../../utils/cn';

export default function Chip({ children, selected, icon: Icon, onPress, className }) {
  return (
    <button
      onClick={onPress}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
        selected
          ? 'bg-[var(--color-primary)] text-white font-medium'
          : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
