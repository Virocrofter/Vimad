import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export function ThemeProvider({ children }) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  return children;
}