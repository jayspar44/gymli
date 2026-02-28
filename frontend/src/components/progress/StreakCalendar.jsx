import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { getStreakData } from '../../api/services';

export default function StreakCalendar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await getStreakData();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="h-24 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Build 13-week (91 day) calendar grid
  const today = new Date();
  const days = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = data.calendar?.find(c => c.date === dateStr);
    days.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      volume: dayData?.volume || 0,
      count: dayData?.count || 0,
    });
  }

  // Group by week (columns)
  const weeks = [];
  let currentWeek = [];
  // Pad the first week
  if (days.length > 0) {
    const firstDay = days[0].dayOfWeek;
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
  }
  days.forEach(day => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const maxVolume = Math.max(...days.map(d => d.volume), 1);

  function getIntensity(volume) {
    if (volume === 0) return 0;
    const ratio = volume / maxVolume;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  }

  const intensityColors = [
    'bg-[var(--color-surface-alt)]',
    'bg-[var(--color-primary)]/25',
    'bg-[var(--color-primary)]/45',
    'bg-[var(--color-primary)]/70',
    'bg-[var(--color-primary)]',
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Streak stats */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Flame className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          <div>
            <span className="text-lg font-semibold text-[var(--color-text)]">{data.currentStreak}</span>
            <span className="text-xs text-[var(--color-text-secondary)] ml-1.5">day streak</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--color-text)]">{data.longestStreak}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Best</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--color-text)]">{data.totalWorkouts}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Total</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-[3px] min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-3 h-3" />;
                const intensity = getIntensity(day.volume);
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-[2px] ${intensityColors[intensity]} transition-colors`}
                    title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
