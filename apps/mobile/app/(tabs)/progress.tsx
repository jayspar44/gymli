import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell } from 'lucide-react-native';
import { SegmentedControl, Card, Stat, Chip, Skeleton } from '../../components/ui';
import { StreakCalendar } from '../../components/progress/StreakCalendar';
import { GymliInsights } from '../../components/progress/GymliInsights';
import { ExerciseChart } from '../../components/progress/ExerciseChart';
import { VolumeChart } from '../../components/progress/VolumeChart';
import { PRBoard } from '../../components/progress/PRBoard';
import { api } from '../../lib/api';

/* ---------- helpers ---------- */

function formatVolume(v: number): string {
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v));
}

/* ---------- Overview Tab ---------- */

type WeekStats = {
  workouts: number;
  volume: number;
  pctChange: number | null;
};

function OverviewTab() {
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadWeekStats();
  }, []);

  async function loadWeekStats() {
    setLoadingStats(true);
    try {
      const result = await api.getVolumeStats('week') as {
        data?: Array<{ totalVolume: number; workoutCount: number; week: string }>;
      };
      const rows = result.data || [];
      if (rows.length >= 1) {
        const thisWeek = rows[rows.length - 1];
        const lastWeek = rows.length >= 2 ? rows[rows.length - 2] : null;
        const thisVol = thisWeek.totalVolume || 0;
        const lastVol = lastWeek?.totalVolume || 0;
        const pctChange =
          lastVol > 0
            ? Math.round(((thisVol - lastVol) / lastVol) * 100)
            : null;
        setWeekStats({
          workouts: thisWeek.workoutCount || 0,
          volume: thisVol,
          pctChange,
        });
      } else {
        setWeekStats(null);
      }
    } catch {
      setWeekStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  return (
    <View className="gap-4">
      <StreakCalendar />

      {/* This Week Summary */}
      {loadingStats ? (
        <Card>
          <View className="flex-row gap-4">
            <View className="flex-1"><Skeleton variant="text" /></View>
            <View className="flex-1"><Skeleton variant="text" /></View>
            <View className="flex-1"><Skeleton variant="text" /></View>
          </View>
        </Card>
      ) : weekStats ? (
        <Card>
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            This Week
          </Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Stat value={weekStats.workouts} label="Workouts" icon={Dumbbell} />
            </View>
            <View className="flex-1">
              <Stat value={formatVolume(weekStats.volume)} label="Volume (lbs)" />
            </View>
            {weekStats.pctChange !== null && (
              <View className="flex-1">
                <Stat
                  value={`${weekStats.pctChange > 0 ? '+' : ''}${weekStats.pctChange}%`}
                  label="vs Last Week"
                  trend={
                    weekStats.pctChange > 0
                      ? 'up'
                      : weekStats.pctChange < 0
                      ? 'down'
                      : 'flat'
                  }
                />
              </View>
            )}
          </View>
        </Card>
      ) : null}

      <GymliInsights />
    </View>
  );
}

/* ---------- Strength Tab ---------- */

type PRItem = {
  name: string;
  bestScore: number;
  bestDate: string;
  kind: string;
  isRecent: boolean;
};

type ExerciseItem = {
  id: string;
  name: string;
  kind?: string;
};

function StrengthTab() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prData, setPrData] = useState<PRItem[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingPRs, setLoadingPRs] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const buildPRs = useCallback(async (list: ExerciseItem[]) => {
    if (list.length === 0) return;
    setLoadingPRs(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const prs = await Promise.all(
        list.map(async (ex) => {
          try {
            const result = await api.getExerciseProgress(ex.id) as {
              progress?: Array<{ maxWeight: number; date: string; kind?: string }>;
            };
            const progress = result.progress || [];
            if (progress.length === 0) return null;

            let best = progress[0];
            for (const p of progress) {
              if (p.maxWeight > best.maxWeight) best = p;
            }

            return {
              name: ex.name,
              bestScore: best.maxWeight,
              bestDate: best.date,
              kind: ex.kind || best.kind || 'weighted',
              isRecent: new Date(best.date) >= thirtyDaysAgo,
            };
          } catch {
            return null;
          }
        })
      );

      setPrData(
        (prs.filter(Boolean) as PRItem[]).sort((a, b) => b.bestScore - a.bestScore)
      );
    } catch {
      setPrData([]);
    } finally {
      setLoadingPRs(false);
    }
  }, []);

  async function loadExercises() {
    setLoadingExercises(true);
    try {
      const data = await api.getLoggedExercises() as { exercises?: ExerciseItem[] };
      const list = data.exercises || [];
      setExercises(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
      }
      buildPRs(list);
    } catch {
      setExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  }

  return (
    <View className="gap-4">
      {/* Exercise selector chips */}
      {loadingExercises ? (
        <View className="flex-row gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="text" className="w-24 h-8 rounded-full" />
          ))}
        </View>
      ) : exercises.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 px-4"
          contentContainerClassName="flex-row gap-2 pb-1"
        >
          {exercises.map((ex) => (
            <Chip
              key={ex.id}
              selected={ex.id === selectedId}
              onPress={() => setSelectedId(ex.id)}
            >
              {ex.name}
            </Chip>
          ))}
        </ScrollView>
      ) : (
        <View className="py-4 items-center">
          <Text className="text-sm text-zinc-500">No logged exercises yet</Text>
        </View>
      )}

      {/* Exercise chart */}
      <ExerciseChart exerciseId={selectedId} />

      {/* PR Board */}
      {loadingPRs ? (
        <Card>
          <View className="gap-3">
            <Skeleton variant="heading" className="w-32" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-3/4" />
          </View>
        </Card>
      ) : (
        <PRBoard exercises={prData} />
      )}
    </View>
  );
}

/* ---------- Volume Tab ---------- */

function VolumeTab() {
  const [period, setPeriod] = useState('8W');
  const weeks = period === '8W' ? 8 : 12;

  return (
    <View className="gap-4">
      <SegmentedControl
        options={[
          { value: '8W', label: '8W' },
          { value: '12W', label: '12W' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      <VolumeChart weeks={weeks} />
    </View>
  );
}

/* ---------- Main Progress Screen ---------- */

type Tab = 'overview' | 'strength' | 'volume';

export default function ProgressScreen() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
            Progress
          </Text>
          <SegmentedControl
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'strength', label: 'Strength' },
              { value: 'volume', label: 'Volume' },
            ]}
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            className="w-full"
          />
        </View>

        <View className="px-4 pt-4">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'strength' && <StrengthTab />}
          {tab === 'volume' && <VolumeTab />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
