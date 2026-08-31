/* src/app/admin/regions/page.jsx */
import { useState, useMemo } from 'react';
import {
  Globe,
  ArrowRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  HardDrive,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  BarChart3,
  FileText,
  Layers,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  regions,
  migrationJobs,
  complianceRules,
  latencyHistory,
  regionStatusMeta,
  migrationStatusMeta,
  complianceStatusMeta,
  getRegionName,
  regionTenants,
} from './data';

import {
  RegionCard,
  MigrationJobCard,
  ComplianceCard,
  RegionStatCard,
  LatencySparkline,
} from './components';

import RegionDetailDrawer from './RegionDetailDrawer';
import MigrationModal from './MigrationModal';

/* ═══════════════════════════════════════════════════════════════════════════════
   DEBUG: Find bad tenant data before flattening
   ═══════════════════════════════════════════════════════════════════════════════ */
(function debugTenants() {
  if (!regionTenants || typeof regionTenants !== 'object') {
    console.error('❌ regionTenants is missing or not an object:', regionTenants);
    return;
  }
  console.log('🔍 Debugging regionTenants...');
  Object.entries(regionTenants).forEach(([regionId, tenants]) => {
    // Check if tenants is an array
    if (!Array.isArray(tenants)) {
      console.error(
        `❌ Region "${regionId}": tenants is NOT an array →`,
        tenants,
        `(type: ${typeof tenants})`
      );
      return;
    }
    console.log(`✅ Region "${regionId}": ${tenants.length} tenants`);
    // Check each tenant
    tenants.forEach((t, i) => {
      if (t === null) {
        console.error(`   ❌ Index ${i}: tenant is NULL`);
      } else if (t === undefined) {
        console.error(`   ❌ Index ${i}: tenant is UNDEFINED`);
      } else if (typeof t !== 'object') {
        console.error(`   ❌ Index ${i}: tenant is not an object →`, t, `(type: ${typeof t})`);
      } else if (Array.isArray(t)) {
        console.error(`   ❌ Index ${i}: tenant is an ARRAY (should be object) →`, t);
      } else if (!t.id) {
        console.warn(`   ⚠️ Index ${i}: tenant missing "id" field →`, t);
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════════
   Flatten all tenants for migration selector — ROBUST VERSION
   ═══════════════════════════════════════════════════════════════════════════════ */
const allTenants = (() => {
  // Guard 1: regionTenants must exist and be an object
  if (!regionTenants || typeof regionTenants !== 'object' || Array.isArray(regionTenants)) {
    console.error('❌ regionTenants is invalid:', regionTenants);
    return [];
  }

  try {
    return Object.entries(regionTenants).flatMap(([regionId, tenants]) => {
      // Guard 2: tenants must be an array
      if (!Array.isArray(tenants)) {
        console.warn(`⚠️ Region "${regionId}": tenants is not an array, skipping. Value:`, tenants);
        return [];
      }
      // Guard 3: each tenant must be a valid object
      return tenants
        .filter((t, i) => {
          const isValid =
            t !== null && t !== undefined && typeof t === 'object' && !Array.isArray(t);
          if (!isValid) {
            console.warn(`⚠️ Region "${regionId}" index ${i}: invalid tenant skipped →`, t);
          }
          return isValid;
        })
        .map((t) => ({ ...t, regionId }));
    });
  } catch (error) {
    console.error('❌ Error flattening tenants:', error);
    return [];
  }
})();

console.log('✅ allTenants loaded:', allTenants.length, 'tenants');

export default function RegionsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobs, setJobs] = useState(migrationJobs);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  /* ─── Computed Data ─── */
  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const regionStats = useMemo(() => {
    const operational = regions.filter((r) => r.status === 'operational').length;
    const degraded = regions.filter((r) => r.status === 'degraded').length;
    const maintenance = regions.filter((r) => r.status === 'maintenance').length;
    const totalTenants = regions.reduce((s, r) => s + r.tenantCount, 0);
    const totalCapacity = regions.reduce((s, r) => s + r.capacity, 0);
    const totalStorage = regions.reduce((s, r) => s + r.storageUsedTB, 0);
    const totalCost = regions.reduce((s, r) => s + r.monthlyCost, 0);
    return {
      operational,
      degraded,
      maintenance,
      totalTenants,
      totalCapacity,
      totalStorage,
      totalCost,
      total: regions.length,
    };
  }, []);

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
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesQuery =
        !query ||
        j.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        j.id.toLowerCase().includes(query.toLowerCase()) ||
        j.sourceRegion.toLowerCase().includes(query.toLowerCase()) ||
        j.targetRegion.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, statusFilter]);

  const filteredCompliance = useMemo(() => {
    return complianceRules.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.regulation.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  /* ─── Handlers ─── */
  const handleRefresh = () => setLastRefresh(new Date());

  const handleCreateMigration = (job) => {
    setJobs((prev) => [job, ...prev]);
    setShowMigrationModal(false);
  };

  const handleUpdateMigration = (updated) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setEditingJob(null);
    setShowMigrationModal(false);
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
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

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
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
                  <Line
                    type="monotone"
                    dataKey="us-east-1"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="US East"
                  />
                  <Line
                    type="monotone"
                    dataKey="us-west-2"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="US West"
                  />
                  <Line
                    type="monotone"
                    dataKey="eu-west-1"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="EU West"
                  />
                  <Line
                    type="monotone"
                    dataKey="eu-central-1"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="EU Central"
                  />
                  <Line
                    type="monotone"
                    dataKey="ap-southeast-1"
                    stroke="#863bff"
                    strokeWidth={2}
                    dot={false}
                    name="APAC SE"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                <MigrationJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── REGIONS TAB ─── */}
      {activeTab === 'regions' && (
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
      {activeTab === 'migrations' && (
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
              <MigrationJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
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
      {activeTab === 'compliance' && (
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
          onSave={editingJob ? handleUpdateMigration : handleCreateMigration}
          tenants={allTenants}
        />
      )}
    </div>
  );
}
