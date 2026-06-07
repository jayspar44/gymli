import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-1 items-center justify-center">
        <Text className="text-zinc-500">Coming next</Text>
      </View>
    </SafeAreaView>
  );
}
