import { useEffect, useState } from 'react';
import { useTheme } from './useTheme';

export type ColorScheme = 'light' | 'dark';

export const useColorScheme = (): ColorScheme => {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return scheme;
};

export const useSystemThemeSync = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, setTheme]);
};
