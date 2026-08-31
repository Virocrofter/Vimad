/* src/app/admin/shadow/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Shield, Zap, Ghost, Users, Clock, Activity,
  AlertTriangle, CheckCircle2, TrendingUp, History,
  BarChart3, Lock, Unlock, Terminal, Radio
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useShadowStore } from './store';
import { ShadowUserSelector } from './components/ShadowUserSelector';
import { ShadowAuditLog } from './components/ShadowAuditLog';
import { ShadowSessionHistory } from './components/ShadowSessionHistory';
import { shadowableUsers, formatDuration } from './data';

/* ─── Stat Card ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', color.replace('text-', 'bg-').replace('purple-500', 'purple-500/10').replace('danger', 'danger/10').replace('accent', 'accent/10').replace('warning', 'warning/10').replace('info', 'info/10'))}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── User Mini Card ─── */
function UserMiniCard({ user, onSelect }) {
  const statusColor = user.status === 'online' ? 'bg-accent' : user.status === 'away' ? 'bg-warning' : 'bg-text-muted';
  
  return (
    <button
      onClick={() => onSelect(user)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-purple-500/30 hover:bg-purple-500/5 group"
    >
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
          {user.avatar}
        </div>
        <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface', statusColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
        <p className="text-[10px] text-text-muted">{user.role} · {user.property}</p>
      </div>
      <Eye className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

/* ─── Main Page ─── */
export default function ShadowModePage() {
  const navigate = useNavigate();
  const [showSelector, setShowSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit' | 'history'
  const [selectedQuickUser, setSelectedQuickUser] = useState(null);
  
  const isShadowActive = useShadowStore((s) => s.isShadowActive);
  const shadowUser = useShadowStore((s) => s.shadowUser);
  const stealthMode = useShadowStore((s) => s.stealthMode);
  const sessionHistory = useShadowStore((s) => s.sessionHistory);
  const startShadow = useShadowStore((s) => s.startShadow);
  const endShadow = useShadowStore((s) => s.endShadow);
  const toggleStealth = useShadowStore((s) => s.toggleStealth);

  const originalUser = {
    id: 'ADM-001',
    name: 'Super Admin',
    role: 'super_admin',
    email: 'admin@unifiedpms.com',
  };

  // Stats
  const onlineCount = shadowableUsers.filter((u) => u.status === 'online').length;
  const totalSessions = sessionHistory.filter((h) => h.endTime && h.id).length;
  const activeSessions = shadowableUsers.filter((u) => u.currentSession).length;
  const stealthSessions = sessionHistory.filter((h) => h.stealth).length;

  const handleQuickShadow = (user) => {
    setSelectedQuickUser(user);
    setShowSelector(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
    { id: 'history', label: 'Session Archive', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Shadow Mode</h1>
              <p className="text-sm text-text-secondary">Impersonate users undetected by standard audit</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isShadowActive ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'border-purple-500/30',
                  stealthMode ? 'text-accent bg-accent/5' : 'text-purple-500 bg-purple-500/5'
                )}
                onClick={toggleStealth}
              >
                {stealthMode ? <Unlock className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
                {stealthMode ? 'Disable Stealth' : 'Enable Stealth'}
              </Button>
              <Button variant="danger" size="sm" onClick={() => endShadow('manual')}>
                <Zap className="mr-1.5 h-4 w-4" /> End Shadow
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setShowSelector(true)}>
              <Eye className="mr-1.5 h-4 w-4" /> Start Shadow
            </Button>
          )}
        </div>
      </div>

      {/* Active Session Banner (if active) */}
      {isShadowActive && shadowUser && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 border-2 border-purple-500/30">
                <Eye className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-text-primary">Shadow Session Active</h3>
                  <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0 text-[10px] font-mono font-medium text-purple-500">
                    {shadowUser.sessionId?.slice(0, 16)}
                  </span>
                  {stealthMode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral/10 border border-border px-2 py-0 text-[10px] font-medium text-text-muted">
                      <Ghost className="h-2.5 w-2.5" /> Stealth
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">
                  Viewing as <strong className="text-text-primary">{shadowUser.name}</strong> ({shadowUser.role}) 
                  at <strong className="text-text-primary">{shadowUser.property}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/app/dashboard')}>
                <Terminal className="mr-1.5 h-3.5 w-3.5" /> Enter as User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active ? 'border-purple-500 text-purple-500' : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Online Users"
              value={onlineCount}
              icon={Radio}
              color="text-accent"
              subtext={`of ${shadowableUsers.length} total`}
            />
            <StatCard
              label="Active Sessions"
              value={activeSessions}
              icon={Users}
              color="text-info"
              subtext="Currently logged in"
            />
            <StatCard
              label="Shadow Sessions"
              value={totalSessions}
              icon={Eye}
              color="text-purple-500"
              subtext="Completed impersonations"
            />
            <StatCard
              label="Stealth Sessions"
              value={stealthSessions}
              icon={Ghost}
              color="text-warning"
              subtext="Undetected operations"
            />
          </div>

          {/* Quick Access + Live Users */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick Shadow Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" /> Available Targets
                </h3>
                <Button size="sm" variant="outline" onClick={() => setShowSelector(true)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Browse All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shadowableUsers.slice(0, 6).map((user) => (
                  <UserMiniCard key={user.id} user={user} onSelect={handleQuickShadow} />
                ))}
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" /> Shadow Protocol
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Invisible to Audit</p>
                      <p className="text-xs text-text-muted">Actions appear as the target user in standard logs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                      <Ghost className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Stealth Mode</p>
                      <p className="text-xs text-text-muted">Hide all UI indicators while shadowing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/10">
                      <Zap className="h-3.5 w-3.5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Session Takeover</p>
                      <p className="text-xs text-text-muted">Hijack live user sessions in real-time</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/10">
                      <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Isolated Logging</p>
                      <p className="text-xs text-text-muted">Shadow actions logged separately — super admin only</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Shortcuts</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Toggle Stealth</span>
                    <kbd className="rounded bg-background border border-border px-2 py-0.5 font-mono text-text-muted">Ctrl + Shift + S</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">End Shadow</span>
                    <kbd className="rounded bg-background border border-border px-2 py-0.5 font-mono text-text-muted">Ctrl + Shift + X</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Switch Context</span>
                    <kbd className="rounded bg-background border border-border px-2 py-0.5 font-mono text-text-muted">Ctrl + Shift + C</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── AUDIT TAB ─── */}
      {activeTab === 'audit' && <ShadowAuditLog />}

      {/* ─── HISTORY TAB ─── */}
      {activeTab === 'history' && <ShadowSessionHistory />}

      {/* User Selector Modal */}
      <ShadowUserSelector isOpen={showSelector} onClose={() => { setShowSelector(false); setSelectedQuickUser(null); }} />
    </div>
  );
}
