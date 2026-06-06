import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

type Pref = 'light' | 'dark' | 'system';
type ThemeValue = { theme: 'light' | 'dark'; preference: Pref; setTheme: (p: Pref) => void; toggleTheme: () => void; isDark: boolean };
const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<Pref>('system');

  useEffect(() => {
    AsyncStorage.getItem('gymli-theme').then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') { setPreference(v); setColorScheme(v); }
    });
  }, []);

  const setTheme = (p: Pref) => { setPreference(p); setColorScheme(p); AsyncStorage.setItem('gymli-theme', p); };
  const resolved = (colorScheme ?? 'light') as 'light' | 'dark';

  return (
    <Ctx.Provider value={{
      theme: resolved, preference, setTheme,
      toggleTheme: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
      isDark: resolved === 'dark',
    }}>{children}</Ctx.Provider>
  );
}
export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
}
