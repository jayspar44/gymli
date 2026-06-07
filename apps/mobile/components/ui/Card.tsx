import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

type Padding = 'sm' | 'md' | 'lg' | 'none';

const paddings: Record<Padding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  none: '',
};

export function Card({
  children,
  className,
  padding = 'md',
  interactive = false,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  padding?: Padding;
  interactive?: boolean;
} & ViewProps) {
  return (
    <View
      className={cn(
        'rounded-2xl bg-white dark:bg-surface-dark',
        'border border-zinc-200 dark:border-transparent',
        paddings[padding],
        interactive && 'active:opacity-90',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-700', className)}>
      {children}
    </View>
  );
}

export default Card;
