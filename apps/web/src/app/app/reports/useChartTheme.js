/* src/app/app/reports/useChartTheme.js */
import { useTheme } from '../../../hooks/useTheme';

/* ─── Chart Theme Tokens ─── */
const CHART_TOKENS = {
  light: {
    primary: '#0F172A',
    secondary: '#3B82F6',
    accent: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1',
    neutral: '#64748B',
    grid: '#E2E8F0',
    text: '#475569',
    surface: '#FFFFFF',
  },
  dark: {
    primary: '#F8FAFC',
    secondary: '#60A5FA',
    accent: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#818CF8',
    neutral: '#94A3B8',
    grid: '#334155',
    text: '#CBD5E1',
    surface: '#1E293B',
  },
};

/* ─── Chart Theme Hook ─── */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return CHART_TOKENS[resolvedTheme === 'dark' ? 'dark' : 'light'];
}
