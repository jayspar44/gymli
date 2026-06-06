import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function RestTimer({ duration = 90, onDismiss }) {
  const [remaining, setRemaining] = useState(duration);
  const [active, setActive] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!active || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, remaining]);

  // Auto-dismiss when timer reaches 0
  useEffect(() => {
    if (remaining === 0 && !active) {
      const timeout = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [remaining, active, onDismiss]);

  const adjustTime = useCallback((amount) => {
    setRemaining(r => Math.max(0, r + amount));
    if (!active && amount > 0) setActive(true);
  }, [active]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / duration;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-2" style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 0.5rem)' }}>
      <div className="relative max-w-lg mx-auto rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg shadow-black/10 overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Compact bar — tap to expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-4 py-2.5 pt-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-semibold text-[var(--color-text)] tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {remaining === 0 ? 'Time to lift!' : 'Rest'}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </button>

        {/* Expanded controls */}
        {expanded && (
          <div className="flex items-center justify-center gap-4 px-4 pb-3">
            <button
              onClick={() => adjustTime(-15)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <Minus className="w-3 h-3" /> 15s
            </button>
            <button
              onClick={() => adjustTime(15)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <Plus className="w-3 h-3" /> 15s
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
