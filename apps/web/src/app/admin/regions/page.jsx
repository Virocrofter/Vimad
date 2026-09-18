/* src/app/admin/regions/page.jsx — wired to api/regions.ts (Phase 3D) */
import { useState, useMemo } from 'react';
import {
  Globe,
  ArrowRight,
  Plus,
  Search,
  RefreshCw,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  FileText,
  Layers,
  MapPin,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { useToast } from '../../../hooks/use-toast';
import { useApiError } from '../../../hooks/useApiError';
import {
  getRegions,
  getRegionStats,
  getMigrationJobs,
  createMigration,
  cancelMigration,
} from '../../../api/regions';
import { api } from '../../../api/client';

// Static metadata only (status labels/colors, helpers) — entity data comes from the API.
import { formatDuration } from './data';

import { RegionCard, MigrationJobCard, ComplianceCard, RegionStatCard } from './components';

import RegionDetailDrawer from './RegionDetailDrawer';
import MigrationModal from './MigrationModal';

/* ─── Normalizers: API shapes → component shapes ─── */
const regionStatusMap = {
  active: 'operational',
  degraded: 'degraded',
  maintenance: 'maintenance',
  offline: 'critical',
};

const normalizeRegion = (r) => {
  const storageTotalTB = r.capacity?.storage ?? 0;
  const storageUsedTB = r.usage?.storage ?? 0;
  const cpuUtil = r.capacity?.cpu > 0 ? (r.usage?.cpu ?? 0) / r.capacity.cpu : 0;
  const capacity =
    r.tenantCount > 0 && cpuUtil > 0
      ? Math.ceil(r.tenantCount / cpuUtil)
      : Math.max(r.tenantCount * 2, 1);

  return {
    ...r,
    status: regionStatusMap[r.status] ?? r.status,
    location: r.datacenter ?? r.code ?? '',
    latencyMs: r.latency ?? 0,
    capacity,
    storageUsedTB,
    storageTotalTB: storageTotalTB || 1,
    throughputRps: r.throughputRps ?? 0,
    monthlyCost: r.monthlyCost ?? 0,
    costPerTenant: r.tenantCount > 0 ? Math.round((r.monthlyCost ?? 0) / r.tenantCount) : 0,
    certifications: r.certifications ?? [],
    replicationTargets: r.replicationTargets ?? [],
    dataResidency: r.dataResidency ?? '—',
    lastIncident: r.lastIncident ?? null,
  };
};

const normalizeMigrationJob = (j) => ({
  ...j,
  error: j.errorMessage ?? null,
  dataSizeGB: j.dataSizeGB ?? 0,
  initiatedBy: j.initiatedBy ?? '—',
  duration:
    j.startedAt && j.completedAt
      ? formatDuration(Math.round((new Date(j.completedAt) - new Date(j.startedAt)) / 1000))
      : null,
  downtimeSeconds: j.downtimeSeconds ?? null,
});

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#863bff'];

export default function RegionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  /* ─── Data fetching (real API) ─── */
  const regionsQuery = useApiFetch(async () => {
    const res = await getRegions();
    return (Array.isArray(res) ? res : (res?.data ?? [])).map(normalizeRegion);
  }, []);

  const statsQuery = useApiFetch(() => getRegionStats(), []);

  const jobsQuery = useApiFetch(async () => {
    const res = await getMigrationJobs({ pageSize: 100 });
    return (res?.data ?? res ?? []).map(normalizeMigrationJob);
  }, []);

  // Compliance rules — endpoint: GET /admin/regions/compliance
  const complianceQuery = useApiFetch(
    async () => {
      const res = await api.get('/admin/regions/compliance');
      return res?.data ?? res ?? [];
    },
    [],
    { initialData: [] }
  );

  // 24h cross-region latency history — endpoint: GET /admin/regions/latency-history
  const latencyQuery = useApiFetch(() => api.get('/admin/regions/latency-history'), [], {
    initialData: [],
  });

  // Tenants (for the migration selector) — endpoint: GET /admin/tenants
  const tenantsQuery = useApiFetch(
    async () => {
      const res = await api.get('/admin/tenants');
      return res?.data ?? res ?? [];
    },
    [],
    { initialData: [] }
  );

  useApiError(regionsQuery.error);
  useApiError(jobsQuery.error);

  const regions = useMemo(() => regionsQuery.data ?? [], [regionsQuery.data]);
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const complianceRules = useMemo(() => complianceQuery.data ?? [], [complianceQuery.data]);
  const latencyHistory = useMemo(() => latencyQuery.data ?? [], [latencyQuery.data]);
  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);

  const pageLoading = regionsQuery.loading || jobsQuery.loading;

  /* ─── Mutations ─── */
  const { mutate: startMigration, loading: savingMigration } = useApiMutation(
    (form) =>
      createMigration({
        tenantId: form.tenantId,
        sourceRegion: form.sourceRegion,
        targetRegion: form.targetRegion,
      }),
    {
      onSuccess: () => {
        toast({ title: 'Migration started' });
        jobsQuery.refetch();
        setShowMigrationModal(false);
        setEditingJob(null);
      },
      onError: (err) =>
        toast({
          title: 'Failed to start migration',
          description: err.message,
          variant: 'destructive',
        }),
    }
  );

  const { mutate: stopMigration } = useApiMutation((job) => cancelMigration(job.id), {
    onSuccess: () => {
      toast({ title: 'Migration cancelled' });
      jobsQuery.refetch();
    },
    onError: (err) =>
      toast({
        title: 'Failed to cancel migration',
        description: err.message,
        variant: 'destructive',
      }),
  });

  /* ─── Computed Data ─── */
  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        (r.location ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [regions, query, statusFilter]);

  const regionStats = useMemo(() => {
    const operational = regions.filter((r) => r.status === 'operational').length;
    const degraded = regions.filter((r) => r.status === 'degraded').length;
    const maintenance = regions.filter((r) => r.status === 'maintenance').length;
    const totalTenants =
      statsQuery.data?.totalTenants ?? regions.reduce((s, r) => s + r.tenantCount, 0);
    const totalCapacity = regions.reduce((s, r) => s + r.capacity, 0) || 1;
    return {
      operational,
      degraded,
      maintenance,
      totalTenants,
      totalCapacity,
      total: statsQuery.data?.totalRegions ?? regions.length,
    };
  }, [regions, statsQuery.data]);

  const migrationStats = useMemo(() => {
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const inProgress = jobs.filter((j) => j.status === 'in_progress').length;
    const pending = jobs.filter((j) => j.status === 'pending' || j.status === 'scheduled').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    return { completed, inProgress, pending, failed, total: jobs.length };
  }, [jobs]);

  const complianceStats = useMemo(() => {
    const compliant = complianceRules.filter((r) => r.status === 'compliant').length;
    const atRisk = complianceRules.filter((r) => r.status === 'at_risk').length;
    const nonCompliant = complianceRules.filter((r) => r.status === 'non_compliant').length;
    return { compliant, atRisk, nonCompliant, total: complianceRules.length };
  }, [complianceRules]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesQuery =
        !query ||
        j.tenantName?.toLowerCase().includes(query.toLowerCase()) ||
        j.id.toLowerCase().includes(query.toLowerCase()) ||
        j.sourceRegion?.toLowerCase().includes(query.toLowerCase()) ||
        j.targetRegion?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, statusFilter]);

  const filteredCompliance = useMemo(() => {
    return complianceRules.filter((r) => {
      const matchesQuery =
        !query ||
        r.name?.toLowerCase().includes(query.toLowerCase()) ||
        r.regulation?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [complianceRules, query, statusFilter]);

  /* ─── Handlers ─── */
  const handleRefresh = () => {
    regionsQuery.refetch();
    statsQuery.refetch();
    jobsQuery.refetch();
    complianceQuery.refetch();
    latencyQuery.refetch();
    setLastRefresh(new Date());
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      regions,
      migrations: jobs,
      compliance: complianceRules,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regions-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'regions', label: 'Regions', icon: Server },
    {
      id: 'migrations',
      label: 'Migrations',
      icon: ArrowRight,
      badge: migrationStats.inProgress + migrationStats.pending,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      badge: complianceStats.atRisk + complianceStats.nonCompliant,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Multi-Region & Tenancy</h1>
          <p className="text-sm text-text-secondary">
            Geographic tenant placement, data residency, region health, and cross-region migration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Refreshed {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={pageLoading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', pageLoading && 'animate-spin')} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingJob(null);
              setShowMigrationModal(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Migration
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RegionStatCard
          label="Regions Online"
          value={`${regionStats.operational}/${regionStats.total}`}
          icon={Server}
          color={regionStats.degraded > 0 ? 'text-warning' : 'text-accent'}
          subtext={regionStats.degraded > 0 ? `${regionStats.degraded} degraded` : 'All healthy'}
        />
        <RegionStatCard
          label="Total Tenants"
          value={regionStats.totalTenants.toLocaleString()}
          icon={Globe}
          color="text-secondary"
          subtext={`${Math.round((regionStats.totalTenants / regionStats.totalCapacity) * 100)}% global capacity`}
        />
        <RegionStatCard
          label="Active Migrations"
          value={migrationStats.inProgress + migrationStats.pending}
          icon={ArrowRight}
          color={migrationStats.inProgress > 0 ? 'text-secondary' : 'text-text-muted'}
          subtext={`${migrationStats.completed} completed, ${migrationStats.failed} failed`}
        />
        <RegionStatCard
          label="Compliance Issues"
          value={complianceStats.atRisk + complianceStats.nonCompliant}
          icon={Shield}
          color={
            complianceStats.nonCompliant > 0
              ? 'text-danger'
              : complianceStats.atRisk > 0
                ? 'text-warning'
                : 'text-accent'
          }
          subtext={`${complianceStats.compliant} of ${complianceStats.total} rules compliant`}
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setQuery('');
                  setStatusFilter('all');
                }}
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

      {/* Loading state */}
      {pageLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-12 text-sm text-text-muted">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading region data…
        </div>
      )}

      {/* ─── OVERVIEW TAB ─── */}
      {!pageLoading && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Region Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" /> Region Status
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> {regionStats.operational}{' '}
                  Operational
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" /> {regionStats.degraded}{' '}
                  Degraded
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-info" /> {regionStats.maintenance}{' '}
                  Maintenance
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  onClick={() => setSelectedRegion(region)}
                />
              ))}
            </div>
          </div>

          {/* Latency Overview Chart */}
          {latencyHistory.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" /> Cross-Region Latency Trends (24h)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" unit="ms" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {regions.slice(0, 5).map((region, i) => (
                      <Line
                        key={region.id}
                        type="monotone"
                        dataKey={region.id}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={region.name}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Migrations Preview */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-secondary" /> Recent Migrations
              </h3>
              <button
                onClick={() => setActiveTab('migrations')}
                className="text-xs text-secondary hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.slice(0, 3).map((job) => (
                <MigrationJobCard
                  key={job.id}
                  job={job}
                  onClick={() => setActiveTab('migrations')}
                />
              ))}
              {jobs.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-text-muted">
                  No migrations yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── REGIONS TAB ─── */}
      {!pageLoading && activeTab === 'regions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search regions by name, ID, or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="degraded">Degraded</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredRegions.length}</span>{' '}
            of {regions.length} regions
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRegions.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                onClick={() => setSelectedRegion(region)}
              />
            ))}
            {filteredRegions.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <Globe className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No regions match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MIGRATIONS TAB ─── */}
      {!pageLoading && activeTab === 'migrations' && (
        <div className="space-y-6">
          {/* Migration Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RegionStatCard
              label="Total Jobs"
              value={migrationStats.total}
              icon={Layers}
              color="text-text-primary"
              subtext="All time"
            />
            <RegionStatCard
              label="Completed"
              value={migrationStats.completed}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Successfully migrated"
            />
            <RegionStatCard
              label="In Progress"
              value={migrationStats.inProgress}
              icon={Activity}
              color="text-secondary"
              subtext="Currently running"
            />
            <RegionStatCard
              label="Failed"
              value={migrationStats.failed}
              icon={XCircle}
              color="text-danger"
              subtext="Require attention"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search migrations by tenant, ID, region..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
              </select>
              <Button
                size="sm"
                onClick={() => {
                  setEditingJob(null);
                  setShowMigrationModal(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Migration
              </Button>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredJobs.length}</span> of{' '}
            {jobs.length} migrations
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <MigrationJobCard
                key={job.id}
                job={job}
                onClick={() =>
                  (job.status === 'pending' || job.status === 'in_progress') &&
                  window.confirm(`Cancel migration ${job.id}?`) &&
                  stopMigration(job)
                }
              />
            ))}
            {filteredJobs.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <ArrowRight className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No migrations match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── COMPLIANCE TAB ─── */}
      {!pageLoading && activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RegionStatCard
              label="Total Rules"
              value={complianceStats.total}
              icon={FileText}
              color="text-text-primary"
              subtext="Across all jurisdictions"
            />
            <RegionStatCard
              label="Compliant"
              value={complianceStats.compliant}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Meeting requirements"
            />
            <RegionStatCard
              label="At Risk"
              value={complianceStats.atRisk}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Action recommended"
            />
            <RegionStatCard
              label="Non-Compliant"
              value={complianceStats.nonCompliant}
              icon={XCircle}
              color="text-danger"
              subtext="Immediate action required"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search rules by name, regulation, or jurisdiction..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="at_risk">At Risk</option>
                <option value="non_compliant">Non-Compliant</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredCompliance.length}</span> of{' '}
            {complianceRules.length} rules
          </p>

          <div className="space-y-3">
            {filteredCompliance.map((rule) => (
              <ComplianceCard key={rule.id} rule={rule} />
            ))}
            {filteredCompliance.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <Shield className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No compliance rules match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modals & Drawers ─── */}
      {selectedRegion && (
        <RegionDetailDrawer region={selectedRegion} onClose={() => setSelectedRegion(null)} />
      )}

      {showMigrationModal && (
        <MigrationModal
          job={editingJob}
          onClose={() => {
            setShowMigrationModal(false);
            setEditingJob(null);
          }}
          onSave={startMigration}
          tenants={tenants}
          regions={regions}
          saving={savingMigration}
        />
      )}
    </div>
  );
}
