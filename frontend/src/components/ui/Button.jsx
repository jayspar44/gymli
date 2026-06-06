import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-[var(--color-primary)] text-white font-semibold active:opacity-90',
  secondary: 'border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost: 'text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary-muted)]',
  destructive: 'bg-[var(--color-danger)] text-white font-semibold active:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
