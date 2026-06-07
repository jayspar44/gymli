/**
 * RestTimer — countdown rest timer shown after a set is completed.
 * Ports frontend/src/components/workout/RestTimer.jsx.
 * - setInterval countdown (cleared on unmount)
 * - Auto-dismisses 3 s after reaching 0
 * - Tap to expand and adjust ±15 s
 * - expo-haptics notification on finish
 */
import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Plus, Minus } from 'lucide-react-native';

type Props = {
  duration?: number;
  onDismiss: () => void;
};

export function RestTimer({ duration = 90, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [active, setActive] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Countdown interval
  useEffect(() => {
    if (!active || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, remaining]);

  // Haptic + auto-dismiss on finish
  useEffect(() => {
    if (remaining === 0 && !active) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timeout = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [remaining, active, onDismiss]);

  const adjustTime = useCallback(
    (amount: number) => {
      setRemaining((r) => Math.max(0, r + amount));
      if (!active && amount > 0) setActive(true);
    },
    [active]
  );

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / duration;

  return (
    <View className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-2">
      <View className="relative rounded-xl bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
        {/* Progress bar */}
        <View className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700">
          <View
            className="h-full bg-primary"
            style={{ width: `${progress * 100}%` }}
          />
        </View>

        {/* Compact bar — tap to expand */}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="flex-row items-center justify-between w-full px-4 py-2.5 pt-3"
        >
          <View className="flex-row items-center gap-3">
            <Text className="text-lg font-mono font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
            <Text className="text-xs text-zinc-500">
              {remaining === 0 ? 'Time to lift!' : 'Rest'}
            </Text>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
          >
            <X size={16} color="#71717a" />
          </Pressable>
        </Pressable>

        {/* Expanded controls */}
        {expanded && (
          <View className="flex-row items-center justify-center gap-4 px-4 pb-3">
            <Pressable
              onPress={() => adjustTime(-15)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-alt dark:bg-zinc-800"
            >
              <Minus size={12} color="#71717a" />
              <Text className="text-xs font-medium text-zinc-500">15s</Text>
            </Pressable>
            <Pressable
              onPress={() => adjustTime(15)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-alt dark:bg-zinc-800"
            >
              <Plus size={12} color="#71717a" />
              <Text className="text-xs font-medium text-zinc-500">15s</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default RestTimer;
