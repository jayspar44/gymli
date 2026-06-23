import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatFAB } from '../../components/chat/ChatFAB';

// Web-only: react-navigation ignores `tabBarStyle.height` on web, so the bottom
// tab bar renders at its built-in ~47px default and the label container collapses
// to ~9px with overflow:hidden, clipping the tab labels. Inject a stylesheet to give
// the bar room and lift the clamp/clip off the labels. Native uses tabBarStyle and
// is unaffected by this (this CSS only exists in the web DOM).
const TABBAR_WEB_FIX = `
[role='tablist'] { height: auto !important; min-height: 62px !important; padding-bottom: 8px !important; }
[role='tablist'] [role='tab'] { height: auto !important; min-height: 54px !important; }
[role='tablist'] [role='tab'] > * { height: auto !important; overflow: visible !important; }
`;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'gymli-tabbar-web-fix';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = TABBAR_WEB_FIX;
    document.head.appendChild(el);
  }, []);

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
