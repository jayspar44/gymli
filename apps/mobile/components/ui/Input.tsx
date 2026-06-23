import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../lib/cn';
import type { ComponentType } from 'react';

type IconProps = { size?: number; color?: string; className?: string };

export function Input({
  label,
  error,
  icon: Icon,
  suffix,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  icon?: ComponentType<IconProps>;
  suffix?: string;
  className?: string;
} & TextInputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</Text>
      ) : null}
      <View className="relative">
        {Icon ? (
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <Icon size={16} color="#71717a" />
          </View>
        ) : null}
        <TextInput
          className={cn(
            'w-full rounded-xl bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700',
            'text-zinc-900 dark:text-zinc-50',
            'px-4 min-h-12 text-base',
            Icon && 'pl-10',
            suffix && 'pr-12',
            error && 'border-red-500',
            className
          )}
          placeholderTextColor="#71717a"
          {...props}
        />
        {suffix ? (
          <View className="absolute right-3 top-0 bottom-0 justify-center">
            <Text className="text-sm text-zinc-500">{suffix}</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}

export default Input;
