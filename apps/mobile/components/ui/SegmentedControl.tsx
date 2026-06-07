import { View, Text, Pressable } from 'react-native';
import { cn } from '../../lib/cn';

type Option = { label: string; value: string };

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row p-1 rounded-xl bg-surface-alt dark:bg-surface-dark',
        className
      )}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-lg items-center',
            value === option.value
              ? 'bg-white dark:bg-zinc-700 shadow-sm'
              : ''
          )}
        >
          <Text
            className={cn(
              'text-sm font-medium',
              value === option.value
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500'
            )}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default SegmentedControl;
