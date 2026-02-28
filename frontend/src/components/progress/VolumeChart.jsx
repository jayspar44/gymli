import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVolumeStats } from '../../api/services';

export default function VolumeChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getVolumeStats('week');
      setData((result.data || []).map(d => ({
        ...d,
        label: new Date(d.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volumeK: Math.round(d.totalVolume / 100) / 10,
      })));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Weekly Volume
        </h3>
      </div>

      <div className="px-2 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-secondary)]">
            No volume data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={v => `${v}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}k lbs`, 'Volume']}
              />
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
    </div>
  );
}
