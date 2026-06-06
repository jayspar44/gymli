import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColors = {
  up: 'text-[var(--color-success)]',
  down: 'text-[var(--color-danger)]',
  flat: 'text-[var(--color-text-secondary)]',
};

export default function Stat({ value, label, trend, icon: Icon, className }) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--color-primary)]" />}
        <span className="text-2xl font-bold text-[var(--color-text)] tabular-nums">{value}</span>
        {TrendIcon && <TrendIcon className={cn('w-4 h-4', trendColors[trend])} />}
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</span>
    </div>
  );
}
