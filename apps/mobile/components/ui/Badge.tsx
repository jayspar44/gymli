import { View, Text } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'success' | 'warning';

const variants: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-primary' },
  success: { container: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  warning: { container: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1 px-2 py-0.5 rounded-full',
        variants[variant].container,
        className
      )}
    >
      <Text className={cn('text-xs font-medium', variants[variant].text)}>{children}</Text>
    </View>
  );
}

export default Badge;
