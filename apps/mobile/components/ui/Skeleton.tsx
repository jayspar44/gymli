import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
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
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        'rounded-lg bg-surface-alt dark:bg-surface-dark',
        variants[variant],
        className
      )}
    />
  );
}

export default Skeleton;
