import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className, showLabel = false }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [theme, setTheme]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const active = options.find((o) => o.value === theme) || options[0];
  const Icon = active.icon;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
        aria-label="Toggle theme"
        title="Toggle theme (Ctrl/Cmd+Shift+L)"
      >
        <Icon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-border bg-surface-elevated shadow-lg z-50 py-1">
          {options.map((option) => {
            const OptIcon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-surface'
                )}
              >
                <OptIcon className="h-4 w-4" />
                <span className="flex-1 text-left">{option.label}</span>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}