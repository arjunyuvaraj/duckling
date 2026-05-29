import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const LS_KEY = 'dk-theme';

interface ThemeCtx {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  preference: 'dark',
  resolved: 'dark',
  setPreference: () => {},
});

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredPreference(): ThemePreference {
  try { return (localStorage.getItem(LS_KEY) as ThemePreference) ?? 'dark'; } catch { return 'dark'; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceRaw] = useState<ThemePreference>(getStoredPreference);

  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    const pref = getStoredPreference();
    const r: ResolvedTheme = pref === 'system' ? getSystemTheme() : pref;
    document.documentElement.setAttribute('data-theme', r);
    return r;
  });

  useEffect(() => {
    const next: ResolvedTheme = preference === 'system' ? getSystemTheme() : preference;
    setResolved(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const next = getSystemTheme();
      setResolved(next);
      document.documentElement.setAttribute('data-theme', next);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  function setPreference(p: ThemePreference) {
    try { localStorage.setItem(LS_KEY, p); } catch {}
    setPreferenceRaw(p);
  }

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
