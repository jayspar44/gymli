import { cn } from '../../utils/cn';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, suffix, className, type = 'text', ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]',
            'text-[var(--color-text)] placeholder-[var(--color-text-secondary)]',
            'outline-none focus:border-[var(--color-primary)] transition-colors',
            'px-3 py-2.5 text-sm',
            Icon && 'pl-10',
            suffix && 'pr-12',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
});

export default Input;
