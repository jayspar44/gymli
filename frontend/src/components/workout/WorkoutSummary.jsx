import { useEffect, useState } from 'react';
import { Clock, Dumbbell, Flame } from 'lucide-react';
import Stat from '../ui/Stat';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { notifySuccess } from '../../utils/haptics';

export default function WorkoutSummary({ result, onClose, onSaveAsRoutine }) {
  const [savedRoutine, setSavedRoutine] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  useEffect(() => {
    notifySuccess();
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

  const totalSets = result.exercises?.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-1">
            Workout Complete
          </h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <Stat
            value={result.duration || '—'}
            label="Minutes"
            icon={Clock}
          />
          <Stat
            value={result.totalVolume ? `${(result.totalVolume / 1000).toFixed(1)}k` : '—'}
            label="Volume"
            icon={Dumbbell}
          />
          <Stat
            value={totalSets}
            label="Sets"
            icon={Flame}
          />
        </div>

        {/* PRs */}
        {result.prs?.length > 0 && (
          <div className="mx-6 mb-4 space-y-1.5">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Personal Records</p>
            {result.prs.map((pr, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="success">PR</Badge>
                <span className="text-sm text-[var(--color-text)]">
                  {pr.name}: {pr.score} (+{pr.score - pr.previousBest})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* AI summary */}
        {result.gymliSummary && (
          <div className="mx-6 mb-4 px-3 py-2.5 rounded-xl bg-[var(--color-surface-alt)]">
            <p className="text-sm text-[var(--color-text)] leading-relaxed">
              {result.gymliSummary}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          {onSaveAsRoutine && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleSaveAsRoutine}
              disabled={savedRoutine || savingRoutine}
            >
              {savedRoutine ? 'Saved as routine ✓' : savingRoutine ? 'Saving…' : 'Save as routine'}
            </Button>
          )}
          <Button variant="primary" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
