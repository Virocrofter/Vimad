import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ThemeMode } from '../lib/theme-config';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const resolveTheme = (theme: ThemeMode): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: resolveTheme('system'),
      setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        set({ theme, resolvedTheme: resolved });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      },
      toggleTheme: () => {
        const { resolvedTheme } = get();
        const next = resolvedTheme === 'light' ? 'dark' : 'light';
        get().setTheme(next);
      },
    }),
    {
      name: 'pms-theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          state.resolvedTheme = resolved;
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        }
      },
    }
  )
);

export const initializeTheme = (): void => {
  try {
    const stored = localStorage.getItem('pms-theme-storage');
    const parsed = stored ? JSON.parse(stored) : null;
    const theme: ThemeMode = parsed?.state?.theme || 'system';
    const resolved = resolveTheme(theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  } catch {
    document.documentElement.classList.add('light');
  }
};
