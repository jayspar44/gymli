import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExerciseSelector from './ExerciseSelector';
import { getExerciseProgress } from '../../api/services';

export default function ExerciseChart() {
  const [exerciseId, setExerciseId] = useState(null);
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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
          Exercise Progress
        </h3>
        <ExerciseSelector selected={exerciseId} onSelect={setExerciseId} />
      </div>

      <div className="px-2 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length < 2 ? (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-secondary)]">
            {data.length === 0 ? 'No data yet' : 'Need more sessions to chart'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
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
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-primary)' }}
                activeDot={{ r: 5, fill: 'var(--color-primary)' }}
                name="Max Weight"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
