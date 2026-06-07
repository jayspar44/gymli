import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { cn } from '../../lib/cn';

export function ProgressRing({
  value,
  max,
  size = 64,
  strokeWidth = 4,
  color = '#d4872a',
  children,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Rotate -90deg so progress starts from top; achieved by flipping start point */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {children ? (
        <View className="absolute inset-0 items-center justify-center">{children}</View>
      ) : null}
    </View>
  );
}

export default ProgressRing;
