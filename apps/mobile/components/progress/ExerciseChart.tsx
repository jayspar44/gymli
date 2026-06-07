import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Card, CardHeader, Skeleton } from '../ui';
import { api } from '../../lib/api';

type ProgressPoint = {
  date: string;
  maxWeight: number;
  label?: string;
};

export function ExerciseChart({ exerciseId }: { exerciseId: string | null }) {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      loadProgress(exerciseId);
    } else {
      setData([]);
    }
  }, [exerciseId]);

  async function loadProgress(id: string) {
    setLoading(true);
    try {
      const result = await api.getExerciseProgress(id) as { progress?: ProgressPoint[] };
      setData(
        (result.progress || []).map((p) => ({
          ...p,
          label: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }))
      );
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const chartData = data.map((d) => ({ value: d.maxWeight, label: d.label }));

  return (
    <Card padding="none">
      <CardHeader className="px-4 pt-3 pb-3">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Weight Progression
        </Text>
      </CardHeader>

      <View className="px-2 py-4">
        {loading ? (
          <View className="px-2">
            <Skeleton variant="chart" />
          </View>
        ) : data.length < 2 ? (
          <View className="h-40 items-center justify-center">
            <Text className="text-sm text-zinc-500">
              {data.length === 0
                ? 'Select an exercise to see progress'
                : 'Need more sessions to chart'}
            </Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            color="#d4872a"
            thickness={2}
            dataPointsColor="#d4872a"
            dataPointsRadius={3}
            startFillColor="#d4872a"
            startOpacity={0.3}
            endOpacity={0}
            areaChart
            hideRules={false}
            rulesColor="#e5e7eb"
            rulesType="dashed"
            xAxisLabelTextStyle={{ color: '#71717a', fontSize: 10 }}
            yAxisTextStyle={{ color: '#71717a', fontSize: 10 }}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#e5e7eb"
            noOfSections={4}
            height={160}
            curved
          />
        )}
      </View>
    </Card>
  );
}

export default ExerciseChart;
