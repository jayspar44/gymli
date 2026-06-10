/**
 * ExerciseCard — displays one exercise with its set rows.
 * Ports frontend/src/components/workout/ExerciseCard.jsx.
 * Sets → SetRow; add/remove set; per-exercise notes; previous performance.
 */
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Plus, Minus, FileText } from 'lucide-react-native';
import { emptySet, fieldsForKind } from '@gymli/shared';
import { Card } from '../ui/Card';
import { SetRow } from './SetRow';

type SetData = {
  completed: boolean;
  [key: string]: unknown;
};

type PreviousPerf = {
  sets?: SetData[];
};

type Exercise = {
  exerciseId: string;
  name: string;
  kind: string;
  targetSets?: number;
  targetReps?: string | number;
  notes: string;
  sets: SetData[];
};

type Props = {
  exercise: Exercise;
  units: string;
  previous?: PreviousPerf;
  onChange: (updated: Exercise) => void;
  onUpdateNotes: (notes: string) => void;
};

export function ExerciseCard({ exercise, units, previous, onChange, onUpdateNotes }: Props) {
  const [showNotes, setShowNotes] = useState(false);

  function handleSetChange(setIndex: number, updatedSet: SetData) {
    const newSets = [...exercise.sets];
    newSets[setIndex] = updatedSet;
    onChange({ ...exercise, sets: newSets });
  }

  function addSet() {
    const kind = exercise.kind || 'weighted';
    const lastSet = exercise.sets[exercise.sets.length - 1] || emptySet(kind);
    const newSet = { ...emptySet(kind) } as SetData;
    const firstKey = Object.keys(newSet).find((k) => k !== 'completed');
    if (firstKey && lastSet[firstKey] !== undefined) newSet[firstKey] = lastSet[firstKey];
    onChange({ ...exercise, sets: [...exercise.sets, newSet] });
  }

  function removeSet() {
    if (exercise.sets.length <= 1) return;
    onChange({ ...exercise, sets: exercise.sets.slice(0, -1) });
  }

  // Build "Last: ..." string
  const previousLine = (() => {
    if (!previous?.sets?.length) return null;
    const kind = exercise.kind || 'weighted';
    const fields = fieldsForKind(kind);
    const setStrings = previous.sets
      .map((s) => {
        const vals = fields
          .map((f) => {
            const v = s[f.key];
            return v != null && v !== '' ? String(v) : null;
          })
          .filter(Boolean) as string[];
        if (vals.length === 0) return null;
        if (kind === 'weighted') return `${vals[0]}${units} × ${vals[1] ?? '?'}`;
        if (kind === 'bodyweight') return `+${vals[0] ?? 0} × ${vals[1] ?? '?'}`;
        if (kind === 'assisted') return `-${vals[0] ?? 0} × ${vals[1] ?? '?'}`;
        if (kind === 'timed') return `${vals[0]}s`;
        if (kind === 'distance') return vals.join(' / ');
        return vals.join(' × ');
      })
      .filter(Boolean) as string[];
    return setStrings.length ? `Last: ${setStrings.join(', ')}` : null;
  })();

  const fields = fieldsForKind(exercise.kind || 'weighted');

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <View className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {exercise.name}
        </Text>
        {exercise.targetReps != null && (
          <Text className="text-sm text-zinc-500 mt-0.5">
            Target: {exercise.targetSets} x {exercise.targetReps}
          </Text>
        )}
        {previousLine && (
          <Text className="text-sm text-zinc-500 mt-1">{previousLine}</Text>
        )}
      </View>

      {/* Sets area */}
      <View className="px-4 py-2">
        {/* Header row */}
        <View className="flex-row items-center gap-2 pb-1 mb-1 border-b border-zinc-200 dark:border-zinc-700">
          <Text className="w-6 text-xs text-zinc-500 text-center uppercase">Set</Text>
          <View className="flex-1 flex-row gap-2">
            {fields.map((f, fi) => (
              <Text
                key={f.key}
                className={`${fi === fields.length - 1 && fields.length > 1 ? 'w-16' : 'flex-1'} text-xs text-zinc-500 text-center uppercase`}
              >
                {f.label}
              </Text>
            ))}
          </View>
          <Text className="w-12 text-xs text-zinc-500 text-center">✓</Text>
        </View>

        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            setIndex={i}
            set={set}
            units={units}
            kind={exercise.kind || 'weighted'}
            onChange={handleSetChange}
          />
        ))}
      </View>

      {/* Add/Remove + Notes */}
      <View className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
        <View className="flex-row items-center justify-center gap-4">
          <Pressable
            onPress={removeSet}
            disabled={exercise.sets.length <= 1}
            className="flex-row items-center gap-1.5 py-3 opacity-100 disabled:opacity-30"
          >
            <Minus size={14} color="#71717a" />
            <Text className="text-sm text-zinc-500">Remove</Text>
          </Pressable>
          <Pressable onPress={addSet} className="flex-row items-center gap-1.5 py-3">
            <Plus size={14} color="#d4872a" />
            <Text className="text-sm text-primary">Add Set</Text>
          </Pressable>
        </View>

        {/* Notes toggle */}
        <Pressable
          onPress={() => setShowNotes(!showNotes)}
          className="flex-row items-center gap-1.5 py-3"
        >
          <FileText size={16} color="#71717a" />
          <Text className="text-sm text-zinc-500">
            {exercise.notes ? 'Edit note' : 'Add note'}
          </Text>
        </Pressable>

        {showNotes && (
          <TextInput
            value={exercise.notes || ''}
            onChangeText={(v) => onUpdateNotes(v)}
            placeholder="How did this feel?"
            placeholderTextColor="#71717a"
            multiline
            numberOfLines={2}
            className="mt-2 w-full rounded-lg bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-base text-zinc-900 dark:text-zinc-50 p-3"
          />
        )}
      </View>
    </Card>
  );
}

export default ExerciseCard;
