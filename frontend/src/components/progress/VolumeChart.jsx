import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { getVolumeStats } from '../../api/services';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md">
      <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-text)]">
        {payload[0].value}k lbs
      </p>
    </div>
  );
}

export default function VolumeChart({ weeks = 8 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [weeks]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getVolumeStats('week');
      const all = (result.data || []).map(d => ({
        ...d,
        label: new Date(d.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volumeK: Math.round(d.totalVolume / 100) / 10,
      }));
      setData(all.slice(-weeks));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          Weekly Volume
        </h3>
      </div>

      <div className="px-2 py-4">
        {loading ? (
          <div className="px-2">
            <Skeleton variant="chart" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-secondary)]">
            No volume data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={v => `${v}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="volumeK"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                name="Volume"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
