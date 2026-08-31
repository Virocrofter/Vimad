export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  muted: string;
  'muted-foreground': string;
  input: string;
  surface: string;
  'surface-elevated': string;
  border: string;
  ring: string;
  radius: string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  accent: string;
  'accent-foreground': string;
  warning: string;
  'warning-foreground': string;
  danger: string;
  'danger-foreground': string;
  info: string;
  'info-foreground': string;
  neutral: string;
  'neutral-foreground': string;
}

export const themeTokens: Record<'light' | 'dark', ThemeTokens> = {
  light: {
    background: '#f8fafc', foreground: '#0f172a', card: '#ffffff', 'card-foreground': '#0f172a',
    popover: '#ffffff', 'popover-foreground': '#0f172a', muted: '#f1f5f9', 'muted-foreground': '#64748b',
    input: '#e2e8f0', surface: '#ffffff', 'surface-elevated': '#ffffff', border: '#e2e8f0',
    ring: '#3b82f6', radius: '0.5rem', 'text-primary': '#0f172a', 'text-secondary': '#475569',
    'text-muted': '#94a3b8', primary: '#0f172a', 'primary-foreground': '#f8fafc',
    secondary: '#3b82f6', 'secondary-foreground': '#ffffff', accent: '#10b981', 'accent-foreground': '#ffffff',
    warning: '#f59e0b', 'warning-foreground': '#0f172a', danger: '#ef4444', 'danger-foreground': '#ffffff',
    info: '#6366f1', 'info-foreground': '#ffffff', neutral: '#64748b', 'neutral-foreground': '#ffffff',
  },
  dark: {
    background: '#0f172a', foreground: '#f1f5f9', card: '#1e293b', 'card-foreground': '#f1f5f9',
    popover: '#1e293b', 'popover-foreground': '#f1f5f9', muted: '#334155', 'muted-foreground': '#94a3b8',
    input: '#475569', surface: '#1e293b', 'surface-elevated': '#334155', border: '#475569',
    ring: '#60a5fa', radius: '0.5rem', 'text-primary': '#f1f5f9', 'text-secondary': '#cbd5e1',
    'text-muted': '#64748b', primary: '#f8fafc', 'primary-foreground': '#0f172a',
    secondary: '#60a5fa', 'secondary-foreground': '#0f172a', accent: '#34d399', 'accent-foreground': '#0f172a',
    warning: '#fbbf24', 'warning-foreground': '#0f172a', danger: '#f87171', 'danger-foreground': '#0f172a',
    info: '#818cf8', 'info-foreground': '#0f172a', neutral: '#94a3b8', 'neutral-foreground': '#0f172a',
  },
};

export const fontTokens = {
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, 'Cascadia Code', monospace",
} as const;

export const shadowTokens = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;