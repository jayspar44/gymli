/**
 * SetRow — one set row inside an ExerciseCard.
 * Ports frontend/src/components/workout/SetRow.jsx.
 * Inputs: TextInput (numeric); check button: Pressable + expo-haptics.
 */
import { View, Text, TextInput, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { fieldsForKind } from '@gymli/shared';
import { cn } from '../../lib/cn';

type SetData = {
  completed: boolean;
  [key: string]: unknown;
};

type Props = {
  setIndex: number;
  set: SetData;
  units: string;
  kind: string;
  onChange: (setIndex: number, updated: SetData) => void;
};

export function SetRow({ setIndex, set, units, kind, onChange }: Props) {
  function handleChange(field: string, value: unknown) {
    if (field === 'completed' && value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onChange(setIndex, { ...set, [field]: value });
  }

  const fields = fieldsForKind(kind || 'weighted');
  const weightField = fields[0];
  const restFields = fields.slice(1);

  return (
    <View className="flex-row items-center gap-2 py-1.5">
      {/* Set number */}
      <Text className="w-6 text-xs text-zinc-500 text-center font-mono">
        {setIndex + 1}
      </Text>

      {/* Input fields */}
      <View className="flex-1 flex-row gap-2">
        {/* First field — flex-1 */}
        <View className="relative flex-1">
          <TextInput
            keyboardType="numeric"
            value={set[weightField.key] != null ? String(set[weightField.key]) : ''}
            onChangeText={(v) => handleChange(weightField.key, v)}
            placeholder="0"
            placeholderTextColor="#71717a"
            className="w-full py-2 px-2.5 rounded-lg bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 text-sm text-center"
          />
          <Text className="absolute right-2 top-2.5 text-[10px] text-zinc-500">
            {weightField.key === 'weight' ? units : weightField.label}
          </Text>
        </View>

        {/* Remaining fields — fixed width */}
        {restFields.map((field) => (
          <View key={field.key} className="relative w-16">
            <TextInput
              keyboardType="numeric"
              value={set[field.key] != null ? String(set[field.key]) : ''}
              onChangeText={(v) => handleChange(field.key, v)}
              placeholder="0"
              placeholderTextColor="#71717a"
              className="w-full py-2 px-2.5 rounded-lg bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 text-sm text-center"
            />
            <Text className="absolute right-2 top-2.5 text-[10px] text-zinc-500">
              {field.label.toLowerCase()}
            </Text>
          </View>
        ))}
      </View>

      {/* Completion toggle */}
      <Pressable
        onPress={() => handleChange('completed', !set.completed)}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg border',
          set.completed
            ? 'bg-primary border-primary'
            : 'border-zinc-300 dark:border-zinc-600'
        )}
      >
        <Check
          size={16}
          strokeWidth={2.5}
          color={set.completed ? '#fff' : '#71717a'}
        />
      </Pressable>
    </View>
  );
}

export default SetRow;
