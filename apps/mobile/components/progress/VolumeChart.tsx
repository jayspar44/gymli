import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card, CardHeader, Skeleton } from '../ui';
import { api } from '../../lib/api';

type VolumeWeek = {
  week: string;
  totalVolume: number;
  workoutCount: number;
  volumeK?: number;
  label?: string;
};

export function VolumeChart({ weeks = 8 }: { weeks?: number }) {
  const [data, setData] = useState<VolumeWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [weeks]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.getVolumeStats('week') as { data?: VolumeWeek[] };
      const all = (result.data || []).map((d) => ({
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

  const barData = data.map((d) => ({ value: d.volumeK ?? 0, label: d.label }));

  return (
    <Card padding="none">
      <CardHeader className="px-4 pt-3 pb-3">
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Weekly Volume
        </Text>
      </CardHeader>

      <View className="px-2 py-4">
        {loading ? (
          <View className="px-2">
            <Skeleton variant="chart" />
          </View>
        ) : data.length === 0 ? (
          <View className="h-40 items-center justify-center">
            <Text className="text-base text-zinc-500">No volume data yet</Text>
          </View>
        ) : (
          <BarChart
            data={barData}
            frontColor="#d4872a"
            barWidth={18}
            spacing={14}
            hideRules={false}
            rulesColor="#e5e7eb"
            rulesType="dashed"
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#e5e7eb"
            xAxisLabelTextStyle={{ color: '#71717a', fontSize: 10 }}
            yAxisTextStyle={{ color: '#71717a', fontSize: 10 }}
            noOfSections={4}
            roundedTop
            height={160}
          />
        )}
      </View>
    </Card>
  );
}

export default VolumeChart;
