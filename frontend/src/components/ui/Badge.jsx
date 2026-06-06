import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
