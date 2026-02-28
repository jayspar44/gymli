import { useState, useEffect, useCallback } from 'react';
import SegmentedControl from '../components/ui/SegmentedControl';
import Card from '../components/ui/Card';
import Stat from '../components/ui/Stat';
import Chip from '../components/ui/Chip';
import Skeleton from '../components/ui/Skeleton';
import GymliInsights from '../components/progress/GymliInsights';
import StreakCalendar from '../components/progress/StreakCalendar';
import ExerciseChart from '../components/progress/ExerciseChart';
import VolumeChart from '../components/progress/VolumeChart';
import PRBoard from '../components/progress/PRBoard';
import { getLoggedExercises, getExerciseProgress, getVolumeStats } from '../api/services';
import { Dumbbell } from 'lucide-react';

/* ---------- helpers ---------- */

function formatVolume(v) {
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v));
}

/* ---------- Overview Tab ---------- */

function OverviewTab() {
  const [weekStats, setWeekStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadWeekStats();
  }, []);

  async function loadWeekStats() {
    setLoadingStats(true);
    try {
      const result = await getVolumeStats('week');
      const rows = result.data || [];
      if (rows.length >= 1) {
        const thisWeek = rows[rows.length - 1];
        const lastWeek = rows.length >= 2 ? rows[rows.length - 2] : null;
        const thisVol = thisWeek.totalVolume || 0;
        const lastVol = lastWeek?.totalVolume || 0;
        const pctChange = lastVol > 0
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
    <div className="space-y-4">
      <StreakCalendar />

      {/* This Week Summary */}
      {loadingStats ? (
        <Card>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        </Card>
      ) : weekStats ? (
        <Card>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">This Week</h3>
          <div className="grid grid-cols-3 gap-4">
            <Stat
              value={weekStats.workouts}
              label="Workouts"
              icon={Dumbbell}
            />
            <Stat
              value={formatVolume(weekStats.volume)}
              label="Volume (lbs)"
            />
            {weekStats.pctChange !== null && (
              <Stat
                value={`${weekStats.pctChange > 0 ? '+' : ''}${weekStats.pctChange}%`}
                label="vs Last Week"
                trend={weekStats.pctChange > 0 ? 'up' : weekStats.pctChange < 0 ? 'down' : 'flat'}
              />
            )}
          </div>
        </Card>
      ) : null}

      <GymliInsights />
    </div>
  );
}

/* ---------- Strength Tab ---------- */

function StrengthTab() {
  const [exercises, setExercises] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [prData, setPrData] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingPRs, setLoadingPRs] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const buildPRs = useCallback(async (list) => {
    if (list.length === 0) return;
    setLoadingPRs(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const prs = await Promise.all(
        list.map(async (ex) => {
          try {
            const result = await getExerciseProgress(ex.id);
            const progress = result.progress || [];
            if (progress.length === 0) return null;

            let best = progress[0];
            for (const p of progress) {
              if (p.maxWeight > best.maxWeight) best = p;
            }

            return {
              name: ex.name,
              bestWeight: best.maxWeight,
              bestDate: best.date,
              units: 'lbs',
              isRecent: new Date(best.date) >= thirtyDaysAgo,
            };
          } catch {
            return null;
          }
        })
      );

      setPrData(prs.filter(Boolean).sort((a, b) => b.bestWeight - a.bestWeight));
    } catch {
      setPrData([]);
    } finally {
      setLoadingPRs(false);
    }
  }, []);

  async function loadExercises() {
    setLoadingExercises(true);
    try {
      const data = await getLoggedExercises();
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
    <div className="space-y-4">
      {/* Exercise selector chips */}
      {loadingExercises ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="text" className="w-24 h-8 rounded-full flex-shrink-0" />
          ))}
        </div>
      ) : exercises.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {exercises.map(ex => (
            <Chip
              key={ex.id}
              selected={ex.id === selectedId}
              onPress={() => setSelectedId(ex.id)}
              className="flex-shrink-0"
            >
              {ex.name}
            </Chip>
          ))}
        </div>
      ) : (
        <div className="text-sm text-[var(--color-text-secondary)] text-center py-4">
          No logged exercises yet
        </div>
      )}

      {/* Exercise chart */}
      <ExerciseChart exerciseId={selectedId} />

      {/* PR Board */}
      {loadingPRs ? (
        <Card>
          <div className="space-y-3">
            <Skeleton variant="heading" className="w-32" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
        </Card>
      ) : (
        <PRBoard exercises={prData} />
      )}
    </div>
  );
}

/* ---------- Volume Tab ---------- */

function VolumeTab() {
  const [period, setPeriod] = useState('8W');
  const weeks = period === '8W' ? 8 : 12;

  return (
    <div className="space-y-4">
      <SegmentedControl
        options={[
          { value: '8W', label: '8W' },
          { value: '12W', label: '12W' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      <VolumeChart weeks={weeks} />
    </div>
  );
}

/* ---------- Main Progress Page ---------- */

export default function Progress() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-3">Progress</h1>
        <SegmentedControl
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'strength', label: 'Strength' },
            { value: 'volume', label: 'Volume' },
          ]}
          value={tab}
          onChange={setTab}
          className="w-full"
        />
      </div>

      <div className="px-4 pt-4">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'strength' && <StrengthTab />}
        {tab === 'volume' && <VolumeTab />}
      </div>
    </div>
  );
}
