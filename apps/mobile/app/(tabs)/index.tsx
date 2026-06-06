import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function Today() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [tip, setTip] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [today, r, s] = await Promise.all([
        api.getTodaysWorkout().catch(() => null),
        api.getRoutines().catch(() => []),
        api.getStreakData().catch(() => null),
      ]);
      setTodayData(today);
      setRoutines(r as any[]);
      setStreak(s);
      setTip(
        await api
          .getDailyTip()
          .then((t: any) => t.tip)
          .catch(() => null)
      );
    } catch {
      setError('Failed to load today');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg dark:bg-bg-dark">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-bg dark:bg-bg-dark">
        <Text className="text-red-500">{error}</Text>
        <Pressable onPress={load}>
          <Text className="text-primary">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-24 pt-4">
        <View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Today</Text>
          {streak?.currentStreak ? (
            <Text className="text-sm text-zinc-500">{streak.currentStreak} day streak</Text>
          ) : null}
        </View>

        {todayData?.alreadyLoggedToday ? (
          <View className="rounded-2xl bg-surface-alt p-4 dark:bg-surface-dark">
            <Text className="font-semibold text-zinc-900 dark:text-zinc-50">
              Workout complete for today
            </Text>
            <Text className="text-sm text-zinc-500">
              {todayData.existingWorkout?.exercises?.length ?? 0} exercises logged
            </Text>
          </View>
        ) : (
          <Pressable
            className="rounded-xl bg-primary py-4"
            onPress={() => router.push('/log?start=empty' as never)}
          >
            <Text className="text-center font-semibold text-white">Start workout</Text>
          </Pressable>
        )}

        <View>
          <Text className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Routines
          </Text>
          {routines.length === 0 ? (
            <Text className="text-sm text-zinc-500">
              No routines yet. Build one from the Log tab.
            </Text>
          ) : (
            routines.map((r) => (
              <Pressable
                key={r.id}
                className="mb-2 flex-row items-center justify-between rounded-xl bg-surface-alt px-4 py-3 dark:bg-surface-dark"
                onPress={() => router.push(`/log?routine=${r.id}` as never)}
              >
                <Text className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</Text>
                <Text className="text-xs text-zinc-500">{r.exercises?.length ?? 0} exercises</Text>
              </Pressable>
            ))
          )}
        </View>

        {tip ? <Text className="text-xs text-zinc-500">{tip}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
