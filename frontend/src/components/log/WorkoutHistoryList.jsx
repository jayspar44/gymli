import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import { getWorkouts } from '../../api/services';

export default function WorkoutHistoryList({ refreshKey }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, [refreshKey]);

  async function loadWorkouts(append = false) {
    setLoading(true);
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
    }
  }

  if (loading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ScrollText className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
        <p className="text-sm text-[var(--color-text-secondary)]">No workouts logged yet</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Start forging your legacy!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout, i) => (
        <WorkoutHistoryItem key={workout.id || i} workout={workout} />
      ))}

      {hasMore && (
        <button
          onClick={() => loadWorkouts(true)}
          disabled={loading}
          className="w-full py-3 text-sm text-[var(--color-primary)] font-medium disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
