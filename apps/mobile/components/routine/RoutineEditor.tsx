/**
 * RoutineEditor — stub placeholder, full implementation in Task 6.
 * Exposes the same prop API as the web RoutineEditor so Log.tsx compiles.
 */
import { View, Text, Pressable } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';

type Routine = {
  id?: string;
  name?: string;
  exercises?: unknown[];
};

type Props = {
  routine: Routine | null;
  onClose: () => void;
  onSaved: () => void;
};

export function RoutineEditor({ routine, onClose, onSaved: _onSaved }: Props) {
  return (
    <BottomSheet open onClose={onClose} snapPoints={['75%']}>
      <View className="flex-1 items-center justify-center gap-4 px-4">
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {routine ? `Edit: ${routine.name ?? 'Routine'}` : 'New Routine'}
        </Text>
        <Text className="text-sm text-zinc-500 text-center">
          Full routine editor coming in Task 6.
        </Text>
        <Pressable
          onPress={onClose}
          className="px-4 py-2 rounded-xl bg-surface-alt dark:bg-surface-dark"
        >
          <Text className="text-sm text-primary font-medium">Close</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export default RoutineEditor;
