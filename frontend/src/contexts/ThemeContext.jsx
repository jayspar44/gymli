import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const ThemeContext = createContext();

function resolveTheme(preference) {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    const saved = localStorage.getItem('gymli-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [resolved, setResolved] = useState(() => resolveTheme(preference));

  // Listen for OS-level theme changes when preference is "system"
  useEffect(() => {
    if (preference !== 'system') {
      setResolved(preference);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setResolved(e.matches ? 'dark' : 'light');
    setResolved(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gymli-theme', preference);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#09090b' : '#fafafa');
    }

    // Sync with Capacitor StatusBar
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: resolved === 'dark' ? Style.Dark : Style.Light });
      });
    }
  }, [resolved, preference]);

  const setTheme = useCallback((value) => {
    setPreference(value);
  }, []);

  function toggleTheme() {
    setPreference(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      // system -> toggle based on current resolved
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }

  return (
    <ThemeContext.Provider value={{
      theme: resolved,
      preference,
      setTheme,
      toggleTheme,
      isDark: resolved === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
