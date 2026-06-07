import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const base = 'rounded-xl items-center justify-center flex-row gap-2';
const variants: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-800',
  ghost: 'bg-transparent',
  destructive: 'bg-red-500',
};
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2.5',
  lg: 'px-5 py-3.5',
};
const textVariants: Record<Variant, string> = {
  primary: 'text-white font-semibold text-sm',
  secondary: 'text-zinc-900 dark:text-zinc-50 font-semibold text-sm',
  ghost: 'text-primary font-semibold text-sm',
  destructive: 'text-white font-semibold text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  className,
  onPress,
  ...rest
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
} & PressableProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50',
        className
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={textVariants[variant]}>{children}</Text>
      )}
    </Pressable>
  );
}

export default Button;
