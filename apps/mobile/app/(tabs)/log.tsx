/**
 * Log screen — port of frontend/src/pages/Log.jsx.
 *
 * Routine list + start flow + workout history.
 * Navigation to /session for active workouts (route built in Task 5).
 * Routine editor overlay (full implementation in Task 6; stub used here).
 *
 * Query-param auto-start (?start=empty, ?routine=<id>) is handled via
 * useLocalSearchParams from expo-router (same pattern as web useSearchParams).
 */
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Play, Pencil, Trash2, Dumbbell } from 'lucide-react-native';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { WorkoutHistoryList } from '../../components/log/WorkoutHistoryList';
import { RoutineEditor } from '../../components/routine/RoutineEditor';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { TestIds, routineRowId } from '../../lib/test-ids';

type RoutineExercise = {
  exerciseId: string;
  name: string;
  kind?: string;
  targetSets?: number;
  targetReps?: number;
};

type Routine = {
  id: string;
  name: string;
  exercises?: RoutineExercise[];
};

export default function LogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ routine?: string; start?: string }>();
  const { profile } = useUserProfile();

  const [refreshKey, setRefreshKey] = useState(0);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  // null | 'new' | Routine object
  const [editing, setEditing] = useState<null | 'new' | Routine>(null);

  const units = (profile as any)?.units ?? 'lbs';

  async function refresh() {
    try {
      const data = await api.getRoutines();
      setRoutines(Array.isArray(data) ? (data as Routine[]) : ((data as any).routines ?? []));
    } catch {
      setRoutines([]);
    } finally {
      setLoadingRoutines(false);
    }
  }

  // Load routines on mount; handle ?start=empty
  useEffect(() => {
    refresh();

    if (params.start === 'empty') {
      router.push('/session?start=empty' as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once routines load, handle ?routine=<id>
  useEffect(() => {
    if (!params.routine || routines.length === 0) return;
    const found = routines.find((r) => r.id === params.routine);
    if (found) {
      router.push(`/session?routine=${found.id}` as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines]);

  function startRoutine(routine: Routine) {
    router.push(`/session?routine=${routine.id}` as never);
  }

  function startEmpty() {
    router.push('/session?start=empty' as never);
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteRoutine(id);
      refresh();
    } catch {
      // ignore
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-4 py-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Workout Log
          </Text>
          <Button variant="primary" size="sm" onPress={startEmpty}>
            <Plus size={16} color="#fff" />
            Log Workout
          </Button>
        </View>

        {/* Routines section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Routines
            </Text>
            <Button testID={TestIds.NEW_ROUTINE_BTN} variant="secondary" size="sm" onPress={() => setEditing('new')}>
              <Plus size={16} color="#71717a" />
              New routine
            </Button>
          </View>

          {loadingRoutines ? (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          ) : routines.length === 0 ? (
            <View className="flex-col items-center justify-center py-8 rounded-xl bg-surface-alt dark:bg-surface-dark">
              <Dumbbell size={32} color="#71717a" strokeWidth={1.5} />
              <Text className="text-base text-zinc-500 mt-2">No routines yet</Text>
              <Pressable onPress={() => setEditing('new')} className="mt-2 min-h-10 items-center justify-center px-2">
                <Text className="text-base font-medium text-primary">
                  Create your first routine
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2">
              {routines.map((routine) => (
                <View
                  key={routine.id}
                  testID={routineRowId(routine.name)}
                  className="flex-row items-center justify-between rounded-xl bg-surface-alt dark:bg-surface-dark px-4 py-3"
                >
                  <View className="flex-1 min-w-0 mr-3">
                    <Text
                      className="text-base font-medium text-zinc-900 dark:text-zinc-50"
                      numberOfLines={1}
                    >
                      {routine.name}
                    </Text>
                    <Text className="text-sm text-zinc-500">
                      {routine.exercises?.length ?? 0} exercise
                      {routine.exercises?.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Pressable
                      onPress={() => startRoutine(routine)}
                      className="min-h-12 min-w-12 items-center justify-center rounded-lg"
                      accessibilityLabel="Start routine"
                    >
                      <Play size={18} color="#d4872a" />
                    </Pressable>
                    <Pressable
                      onPress={() => setEditing(routine)}
                      className="min-h-12 min-w-12 items-center justify-center rounded-lg"
                      accessibilityLabel="Edit routine"
                    >
                      <Pencil size={18} color="#71717a" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(routine.id)}
                      className="min-h-12 min-w-12 items-center justify-center rounded-lg"
                      accessibilityLabel="Delete routine"
                    >
                      <Trash2 size={18} color="#71717a" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Workout history */}
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          History
        </Text>
        <WorkoutHistoryList refreshKey={refreshKey} />
      </ScrollView>

      {/* Routine editor overlay */}
      {editing !== null && (
        <RoutineEditor
          routine={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((k) => k + 1);
            refresh();
          }}
        />
      )}
    </SafeAreaView>
  );
}
