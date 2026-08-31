/* src/app/admin/shadow/components/ShadowToggle.jsx */
import { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Zap,
  LogOut,
  Shield,
  ChevronRight,
  Clock,
  ArrowLeftRight,
  User,
  Ghost,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useShadowStore } from '../store';
import { formatDuration } from '../data';

/**
 * ShadowToggle — Floating action button for quick shadow controls.
 * Appears in topbar when shadow is active. Compact dropdown menu.
 */
export function ShadowToggle() {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  const isShadowActive = useShadowStore((s) => s.isShadowActive);
  const shadowUser = useShadowStore((s) => s.shadowUser);
  const stealthMode = useShadowStore((s) => s.stealthMode);
  const viewContext = useShadowStore((s) => s.viewContext);
  const endShadow = useShadowStore((s) => s.endShadow);
  const setViewContext = useShadowStore((s) => s.setViewContext);
  const toggleStealth = useShadowStore((s) => s.toggleStealth);
  const getSessionDuration = useShadowStore((s) => s.getSessionDuration);

  useEffect(() => {
    if (!isShadowActive) return;
    const interval = setInterval(() => setElapsed(getSessionDuration()), 1000);
    return () => clearInterval(interval);
  }, [isShadowActive, getSessionDuration]);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (!isShadowActive || !shadowUser) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-all',
          stealthMode
            ? 'border-purple-500/20 bg-purple-500/5 text-purple-500 hover:bg-purple-500/10'
            : 'border-purple-500/30 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
        )}
        title={stealthMode ? 'Shadow active (stealth)' : 'Shadow active'}
      >
        {stealthMode ? <Ghost className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="hidden sm:inline">{stealthMode ? 'Stealth' : 'Shadow'}</span>
        <span className="rounded-full bg-purple-500/20 px-1.5 py-0 text-[10px] font-mono">
          {formatDuration(elapsed)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface-elevated shadow-xl z-50 py-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-sm font-bold text-purple-500">
                {shadowUser.avatar ||
                  shadowUser.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {shadowUser.name}
                </p>
                <p className="text-xs text-text-muted">{shadowUser.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-text-muted">
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-500 font-medium">
                {shadowUser.sessionId?.slice(0, 12)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(elapsed)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-2 py-2 space-y-0.5">
            {/* Context Switch */}
            <button
              onClick={() => {
                setViewContext(viewContext === 'user' ? 'admin' : 'user');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4 text-purple-500" />
              <span className="flex-1 text-left">
                Switch to {viewContext === 'user' ? 'Admin View' : 'User View'}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0 rounded',
                  viewContext === 'user'
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-secondary/10 text-secondary'
                )}
              >
                {viewContext === 'user' ? 'USER' : 'ADMIN'}
              </span>
            </button>

            {/* Stealth Toggle */}
            <button
              onClick={() => {
                toggleStealth();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface transition-colors"
            >
              {stealthMode ? (
                <Eye className="h-4 w-4 text-accent" />
              ) : (
                <Ghost className="h-4 w-4 text-purple-500" />
              )}
              <span className="flex-1 text-left">
                {stealthMode ? 'Disable Stealth' : 'Enable Stealth'}
              </span>
              {stealthMode && (
                <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0 rounded">
                  ON
                </span>
              )}
            </button>

            <div className="my-1 border-t border-border" />

            {/* End Shadow */}
            <button
              onClick={() => {
                endShadow('manual');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="flex-1 text-left">End Shadow Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ShadowActivator — Button to open the user selector.
 * Placed in admin sidebar or admin dashboard toolbar.
 */
export function ShadowActivator({ onActivate }) {
  return (
    <button
      onClick={onActivate}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-500 hover:bg-purple-500/10 transition-colors border border-purple-500/20"
    >
      <Eye className="h-5 w-5 shrink-0" />
      <span>Shadow Mode</span>
      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
    </button>
  );
}
