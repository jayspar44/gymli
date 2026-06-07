import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';
import type { ComponentType } from 'react';

type IconProps = { size?: number; color?: string };

export function Chip({
  children,
  selected,
  icon: Icon,
  onPress,
  className,
  ...rest
}: {
  children: React.ReactNode;
  selected?: boolean;
  icon?: ComponentType<IconProps>;
  className?: string;
} & PressableProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 px-3 py-1.5 rounded-full',
        selected
          ? 'bg-primary'
          : 'bg-surface-alt dark:bg-surface-dark',
        className
      )}
      {...rest}
    >
      {Icon ? <Icon size={14} color={selected ? '#fff' : '#71717a'} /> : null}
      <Text
        className={cn(
          'text-sm',
          selected ? 'text-white font-medium' : 'text-zinc-500'
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export default Chip;
