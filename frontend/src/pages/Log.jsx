import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Play, Pencil, Trash2, Dumbbell } from 'lucide-react';
import { useUserProfile } from '../contexts/UserProfileContext';
import ManualLogForm from '../components/log/ManualLogForm';
import WorkoutHistoryList from '../components/log/WorkoutHistoryList';
import WorkoutSession from '../components/workout/WorkoutSession';
import RoutineEditor from '../components/routine/RoutineEditor';
import Button from '../components/ui/Button';
import { getRoutines, deleteRoutine } from '../api/services';

export default function Log() {
  const { profile } = useUserProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [routines, setRoutines] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | routineObject
  const [sessionDay, setSessionDay] = useState(null); // null | { name, exercises }

  const units = profile?.units || 'lbs';

  async function refresh() {
    try {
      const data = await getRoutines();
      setRoutines(Array.isArray(data) ? data : (data.routines || []));
    } catch {
      setRoutines([]);
    }
  }

  // Load routines on mount + handle query-param auto-start
  useEffect(() => {
    refresh();

    const routineId = searchParams.get('routine');
    const startEmpty = searchParams.get('start') === 'empty';

    if (startEmpty) {
      setSessionDay({ name: 'Workout', exercises: [] });
      setSearchParams({}, { replace: true });
    } else if (routineId) {
      // We need to wait for routines to load; handled in a separate effect below
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once routines are loaded, check for ?routine=<id> query param
  useEffect(() => {
    const routineId = searchParams.get('routine');
    if (routineId && routines.length > 0) {
      const found = routines.find(r => r.id === routineId);
      if (found) {
        startRoutine(found);
        setSearchParams({}, { replace: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines]);

  function startRoutine(routine) {
    setSessionDay({
      name: routine.name,
      exercises: routine.exercises.map(e => ({
        exerciseId: e.exerciseId,
        name: e.name,
        kind: e.kind || 'weighted',
        sets: e.targetSets,
        reps: e.targetReps,
      })),
    });
  }

  function startEmpty() {
    setSessionDay({ name: 'Workout', exercises: [] });
  }

  async function handleDelete(id) {
    try {
      await deleteRoutine(id);
      refresh();
    } catch {
      // ignore
    }
  }

  function handleSaved() {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  }

  // Workout session open — takes priority over everything
  if (sessionDay) {
    return (
      <WorkoutSession
        day={sessionDay}
        units={units}
        onClose={() => setSessionDay(null)}
      />
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Workout Log</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" />
          Log Workout
        </Button>
      </div>

      {/* Routines section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            Routines
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={startEmpty}>
              <Play className="w-3.5 h-3.5" />
              Empty session
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing('new')}>
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
        </div>

        {routines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl bg-[var(--color-surface-alt)]">
            <Dumbbell className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
            <p className="text-sm text-[var(--color-text-secondary)]">No routines yet</p>
            <button
              onClick={() => setEditing('new')}
              className="mt-2 text-sm font-medium text-[var(--color-primary)]"
            >
              Create your first routine
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map(routine => (
              <div
                key={routine.id}
                className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{routine.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {routine.exercises?.length ?? 0} exercise{routine.exercises?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startRoutine(routine)}
                    className="p-2 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]"
                    aria-label="Start routine"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditing(routine)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    aria-label="Edit routine"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(routine.id)}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    aria-label="Delete routine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <WorkoutHistoryList refreshKey={refreshKey} />

      {/* Manual log form overlay */}
      {showForm && (
        <ManualLogForm
          units={units}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Routine editor overlay */}
      {editing && (
        <RoutineEditor
          routine={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}
