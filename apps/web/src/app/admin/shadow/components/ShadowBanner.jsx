/* src/app/admin/shadow/components/ShadowBanner.jsx */
import { useState, useEffect } from 'react';
import {
  Eye, X, LogOut, Shield, Clock, ChevronUp, ChevronDown,
  User, ArrowLeftRight, Zap
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useShadowStore } from '../store';
import { formatDuration } from '../data';

/**
 * ShadowBanner — Persistent indicator when shadow mode is active.
 * Collapsible, shows session info, quick actions.
 * Respects stealth mode (hidden when stealth is on).
 */
export function ShadowBanner() {
  const [collapsed, setCollapsed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  const isShadowActive = useShadowStore((s) => s.isShadowActive);
  const shadowUser = useShadowStore((s) => s.shadowUser);
  const originalUser = useShadowStore((s) => s.originalUser);
  const stealthMode = useShadowStore((s) => s.stealthMode);
  const shadowStartTime = useShadowStore((s) => s.shadowStartTime);
  const viewContext = useShadowStore((s) => s.viewContext);
  const endShadow = useShadowStore((s) => s.endShadow);
  const setViewContext = useShadowStore((s) => s.setViewContext);
  const toggleStealth = useShadowStore((s) => s.toggleStealth);
  const getSessionDuration = useShadowStore((s) => s.getSessionDuration);

  // Update elapsed time every second
  useEffect(() => {
    if (!isShadowActive) return;
    const interval = setInterval(() => {
      setElapsed(getSessionDuration());
    }, 1000);
    return () => clearInterval(interval);
  }, [isShadowActive, getSessionDuration]);

  if (!isShadowActive || !shadowUser) return null;

  // In stealth mode, render nothing (admin must know the keyboard shortcut)
  if (stealthMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleStealth}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-500 hover:bg-purple-500/30 transition-colors"
          title="Stealth mode active — click to reveal"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed left-0 right-0 z-50 transition-all duration-300',
      collapsed ? 'bottom-0' : 'bottom-0'
    )}>
      <div className={cn(
        'mx-auto max-w-7xl px-4 transition-all duration-300',
        collapsed ? 'translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'
      )}>
        <div className="rounded-t-xl border border-purple-500/20 bg-purple-500/10 backdrop-blur-md shadow-lg">
          {/* Collapse Handle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-1.5 hover:bg-purple-500/5 rounded-t-xl transition-colors"
          >
            {collapsed ? <ChevronUp className="h-4 w-4 text-purple-500" /> : <ChevronDown className="h-4 w-4 text-purple-500" />}
          </button>

          {!collapsed && (
            <div className="px-4 pb-3 pt-1">
              <div className="flex items-center justify-between">
                {/* Left: Identity */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                    <Eye className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-purple-500">Shadow Mode Active</span>
                      <span className="rounded-full bg-purple-500/20 px-1.5 py-0 text-[10px] font-mono font-medium text-purple-500">
                        {shadowUser.sessionId?.slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Viewing as <strong className="text-text-primary">{shadowUser.name}</strong>
                      </span>
                      <span className="text-text-muted">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(elapsed)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Context Toggle */}
                <div className="hidden md:flex items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-500/5 p-1">
                  <button
                    onClick={() => setViewContext('user')}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      viewContext === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'text-purple-500 hover:bg-purple-500/10'
                    )}
                  >
                    As User
                  </button>
                  <button
                    onClick={() => setViewContext('admin')}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      viewContext === 'admin'
                        ? 'bg-purple-500 text-white'
                        : 'text-purple-500 hover:bg-purple-500/10'
                    )}
                  >
                    As Admin
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleStealth}
                    className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-500 hover:bg-purple-500/10 transition-colors"
                    title="Hide all shadow indicators"
                  >
                    <Zap className="h-3 w-3" /> Stealth
                  </button>
                  <button
                    onClick={() => setViewContext(viewContext === 'user' ? 'admin' : 'user')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-500 hover:bg-purple-500/10 transition-colors md:hidden"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {viewContext === 'user' ? 'Admin' : 'User'}
                  </button>
                  <button
                    onClick={() => endShadow('manual')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-danger/20 bg-danger/5 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-3 w-3" /> End Shadow
                  </button>
                </div>
              </div>

              {/* Session Details Bar */}
              <div className="mt-2 flex items-center gap-4 text-[10px] text-text-muted border-t border-purple-500/10 pt-2">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Original: {originalUser?.name || 'Unknown'}
                </span>
                <span>·</span>
                <span>Role: {shadowUser.role}</span>
                <span>·</span>
                <span>Property: {shadowUser.property}</span>
                {shadowUser.takenOverSession && (
                  <>
                    <span>·</span>
                    <span className="text-warning flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Session Takeover: {shadowUser.takenOverSession}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
