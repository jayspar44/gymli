import { View } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'text' | 'heading' | 'circle' | 'card' | 'chart';

const variants: Record<Variant, string> = {
  text: 'h-4 w-full',
  heading: 'h-6 w-3/4',
  circle: 'rounded-full w-10 h-10',
  card: 'h-32 w-full rounded-2xl',
  chart: 'h-48 w-full rounded-2xl',
};

export function Skeleton({
  className,
  variant = 'text',
}: {
  className?: string;
  variant?: Variant;
}) {
  return (
    <View
      className={cn(
        'rounded-lg bg-surface-alt dark:bg-surface-dark',
        variants[variant],
        className
      )}
    />
  );
}

export default Skeleton;
