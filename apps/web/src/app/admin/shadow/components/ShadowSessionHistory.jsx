/* src/app/admin/shadow/components/ShadowSessionHistory.jsx */
import { useState, useMemo } from 'react';
import {
  History,
  Eye,
  Zap,
  Ghost,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
  X,
  Trash2,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useShadowStore } from '../store';
import { formatDuration, roleConfig } from '../data';

/**
 * ShadowSessionHistory — Archive of all completed shadow sessions.
 * Shows who was impersonated, by whom, for how long, and what actions were taken.
 */
export function ShadowSessionHistory() {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('endTime'); // 'endTime' | 'duration' | 'targetUser'

  const sessionHistory = useShadowStore((s) => s.sessionHistory);
  const clearHistory = useShadowStore((s) => s.clearHistory);

  // Extract archived sessions (entries with endTime)
  const archivedSessions = useMemo(() => {
    const sessions = new Map();
    sessionHistory.forEach((entry) => {
      if (entry.endTime && entry.id) {
        if (!sessions.has(entry.id)) {
          sessions.set(entry.id, entry);
        }
      }
    });
    return Array.from(sessions.values());
  }, [sessionHistory]);

  const filtered = useMemo(() => {
    let result = archivedSessions.filter((s) => {
      const q = query.toLowerCase();
      return (
        !q ||
        s.shadowUser?.name?.toLowerCase().includes(q) ||
        s.shadowUser?.email?.toLowerCase().includes(q) ||
        s.originalUser?.name?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'endTime') return new Date(b.endTime) - new Date(a.endTime);
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      if (sortBy === 'targetUser')
        return (a.shadowUser?.name || '').localeCompare(b.shadowUser?.name || '');
      return 0;
    });

    return result;
  }, [archivedSessions, query, sortBy]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExport = () => {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <History className="h-4 w-4 text-purple-500" /> Session Archive
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {archivedSessions.length} completed shadow sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-danger border-danger/30 hover:bg-danger/10"
            onClick={clearHistory}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search sessions by user, admin, ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="endTime">Sort by Date</option>
            <option value="duration">Sort by Duration</option>
            <option value="targetUser">Sort by User</option>
          </select>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {filtered.map((session) => {
          const isExpanded = expandedId === session.id;
          const shadowMeta = roleConfig[session.shadowUser?.role] || roleConfig.readonly;

          return (
            <div
              key={session.id}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              {/* Session Card Header */}
              <button
                onClick={() => toggleExpand(session.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-background/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                )}

                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    shadowMeta.bg
                  )}
                >
                  <Eye className={cn('h-4 w-4', shadowMeta.color)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {session.shadowUser?.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase tracking-wider',
                        shadowMeta.color
                      )}
                    >
                      {shadowMeta.label}
                    </span>
                    {session.stealth && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral/10 border border-border px-2 py-0 text-[10px] font-medium text-text-muted">
                        <Ghost className="h-2.5 w-2.5" /> Stealth
                      </span>
                    )}
                    {session.takenOverSession && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0 text-[10px] font-medium text-warning">
                        <Zap className="h-2.5 w-2.5" /> Takeover
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span className="font-mono">{session.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.duration)}
                    </span>
                    <span>·</span>
                    <span>By {session.originalUser?.name}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-text-muted">{session.endTime?.split(' ')[0]}</p>
                  <p className="text-[10px] text-text-muted">
                    {session.endTime?.split(' ')[1]?.slice(0, 5)}
                  </p>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* User Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                        Target User
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                          {session.shadowUser?.avatar ||
                            session.shadowUser?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {session.shadowUser?.name}
                          </p>
                          <p className="text-xs text-text-muted">{session.shadowUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                        Shadow Admin
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-500">
                          {session.originalUser?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {session.originalUser?.name}
                          </p>
                          <p className="text-xs text-text-muted">{session.originalUser?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                      Session Timeline
                    </p>
                    <div className="space-y-2">
                      {session.actionsTaken?.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 mt-0.5">
                            <Clock className="h-3 w-3 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary">{action.action}</p>
                            {action.details && (
                              <p className="text-xs text-text-muted font-mono">
                                {JSON.stringify(action.details)}
                              </p>
                            )}
                            <p className="text-[10px] text-text-muted">{action.timestamp}</p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-xs text-text-muted italic">
                          No detailed actions recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Session Meta */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-text-muted">
                    <span className="rounded-full bg-background border border-border px-2 py-0.5">
                      Started: {session.startTime}
                    </span>
                    <span className="rounded-full bg-background border border-border px-2 py-0.5">
                      Ended: {session.endTime}
                    </span>
                    <span className="rounded-full bg-background border border-border px-2 py-0.5">
                      Reason: {session.reason}
                    </span>
                    {session.takenOverSession && (
                      <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-warning">
                        Taken Over: {session.takenOverSession}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-text-muted">
            <History className="mx-auto h-10 w-10 mb-3" />
            <p className="text-sm">No shadow sessions in archive.</p>
            <p className="text-xs mt-1">Completed sessions appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
