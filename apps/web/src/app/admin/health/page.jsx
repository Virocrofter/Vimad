/* src/app/admin/health/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Cpu, Database, Download, Filter, HardDrive, History,
  Layers, LayoutGrid, List, MemoryStick, RefreshCw, Search,
  Server, Shield, TrendingUp, X, XCircle, Zap, Globe,
  ArrowUpRight, ArrowDownRight, Minus, Wifi
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import {
  systemOverview,
  serviceStatus,
  errorLogs,
  latencyHistory,
  requestVolume,
  resourceUsage,
  incidentHistory,
  severityMeta,
  timeAgo,
} from './data';

import {
  HealthStatCard,
  ServiceStatusBadge,
  SeverityBadge,
  ErrorStatusBadge,
  IncidentSeverityBadge,
  ServiceCard,
  ErrorLogRow,
  IncidentCard,
  SystemHealthIndicator,
} from './components';

/* ─── Main Page ─── */
export default function SystemHealthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview | errors | incidents | performance
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedErrors, setExpandedErrors] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  /* ─── Computed Data ─── */
  const filteredErrors = useMemo(() => {
    return errorLogs.filter((e) => {
      const matchesQuery = !query ||
        e.message.toLowerCase().includes(query.toLowerCase()) ||
        e.id.toLowerCase().includes(query.toLowerCase()) ||
        e.service.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
      const matchesService = serviceFilter === 'all' || e.service === serviceFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesQuery && matchesSeverity && matchesService && matchesStatus;
    });
  }, [query, severityFilter, serviceFilter, statusFilter]);

  const errorStats = useMemo(() => ({
    total: errorLogs.length,
    critical: errorLogs.filter(e => e.severity === 'critical').length,
    error: errorLogs.filter(e => e.severity === 'error').length,
    warning: errorLogs.filter(e => e.severity === 'warning').length,
    open: errorLogs.filter(e => e.status === 'open').length,
  }), []);

  const serviceStats = useMemo(() => {
    const operational = serviceStatus.filter(s => s.status === 'operational').length;
    const degraded = serviceStatus.filter(s => s.status === 'degraded').length;
    const critical = serviceStatus.filter(s => s.status === 'critical').length;
    return { operational, degraded, critical, total: serviceStatus.length };
  }, []);

  const avgLatency = useMemo(() => {
    const latest = latencyHistory[latencyHistory.length - 1];
    return Math.round((latest.api + latest.auth + latest.db + latest.cache) / 4);
  }, []);

  const totalRequests = useMemo(() => {
    return requestVolume.reduce((s, r) => s + r.requests, 0);
  }, []);

  const totalErrors = useMemo(() => {
    return requestVolume.reduce((s, r) => s + r.errors, 0);
  }, []);

  const errorRate = useMemo(() => {
    return totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(3) : '0.000';
  }, [totalRequests, totalErrors]);

  /* ─── Handlers ─── */
  const toggleError = (id) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const uniqueServices = useMemo(() => [...new Set(errorLogs.map(e => e.service))], []);

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'errors', label: 'Error Logs', icon: AlertTriangle, badge: errorStats.open },
    { id: 'incidents', label: 'Incidents', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Health</h1>
          <p className="text-sm text-text-secondary">
            Monitor platform performance, uptime, and error logs across all services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Refreshed {timeAgo(lastRefresh.toISOString().replace('T', ' ').slice(0, 19))}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* System Health Indicator */}
      <SystemHealthIndicator status={systemOverview.status} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HealthStatCard
          label="Overall Uptime"
          value={systemOverview.uptime.current}
          icon={CheckCircle2}
          color="text-accent"
          subtext={`30d avg: ${systemOverview.uptime.last30Days}`}
        />
        <HealthStatCard
          label="Avg Latency"
          value={`${avgLatency}ms`}
          icon={Zap}
          color="text-secondary"
          subtext="p95 across all services"
          trend={-8.2}
        />
        <HealthStatCard
          label="Error Rate"
          value={`${errorRate}%`}
          icon={AlertTriangle}
          color={parseFloat(errorRate) > 0.5 ? 'text-danger' : 'text-accent'}
          subtext={`${totalErrors} errors / ${(totalRequests / 1000).toFixed(0)}k requests`}
          trend={parseFloat(errorRate) > 0.3 ? -12 : 5}
        />
        <HealthStatCard
          label="Services Up"
          value={`${serviceStats.operational}/${serviceStats.total}`}
          icon={Server}
          color={serviceStats.degraded > 0 ? 'text-warning' : 'text-accent'}
          subtext={serviceStats.degraded > 0 ? `${serviceStats.degraded} degraded` : 'All healthy'}
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
                  active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
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

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Service Status Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Server className="h-4 w-4 text-secondary" /> Service Status
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {serviceStats.operational} Operational
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  {serviceStats.degraded} Degraded
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  {serviceStats.critical} Critical
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {serviceStatus.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>

          {/* Recent Errors Preview */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-secondary" /> Recent Errors
              </h3>
              <button
                onClick={() => setActiveTab('errors')}
                className="text-xs text-secondary hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {errorLogs.slice(0, 5).map((error) => (
                    <tr key={error.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">{error.id}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={error.severity} /></td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{error.service}</td>
                      <td className="px-4 py-3 text-sm text-text-primary truncate max-w-[250px]">{error.message}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{timeAgo(error.timestamp)}</td>
                      <td className="px-4 py-3"><ErrorStatusBadge status={error.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Request Volume */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" /> Request Volume (24h)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={requestVolume}>
                    <defs>
                      <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#863bff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#863bff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="requests" stroke="#863bff" fill="url(#reqGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-secondary" /> Resource Usage (24h)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resourceUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="cpu" stroke="#863bff" strokeWidth={2} dot={false} name="CPU" />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" strokeWidth={2} dot={false} name="Memory" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PERFORMANCE TAB ─── */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Latency Chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Zap className="h-4 w-4 text-secondary" /> Service Latency (24h)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary" /> API Gateway
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Auth
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-info" /> Database
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" /> Cache
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="api" stroke="#863bff" strokeWidth={2} dot={false} name="API Gateway" />
                  <Line type="monotone" dataKey="auth" stroke="#22c55e" strokeWidth={2} dot={false} name="Auth Service" />
                  <Line type="monotone" dataKey="db" stroke="#3b82f6" strokeWidth={2} dot={false} name="Database" />
                  <Line type="monotone" dataKey="cache" stroke="#f59e0b" strokeWidth={2} dot={false} name="Redis Cache" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Request Volume Bar Chart */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Requests per Hour</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="var(--text-muted)" interval={2} />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="requests" fill="#863bff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Error Distribution */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Error Distribution</h3>
              <div className="space-y-3">
                {[
                  { service: 'Background Worker', count: 14, color: 'bg-danger' },
                  { service: 'Auth Service', count: 8, color: 'bg-warning' },
                  { service: 'API Gateway', count: 5, color: 'bg-info' },
                  { service: 'Primary Database', count: 3, color: 'bg-secondary' },
                  { service: 'Notification Service', count: 2, color: 'bg-accent' },
                ].map((item) => {
                  const max = 14;
                  const pct = (item.count / max) * 100;
                  return (
                    <div key={item.service}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">{item.service}</span>
                        <span className="text-xs font-mono font-medium text-text-primary">{item.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resource Gauges */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Current Resources</h3>
              <div className="space-y-4">
                {serviceStatus.filter(s => s.connections || s.memoryUsage || s.diskUsage || s.indexSize).map((svc) => {
                  const metric = svc.connections
                    ? { label: 'Connections', used: svc.connections.active, total: svc.connections.max, unit: '' }
                    : svc.memoryUsage
                    ? { label: 'Memory', used: svc.memoryUsage.used, total: svc.memoryUsage.total, unit: svc.memoryUsage.unit }
                    : svc.diskUsage
                    ? { label: 'Disk', used: svc.diskUsage.used, total: svc.diskUsage.total, unit: svc.diskUsage.unit }
                    : { label: 'Index', used: svc.indexSize.used, total: svc.indexSize.total, unit: svc.indexSize.unit };

                  const pct = Math.round((metric.used / metric.total) * 100);

                  return (
                    <div key={svc.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">{svc.name} — {metric.label}</span>
                        <span className={cn('text-xs font-mono font-medium', pct > 80 ? 'text-danger' : pct > 60 ? 'text-warning' : 'text-accent')}>
                          {metric.used}{metric.unit} / {metric.total}{metric.unit}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', pct > 80 ? 'bg-danger' : pct > 60 ? 'bg-warning' : 'bg-accent')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ERRORS TAB ─── */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          {/* Error Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HealthStatCard
              label="Total Errors"
              value={errorStats.total}
              icon={AlertTriangle}
              color="text-text-primary"
              subtext="Last 24 hours"
            />
            <HealthStatCard
              label="Critical"
              value={errorStats.critical}
              icon={XCircle}
              color="text-danger"
              subtext="Require immediate action"
            />
            <HealthStatCard
              label="Errors"
              value={errorStats.error}
              icon={AlertTriangle}
              color="text-danger"
              subtext="Standard errors"
            />
            <HealthStatCard
              label="Open Issues"
              value={errorStats.open}
              icon={Clock}
              color="text-warning"
              subtext="Awaiting resolution"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search errors by ID, message, service..."
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
                  showFilters ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
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
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Service</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Services</option>
                    {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="auto-resolved">Auto-Resolved</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => { setSeverityFilter('all'); setServiceFilter('all'); setStatusFilter('all'); setQuery(''); }}
                  className="h-9 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredErrors.length}</span> of {errorLogs.length} errors
          </p>

          {/* Error Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredErrors.map((error) => (
                    <ErrorLogRow
                      key={error.id}
                      error={error}
                      expanded={expandedErrors.has(error.id)}
                      onToggle={() => toggleError(error.id)}
                    />
                  ))}
                  {filteredErrors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                        <CheckCircle2 className="mx-auto h-10 w-10 mb-3" />
                        <p>No errors match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── INCIDENTS TAB ─── */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          {/* Incident Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HealthStatCard
              label="Total Incidents"
              value={incidentHistory.length}
              icon={History}
              color="text-text-primary"
              subtext="Last 30 days"
            />
            <HealthStatCard
              label="Critical"
              value={incidentHistory.filter(i => i.severity === 'critical').length}
              icon={XCircle}
              color="text-danger"
              subtext="Highest severity"
            />
            <HealthStatCard
              label="Avg Resolution"
              value="8.4m"
              icon={Clock}
              color="text-accent"
              subtext="Mean time to resolve"
              trend={-15}
            />
            <HealthStatCard
              label="Uptime SLA"
              value="99.94%"
              icon={Shield}
              color="text-accent"
              subtext="Target: 99.9%"
            />
          </div>

          {/* MTTR Trend */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" /> Incident Timeline
            </h3>
            <div className="space-y-4">
              {incidentHistory.map((incident, index) => (
                <div key={incident.id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {index < incidentHistory.length - 1 && (
                    <div className="absolute left-[19px] top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Dot */}
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                    incident.severity === 'critical' ? 'border-danger bg-danger/10' :
                    incident.severity === 'warning' ? 'border-warning bg-warning/10' :
                    'border-info bg-info/10'
                  )}>
                    {incident.severity === 'critical' ? <XCircle className="h-4 w-4 text-danger" /> :
                     incident.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                     <Info className="h-4 w-4 text-info" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IncidentSeverityBadge severity={incident.severity} />
                      <span className="font-mono text-xs text-text-muted">{incident.id}</span>
                      <span className="text-xs text-text-muted">· {incident.duration}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">{incident.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{incident.date}</p>
                    <div className="mt-2 rounded-lg border border-border bg-background p-3 space-y-1">
                      <p className="text-xs text-text-secondary">
                        <span className="font-medium">Root Cause:</span> {incident.rootCause}
                      </p>
                      <p className="text-xs text-text-secondary">
                        <span className="font-medium">Resolution:</span> {incident.resolution}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {incident.affectedServices.map((svc) => (
                        <span key={svc} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          {svc}
                        </span>
                      ))}
                    </div>
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