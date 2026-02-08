import { Trophy, Clock, Dumbbell, Flame } from 'lucide-react';

export default function WorkoutSummary({ result, onClose }) {
  if (!result) return null;

  const totalSets = result.exercises?.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center bg-gradient-to-b from-[var(--color-primary)]/.08 to-transparent">
          <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#d4872a] to-[#96501d]">
            <Trophy className="w-7 h-7 text-[#fdf8f0]" strokeWidth={1.5} />
          </div>
          <h3
            className="text-xl tracking-wider font-semibold text-[var(--color-text)] mb-1"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Workout Complete!
          </h3>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-lg bg-[var(--color-surface-alt)]">
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">{result.duration || '—'}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Minutes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-lg bg-[var(--color-surface-alt)]">
              <Dumbbell className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">
              {result.totalVolume ? `${(result.totalVolume / 1000).toFixed(1)}k` : '—'}
            </p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Volume</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-lg bg-[var(--color-surface-alt)]">
              <Flame className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">{totalSets}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Sets</p>
          </div>
        </div>

        {/* PRs */}
        {result.prs?.length > 0 && (
          <div className="mx-6 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/.1 border border-amber-500/.2">
            <p className="text-xs font-semibold text-amber-500 mb-1">Personal Records!</p>
            {result.prs.map((pr, i) => (
              <p key={i} className="text-xs text-[var(--color-text)]">
                {pr.name}: {pr.weight} (+{pr.weight - pr.previousBest} from previous best)
              </p>
            ))}
          </div>
        )}

        {/* Gimli summary */}
        {result.gimliSummary && (
          <div className="mx-6 mb-4 px-3 py-2.5 rounded-xl bg-[var(--color-surface-alt)]">
            <p className="text-sm text-[var(--color-text)] italic leading-relaxed">
              &ldquo;{result.gimliSummary}&rdquo;
            </p>
            <p className="text-xs text-[var(--color-primary)] mt-1 font-medium">— Gimli</p>
          </div>
        )}

        {/* Close button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
