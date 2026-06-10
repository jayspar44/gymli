import '../global.css';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { UserProfileProvider, useUserProfile } from '../contexts/UserProfileContext';

function AuthGate() {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: profileLoading } = useUserProfile();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    // Wait until both auth and profile have settled before redirecting.
    // Acting before profile is loaded causes a flash/loop because needsOnboarding
    // starts true (profile null) and flips false once the real profile loads.
    if (authLoading || profileLoading) return;

    const inAuth = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuth) {
      // Not logged in → go to login
      router.replace('/login' as never);
    } else if (user && inAuth) {
      // Logged in but sitting on login → go to app or onboarding
      if (needsOnboarding) {
        router.replace('/onboarding' as never);
      } else {
        router.replace('/' as never);
      }
    } else if (user && !inAuth && !inOnboarding && needsOnboarding) {
      // Logged in, not on login or onboarding, but hasn't completed onboarding
      router.replace('/onboarding' as never);
    } else if (user && inOnboarding && !needsOnboarding) {
      // Completed onboarding (or already done) but still on onboarding screen
      router.replace('/' as never);
    }
  }, [user, authLoading, profileLoading, needsOnboarding, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <ThemeProvider>
          <AuthProvider>
            <UserProfileProvider>
              <AuthGate />
              <Stack screenOptions={{ headerShown: false }} />
            </UserProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
