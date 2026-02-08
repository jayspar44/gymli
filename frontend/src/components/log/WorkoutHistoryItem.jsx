import { useState } from 'react';
import { Clock, Dumbbell, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkoutHistoryItem({ workout }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(workout.date);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const exerciseCount = workout.exercises?.length || 0;
  const totalSets = workout.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0;
  const hasPRs = workout.prs?.length > 0;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center w-10 flex-shrink-0">
          <span className="text-[10px] uppercase text-[var(--color-text-secondary)]">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
          <span className="text-lg font-semibold text-[var(--color-text)] leading-tight">
            {date.getDate()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-text)] truncate">
              {workout.dayName || `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
            </p>
            {hasPRs && <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {workout.duration && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Clock className="w-3 h-3" /> {workout.duration}m
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <Dumbbell className="w-3 h-3" /> {totalSets} sets
            </span>
            {workout.totalVolume > 0 && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {(workout.totalVolume / 1000).toFixed(1)}k vol
              </span>
            )}
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-[var(--color-border)]">
          {/* Exercises */}
          {workout.exercises?.map((ex, i) => (
            <div key={i} className="py-2 border-b border-[var(--color-border)] last:border-0">
              <p className="text-sm font-medium text-[var(--color-text)] mb-1">{ex.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {ex.sets?.map((set, j) => (
                  <span key={j} className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {set.weight > 0 ? `${set.weight}×${set.reps}` : `${set.reps} reps`}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* PRs */}
          {hasPRs && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10">
              <p className="text-xs font-semibold text-amber-500 mb-0.5">PRs</p>
              {workout.prs.map((pr, i) => (
                <p key={i} className="text-xs text-[var(--color-text)]">
                  {pr.name}: {pr.weight}
                </p>
              ))}
            </div>
          )}

          {/* Gimli summary */}
          {workout.gimliSummary && (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)] italic">
              &ldquo;{workout.gimliSummary}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
