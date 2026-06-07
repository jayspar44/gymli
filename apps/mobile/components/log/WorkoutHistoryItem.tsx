/**
 * WorkoutHistoryItem — expandable card showing a single logged workout.
 * Ports frontend/src/components/log/WorkoutHistoryItem.jsx.
 * framer-motion AnimatePresence replaced with Reanimated useAnimatedStyle.
 */
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Clock, Dumbbell, ChevronDown } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';

function formatVolume(vol: number | undefined | null): string | null {
  if (!vol || vol <= 0) return null;
  return vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : `${vol}`;
}

type WorkoutSet = {
  weight?: number;
  reps?: number;
};

type WorkoutExercise = {
  name: string;
  unit?: string;
  sets?: WorkoutSet[];
};

type PR = {
  name: string;
  weight: string | number;
};

type Workout = {
  id?: string;
  date: string;
  dayName?: string;
  duration?: number;
  totalVolume?: number;
  exercises?: WorkoutExercise[];
  prs?: PR[];
  gymliSummary?: string;
};

export function WorkoutHistoryItem({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false);

  const rotate = useSharedValue(0);
  const expandHeight = useSharedValue(0);
  const expandOpacity = useSharedValue(0);

  // We use maxHeight trick since we can't know height upfront
  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: expandHeight.value,
    opacity: expandOpacity.value,
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    rotate.value = withTiming(next ? 180 : 0, { duration: 200 });
    expandHeight.value = withTiming(next ? 800 : 0, { duration: 220 });
    expandOpacity.value = withTiming(next ? 1 : 0, { duration: 180 });
  }

  const date = new Date(workout.date);
  const exerciseCount = workout.exercises?.length ?? 0;
  const hasPRs = (workout.prs?.length ?? 0) > 0;
  const prCount = workout.prs?.length ?? 0;
  const volume = formatVolume(workout.totalVolume);

  return (
    <Card padding="none" className="overflow-hidden">
      <Pressable
        onPress={toggle}
        className="w-full flex-row items-center gap-3 px-4 py-3"
      >
        {/* Date badge */}
        <View className="w-10 flex-shrink-0 items-center justify-center">
          <Text className="text-[10px] uppercase text-zinc-500">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
            {date.getDate()}
          </Text>
        </View>

        {/* Info */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              numberOfLines={1}
            >
              {workout.dayName ||
                `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
            </Text>
            {hasPRs && (
              <Badge variant="success">
                {prCount > 1 ? `${prCount} PRs` : 'PR'}
              </Badge>
            )}
          </View>
          <View className="flex-row items-center gap-3 mt-0.5">
            {workout.duration != null && (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color="#71717a" />
                <Text className="text-xs text-zinc-500">{workout.duration}m</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Dumbbell size={12} color="#71717a" />
              <Text className="text-xs text-zinc-500">
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </Text>
            </View>
            {volume && (
              <Text className="text-xs text-zinc-500">{volume} vol</Text>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Animated.View style={chevronStyle} className="flex-shrink-0">
          <ChevronDown size={16} color="#71717a" />
        </Animated.View>
      </Pressable>

      {/* Expandable detail */}
      <Animated.View style={expandStyle}>
        <View className="px-4 pb-3 border-t border-zinc-200 dark:border-zinc-700">
          {workout.exercises?.map((ex, i) => (
            <View
              key={i}
              className={cn(
                'py-2',
                i < (workout.exercises!.length - 1) &&
                  'border-b border-zinc-200 dark:border-zinc-700'
              )}
            >
              <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                {ex.name}
              </Text>
              <Text className="text-xs text-zinc-500 font-mono">
                {ex.sets
                  ?.map((set, j) => {
                    const part =
                      (set.weight ?? 0) > 0
                        ? `${set.weight}${ex.unit ?? ''} × ${set.reps}`
                        : `${set.reps} reps`;
                    return j === 0 ? part : `, ${part}`;
                  })
                  .join('') ?? ''}
              </Text>
            </View>
          ))}

          {hasPRs && (
            <View className="mt-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Text className="text-xs font-semibold text-green-600 dark:text-green-400 mb-0.5">
                Personal Records
              </Text>
              {workout.prs!.map((pr, i) => (
                <Text key={i} className="text-xs text-zinc-900 dark:text-zinc-50">
                  {pr.name}: {pr.weight}
                </Text>
              ))}
            </View>
          )}

          {workout.gymliSummary && (
            <Text className="mt-2 text-xs text-zinc-500 italic">
              &ldquo;{workout.gymliSummary}&rdquo;
            </Text>
          )}
        </View>
      </Animated.View>
    </Card>
  );
}

export default WorkoutHistoryItem;
