/* src/app/admin/security/page.jsx */
import { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Globe,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Download,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  Users,
  KeyRound,
  Server,
  ChevronDown,
  ChevronUp,
  Ban,
  Check,
  X,
  Fingerprint,
  Wifi,
  WifiOff,
  Siren,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

import {
  securityOverview,
  failedLogins,
  suspiciousActivity,
  twoFAPolicies,
  ipAllowlists,
  breachScenarios,
  threatSeverityMeta,
  alertStatusMeta,
  threatLevelMeta,
  activityTypeMeta,
  timeAgo,
  formatNumber,
} from './data';

import {
  SecurityStatCard,
  ThreatLevelIndicator,
  SeverityBadge,
  AlertStatusBadge,
  ActivityTypeBadge,
  CountryBadge,
  FailedLoginRow,
  SuspiciousActivityRow,
  TwoFAPolicyCard,
  IPAllowlistCard,
  SimpleWorldMap,
  PasswordPolicyDisplay,
} from './components';

/* ─── Main Security Page ─── */
export default function SecurityPage() {
  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState('overview'); // overview | failed-logins | suspicious | access-control | breach-sim
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogins, setExpandedLogins] = useState(new Set());
  const [expandedActivity, setExpandedActivity] = useState(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  /* ─── Overview Stats ─── */
  const stats = useMemo(() => {
    const overview = securityOverview[0] || {};
    return {
      threatLevel: overview.threatLevel || 'normal',
      activeAlerts: overview.activeAlerts || 0,
      failedLogins24h: overview.failedLogins24h || 0,
      blockedIPs: overview.blockedIPs || 0,
      mfaCompliance: overview.mfaCompliance || 0,
      passwordScore: overview.passwordScore || 0,
      openIncidents: overview.openIncidents || 0,
      avgResponseTime: overview.avgResponseTime || '0m',
    };
  }, []);

  /* ─── Filtered Failed Logins ─── */
  const filteredLogins = useMemo(() => {
    return failedLogins.filter((entry) => {
      const matchesQuery =
        !query ||
        entry.ip.includes(query) ||
        entry.location.toLowerCase().includes(query.toLowerCase()) ||
        entry.country.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || entry.risk === severityFilter;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesQuery && matchesSeverity && matchesStatus;
    });
  }, [query, severityFilter, statusFilter]);

  /* ─── Filtered Suspicious Activity ─── */
  const filteredActivity = useMemo(() => {
    return suspiciousActivity.filter((entry) => {
      const matchesQuery =
        !query ||
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.description.toLowerCase().includes(query.toLowerCase()) ||
        entry.user.toLowerCase().includes(query.toLowerCase()) ||
        entry.ip.includes(query);
      const matchesSeverity = severityFilter === 'all' || entry.severity === severityFilter;
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesQuery && matchesSeverity && matchesType && matchesStatus;
    });
  }, [query, severityFilter, typeFilter, statusFilter]);

  /* ─── Computed: 2FA Stats ─── */
  const twoFAStats = useMemo(() => {
    const total = twoFAPolicies.length;
    const enforced = twoFAPolicies.filter((p) => p.enforced).length;
    const avgCompliance =
      total > 0 ? Math.round(twoFAPolicies.reduce((s, p) => s + p.complianceRate, 0) / total) : 0;
    return { total, enforced, avgCompliance };
  }, []);

  /* ─── Computed: IP Allowlist Stats ─── */
  const ipStats = useMemo(() => {
    const total = ipAllowlists.length;
    const active = ipAllowlists.filter((a) => a.status === 'active').length;
    const totalHits = ipAllowlists.reduce((s, a) => s + (a.hitCount || 0), 0);
    return { total, active, totalHits };
  }, []);

  /* ─── Handlers ─── */
  const toggleLogin = (id) => {
    setExpandedLogins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleActivity = (id) => {
    setExpandedActivity((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBlockIP = (ip) => {
    console.log('Block IP:', ip);
    // In production: call API to block IP
  };

  const handleAcknowledge = (id) => {
    console.log('Acknowledge activity:', id);
    // In production: update status to acknowledged
  };

  const handleInvestigate = (id) => {
    console.log('Investigate activity:', id);
    // In production: open investigation workflow
  };

  const handleToggle2FA = (id) => {
    console.log('Toggle 2FA policy:', id);
    // In production: toggle enforcement
  };

  const handleEdit2FA = (id) => {
    console.log('Edit 2FA policy:', id);
    // In production: open edit modal
  };

  const handleToggleAllowlist = (id) => {
    console.log('Toggle allowlist:', id);
    // In production: toggle status
  };

  const handleDeleteAllowlist = (id) => {
    console.log('Delete allowlist:', id);
    // In production: delete entry
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const resetFilters = () => {
    setQuery('');
    setSeverityFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    {
      id: 'failed-logins',
      label: 'Failed Logins',
      icon: Lock,
      badge: failedLogins.filter((l) => l.status === 'active').length,
    },
    {
      id: 'suspicious',
      label: 'Suspicious Activity',
      icon: AlertTriangle,
      badge: suspiciousActivity.filter((a) => a.status === 'open').length,
    },
    { id: 'access-control', label: 'Access Control', icon: KeyRound },
    { id: 'breach-sim', label: 'Breach Scenarios', icon: Siren },
  ];

  /* ─── Map Markers ─── */
  const mapMarkers = useMemo(() => {
    return failedLogins
      .filter((e) => e.lat && e.lng)
      .map((e) => ({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        label: e.location,
        severity: e.risk,
        value: e.attempts,
      }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Security Center</h1>
          <p className="text-sm text-text-secondary">
            Threat monitoring, access control, and breach preparedness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Threat Level Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-4',
          stats.threatLevel === 'critical'
            ? 'border-danger/20 bg-danger/5'
            : stats.threatLevel === 'high'
              ? 'border-warning/20 bg-warning/5'
              : stats.threatLevel === 'elevated'
                ? 'border-info/20 bg-info/5'
                : 'border-accent/20 bg-accent/5'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            stats.threatLevel === 'critical'
              ? 'bg-danger/10'
              : stats.threatLevel === 'high'
                ? 'bg-warning/10'
                : stats.threatLevel === 'elevated'
                  ? 'bg-info/10'
                  : 'bg-accent/10'
          )}
        >
          {stats.threatLevel === 'normal' ? (
            <ShieldCheck className="h-6 w-6 text-accent" />
          ) : (
            <ShieldAlert
              className={cn(
                'h-6 w-6',
                stats.threatLevel === 'critical'
                  ? 'text-danger'
                  : stats.threatLevel === 'high'
                    ? 'text-warning'
                    : 'text-info'
              )}
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p
              className={cn(
                'text-lg font-bold',
                stats.threatLevel === 'critical'
                  ? 'text-danger'
                  : stats.threatLevel === 'high'
                    ? 'text-warning'
                    : stats.threatLevel === 'elevated'
                      ? 'text-info'
                      : 'text-accent'
              )}
            >
              {stats.threatLevel === 'normal'
                ? 'All Systems Secure'
                : stats.threatLevel === 'elevated'
                  ? 'Elevated Threat Level'
                  : stats.threatLevel === 'high'
                    ? 'High Threat Detected'
                    : 'Critical Security Alert'}
            </p>
            <ThreatLevelIndicator level={stats.threatLevel} />
          </div>
          <p className="text-xs text-text-secondary">
            {stats.threatLevel === 'normal'
              ? 'No active threats. All security systems operational.'
              : `${stats.activeAlerts} active alert${stats.activeAlerts !== 1 ? 's' : ''} requiring attention.`}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="font-mono font-bold text-text-primary">{stats.openIncidents}</p>
            <p className="text-text-muted">Open Incidents</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-text-primary">{stats.avgResponseTime}</p>
            <p className="text-text-muted">Avg Response</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SecurityStatCard
          label="Failed Logins (24h)"
          value={formatNumber(stats.failedLogins24h)}
          icon={Lock}
          color="text-warning"
          subtext={`${stats.blockedIPs} IPs auto-blocked`}
          trend={-8}
        />
        <SecurityStatCard
          label="MFA Compliance"
          value={`${stats.mfaCompliance}%`}
          icon={Fingerprint}
          color="text-accent"
          subtext={`${twoFAStats.enforced}/${twoFAStats.total} policies enforced`}
          trend={3}
        />
        <SecurityStatCard
          label="Password Health"
          value={`${stats.passwordScore}/100`}
          icon={Shield}
          color={
            stats.passwordScore >= 80
              ? 'text-accent'
              : stats.passwordScore >= 60
                ? 'text-warning'
                : 'text-danger'
          }
          subtext="Platform-wide score"
        />
        <SecurityStatCard
          label="Active Alerts"
          value={stats.activeAlerts}
          icon={AlertTriangle}
          color={stats.activeAlerts > 0 ? 'text-danger' : 'text-accent'}
          subtext={stats.activeAlerts > 0 ? 'Requires attention' : 'All clear'}
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
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════
          OVERVIEW TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* World Map + Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Globe className="h-4 w-4 text-secondary" /> Attack Origins
                </h3>
                <p className="text-xs text-text-muted">{mapMarkers.length} locations mapped</p>
              </div>
              <SimpleWorldMap
                markers={mapMarkers}
                onMarkerClick={(m) => console.log('Clicked:', m)}
              />
            </div>

            <div className="space-y-4">
              {/* Quick 2FA Summary */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-secondary" /> 2FA Policies
                </h3>
                <div className="space-y-3">
                  {twoFAPolicies.slice(0, 3).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{policy.name}</p>
                        <p className="text-xs text-text-muted">
                          {policy.scope} · {policy.target}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-mono font-medium',
                          policy.complianceRate >= 95
                            ? 'text-accent'
                            : policy.complianceRate >= 80
                              ? 'text-warning'
                              : 'text-danger'
                        )}
                      >
                        {policy.complianceRate}%
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('access-control')}
                  className="mt-3 text-xs text-secondary hover:underline w-full text-center"
                >
                  View all policies →
                </button>
              </div>

              {/* IP Allowlist Summary */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Server className="h-4 w-4 text-secondary" /> IP Allowlists
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Active Rules</span>
                    <span className="font-mono font-medium text-text-primary">
                      {ipStats.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Total Hits (24h)</span>
                    <span className="font-mono font-medium text-accent">
                      {formatNumber(ipStats.totalHits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Coverage</span>
                    <span className="font-mono font-medium text-text-primary">
                      {ipAllowlists.filter((a) => a.type === 'tenant').length} tenants
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('access-control')}
                  className="mt-3 text-xs text-secondary hover:underline w-full text-center"
                >
                  Manage allowlists →
                </button>
              </div>
            </div>
          </div>

          {/* Top Failed Logins Preview */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Lock className="h-4 w-4 text-secondary" /> Top Failed Login Attempts
              </h3>
              <button
                onClick={() => setActiveTab('failed-logins')}
                className="text-xs text-secondary hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {failedLogins.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background hover:bg-surface-elevated/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
                    <Lock className="h-4 w-4 text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{entry.ip}</p>
                      <SeverityBadge severity={entry.risk} />
                      {entry.status === 'blocked' && <AlertStatusBadge status="blocked" />}
                    </div>
                    <p className="text-xs text-text-muted">
                      {entry.location}, {entry.country} · {entry.attempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">{timeAgo(entry.lastAttempt)}</p>
                    <p className="text-[10px] text-text-muted">
                      {entry.userAgents?.[0]?.slice(0, 30)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suspicious Activity Preview */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-secondary" /> Recent Suspicious Activity
              </h3>
              <button
                onClick={() => setActiveTab('suspicious')}
                className="text-xs text-secondary hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {suspiciousActivity.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-surface-elevated/50 transition-colors"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      entry.severity === 'critical'
                        ? 'bg-danger/10'
                        : entry.severity === 'high'
                          ? 'bg-warning/10'
                          : 'bg-info/10'
                    )}
                  >
                    <Activity
                      className={cn(
                        'h-4 w-4',
                        entry.severity === 'critical'
                          ? 'text-danger'
                          : entry.severity === 'high'
                            ? 'text-warning'
                            : 'text-info'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                      <SeverityBadge severity={entry.severity} />
                      <ActivityTypeBadge type={entry.type} />
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{entry.description}</p>
                    <p className="text-[10px] text-text-muted mt-1">
                      {entry.user} · {entry.ip} · {timeAgo(entry.timestamp)}
                    </p>
                  </div>
                  <AlertStatusBadge status={entry.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          FAILED LOGINS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'failed-logins' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by IP, location, country..."
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Risk Level</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Severities</option>
                    {Object.entries(threatSeverityMeta).map(([key, meta]) => (
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
                    {Object.entries(alertStatusMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
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
            Showing <span className="font-medium text-text-primary">{filteredLogins.length}</span>{' '}
            of {failedLogins.length} failed login entries
          </p>

          {/* Failed Logins Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Last Attempt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogins.map((entry) => (
                    <FailedLoginRow
                      key={entry.id}
                      entry={entry}
                      expanded={expandedLogins.has(entry.id)}
                      onToggle={() => toggleLogin(entry.id)}
                      onBlock={() => handleBlockIP(entry.ip)}
                    />
                  ))}
                  {filteredLogins.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <Shield className="mx-auto h-10 w-10 mb-3" />
                        <p>No failed login entries match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          SUSPICIOUS ACTIVITY TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'suspicious' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by title, user, IP, description..."
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Severities</option>
                    {Object.entries(threatSeverityMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(activityTypeMeta).map(([key, meta]) => (
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
                    {Object.entries(alertStatusMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
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
            Showing <span className="font-medium text-text-primary">{filteredActivity.length}</span>{' '}
            of {suspiciousActivity.length} activity entries
          </p>

          {/* Activity Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      User / IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredActivity.map((entry) => (
                    <SuspiciousActivityRow
                      key={entry.id}
                      entry={entry}
                      expanded={expandedActivity.has(entry.id)}
                      onToggle={() => toggleActivity(entry.id)}
                      onAcknowledge={() => handleAcknowledge(entry.id)}
                      onInvestigate={() => handleInvestigate(entry.id)}
                    />
                  ))}
                  {filteredActivity.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                        <ShieldCheck className="mx-auto h-10 w-10 mb-3" />
                        <p>No suspicious activity matches your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          ACCESS CONTROL TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'access-control' && (
        <div className="space-y-6">
          {/* 2FA Policies */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-secondary" /> Two-Factor Authentication
                Policies
              </h3>
              <span className="text-xs text-text-muted">
                {twoFAStats.enforced} enforced · {twoFAStats.avgCompliance}% avg compliance
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {twoFAPolicies.map((policy) => (
                <TwoFAPolicyCard
                  key={policy.id}
                  policy={policy}
                  onToggle={() => handleToggle2FA(policy.id)}
                  onEdit={() => handleEdit2FA(policy.id)}
                />
              ))}
            </div>
          </div>

          {/* IP Allowlists */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Server className="h-5 w-5 text-secondary" /> IP Allowlists
              </h3>
              <span className="text-xs text-text-muted">
                {ipStats.active} active · {formatNumber(ipStats.totalHits)} hits today
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {ipAllowlists.map((entry) => (
                <IPAllowlistCard
                  key={entry.id}
                  entry={entry}
                  onToggle={() => handleToggleAllowlist(entry.id)}
                  onDelete={() => handleDeleteAllowlist(entry.id)}
                />
              ))}
            </div>
          </div>

          {/* Password Policy */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-secondary" /> Global Password Policy
            </h3>
            <PasswordPolicyDisplay
              policy={{
                minLength: 12,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecial: true,
                maxAge: 90,
                preventReuse: 5,
              }}
            />
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          BREACH SCENARIOS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'breach-sim' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Siren className="h-4 w-4 text-secondary" /> Breach Scenario Library
              </h3>
              <p className="text-xs text-text-muted">
                {breachScenarios.length} scenarios available
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {breachScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all hover:shadow-md',
                    scenario.severity === 'critical'
                      ? 'border-danger/20 hover:border-danger/40'
                      : scenario.severity === 'high'
                        ? 'border-warning/20 hover:border-warning/40'
                        : 'border-border hover:border-secondary/30'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          scenario.severity === 'critical'
                            ? 'bg-danger/10'
                            : scenario.severity === 'high'
                              ? 'bg-warning/10'
                              : 'bg-info/10'
                        )}
                      >
                        <Zap
                          className={cn(
                            'h-5 w-5',
                            scenario.severity === 'critical'
                              ? 'text-danger'
                              : scenario.severity === 'high'
                                ? 'text-warning'
                                : 'text-info'
                          )}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{scenario.name}</h4>
                        <p className="text-xs text-text-muted mt-0.5">{scenario.id}</p>
                      </div>
                    </div>
                    <SeverityBadge severity={scenario.severity} />
                  </div>

                  <p className="mt-3 text-sm text-text-secondary">{scenario.description}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-background p-2">
                      <p className="text-text-muted">Duration</p>
                      <p className="font-mono font-medium text-text-primary">{scenario.duration}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <p className="text-text-muted">Est. Impact</p>
                      <p className="font-mono font-medium text-text-primary">
                        {scenario.estimatedImpact}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Targets
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {scenario.targets.map((target) => (
                        <span
                          key={target}
                          className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary"
                        >
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          scenario.blocked ? 'text-accent' : 'text-text-muted'
                        )}
                      >
                        {scenario.blocked ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {scenario.blocked ? 'Blocked' : 'Not Blocked'}
                      </span>
                      <span className="text-text-muted">
                        {scenario.alerts} alerts · {scenario.falsePositives} false pos.
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Activity className="mr-1.5 h-3.5 w-3.5" /> Simulate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
