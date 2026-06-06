import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import { getWorkouts } from '../../api/services';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';

export default function WorkoutHistoryList({ refreshKey }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, [refreshKey]);

  async function loadWorkouts(append = false) {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = { limit: 20 };
      if (append && workouts.length > 0) {
        params.startAfterDate = workouts[workouts.length - 1].date;
      }
      const data = await getWorkouts(params);
      const items = data.workouts || data || [];
      if (append) {
        setWorkouts(prev => [...prev, ...items]);
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

  if (loading && workouts.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ScrollText className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
        <p className="text-sm text-[var(--color-text-secondary)]">No workouts logged yet</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Log your first workout to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout, i) => (
        <WorkoutHistoryItem key={workout.id || i} workout={workout} />
      ))}

      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          loading={loadingMore}
          onClick={() => loadWorkouts(true)}
        >
          Load More
        </Button>
      )}
    </div>
  );
}
