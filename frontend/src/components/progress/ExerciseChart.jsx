import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { getExerciseProgress } from '../../api/services';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md">
      <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-text)]">
        {payload[0].value} lbs
      </p>
    </div>
  );
}

export default function ExerciseChart({ exerciseId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseId) loadProgress(exerciseId);
  }, [exerciseId]);

  async function loadProgress(id) {
    setLoading(true);
    try {
      const result = await getExerciseProgress(id);
      setData((result.progress || []).map(p => ({
        ...p,
        label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })));
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
          Weight Progression
        </h3>
      </div>

      <div className="px-2 py-4">
        {loading ? (
          <div className="px-2">
            <Skeleton variant="chart" />
          </div>
        ) : data.length < 2 ? (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-secondary)]">
            {data.length === 0 ? 'Select an exercise to see progress' : 'Need more sessions to chart'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="maxWeight"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#chartGradient)"
                dot={{ r: 3, fill: 'var(--color-primary)' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface)', fill: 'var(--color-primary)' }}
                name="Max Weight"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
