/**
 * RoutineEditor — full port of frontend/src/components/routine/RoutineEditor.jsx.
 *
 * Prop API (must match what log.tsx passes):
 *   routine: Routine | null   — null = create new; object = edit existing
 *   onClose: () => void
 *   onSaved: (saved: Routine) => void
 *
 * Rendered as a BottomSheet (RN Modal, 85% snap) with an ExercisePicker
 * overlay (also a bottom-sheet) for adding exercises.
 */
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { ExercisePicker } from '../log/ExercisePicker';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

export type RoutineExercise = {
  exerciseId: string;
  name: string;
  kind?: string;
  targetSets?: number;
  targetReps?: string | number;
};

export type Routine = {
  id?: string;
  name?: string;
  exercises?: RoutineExercise[];
};

type PickedExercise = {
  id: string;
  name: string;
  kind?: string;
  [key: string]: unknown;
};

type Props = {
  routine: Routine | null;
  onClose: () => void;
  onSaved: (saved: Routine) => void;
};

export function RoutineEditor({ routine, onClose, onSaved }: Props) {
  const [name, setName] = useState(routine?.name ?? '');
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    (routine?.exercises as RoutineExercise[]) ?? []
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(ex: PickedExercise) {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        kind: ex.kind ?? 'weighted',
        targetSets: 3,
        targetReps: '8-12',
      },
    ]);
    setPicking(false);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, j) => j !== index));
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), exercises };
      const saved = routine?.id
        ? ((await api.updateRoutine(routine.id, payload)) as Routine)
        : ((await api.createRoutine(payload)) as Routine);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Main editor sheet */}
      <BottomSheet open={!picking} onClose={onClose} snapPoints={['85%']}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {routine?.id ? 'Edit routine' : 'New routine'}
          </Text>
          <Pressable onPress={onClose} className="min-h-12 min-w-12 items-center justify-center">
            <X size={22} color="#71717a" />
          </Pressable>
        </View>

        {/* Routine name input */}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Routine name"
          placeholderTextColor="#71717a"
          className="mb-4 rounded-xl bg-surface-alt dark:bg-surface-dark px-4 min-h-12 text-base text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700"
        />

        {/* Exercise list */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-2"
        >
          {exercises.map((ex, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between rounded-xl bg-surface-alt dark:bg-surface-dark px-4 py-3.5"
            >
              <View className="flex-1 min-w-0 mr-3">
                <Text
                  className="text-base font-medium text-zinc-900 dark:text-zinc-50"
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>
                {ex.targetSets != null && ex.targetReps != null ? (
                  <Text className="text-sm text-zinc-500">
                    {ex.targetSets} sets · {ex.targetReps} reps
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => removeExercise(i)} className="min-h-12 min-w-12 items-center justify-center">
                <Trash2 size={18} color="#71717a" />
              </Pressable>
            </View>
          ))}

          {/* Add exercise button */}
          <Pressable
            onPress={() => setPicking(true)}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 py-4"
          >
            <Plus size={18} color="#71717a" />
            <Text className="text-base text-zinc-500">Add exercise</Text>
          </Pressable>
        </ScrollView>

        {/* Save button */}
        <View className="pt-4">
          <Button
            size="lg"
            fullWidth
            disabled={!name.trim() || saving}
            loading={saving}
            onPress={save}
          >
            {saving ? 'Saving…' : 'Save routine'}
          </Button>
        </View>
      </BottomSheet>

      {/* Exercise picker overlay — separate sheet so editor state is preserved */}
      <ExercisePicker
        open={picking}
        onSelect={addExercise}
        onClose={() => setPicking(false)}
      />
    </>
  );
}

export default RoutineEditor;
