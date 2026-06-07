/**
 * WorkoutSummary — shown when a workout finishes.
 * Ports frontend/src/components/workout/WorkoutSummary.jsx.
 * Haptics success on mount; stats grid; PRs; AI summary; save-as-routine.
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Clock, Dumbbell, Flame } from 'lucide-react-native';
import { Stat } from '../ui/Stat';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type SetData = {
  completed: boolean;
  [key: string]: unknown;
};

type ExerciseResult = {
  exerciseId?: string;
  name?: string;
  sets: SetData[];
};

type PREntry = {
  name: string;
  score: number;
  previousBest: number;
};

type WorkoutResult = {
  exercises?: ExerciseResult[];
  duration?: number;
  totalVolume?: number;
  prs?: PREntry[];
  gymliSummary?: string;
};

type Props = {
  result: WorkoutResult;
  onClose: () => void;
  onSaveAsRoutine?: () => Promise<void>;
};

export function WorkoutSummary({ result, onClose, onSaveAsRoutine }: Props) {
  const [savedRoutine, setSavedRoutine] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  async function handleSaveAsRoutine() {
    if (!onSaveAsRoutine || savedRoutine) return;
    setSavingRoutine(true);
    try {
      await onSaveAsRoutine();
      setSavedRoutine(true);
    } finally {
      setSavingRoutine(false);
    }
  }

  if (!result) return null;

  const totalSets =
    result.exercises?.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    ) || 0;

  const volumeDisplay = result.totalVolume
    ? `${(result.totalVolume / 1000).toFixed(1)}k`
    : '—';

  return (
    <View className="flex-1 bg-black/60 items-center justify-center px-4">
      <View className="w-full max-w-sm rounded-2xl bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 items-center">
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
            Workout Complete
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View className="flex-row gap-3 px-6 pb-4">
            <View className="flex-1">
              <Stat value={result.duration ?? '—'} label="Minutes" icon={Clock} />
            </View>
            <View className="flex-1">
              <Stat value={volumeDisplay} label="Volume" icon={Dumbbell} />
            </View>
            <View className="flex-1">
              <Stat value={totalSets} label="Sets" icon={Flame} />
            </View>
          </View>

          {/* PRs */}
          {result.prs && result.prs.length > 0 && (
            <View className="mx-6 mb-4 gap-1.5">
              <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Personal Records
              </Text>
              {result.prs.map((pr, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <Badge variant="success">PR</Badge>
                  <Text className="text-sm text-zinc-900 dark:text-zinc-50">
                    {pr.name}: {pr.score} (+{pr.score - pr.previousBest})
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* AI summary */}
          {result.gymliSummary && (
            <View className="mx-6 mb-4 px-3 py-2.5 rounded-xl bg-surface-alt dark:bg-zinc-800">
              <Text className="text-sm text-zinc-900 dark:text-zinc-50 leading-relaxed">
                {result.gymliSummary}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="px-6 pb-6 gap-2">
            {onSaveAsRoutine && (
              <Button
                variant="secondary"
                fullWidth
                onPress={handleSaveAsRoutine}
                disabled={savedRoutine || savingRoutine}
                loading={savingRoutine}
              >
                {savedRoutine ? 'Saved as routine ✓' : 'Save as routine'}
              </Button>
            )}
            <Button variant="primary" fullWidth onPress={onClose}>
              Done
            </Button>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export default WorkoutSummary;
