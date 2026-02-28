import { cn } from '../../utils/cn';

export default function Skeleton({ className, variant = 'text' }) {
  const base = 'animate-pulse rounded-lg bg-[var(--color-surface-alt)]';
  const variants = {
    text: 'h-4 w-full',
    heading: 'h-6 w-3/4',
    circle: 'rounded-full w-10 h-10',
    card: 'h-32 w-full rounded-2xl',
    chart: 'h-48 w-full rounded-2xl',
  };
  return <div className={cn(base, variants[variant], className)} />;
}
