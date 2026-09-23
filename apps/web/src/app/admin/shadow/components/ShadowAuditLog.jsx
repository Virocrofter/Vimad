/* src/app/admin/shadow/components/ShadowAuditLog.jsx */
import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Zap,
  LogOut,
  LogIn,
  ArrowLeftRight,
  Ghost,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  Info,
  Monitor,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useShadowStore } from '../store';

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

const shadowActionLabels = {
  SESSION_STARTED: 'Session Started',
  SESSION_ENDED: 'Session Ended',
  SESSION_TAKEOVER: 'Session Takeover',
  STEALTH_ENABLED: 'Stealth Mode On',
  STEALTH_DISABLED: 'Stealth Mode Off',
  CONTEXT_SWITCHED: 'Context Switched',
  VIEWED_RESERVATION: 'Viewed Reservation',
  MODIFIED_GUEST_PROFILE: 'Modified Guest Profile',
  UPDATED_ROOM_STATUS: 'Updated Room Status',
  VIEWED_HOUSEKEEPING_REPORT: 'Viewed Housekeeping Report',
  VIEWED_EVENT: 'Viewed Event',
  MODIFIED_BEO: 'Modified BEO',
  VIEWED_BILLING_DASHBOARD: 'Viewed Billing Dashboard',
  RATE_OVERRIDE: 'Rate Override',
  POSTED_PAYMENT: 'Posted Payment',
  SENT_MESSAGE: 'Sent Message',
  EXPORTED_DATA: 'Exported Data',
  DELETED_RECORD: 'Deleted Record',
};

/**
 * ShadowAuditLog — Dedicated audit trail for shadow sessions.
 * Completely separate from the main platform audit log.
 * Data source: the shadow store's sessionHistory / current session action mirror.
 */
export function ShadowAuditLog() {
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const sessionHistory = useShadowStore((s) => s.sessionHistory);
  const isShadowActive = useShadowStore((s) => s.isShadowActive);
  const shadowSessionId = useShadowStore((s) => s.shadowSessionId);
  const getCurrentSessionActions = useShadowStore((s) => s.getCurrentSessionActions);

  // Combine archived + current session actions
  const allActions = useMemo(() => {
    const current = isShadowActive ? getCurrentSessionActions() : [];
    return [...sessionHistory, ...current].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [sessionHistory, isShadowActive, getCurrentSessionActions]);

  const filteredActions = useMemo(() => {
    return allActions.filter((a) => {
      const matchesQuery =
        !query ||
        (a.targetUserName && a.targetUserName.toLowerCase().includes(query.toLowerCase())) ||
        (a.adminUserName && a.adminUserName.toLowerCase().includes(query.toLowerCase())) ||
        (a.action && a.action.toLowerCase().includes(query.toLowerCase())) ||
        (a.sessionId && a.sessionId.toLowerCase().includes(query.toLowerCase()));
      const matchesAction = actionFilter === 'all' || a.action === actionFilter;
      return matchesQuery && matchesAction;
    });
  }, [allActions, query, actionFilter]);

  // Group by session
  const groupedBySession = useMemo(() => {
    const groups = {};
    filteredActions.forEach((action) => {
      const sid = action.sessionId || 'unknown';
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(action);
    });
    return groups;
  }, [filteredActions]);

  const toggleSession = (sid) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  // Unique action types for filter
  const actionTypes = useMemo(() => {
    const types = new Set(allActions.map((a) => a.action));
    return Array.from(types).sort();
  }, [allActions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" /> Shadow Audit Trail
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {allActions.length} actions across {Object.keys(groupedBySession).length} sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
              showFilters
                ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by user, action, session ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {shadowActionLabels[type] || type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {Object.entries(groupedBySession).map(([sid, actions]) => {
          const isExpanded = expandedSessions.has(sid);
          const firstAction = actions[0];
          const isCurrent = isShadowActive && sid === shadowSessionId;

          return (
            <div
              key={sid}
              className={cn(
                'rounded-xl border overflow-hidden transition-colors',
                isCurrent ? 'border-purple-500/30 bg-purple-500/5' : 'border-border bg-surface'
              )}
            >
              {/* Session Header */}
              <button
                onClick={() => toggleSession(sid)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-background/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 shrink-0">
                  <Eye className="h-4 w-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary font-mono">{sid}</span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0 text-[10px] font-medium text-purple-500">
                        <Monitor className="h-2.5 w-2.5" /> Active
                      </span>
                    )}
                    {firstAction?.stealth && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral/10 border border-border px-2 py-0 text-[10px] font-medium text-text-muted">
                        <Ghost className="h-2.5 w-2.5" /> Stealth
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    {firstAction?.targetUserName && (
                      <span>
                        Target:{' '}
                        <strong className="text-text-secondary">
                          {firstAction.targetUserName}
                        </strong>
                      </span>
                    )}
                    {firstAction?.adminUserName && (
                      <>
                        <span>·</span>
                        <span>By: {firstAction.adminUserName}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{actions.length} actions</span>
                  </div>
                </div>
                <span className="text-xs text-text-muted shrink-0">
                  {firstAction?.timestamp?.split(' ')[0]}
                </span>
              </button>

              {/* Expanded Actions */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className="divide-y divide-border">
                    {actions.map((action, idx) => (
                      <AuditActionRow key={action.id || idx} action={action} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(groupedBySession).length === 0 && (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-text-muted">
            <Shield className="mx-auto h-10 w-10 mb-3" />
            <p className="text-sm">No shadow actions match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Individual Action Row ─── */
function AuditActionRow({ action }) {
  const config = getActionConfig(action.action);
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-background/30 transition-colors">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
          config.bg
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            {shadowActionLabels[action.action] || action.action}
          </span>
          {action.stealth && <Ghost className="h-3 w-3 text-text-muted" />}
        </div>
        {action.details && Object.keys(action.details).length > 0 && (
          <p className="mt-0.5 text-xs text-text-muted font-mono">
            {JSON.stringify(action.details)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
          <Clock className="h-3 w-3" />
          {action.timestamp}
          {action.duration && (
            <>
              <span>·</span>
              <span>Duration: {formatDuration(action.duration)}</span>
            </>
          )}
          {action.reason && (
            <>
              <span>·</span>
              <span>Reason: {action.reason}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Action Type Config ─── */
function getActionConfig(action) {
  const configs = {
    SESSION_STARTED: { icon: LogIn, color: 'text-accent', bg: 'bg-accent/10' },
    SESSION_ENDED: { icon: LogOut, color: 'text-danger', bg: 'bg-danger/10' },
    SESSION_TAKEOVER: { icon: Zap, color: 'text-warning', bg: 'bg-warning/10' },
    STEALTH_ENABLED: { icon: Ghost, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    STEALTH_DISABLED: { icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    CONTEXT_SWITCHED: { icon: ArrowLeftRight, color: 'text-info', bg: 'bg-info/10' },
  };
  return configs[action] || { icon: Info, color: 'text-text-muted', bg: 'bg-neutral/10' };
}
