import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Card, CardHeader, Skeleton } from '../ui';
import { api } from '../../lib/api';
type FullStreakData = {
  currentStreak?: number;
  longestStreak?: number;
  totalWorkouts?: number;
  calendar?: Array<{ date: string; count: number }>;
};

type CalendarDay = {
  date: string;
  dayOfWeek: number;
  count: number;
};

type WeekCol = (CalendarDay | null)[];

export function StreakCalendar() {
  const [data, setData] = useState<FullStreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await api.getStreakData();
      setData(result as FullStreakData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <View className="gap-3">
          <Skeleton variant="heading" />
          <Skeleton variant="chart" className="h-24" />
        </View>
      </Card>
    );
  }

  if (!data) return null;

  // Build 13-week (91 day) calendar grid
  const today = new Date();
  const days: CalendarDay[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = data.calendar?.find((c) => c.date === dateStr);
    days.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      count: dayData?.count || 0,
    });
  }

  // Group into columns (weeks)
  const weeks: WeekCol[] = [];
  let currentWeek: WeekCol = [];
  if (days.length > 0) {
    const firstDay = days[0].dayOfWeek;
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
  }
  days.forEach((day) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  function getCellColor(count: number): string {
    if (count === 0) return 'bg-surface-alt dark:bg-surface-dark';
    if (count === 1) return 'bg-amber-200 dark:bg-amber-900/40';
    if (count === 2) return 'bg-amber-400 dark:bg-amber-700';
    return 'bg-primary';
  }

  return (
    <Card padding="none">
      {/* Streak stats header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <View className="flex-row items-center gap-2">
          <Flame size={18} color="#d4872a" />
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {data.currentStreak}
            </Text>
            <Text className="text-xs text-zinc-500">day streak</Text>
          </View>
        </View>
        <View className="flex-row gap-4">
          <View className="items-end">
            <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {data.longestStreak}
            </Text>
            <Text className="text-[10px] text-zinc-500 uppercase">Best</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {data.totalWorkouts}
            </Text>
            <Text className="text-[10px] text-zinc-500 uppercase">Total</Text>
          </View>
        </View>
      </View>

      {/* Heatmap grid */}
      <View className="px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-[3px]">
            {weeks.map((week, wi) => (
              <View key={wi} className="flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, di) => {
                  const day = week[di];
                  if (!day) {
                    return <View key={di} className="w-3 h-3" />;
                  }
                  return (
                    <View
                      key={di}
                      className={`w-3 h-3 rounded-sm ${getCellColor(day.count)}`}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Card>
  );
}

export default StreakCalendar;
