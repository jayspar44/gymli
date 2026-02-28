import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { getInsights } from '../../api/services';

export default function GymliInsights() {
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
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" className="w-7 h-7" />
            <Skeleton variant="heading" className="w-24" />
          </div>
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
      </Card>
    );
  }

  if (insights.length === 0) return null;

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">
            AI Insights
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
          <p key={i} className="text-sm text-[var(--color-text)] leading-relaxed">
            {insight}
          </p>
        ))}
      </div>
    </Card>
  );
}
