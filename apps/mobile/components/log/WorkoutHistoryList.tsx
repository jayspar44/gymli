/**
 * WorkoutHistoryList — paginated list of logged workouts using FlashList v2.
 * Ports frontend/src/components/log/WorkoutHistoryList.jsx.
 * Uses @shopify/flash-list (v2 — no estimatedItemSize required).
 */
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ScrollText } from 'lucide-react-native';
import { WorkoutHistoryItem } from './WorkoutHistoryItem';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

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

type WorkoutsResponse = {
  workouts?: Workout[];
} | Workout[];

export function WorkoutHistoryList({ refreshKey }: { refreshKey: number }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function loadWorkouts(append = false) {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params: Record<string, any> = { limit: 20 };
      if (append && workouts.length > 0) {
        params.startAfterDate = workouts[workouts.length - 1].date;
      }
      const data = (await api.getWorkouts(params)) as WorkoutsResponse;
      const items: Workout[] = Array.isArray(data)
        ? data
        : (data as { workouts?: Workout[] }).workouts ?? [];
      if (append) {
        setWorkouts((prev) => [...prev, ...items]);
      } else {
        setWorkouts(items);
      }
      setHasMore(items.length === 20);
    } catch {
      if (!append) setWorkouts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Loading skeleton
  if (loading && workouts.length === 0) {
    return (
      <View className="gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
      </View>
    );
  }

  // Empty state
  if (!loading && workouts.length === 0) {
    return (
      <View className="flex-col items-center justify-center py-12">
        <ScrollText size={32} color="#71717a" strokeWidth={1.5} />
        <Text className="text-sm text-zinc-500 mt-2">No workouts logged yet</Text>
        <Text className="text-xs text-zinc-500 mt-1">
          Log your first workout to get started.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* scrollEnabled={false}: this list lives inside log.tsx's outer ScrollView,
          so the outer scroll handles all scrolling. Without this, FlashList has no
          measured height in a ScrollView content container on web (flex-1 = 0 in
          unconstrained-height context) and renders invisibly. On native this is the
          recommended pattern for FlashList nested inside a ScrollView. */}
      <FlashList
        data={workouts}
        scrollEnabled={false}
        keyExtractor={(item, index) => item.id ?? `${index}`}
        renderItem={({ item }) => (
          <View className="mb-3">
            <WorkoutHistoryItem workout={item} />
          </View>
        )}
        ListFooterComponent={
          hasMore ? (
            <Button
              variant="secondary"
              fullWidth
              loading={loadingMore}
              onPress={() => loadWorkouts(true)}
            >
              Load More
            </Button>
          ) : null
        }
      />
    </View>
  );
}

export default WorkoutHistoryList;
