import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardList,
  Download,
  RefreshCw,
  Shield,
  Eye,
  X,
  Search,
  AlertCircle,
  User,
  ArrowUpDown,
  Calendar,
  Users,
  BedDouble,
  DollarSign,
  Settings,
  Globe,
  Activity,
  KeyRound,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  AUDIT_SEVERITIES,
  fetchTenantAuditLogs,
  exportTenantAuditLogsCsv,
} from '../../../../api/audit';

/* ─── Category metadata (labels + icons) ─── */
const CATEGORY_META = {
  reservation: { label: 'Reservations', icon: Calendar },
  guest: { label: 'Guests', icon: Users },
  folio: { label: 'Billing & Folios', icon: DollarSign },
  billing: { label: 'Billing & Folios', icon: DollarSign },
  room: { label: 'Rooms', icon: BedDouble },
  housekeeping: { label: 'Housekeeping', icon: BedDouble },
  rate: { label: 'Rates', icon: DollarSign },
  channel: { label: 'Channels', icon: Globe },
  task: { label: 'Tasks', icon: Activity },
  auth: { label: 'Auth & Security', icon: KeyRound },
  security: { label: 'Auth & Security', icon: KeyRound },
  settings: { label: 'Settings', icon: Settings },
  loyalty: { label: 'Loyalty', icon: Users },
  night_audit: { label: 'Night Audit', icon: Activity },
  concierge: { label: 'Concierge', icon: Activity },
  parking: { label: 'Parking', icon: Activity },
  user: { label: 'Users', icon: Users },
  system: { label: 'System', icon: Settings },
  general: { label: 'General', icon: Activity },
};

const SEVERITY_STYLES = {
  critical: 'bg-danger/10 text-danger border-danger/20',
  high: 'bg-danger/5 text-danger border-danger/10',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-info/10 text-info border-info/20',
  info: 'bg-surface-elevated text-text-secondary border-border',
};

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function SeverityBadge({ severity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
      )}
    >
      {severity}
    </span>
  );
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.general;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── Page ─── */
export default function AuditLogsPage() {
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchTenantAuditLogs({
        page,
        pageSize: 25,
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setEntries(res.data || []);
      setMeta(res.meta);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, severityFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.user.name.toLowerCase().includes(q) ||
        e.action.label.toLowerCase().includes(q) ||
        e.action.type.toLowerCase().includes(q) ||
        e.resource.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const stats = useMemo(() => {
    const src = filteredEntries;
    return {
      total: meta.total,
      critical: src.filter((e) => e.severity === 'critical' || e.severity === 'high').length,
      medium: src.filter((e) => e.severity === 'medium' || e.severity === 'low').length,
      info: src.filter((e) => e.severity === 'info').length,
    };
  }, [filteredEntries, meta.total]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTenantAuditLogsCsv({
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Trail</h1>
          <p className="text-sm text-text-secondary">
            Immutable log of every action taken across your properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting || meta.total === 0}
          >
            <Download className="mr-1.5 h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Events</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Critical / High</p>
          <p className="mt-1 text-xl font-bold font-mono text-danger">{stats.critical}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Medium / Low</p>
          <p className="mt-1 text-xl font-bold font-mono text-warning">{stats.medium}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Info</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">{stats.info}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, action, resource…"
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_META).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All severities</option>
          {AUDIT_SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-text-muted">
                    Loading audit trail…
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-text-muted">
                    <ClipboardList className="mx-auto h-10 w-10 mb-3" />
                    <p>No audit entries match your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const meta = CATEGORY_META[entry.category] || CATEGORY_META.general;
                  const ActionIcon = meta.icon;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="group cursor-pointer hover:bg-surface/50"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-text-secondary text-xs">
                            {formatTimestamp(entry.timestamp)}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono">
                            {entry.timestamp.slice(11, 19)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={entry.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-[10px] font-bold text-secondary">
                              {entry.user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {entry.user.name}
                              </p>
                              <p className="text-[10px] text-text-muted">{entry.user.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ActionIcon className="h-4 w-4 text-text-muted" />
                            <span className="text-sm text-text-primary">{entry.action.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-text-primary">{entry.resource.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">
                            {entry.resource.id}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={entry.category} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 bg-background/50">
                            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
                              <p className="text-sm text-text-secondary">{entry.description}</p>
                              {entry.changes.length > 0 && (
                                <div className="space-y-2">
                                  {entry.changes.map((change, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs">
                                      <span className="font-medium text-text-muted w-24">
                                        {change.field}
                                      </span>
                                      <span className="rounded bg-danger/5 border border-danger/20 px-2 py-0.5 font-mono text-danger">
                                        {change.old}
                                      </span>
                                      <ArrowUpDown className="h-3 w-3 text-text-muted" />
                                      <span className="rounded bg-accent/5 border border-accent/20 px-2 py-0.5 font-mono text-accent">
                                        {change.new}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-4 pt-2 border-t border-border text-[10px] text-text-muted">
                                <span className="font-mono">Session: {entry.sessionId}</span>
                                <span>IP: {entry.user.ip}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-text-muted">
              Page {meta.page} of {meta.totalPages} · {meta.total.toLocaleString()} events
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Footer */}
      <div className="rounded-lg border border-border bg-surface p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">Compliance & Data Retention</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit logs are immutable and retained per PCI DSS and GDPR requirements. Use Export CSV
            for compliance officers and authorized administrators. All access to this page is itself
            logged.
          </p>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedEntry && (
        <AuditDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}

/* ─── Detail Drawer ─── */
function AuditDetailDrawer({ entry, onClose }) {
  const meta = CATEGORY_META[entry.category] || CATEGORY_META.general;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{entry.action.label}</h3>
            <p className="text-xs text-text-muted">{formatTimestamp(entry.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={entry.severity} />
            <CategoryBadge category={entry.category} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
              Actor
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                {entry.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{entry.user.name}</p>
                <p className="text-xs text-text-muted">{entry.user.role}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-text-muted">IP Address</p>
                <p className="font-mono text-text-primary">{entry.user.ip}</p>
              </div>
              <div>
                <p className="text-text-muted">Session</p>
                <p className="font-mono text-text-primary">{entry.sessionId}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
              Resource
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Type</span>
                <span className="text-text-primary">{entry.resource.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Name</span>
                <span className="text-text-primary">{entry.resource.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">ID</span>
                <span className="font-mono text-xs text-text-primary">{entry.resource.id}</span>
              </div>
            </div>
          </div>

          {entry.description && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Description
              </p>
              <p className="text-sm text-text-secondary">{entry.description}</p>
            </div>
          )}

          {entry.changes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Changes
              </p>
              <div className="space-y-2">
                {entry.changes.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 font-medium text-text-muted">{c.field}</span>
                    <span className="rounded bg-danger/5 border border-danger/20 px-2 py-0.5 font-mono text-danger">
                      {c.old}
                    </span>
                    <ArrowUpDown className="h-3 w-3 text-text-muted" />
                    <span className="rounded bg-accent/5 border border-accent/20 px-2 py-0.5 font-mono text-accent">
                      {c.new}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
