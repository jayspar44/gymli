/**
 * ExercisePicker — bottom-sheet search/filter for selecting an exercise.
 * Ports frontend/src/components/log/ExercisePicker.jsx.
 * <input> → <TextInput>, BottomSheet, Chip filters, FlashList results.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Search, Dumbbell, ChevronRight } from 'lucide-react-native';
import { BottomSheet, type BottomSheetRef } from '../ui/BottomSheet';
import { Chip } from '../ui/Chip';
import { Skeleton } from '../ui/Skeleton';
import { api } from '../../lib/api';
import { TestIds, exerciseResultId } from '../../lib/test-ids';

const CATEGORIES = ['All', 'compound', 'isolation', 'cardio', 'olympic', 'power'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  All: 'All',
  compound: 'Compound',
  isolation: 'Isolation',
  cardio: 'Cardio',
  olympic: 'Olympic',
  power: 'Power',
};

type Exercise = {
  id: string;
  name: string;
  category?: string;
  muscleGroups?: {
    primary?: string[];
  };
};

type ExerciseResponse = {
  exercises?: Exercise[];
} | Exercise[];

type Props = {
  open: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

export function ExercisePicker({ open, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Focus the input and load exercises on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      loadExercises();
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced reload on query/category change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadExercises();
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  async function loadExercises() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (category !== 'All') params.category = category;
      const data = (await api.searchExercises(params)) as ExerciseResponse;
      setExercises(
        Array.isArray(data)
          ? data
          : (data as { exercises?: Exercise[] }).exercises ?? []
      );
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }

  const renderExercise = useCallback(
    ({ item: ex, index: i }: { item: Exercise; index: number }) => (
      <Pressable
        key={ex.id}
        testID={exerciseResultId(i)}
        onPress={() => onSelect(ex)}
        className="w-full flex-row items-center gap-3 px-1 py-3.5 border-b border-zinc-200 dark:border-zinc-700 active:bg-surface-alt dark:active:bg-surface-dark"
      >
        <View className="flex-1 min-w-0">
          <Text
            className="text-base font-medium text-zinc-900 dark:text-zinc-50"
            numberOfLines={1}
          >
            {ex.name}
          </Text>
          <Text className="text-sm text-zinc-500">
            {ex.category}
            {ex.muscleGroups?.primary?.length
              ? ` · ${ex.muscleGroups.primary.join(', ')}`
              : ''}
          </Text>
        </View>
        <ChevronRight size={18} color="#71717a" />
      </Pressable>
    ),
    [onSelect]
  );

  return (
    <BottomSheet open={open} onClose={onClose} snapPoints={['85%']}>
      {/* Search input */}
      <View className="relative mb-3 flex-row items-center">
        <View className="absolute left-3 z-10">
          <Search size={18} color="#71717a" />
        </View>
        <TextInput
          testID={TestIds.EXERCISE_SEARCH_INPUT}
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises..."
          placeholderTextColor="#71717a"
          className="flex-1 pl-10 pr-3 min-h-12 rounded-xl bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-base text-zinc-900 dark:text-zinc-50"
        />
      </View>

      {/* Category filter chips */}
      <View className="flex-row gap-2 pb-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </Chip>
        ))}
      </View>

      {/* Exercise list */}
      {loading ? (
        <View className="gap-3 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="text" className="h-12" />
          ))}
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-col items-center justify-center py-12">
          <Dumbbell size={32} color="#71717a" strokeWidth={1.5} />
          <Text className="text-sm text-zinc-500 mt-2">No exercises found</Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlashList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExercise}
          />
        </View>
      )}
    </BottomSheet>
  );
}

export default ExercisePicker;
