import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeCtx {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  preference: 'dark',
  resolved: 'dark',
  setPreference: () => undefined,
});

export const useTheme = () => useContext(ThemeContext);
