/**
 * session.tsx — active workout session screen.
 * Ports frontend/src/components/workout/WorkoutSession.jsx.
 *
 * Stack route (presented over tabs). Parameters via useLocalSearchParams:
 *   ?start=empty  → blank session
 *   ?routine=<id> → loads the routine's exercises
 *
 * Domain logic via @gymli/shared (applyAction, emptySet, fieldsForKind).
 * Data via api (getTodaysWorkout / getRoutine not in shared services, so we
 * load the routine from getRoutines and match by id; getPreviousPerformance;
 * logWorkout; parseLog).
 *
 * Persistence: the active session is written to AsyncStorage under
 * ACTIVE_SESSION_KEY on every meaningful state change and restored on mount.
 * The key is cleared only on a successful finish (not on X/back, so the user
 * can resume). If a saved session exists it takes precedence over ?routine /
 * ?start=empty params — the user resumes where they left off.
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Timer, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyAction, emptySet, type SessionState, type SessionAction } from '@gymli/shared';
import { api } from '../lib/api';
import { useUserProfile, type UserProfile } from '../contexts/UserProfileContext';

import { ExerciseCard } from '../components/workout/ExerciseCard';
import { RestTimer } from '../components/workout/RestTimer';
import { WorkoutSummary } from '../components/workout/WorkoutSummary';
import { LogInput } from '../components/workout/LogInput';
import { LogFeed } from '../components/workout/LogFeed';
import { ExercisePicker } from '../components/log/ExercisePicker';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

// ─── Storage key ──────────────────────────────────────────────────────────────

const ACTIVE_SESSION_KEY = 'gymli:active-session';

// ─── Types ────────────────────────────────────────────────────────────────────

type SetData = {
  completed: boolean;
  [key: string]: unknown;
};

type SessionExercise = {
  exerciseId: string;
  name: string;
  kind: string;
  targetSets?: number;
  targetReps?: string | number;
  notes: string;
  sets: SetData[];
};

type PreviousData = Record<string, { sets?: SetData[] }>;

type FeedEntry = {
  from: 'user' | 'gymli';
  text: string;
  clarification?: { options?: { exerciseId: string; label: string }[] } | null;
};

type WorkoutResult = {
  exercises?: SessionExercise[];
  duration?: number;
  totalVolume?: number;
  prs?: { name: string; score: number; previousBest: number }[];
  gymliSummary?: string;
};

type RoutineExercise = {
  exerciseId: string;
  name?: string;
  kind?: string;
  sets?: number;
  reps?: string | number;
};

type Routine = {
  id: string;
  name?: string;
  exercises?: RoutineExercise[];
};

type PersistedSession = {
  exercises: SessionExercise[];
  feed: FeedEntry[];
  currentIndex: number;
  startedAt: number;
  units: string;
  routineName: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initExercise(ex: RoutineExercise): SessionExercise {
  const kind = ex.kind || 'weighted';
  const setCount = ex.sets ?? 3;
  return {
    exerciseId: ex.exerciseId,
    name:
      ex.name ||
      ex.exerciseId
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    kind,
    targetSets: setCount,
    targetReps: ex.reps,
    notes: '',
    sets: Array.from({ length: setCount }, () => emptySet(kind) as SetData),
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ start?: string; routine?: string }>();
  const { profile } = useUserProfile();
  const units = profile?.units ?? 'lbs';

  const [loadingSession, setLoadingSession] = useState(true);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [routineName, setRoutineName] = useState('My Routine');
  const [showRestTimer, setShowRestTimer] = useState(false);
  // startedAt: epoch ms when the session began; used to compute elapsed time
  // so the timer survives a web refresh.
  const startedAtRef = useRef<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<WorkoutResult | null>(null);
  const [previousData, setPreviousData] = useState<PreviousData>({});
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [parsing, setParsing] = useState(false);
  const [picking, setPicking] = useState(false);

  // Guard: true while the initial restore/load is still running; prevents
  // the write-through effect from overwriting saved state with empty state.
  const restoredRef = useRef(false);

  // Keep currentIndexRef in sync so async/functional-updater closures can read stable index
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCompletionRef = useRef(0);
  const sessionId = useRef(`s-${Math.round(Date.now())}`).current;
  const pillScrollRef = useRef<ScrollView>(null);

  // ── Load session: restore from AsyncStorage or init from params ─────────────
  useEffect(() => {
    async function load() {
      try {
        // 1. Check for a saved session first.
        const saved = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
        if (saved) {
          const parsed: PersistedSession = JSON.parse(saved);
          // Discard stale sessions (e.g. abandoned days ago) — resuming them
          // produces absurd elapsed timers and surprises the user.
          const ageMs = Date.now() - (parsed.startedAt ?? 0);
          const MAX_RESUME_AGE_MS = 12 * 60 * 60 * 1000; // 12h
          if (parsed.startedAt && ageMs < MAX_RESUME_AGE_MS) {
            setExercises(parsed.exercises ?? []);
            setFeed(parsed.feed ?? []);
            setCurrentIndex(parsed.currentIndex ?? 0);
            startedAtRef.current = parsed.startedAt;
            // Restore elapsed time from saved startedAt so the timer is accurate.
            setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
            if (parsed.routineName) setRoutineName(parsed.routineName);
            // units come from profile, not stored (profile loads separately)
            return; // skip routine/empty init
          }
          await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        }

        // 2. No saved session — init from params.
        startedAtRef.current = Date.now();
        if (params.routine) {
          const routines = (await api.getRoutines()) as Routine[];
          const routine = Array.isArray(routines)
            ? routines.find((r) => r.id === params.routine)
            : null;
          if (routine?.exercises?.length) {
            setExercises(routine.exercises.map(initExercise));
            if (routine.name) setRoutineName(routine.name);
          }
        }
        // For ?start=empty we leave exercises as []
      } catch {
        // start blank on error
        startedAtRef.current = Date.now();
      } finally {
        restoredRef.current = true;
        setLoadingSession(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Write-through: persist session state to AsyncStorage ───────────────────
  // Only runs after the initial load completes (restoredRef.current === true).
  useEffect(() => {
    if (!restoredRef.current) return;
    const snapshot: PersistedSession = {
      exercises,
      feed,
      currentIndex,
      startedAt: startedAtRef.current,
      units,
      routineName,
    };
    AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(snapshot)).catch(
      () => {}
    );
  }, [exercises, feed, currentIndex, units, routineName]);

  // ── Load previous performance ───────────────────────────────────────────────
  useEffect(() => {
    if (exercises.length === 0) return;
    const ids = exercises.map((e) => e.exerciseId);
    api.getPreviousPerformance(ids).then((data) => {
      setPreviousData((data as PreviousData) ?? {});
    }).catch(() => {});
  }, [exercises.length]);

  // ── Pre-fill weights from previous session ──────────────────────────────────
  useEffect(() => {
    if (Object.keys(previousData).length === 0) return;
    setExercises((prev) =>
      prev.map((ex) => {
        const prevPerf = previousData[ex.exerciseId];
        if (!prevPerf?.sets?.length) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set, i) => ({
            ...set,
            weight:
              (set.weight as string) ||
              (prevPerf.sets?.[i] as any)?.weight ||
              (prevPerf.sets?.[0] as any)?.weight ||
              '',
          })),
        };
      })
    );
  }, [previousData]);

  // ── Elapsed timer (epoch-based so it survives refresh) ─────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Scroll pill strip on currentIndex change ────────────────────────────────
  useEffect(() => {
    if (pillScrollRef.current && exercises.length > 0) {
      // Approximate scroll: each pill ~80px wide
      pillScrollRef.current.scrollTo({
        x: Math.max(0, currentIndex * 88 - 40),
        animated: true,
      });
    }
  }, [currentIndex, exercises.length]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleExerciseChange(updated: SessionExercise) {
    const newExercises = [...exercises];
    const prevExercise = exercises[currentIndex];
    newExercises[currentIndex] = updated;
    setExercises(newExercises);

    const completedCount = updated.sets.filter((s) => s.completed).length;
    const prevCompletedCount =
      prevExercise?.sets.filter((s) => s.completed).length || 0;

    if (completedCount > prevCompletedCount) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const now = Date.now();
      const gap = now - lastCompletionRef.current;
      lastCompletionRef.current = now;

      const allDone = updated.sets.every((s) => s.completed);
      if (gap > 5000 && !allDone) {
        setShowRestTimer(true);
      }
    }
  }

  function handleUpdateNotes(notes: string) {
    const newExercises = [...exercises];
    newExercises[currentIndex] = { ...newExercises[currentIndex], notes };
    setExercises(newExercises);
  }

  async function handleFinish() {
    setShowFinishSheet(false);
    setSaving(true);
    const duration = Math.round(elapsedSeconds / 60);

    try {
      const workoutResult = await api.logWorkout({
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          kind: ex.kind,
          notes: ex.notes || undefined,
          sets: ex.sets.map((s) => ({ ...s, completed: !!s.completed })),
        })),
        duration,
      });
      // Clear persisted session — workout is saved.
      AsyncStorage.removeItem(ACTIVE_SESSION_KEY).catch(() => {});
      setResult({ ...(workoutResult as WorkoutResult), duration });
    } catch (err) {
      console.error('Failed to save workout:', err);
      setResult({
        exercises,
        duration,
        totalVolume: exercises.reduce(
          (sum, ex) =>
            sum +
            ex.sets.reduce(
              (s, set) =>
                s +
                (Number((set as any).weight) || 0) *
                  (Number((set as any).reps) || 0),
              0
            ),
          0
        ),
        prs: [],
      });
    } finally {
      setSaving(false);
    }
  }

  function applyEnvelopeActions(actions: SessionAction[]) {
    setExercises((prev) => {
      let session: SessionState = {
        exercises: prev.map((e) => ({ ...e, sets: [...e.sets] })),
        currentExerciseId: prev[currentIndexRef.current]?.exerciseId || null,
      };
      for (const a of actions) session = applyAction(session, a);
      const next = session.exercises as SessionExercise[];
      // If the AI added a new exercise, focus it so the card is visible
      // (otherwise only its pill appears and the add looks like a no-op).
      if (next.length > prev.length) setCurrentIndex(next.length - 1);
      return next;
    });
  }

  async function handleLogInput(text: string) {
    setFeed((f) => [...f, { from: 'user', text }]);
    setParsing(true);
    try {
      const session = {
        exercises: exercises.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          kind: e.kind,
          sets: e.sets,
        })),
        currentExerciseId: exercises[currentIndexRef.current]?.exerciseId || null,
      };
      const env = await api.parseLog({ text, session, units, sessionId });
      const envelope = env as any;
      setFeed((f) => [
        ...f,
        {
          from: 'gymli',
          text: envelope.reply || '…',
          clarification: envelope.needsClarification ? envelope.clarification : null,
        },
      ]);
      if (!envelope.needsClarification) {
        applyEnvelopeActions(envelope.actions || []);
      }
    } catch {
      setFeed((f) => [
        ...f,
        { from: 'gymli', text: 'Something went wrong — try again.' },
      ]);
    } finally {
      setParsing(false);
    }
  }

  function handleClarify(option: { exerciseId: string; label: string }) {
    applyEnvelopeActions([
      { type: 'add_exercise', exerciseId: option.exerciseId, name: option.label, kind: 'weighted' },
    ]);
    setFeed((f) => [...f, { from: 'gymli', text: `Added ${option.label}.` }]);
  }

  function handleAddExercise(ex: { id: string; name: string; kind?: string }) {
    setPicking(false);
    const existingIdx = exercises.findIndex((e) => e.exerciseId === ex.id);
    if (existingIdx !== -1) {
      setCurrentIndex(existingIdx);
      return;
    }
    const kind = ex.kind || 'weighted';
    setExercises((prev) => {
      const updated = [
        ...prev,
        {
          exerciseId: ex.id,
          name: ex.name,
          kind,
          targetReps: '',
          notes: '',
          sets: [emptySet(kind) as SetData],
        },
      ];
      setCurrentIndex(updated.length - 1);
      return updated;
    });
  }

  async function handleSaveAsRoutine() {
    await api.createRoutine({
      name: routineName,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        kind: ex.kind || 'weighted',
        targetSets: ex.sets.length,
        targetReps: ex.targetReps || '8-12',
      })),
    });
    // Clear persisted session — user saved this as a routine and is done.
    AsyncStorage.removeItem(ACTIVE_SESSION_KEY).catch(() => {});
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const currentExercise = exercises[currentIndex];
  const completedExerciseCount = exercises.filter((ex) =>
    ex.sets.some((s) => s.completed)
  ).length;
  const totalExercises = exercises.length;

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg dark:bg-bg-dark">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // ── Workout complete — show summary ─────────────────────────────────────────

  if (result) {
    return (
      <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top', 'bottom']}>
        <WorkoutSummary
          result={result}
          onClose={() => router.back()}
          onSaveAsRoutine={handleSaveAsRoutine}
        />
      </SafeAreaView>
    );
  }

  // ── Active session ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
        <Pressable onPress={() => router.back()}>
          <X size={20} color="#71717a" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Timer size={16} color="#d4872a" />
          <Text className="font-mono font-medium text-zinc-900 dark:text-zinc-50 tabular-nums text-sm">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowFinishSheet(true)}
          disabled={saving}
          className="opacity-100 disabled:opacity-50"
        >
          <Text className="text-sm font-semibold text-zinc-500">
            {saving ? 'Saving...' : 'End'}
          </Text>
        </Pressable>
      </View>

      {/* ── Exercise pill strip ── */}
      {/* BUG 1 FIX: grow-0 shrink-0 prevents the ScrollView from expanding
          vertically in the column layout. items-center on contentContainerClassName
          prevents the horizontal flex row from stretching pills to full height
          (the default align-items:stretch on web). */}
      <ScrollView
        ref={pillScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, height: 52 }}
        className="border-b border-zinc-200 dark:border-zinc-800"
        contentContainerClassName="flex-row items-center gap-2 px-4"
      >
        {exercises.map((ex, i) => (
          <Pressable
            key={i}
            onPress={() => setCurrentIndex(i)}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full',
              i === currentIndex
                ? 'bg-primary'
                : i < currentIndex || ex.sets.some((s) => s.completed)
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-surface-alt dark:bg-surface-dark'
            )}
          >
            <Text
              className={cn(
                'text-xs font-medium',
                i === currentIndex
                  ? 'text-white'
                  : i < currentIndex || ex.sets.some((s) => s.completed)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-zinc-500'
              )}
            >
              {ex.name.split(' ').slice(0, 2).join(' ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Split layout: exercise grid + log feed + input ── */}
      <View className="flex-1 overflow-hidden">
        {/* Scrollable exercise area */}
        <ScrollView
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentExercise ? (
            <ExerciseCard
              exercise={currentExercise}
              units={units}
              previous={previousData[currentExercise.exerciseId]}
              onChange={handleExerciseChange}
              onUpdateNotes={handleUpdateNotes}
            />
          ) : (
            <View className="flex-col items-center justify-center gap-1 py-12">
              <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                No exercises yet
              </Text>
              <Text className="text-xs text-zinc-500 text-center">
                {`Tap "Add exercise" below, or just type it in the bar — e.g. "dumbbell bench 60s 10, 9, 8".`}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setPicking(true)}
            className="mt-4 flex-row w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-3"
          >
            <Plus size={16} color="#71717a" />
            <Text className="text-sm text-zinc-500">Add exercise</Text>
          </Pressable>
        </ScrollView>

        {/* Conversational log feed — max ~34% height */}
        <View
          className="border-t border-zinc-200 dark:border-zinc-800"
          style={{ maxHeight: '34%' }}
        >
          <LogFeed entries={feed} onClarify={handleClarify} />
        </View>

        {/* Conversational log input */}
        <LogInput onSend={handleLogInput} disabled={parsing} />
      </View>

      {/* ── Rest timer (absolute over content) ── */}
      {showRestTimer && (
        <RestTimer duration={90} onDismiss={() => setShowRestTimer(false)} />
      )}

      {/* ── Exercise picker (bottom sheet) ── */}
      <ExercisePicker
        open={picking}
        onSelect={handleAddExercise}
        onClose={() => setPicking(false)}
      />

      {/* ── Finish confirmation sheet ── */}
      <BottomSheet
        open={showFinishSheet}
        onClose={() => setShowFinishSheet(false)}
        snapPoints={['40%']}
      >
        <View className="py-4 gap-4">
          <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            End workout?
          </Text>
          <Text className="text-sm text-zinc-500">
            {completedExerciseCount} of {totalExercises} exercises completed
          </Text>
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              fullWidth
              onPress={() => setShowFinishSheet(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" fullWidth onPress={handleFinish}>
              End Workout
            </Button>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
