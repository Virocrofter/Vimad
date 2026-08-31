/* src/app/admin/shadow/components/ShadowUserSelector.jsx */
import { useState, useMemo } from 'react';
import {
  Search, User, Eye, Zap, Monitor, X, Shield, Clock,
  MapPin, Mail, ChevronRight, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useShadowStore } from '../store';
import {
  shadowableUsers,
  roleConfig,
  userStatusConfig,
  moduleLabels,
} from '../data';

export function ShadowUserSelector({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [mode, setMode] = useState('impersonate'); // 'impersonate' | 'takeover'
  const [showConfirm, setShowConfirm] = useState(false);
  
  const startShadow = useShadowStore((s) => s.startShadow);
  const takeoverSession = useShadowStore((s) => s.takeoverSession);
  const originalUser = useShadowStore((s) => s.originalUser) || {
    id: 'ADM-001',
    name: 'Super Admin',
    role: 'super_admin',
    email: 'admin@unifiedpms.com',
  };

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return shadowableUsers;
    const q = query.toLowerCase();
    return shadowableUsers.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.property.toLowerCase().includes(q)
    );
  }, [query]);

  const onlineUsers = filteredUsers.filter((u) => u.status === 'online');
  const offlineUsers = filteredUsers.filter((u) => u.status !== 'online');

  const handleSelect = (user) => {
    setSelectedUser(user);
    setMode(user.currentSession ? 'takeover' : 'impersonate');
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!selectedUser) return;
    
    if (mode === 'takeover' && selectedUser.currentSession) {
      takeoverSession(selectedUser.currentSession, originalUser);
    } else {
      startShadow(selectedUser, originalUser);
    }
    
    onClose();
    setSelectedUser(null);
    setShowConfirm(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-border bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Shadow Mode</h3>
              <p className="text-xs text-text-muted">Impersonate any user undetected</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirm Panel */}
        {showConfirm && selectedUser ? (
          <div className="p-6 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-lg font-bold text-secondary">
                  {selectedUser.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-text-primary">{selectedUser.name}</h4>
                  <p className="text-sm text-text-muted">{selectedUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="h-4 w-4 text-text-muted" />
                  {selectedUser.property}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="h-4 w-4 text-text-muted" />
                  {selectedUser.department}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Shield className="h-4 w-4 text-text-muted" />
                  {selectedUser.permissions.length} permissions
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="h-4 w-4 text-text-muted" />
                  Last active: {selectedUser.lastActive.split(' ')[1]}
                </div>
              </div>

              {selectedUser.currentSession && (
                <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Monitor className="h-4 w-4" />
                    <span className="font-medium">Active Session Detected</span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    IP: {selectedUser.currentSession.ip} · {selectedUser.currentSession.userAgent}
                  </p>
                  <p className="text-xs text-text-muted">
                    Started: {selectedUser.currentSession.startedAt}
                  </p>
                </div>
              )}
            </div>

            {/* Mode Selection */}
            {selectedUser.currentSession && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Entry Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('impersonate')}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-4 text-left transition-all',
                      mode === 'impersonate'
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <Eye className={cn('h-5 w-5', mode === 'impersonate' ? 'text-secondary' : 'text-text-muted')} />
                    <div>
                      <p className={cn('text-sm font-medium', mode === 'impersonate' ? 'text-secondary' : 'text-text-primary')}>Fresh Impersonation</p>
                      <p className="text-xs text-text-muted">Start new session as this user</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('takeover')}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-4 text-left transition-all',
                      mode === 'takeover'
                        ? 'border-danger bg-danger/5'
                        : 'border-border bg-surface hover:border-danger/30'
                    )}
                  >
                    <Zap className={cn('h-5 w-5', mode === 'takeover' ? 'text-danger' : 'text-text-muted')} />
                    <div>
                      <p className={cn('text-sm font-medium', mode === 'takeover' ? 'text-danger' : 'text-text-primary')}>Session Takeover</p>
                      <p className="text-xs text-text-muted">Hijack their active session</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                Shadow mode bypasses normal audit trails. All actions will appear as {selectedUser.name}. 
                Use responsibly.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Back
              </Button>
              <Button onClick={handleConfirm} variant={mode === 'takeover' ? 'danger' : 'primary'}>
                <Eye className="mr-1.5 h-4 w-4" />
                {mode === 'takeover' ? 'Take Over Session' : 'Start Shadow'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-6 py-4 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search users by name, email, role, department..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* Online Users */}
              {onlineUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Online ({onlineUsers.length})
                  </h4>
                  <div className="space-y-1">
                    {onlineUsers.map((user) => (
                      <UserRow key={user.id} user={user} onSelect={handleSelect} />
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Users */}
              {offlineUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
                    Offline / Away ({offlineUsers.length})
                  </h4>
                  <div className="space-y-1">
                    {offlineUsers.map((user) => (
                      <UserRow key={user.id} user={user} onSelect={handleSelect} />
                    ))}
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-text-muted">
                  <User className="mx-auto h-10 w-10 mb-3" />
                  <p>No users match your search.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function UserRow({ user, onSelect }) {
  const roleMeta = roleConfig[user.role] || roleConfig.readonly;
  const statusMeta = userStatusConfig[user.status] || userStatusConfig.offline;

  return (
    <button
      onClick={() => onSelect(user)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-secondary/30 hover:bg-surface-elevated group"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
        {user.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">{user.name}</span>
          {user.currentSession && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-1.5 py-0 text-[10px] font-medium text-accent">
              <Monitor className="h-2.5 w-2.5" /> Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-[10px] font-medium uppercase tracking-wider', roleMeta.color)}>
            {roleMeta.label}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-[10px] text-text-muted truncate">{user.property}</span>
          <span className="text-text-muted">·</span>
          <span className="text-[10px] text-text-muted">{user.department}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', statusMeta.dot)} />
        <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function RoleBadge({ role }) {
  const meta = roleConfig[role] || roleConfig.readonly;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.bg, meta.color, meta.border)}>
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = userStatusConfig[status] || userStatusConfig.offline;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
