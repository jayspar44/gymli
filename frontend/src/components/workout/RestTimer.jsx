import { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw } from 'lucide-react';

export default function RestTimer({ duration = 90, onDismiss }) {
  const [remaining, setRemaining] = useState(duration);
  const [active, setActive] = useState(true);

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

  const reset = useCallback(() => {
    setRemaining(duration);
    setActive(true);
  }, [duration]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / duration;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-2" style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 4.5rem)' }}>
      <div className="relative max-w-lg mx-auto rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg shadow-black/10 px-4 py-3">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl overflow-hidden bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-semibold text-[var(--color-text)]">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {remaining === 0 ? 'Time to lift!' : 'Rest'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
