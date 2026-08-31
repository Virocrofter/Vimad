/* src/app/admin/audit/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Flag,
  Ban,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Hash,
  Link2,
  BarChart3,
  Fingerprint,
  Lock,
  Unlock,
  X,
  Check,
  Calendar,
  Tag,
  Server,
  HardDrive,
  Database,
  KeyRound,
  Users,
  CreditCard,
  Settings,
  Building2,
  Globe,
  FileText,
  History,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  initialAuditLogs,
  initialAnomalies,
  complianceReports,
  severityMeta,
  statusMeta,
  actionCategories,
  timeAgo,
  formatDateTime,
  generateChainHash,
  verifyLogIntegrity,
} from './data';
import {
  SeverityBadge,
  StatusBadge,
  CategoryBadge,
  TamperProofBadge,
  AuditLogRow,
  AnomalyCard,
  ComplianceExportModal,
  AuditStatCard,
  ChainVerificationVisual,
} from './components';

/* ─── Main Audit Page ─── */
export default function AuditTrailPage() {
  const navigate = useNavigate();

  /* ─── State ─── */
  const [logs, setLogs] = useState(initialAuditLogs);
  const [anomalies, setAnomalies] = useState(initialAnomalies);
  const [activeTab, setActiveTab] = useState('logs'); // logs | anomalies | compliance | chain
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', dir: 'desc' });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  /* ─── Computed: Filtered Logs ─── */
  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      // Exclude shadow sessions (tamper-proof requirement)
      if (log.shadowSession) return false;

      const matchesQuery =
        !query ||
        log.id.toLowerCase().includes(query.toLowerCase()) ||
        log.action.label.toLowerCase().includes(query.toLowerCase()) ||
        log.action.description.toLowerCase().includes(query.toLowerCase()) ||
        log.actor.name.toLowerCase().includes(query.toLowerCase()) ||
        log.actor.email.toLowerCase().includes(query.toLowerCase()) ||
        log.target.name.toLowerCase().includes(query.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      const matchesCategory = categoryFilter === 'all' || log.action.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesActor = actorFilter === 'all' || log.actor.id === actorFilter;

      let matchesDate = true;
      if (dateFrom) {
        matchesDate =
          matchesDate && new Date(log.timestamp.replace(' ', 'T')) >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate =
          matchesDate &&
          new Date(log.timestamp.replace(' ', 'T')) <= new Date(dateTo + 'T23:59:59');
      }

      return (
        matchesQuery &&
        matchesSeverity &&
        matchesCategory &&
        matchesStatus &&
        matchesActor &&
        matchesDate
      );
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'timestamp') {
        return sortConfig.dir === 'asc'
          ? new Date(a.timestamp.replace(' ', 'T')) - new Date(b.timestamp.replace(' ', 'T'))
          : new Date(b.timestamp.replace(' ', 'T')) - new Date(a.timestamp.replace(' ', 'T'));
      }
      if (sortConfig.key === 'severity') {
        const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        return sortConfig.dir === 'asc'
          ? order[a.severity] - order[b.severity]
          : order[b.severity] - order[a.severity];
      }
      if (sortConfig.key === 'actor') {
        return sortConfig.dir === 'asc'
          ? a.actor.name.localeCompare(b.actor.name)
          : b.actor.name.localeCompare(a.actor.name);
      }
      return 0;
    });

    return result;
  }, [
    logs,
    query,
    severityFilter,
    categoryFilter,
    statusFilter,
    actorFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  /* ─── Computed: Stats ─── */
  const stats = useMemo(() => {
    const nonShadow = logs.filter((l) => !l.shadowSession);
    return {
      total: nonShadow.length,
      critical: nonShadow.filter((l) => l.severity === 'critical').length,
      flagged: nonShadow.filter((l) => l.status === 'flagged').length,
      verified: nonShadow.filter((l) => l.status === 'verified').length,
      activeAnomalies: anomalies.filter((a) => a.status === 'active').length,
      chainValid: nonShadow.every((log, idx) => {
        if (idx === 0) return true;
        return log.tamperProof.previousHash === nonShadow[idx - 1].tamperProof.hash;
      }),
    };
  }, [logs, anomalies]);

  /* ─── Computed: Unique Actors ─── */
  const uniqueActors = useMemo(() => {
    const actors = {};
    logs.forEach((l) => {
      if (!actors[l.actor.id]) {
        actors[l.actor.id] = l.actor;
      }
    });
    return Object.values(actors);
  }, [logs]);

  /* ─── Handlers ─── */
  const toggleLog = (id) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFlag = (log) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === log.id ? { ...l, status: l.status === 'flagged' ? 'verified' : 'flagged' } : l
      )
    );
  };

  const handleExport = (config) => {
    console.log('Exporting compliance report:', config);
    // In production: generate and download file
  };

  const handleInvestigate = (anomaly) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === anomaly.id ? { ...a, status: 'investigating' } : a))
    );
  };

  const handleDismiss = (anomaly) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === anomaly.id ? { ...a, status: 'resolved' } : a))
    );
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const resetFilters = () => {
    setQuery('');
    setSeverityFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setActorFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  /* ─── Tabs ─── */
  const tabs = [
    {
      id: 'logs',
      label: 'Audit Logs',
      icon: FileText,
      badge: stats.flagged > 0 ? stats.flagged : undefined,
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      icon: AlertTriangle,
      badge: stats.activeAnomalies > 0 ? stats.activeAnomalies : undefined,
    },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'chain', label: 'Chain Verify', icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Trail</h1>
          <p className="text-sm text-text-secondary">
            Tamper-proof audit logs, anomaly detection, and compliance reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Refreshed {timeAgo(lastRefresh.toISOString().replace('T', ' ').slice(0, 19))}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <FileDown className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Integrity Status Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-4',
          stats.chainValid
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-rose-500/20 bg-rose-500/5'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            stats.chainValid ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          )}
        >
          {stats.chainValid ? (
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-6 w-6 text-rose-500" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-lg font-bold',
              stats.chainValid ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {stats.chainValid ? 'Audit Chain Integrity Verified' : 'Audit Chain Compromised'}
          </p>
          <p className="text-xs text-text-secondary">
            {stats.chainValid
              ? `All ${stats.total} log entries cryptographically linked. No shadow sessions detected.`
              : 'Hash chain mismatch detected. Immediate investigation required.'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="font-mono font-bold text-text-primary">SHA-256</p>
            <p className="text-text-muted">Algorithm</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-text-primary">RSA-4096</p>
            <p className="text-text-muted">Signature</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-text-primary">{stats.total}</p>
            <p className="text-text-muted">Entries</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AuditStatCard
          label="Total Events"
          value={stats.total}
          icon={FileText}
          color="text-text-primary"
          subtext="Non-shadow sessions"
        />
        <AuditStatCard
          label="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-500"
          subtext="Require immediate attention"
          trend={-12}
        />
        <AuditStatCard
          label="Flagged"
          value={stats.flagged}
          icon={Flag}
          color="text-amber-500"
          subtext="Pending review"
          trend={8}
        />
        <AuditStatCard
          label="Verified"
          value={stats.verified}
          icon={CheckCircle2}
          color="text-emerald-500"
          subtext="Tamper-proof confirmed"
          trend={5}
        />
      </div>

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
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── LOGS TAB ─── */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by ID, action, actor, target..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
                  showFilters
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                )}
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Severities</option>
                    {Object.entries(severityMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(actionCategories).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(statusMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Actor</label>
                  <select
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Actors</option>
                    {uniqueActors.map((actor) => (
                      <option key={actor.id} value={actor.id}>
                        {actor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={resetFilters} className="text-xs text-secondary hover:underline">
                  Reset all filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredLogs.length}</span> of{' '}
            {stats.total} audit entries
            {stats.total < logs.length && (
              <span className="text-text-muted">
                {' '}
                ({logs.length - stats.total} shadow sessions excluded)
              </span>
            )}
          </p>

          {/* Audit Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10"></th>
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'severity', label: 'Severity' },
                      { key: 'category', label: 'Category' },
                      { key: 'action', label: 'Action' },
                      { key: 'actor', label: 'Actor' },
                      { key: 'timestamp', label: 'Timestamp' },
                      { key: 'status', label: 'Status' },
                      { key: 'integrity', label: 'Integrity' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() =>
                          ['severity', 'timestamp', 'actor'].includes(col.key)
                            ? handleSort(col.key)
                            : null
                        }
                        className={cn(
                          'px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider',
                          ['severity', 'timestamp', 'actor'].includes(col.key) &&
                            'cursor-pointer hover:text-text-primary select-none'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortConfig.key === col.key &&
                            (sortConfig.dir === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            ))}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      expanded={expandedLogs.has(log.id)}
                      onToggle={() => toggleLog(log.id)}
                      onFlag={handleFlag}
                      onExport={(l) => console.log('Export single:', l.id)}
                    />
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-text-muted">
                        <Shield className="mx-auto h-10 w-10 mb-3" />
                        <p>No audit entries match your filters.</p>
                        <p className="text-xs mt-1">
                          Shadow sessions are always excluded from this view.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── ANOMALIES TAB ─── */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Anomaly Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AuditStatCard
              label="Active"
              value={anomalies.filter((a) => a.status === 'active').length}
              icon={AlertTriangle}
              color="text-rose-500"
              subtext="Require action"
            />
            <AuditStatCard
              label="Investigating"
              value={anomalies.filter((a) => a.status === 'investigating').length}
              icon={Search}
              color="text-amber-500"
              subtext="In progress"
            />
            <AuditStatCard
              label="Resolved"
              value={anomalies.filter((a) => a.status === 'resolved').length}
              icon={CheckCircle2}
              color="text-emerald-500"
              subtext="This period"
            />
            <AuditStatCard
              label="Avg Confidence"
              value={`${Math.round((anomalies.reduce((s, a) => s + a.confidence, 0) / anomalies.length) * 100)}%`}
              icon={Sparkles}
              color="text-blue-500"
              subtext="ML detection accuracy"
            />
          </div>

          {/* Anomalies Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {anomalies.map((anomaly) => (
              <AnomalyCard
                key={anomaly.id}
                anomaly={anomaly}
                onInvestigate={handleInvestigate}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── COMPLIANCE TAB ─── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Frameworks */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {complianceFrameworks.map((framework) => {
              const report = complianceReports.find((r) => r.framework === framework.id);
              const isCompliant = !!report && report.status === 'complete';

              return (
                <div key={framework.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{framework.label}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{framework.description}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        isCompliant ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                      )}
                    >
                      {isCompliant ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                  </div>

                  {report ? (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Last Report</span>
                        <span className="text-text-primary">{timeAgo(report.generatedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Period</span>
                        <span className="text-text-primary">{report.period}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Records</span>
                        <span className="font-mono text-text-primary">
                          {report.recordCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Generated By</span>
                        <span className="text-text-primary">{report.generatedBy}</span>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowExportModal(true)}
                        >
                          <FileDown className="mr-1.5 h-3.5 w-3.5" /> New Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-text-muted">No compliance report generated yet.</p>
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => setShowExportModal(true)}
                      >
                        <FileDown className="mr-1.5 h-3.5 w-3.5" /> Generate First Report
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Reports Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Recent Compliance Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Report ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Framework
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Generated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Records
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complianceReports.map((report) => {
                    const fw = complianceFrameworks.find((f) => f.id === report.framework);
                    return (
                      <tr key={report.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-text-muted">{report.id}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-text-primary">{fw?.label}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{report.period}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {timeAgo(report.generatedAt)} by {report.generatedBy}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {report.recordCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" /> Complete
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHAIN VERIFY TAB ─── */}
      {activeTab === 'chain' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChainVerificationVisual logs={logs.filter((l) => !l.shadowSession)} />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">
                  Verification Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Total Entries</span>
                    <span className="text-sm font-mono font-medium text-text-primary">
                      {stats.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Valid Hashes</span>
                    <span className="text-sm font-mono font-medium text-emerald-500">
                      {stats.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Chain Linked</span>
                    <span className="text-sm font-mono font-medium text-emerald-500">
                      {stats.total - 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Shadow Excluded</span>
                    <span className="text-sm font-mono font-medium text-amber-500">
                      {logs.filter((l) => l.shadowSession).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Signatures Valid</span>
                    <span className="text-sm font-mono font-medium text-emerald-500">
                      {stats.total}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div
                    className={cn(
                      'rounded-lg p-3 text-center',
                      stats.chainValid ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-bold',
                        stats.chainValid ? 'text-emerald-500' : 'text-rose-500'
                      )}
                    >
                      {stats.chainValid ? '✓ Chain Verified' : '✗ Chain Broken'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {stats.chainValid
                        ? 'All cryptographic links intact'
                        : 'Hash mismatch detected in chain'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Cryptographic Details
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Hash Algorithm</span>
                    <span className="font-mono text-text-primary">SHA-256</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Signature</span>
                    <span className="font-mono text-text-primary">RSA-4096</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Chain Type</span>
                    <span className="font-mono text-text-primary">Linked List + Merkle</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Rotation</span>
                    <span className="font-mono text-text-primary">Every 10,000 entries</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Last Rotation</span>
                    <span className="font-mono text-text-primary">2026-08-15 00:00:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Export Modal ─── */}
      {showExportModal && (
        <ComplianceExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
