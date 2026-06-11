import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type ResolvedTheme, type ThemePreference } from './theme-core';

const LS_KEY = 'dk-theme';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredPreference(): ThemePreference {
  try { return (localStorage.getItem(LS_KEY) as ThemePreference) ?? 'dark'; } catch { return 'dark'; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceRaw] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolved: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      setSystemTheme(getSystemTheme());
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  function setPreference(p: ThemePreference) {
    try { localStorage.setItem(LS_KEY, p); } catch {
      setPreferenceRaw(p);
      return;
    }
    setPreferenceRaw(p);
  }

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
