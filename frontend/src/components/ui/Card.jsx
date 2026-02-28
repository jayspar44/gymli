import { cn } from '../../utils/cn';

export default function Card({ children, className, padding = 'md', interactive = false, ...props }) {
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-5', none: '' };
  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--color-surface)]',
        'border border-[var(--color-border)] dark:border-transparent',
        paddings[padding],
        interactive && 'active:scale-[0.99] transition-transform cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('pb-3 mb-3 border-b border-[var(--color-border)]', className)}>
      {children}
    </div>
  );
}
