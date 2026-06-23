import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';

type Exercise = {
  id: string;
  name: string;
  kind?: string;
};

export function ExerciseSelector({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await api.getLoggedExercises() as { exercises?: Exercise[] };
      const list = data.exercises || [];
      setExercises(list);
      if (!selected && list.length > 0) {
        onSelect(list[0].id);
      }
    } catch {
      setExercises([]);
    }
  }

  const selectedExercise = exercises.find((e) => e.id === selected);

  if (exercises.length === 0) return null;

  return (
    <View className="relative z-10">
      <Pressable
        onPress={() => setOpen(!open)}
        className="flex-row items-center justify-between w-full px-4 min-h-12 rounded-lg bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700"
      >
        <Text className="text-base text-zinc-900 dark:text-zinc-50 flex-1 mr-2" numberOfLines={1}>
          {selectedExercise?.name || 'Select exercise'}
        </Text>
        <ChevronDown
          size={18}
          color="#71717a"
          style={open ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </Pressable>

      {open && (
        <View className="absolute top-full left-0 right-0 mt-1 max-h-48 rounded-lg bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-lg z-20">
          {exercises.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => {
                onSelect(ex.id);
                setOpen(false);
              }}
              className={cn(
                'w-full px-4 py-3',
                ex.id === selected
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : ''
              )}
            >
              <Text
                className={cn(
                  'text-base',
                  ex.id === selected
                    ? 'text-primary font-medium'
                    : 'text-zinc-900 dark:text-zinc-50'
                )}
              >
                {ex.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default ExerciseSelector;
