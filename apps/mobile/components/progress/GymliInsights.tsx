import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { Card, CardHeader, Skeleton } from '../ui';
import { api } from '../../lib/api';

export function GymliInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);
    try {
      const data = await api.getInsights() as { insights?: string[] };
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
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Skeleton variant="circle" className="w-7 h-7" />
            <Skeleton variant="heading" className="w-24" />
          </View>
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-3/4" />
        </View>
      </Card>
    );
  }

  if (insights.length === 0) return null;

  return (
    <Card padding="none">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <View className="flex-row items-center gap-2">
          <Sparkles size={18} color="#d4872a" />
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            AI Insights
          </Text>
        </View>
        <Pressable
          onPress={loadInsights}
          disabled={loading}
          className={`min-h-10 min-w-10 items-center justify-center ${loading ? 'opacity-40' : ''}`}
        >
          <RefreshCw size={16} color="#71717a" />
        </Pressable>
      </View>
      <View className="px-4 py-3 gap-2">
        {insights.map((insight, i) => (
          <Text key={i} className="text-base text-zinc-900 dark:text-zinc-50 leading-relaxed">
            {insight}
          </Text>
        ))}
      </View>
    </Card>
  );
}

export default GymliInsights;
