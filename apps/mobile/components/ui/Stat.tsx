import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { cn } from '../../lib/cn';
import type { ComponentType } from 'react';

type Trend = 'up' | 'down' | 'flat';
type IconProps = { size?: number; color?: string };

const trendIcons: Record<Trend, ComponentType<{ size?: number; color?: string }>> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};
const trendColors: Record<Trend, string> = {
  up: '#22c55e',
  down: '#ef4444',
  flat: '#71717a',
};

export function Stat({
  value,
  label,
  trend,
  icon: Icon,
  className,
  testID,
}: {
  value: React.ReactNode;
  label: string;
  trend?: Trend;
  icon?: ComponentType<IconProps>;
  className?: string;
  testID?: string;
}) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  return (
    <View testID={testID} className={cn('flex flex-col', className)}>
      <View className="flex-row items-center gap-2">
        {Icon ? <Icon size={16} color="#d4872a" /> : null}
        <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
          {value}
        </Text>
        {TrendIcon ? <TrendIcon size={16} color={trendColors[trend!]} /> : null}
      </View>
      <Text className="text-xs text-zinc-500 mt-0.5">{label}</Text>
    </View>
  );
}

export default Stat;
