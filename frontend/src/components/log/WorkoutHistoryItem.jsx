import { useState } from 'react';
import { Clock, Dumbbell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

function formatVolume(vol) {
  if (!vol || vol <= 0) return null;
  return vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : `${vol}`;
}

export default function WorkoutHistoryItem({ workout }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(workout.date);
  const exerciseCount = workout.exercises?.length || 0;
  const hasPRs = workout.prs?.length > 0;
  const prCount = workout.prs?.length || 0;
  const volume = formatVolume(workout.totalVolume);

  return (
    <Card padding="none" interactive className="overflow-hidden">
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
            {hasPRs && (
              <Badge variant="success">
                {prCount > 1 ? `${prCount} PRs` : 'PR'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {workout.duration && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Clock className="w-3 h-3" /> {workout.duration}m
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <Dumbbell className="w-3 h-3" /> {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            </span>
            {volume && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {volume} vol
              </span>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-[var(--color-border)]">
              {/* Exercises */}
              {workout.exercises?.map((ex, i) => (
                <div key={i} className="py-2 border-b border-[var(--color-border)] last:border-0">
                  <p className="text-sm font-medium text-[var(--color-text)] mb-1">{ex.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {ex.sets?.map((set, j) => {
                      const part = set.weight > 0
                        ? `${set.weight}${ex.unit || ''} \u00d7 ${set.reps}`
                        : `${set.reps} reps`;
                      return j === 0 ? part : `, ${part}`;
                    }).join('')}
                  </p>
                </div>
              ))}

              {/* PRs */}
              {hasPRs && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--color-success-muted)]">
                  <p className="text-xs font-semibold text-[var(--color-success)] mb-0.5">Personal Records</p>
                  {workout.prs.map((pr, i) => (
                    <p key={i} className="text-xs text-[var(--color-text)]">
                      {pr.name}: {pr.weight}
                    </p>
                  ))}
                </div>
              )}

              {/* Summary */}
              {workout.gymliSummary && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)] italic">
                  &ldquo;{workout.gymliSummary}&rdquo;
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
