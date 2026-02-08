import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getInsights } from '../../api/services';

export default function GimliInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);
    try {
      const data = await getInsights();
      setInsights(data.insights || []);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#fdf8f0]" style={{ fontFamily: "'Cinzel', serif" }}>G</span>
          </div>
          <div className="flex-1">
            <div className="h-3 w-3/4 rounded bg-[var(--color-surface-alt)] animate-pulse mb-2" />
            <div className="h-3 w-1/2 rounded bg-[var(--color-surface-alt)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#fdf8f0]" style={{ fontFamily: "'Cinzel', serif" }}>G</span>
          </div>
          <span className="text-xs font-semibold text-[var(--color-text)] tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
            Gimli&apos;s Wisdom
          </span>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-40 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm text-[var(--color-text)] leading-relaxed italic">
            &ldquo;{insight}&rdquo;
          </p>
        ))}
      </div>
    </div>
  );
}
