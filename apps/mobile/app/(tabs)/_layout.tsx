import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatFAB } from '../../components/chat/ChatFAB';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#d4872a',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
      <ChatFAB />
    </View>
  );
}
