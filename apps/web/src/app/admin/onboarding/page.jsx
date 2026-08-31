/* src/app/admin/onboarding/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Funnel,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Zap,
  Target,
  Flag,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Monitor,
  Video,
  Tag,
  Clock3,
  Sparkles,
  PieChart,
  LineChart,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  LineChart as ReLineChart,
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
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  funnelStages,
  onboardingTenants,
  funnelMetrics,
  stageDropOffs,
  dailyConversions,
  csmTeam,
  dropOffReasons,
  interventionTypes,
  getOverallProgress,
  getHealthScoreColor,
  getStatusMeta,
} from './data';

import {
  OnboardingStatCard,
  OnboardingStatusBadge,
  HealthScoreBadge,
  FunnelVisualization,
  TenantProgressRow,
  InterventionCard,
  CsmPerformanceCard,
  MiniSparkline,
} from './components';

import InterventionModal from './InterventionModal';

/* ─── Colors for charts ─── */
const CHART_COLORS = {
  primary: '#863bff',
  accent: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  secondary: '#a855f7',
};

/* ─── Main Page ─── */
export default function OnboardingFunnelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [tenants, setTenants] = useState(onboardingTenants);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [csmFilter, setCsmFilter] = useState('all');
  const [expandedTenants, setExpandedTenants] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  /* ─── Computed Data ─── */
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesQuery =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(query.toLowerCase()) ||
        t.assignedCSM.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesStage =
        stageFilter === 'all' ||
        t.dropOffStage === stageFilter ||
        (stageFilter === 'no_dropoff' && !t.dropOffStage);
      const matchesCSM = csmFilter === 'all' || t.assignedCSM === csmFilter;
      return matchesQuery && matchesStatus && matchesStage && matchesCSM;
    });
  }, [tenants, query, statusFilter, stageFilter, csmFilter]);

  const stats = useMemo(() => {
    const activeTrials = tenants.filter((t) => t.status === 'active_trial').length;
    const atRisk = tenants.filter((t) => t.status === 'at_risk').length;
    const expired = tenants.filter((t) => t.status === 'trial_expired').length;
    const converted = tenants.filter((t) => t.status === 'converted').length;
    const totalRevenueAtRisk = tenants.reduce((s, t) => s + t.revenueAtRisk, 0);
    const avgHealth =
      tenants.length > 0
        ? Math.round(tenants.reduce((s, t) => s + t.healthScore, 0) / tenants.length)
        : 0;
    const interventionSuccess = 68.4;

    return {
      activeTrials,
      atRisk,
      expired,
      converted,
      totalRevenueAtRisk,
      avgHealth,
      interventionSuccess,
      total: tenants.length,
    };
  }, [tenants]);

  const chartData = useMemo(() => {
    if (timeRange === '30d') return dailyConversions;
    if (timeRange === '14d') return dailyConversions.slice(-14);
    if (timeRange === '7d') return dailyConversions.slice(-7);
    return dailyConversions;
  }, [timeRange]);

  const dropOffPieData = useMemo(() => {
    const reasons = {};
    tenants.forEach((t) => {
      if (t.dropOffReason) {
        reasons[t.dropOffReason] = (reasons[t.dropOffReason] || 0) + 1;
      }
    });
    return Object.entries(reasons).map(([key, value]) => ({
      name: dropOffReasons[key]?.label || key,
      value,
      key,
    }));
  }, [tenants]);

  const conversionByPlan = useMemo(() => {
    const plans = ['Starter', 'Professional', 'Enterprise'];
    return plans.map((plan) => {
      const planTenants = tenants.filter((t) => t.plan === plan);
      const converted = planTenants.filter((t) => t.status === 'converted').length;
      const rate = planTenants.length > 0 ? (converted / planTenants.length) * 100 : 0;
      return { plan, converted, total: planTenants.length, rate: rate.toFixed(1) };
    });
  }, [tenants]);

  /* ─── Handlers ─── */
  const toggleTenant = (id) => {
    setExpandedTenants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleIntervene = (tenant) => {
    setSelectedTenant(tenant);
    setShowInterventionModal(true);
  };

  const handleSaveIntervention = (intervention) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === selectedTenant.id) {
          return { ...t, interventions: [...t.interventions, intervention] };
        }
        return t;
      })
    );
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      metrics: funnelMetrics,
      tenants: filteredTenants,
      stageDropOffs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-funnel-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueCSMs = useMemo(() => [...new Set(tenants.map((t) => t.assignedCSM))], [tenants]);

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Funnel },
    { id: 'tenants', label: 'Tenant Progress', icon: Users, badge: stats.atRisk + stats.expired },
    { id: 'interventions', label: 'Interventions', icon: Flag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Onboarding Funnel</h1>
          <p className="text-sm text-text-secondary">
            Trial-to-paid conversion tracking, drop-off analysis, and intervention management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedTenant(null);
              setShowInterventionModal(true);
            }}
          >
            <Flag className="mr-1.5 h-4 w-4" /> Bulk Intervention
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <OnboardingStatCard
          label="Active Trials"
          value={stats.activeTrials}
          icon={Users}
          color="text-info"
          subtext={`${stats.total} total enrolled`}
          trend={12.5}
        />
        <OnboardingStatCard
          label="At Risk / Expired"
          value={stats.atRisk + stats.expired}
          icon={AlertTriangle}
          color="text-warning"
          subtext={`${stats.atRisk} at risk, ${stats.expired} expired`}
          trend={-8.2}
        />
        <OnboardingStatCard
          label="Converted"
          value={stats.converted}
          icon={CheckCircle2}
          color="text-accent"
          subtext={`${funnelMetrics.conversionRate}% conversion rate`}
          trend={5.3}
        />
        <OnboardingStatCard
          label="Revenue at Risk"
          value={`$${stats.totalRevenueAtRisk.toLocaleString()}`}
          icon={DollarSign}
          color="text-danger"
          subtext={`${funnelMetrics.interventionSuccessRate}% intervention success`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">
            Avg. Time to Convert
          </p>
          <p className="mt-1 text-lg font-bold font-mono text-text-primary">
            {funnelMetrics.avgTimeToConvert}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg. Health Score</p>
          <p
            className={cn('mt-1 text-lg font-bold font-mono', getHealthScoreColor(stats.avgHealth))}
          >
            {stats.avgHealth}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Revenue Converted</p>
          <p className="mt-1 text-lg font-bold font-mono text-accent">
            ${funnelMetrics.revenueConverted.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">
            Intervention Success
          </p>
          <p className="mt-1 text-lg font-bold font-mono text-secondary">
            {funnelMetrics.interventionSuccessRate}%
          </p>
        </div>
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

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Funnel Visualization */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Funnel className="h-4 w-4 text-secondary" /> Conversion Funnel
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary/40" /> Completed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning/20" /> In Progress / Dropped
                </span>
              </div>
            </div>
            <FunnelVisualization stageData={stageDropOffs} />
          </div>

          {/* Drop-off Reasons & CSM Performance */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Drop-off Reasons */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-secondary" /> Drop-off Reasons
              </h3>
              {dropOffPieData.length > 0 ? (
                <div className="space-y-3">
                  {dropOffPieData.map((item) => {
                    const total = dropOffPieData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    const reasonMeta = dropOffReasons[item.key];
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                reasonMeta?.color.replace('text-', 'bg-') || 'bg-text-muted'
                              )}
                            />
                            <span className="text-xs font-medium text-text-secondary">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-text-primary">
                            {item.value} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              reasonMeta?.color.replace('text-', 'bg-') || 'bg-text-muted'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-8">
                  No drop-off data available
                </p>
              )}
            </div>

            {/* CSM Performance */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" /> CSM Performance
              </h3>
              <div className="space-y-3">
                {csmTeam.map((csm) => (
                  <CsmPerformanceCard key={csm.id} csm={csm} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TENANTS TAB ─── */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search tenants by name, ID, CSM..."
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
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active_trial">Active Trial</option>
                    <option value="at_risk">At Risk</option>
                    <option value="trial_expired">Trial Expired</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Drop-off Stage</label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Stages</option>
                    <option value="no_dropoff">No Drop-off</option>
                    {funnelStages
                      .filter((s) => !s.isStart && !s.isEnd)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Assigned CSM</label>
                  <select
                    value={csmFilter}
                    onChange={(e) => setCsmFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All CSMs</option>
                    {uniqueCSMs.map((csm) => (
                      <option key={csm} value={csm}>
                        {csm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setStageFilter('all');
                    setCsmFilter('all');
                    setQuery('');
                  }}
                  className="h-9 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredTenants.length}</span>{' '}
            of {tenants.length} tenants
          </p>

          {/* Tenant Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Health
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      CSM
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Revenue at Risk
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTenants.map((tenant) => (
                    <TenantProgressRow
                      key={tenant.id}
                      tenant={tenant}
                      expanded={expandedTenants.has(tenant.id)}
                      onToggle={() => toggleTenant(tenant.id)}
                      onIntervene={handleIntervene}
                    />
                  ))}
                  {filteredTenants.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <Users className="mx-auto h-10 w-10 mb-3" />
                        <p>No tenants match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── INTERVENTIONS TAB ─── */}
      {activeTab === 'interventions' && (
        <div className="space-y-6">
          {/* Intervention Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OnboardingStatCard
              label="Total Sent"
              value={tenants.reduce((s, t) => s + t.interventions.length, 0)}
              icon={Mail}
              color="text-secondary"
              subtext="All time"
            />
            <OnboardingStatCard
              label="Opened / Clicked"
              value={tenants.reduce(
                (s, t) =>
                  s +
                  t.interventions.filter((i) => ['opened', 'clicked'].includes(i.status)).length,
                0
              )}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Engaged recipients"
            />
            <OnboardingStatCard
              label="No Response"
              value={tenants.reduce(
                (s, t) =>
                  s +
                  t.interventions.filter((i) => ['unopened', 'no_answer'].includes(i.status))
                    .length,
                0
              )}
              icon={XCircle}
              color="text-warning"
              subtext="Follow-up needed"
            />
            <OnboardingStatCard
              label="Success Rate"
              value={`${funnelMetrics.interventionSuccessRate}%`}
              icon={Target}
              color="text-info"
              subtext="Led to conversion"
            />
          </div>

          {/* Recent Interventions */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Flag className="h-4 w-4 text-secondary" /> Recent Interventions
            </h3>
            <div className="space-y-3">
              {tenants
                .flatMap((t) =>
                  t.interventions.map((i) => ({ ...i, tenantName: t.name, tenantId: t.id }))
                )
                .sort(
                  (a, b) =>
                    new Date(b.sentAt || b.scheduledAt) - new Date(a.sentAt || a.scheduledAt)
                )
                .slice(0, 10)
                .map((intervention) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    tenantName={intervention.tenantName}
                  />
                ))}
              {tenants.every((t) => t.interventions.length === 0) && (
                <p className="text-sm text-text-muted text-center py-8">
                  No interventions recorded yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS TAB ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Time Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            <span className="text-xs text-text-muted">Time range:</span>
            {['7d', '14d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  timeRange === range
                    ? 'bg-secondary text-white'
                    : 'border border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                )}
              >
                Last {range}
              </button>
            ))}
          </div>

          {/* Conversion Trend Chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" /> Daily Trial & Conversion Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="trialGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="var(--text-muted)"
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="trials"
                    stroke={CHART_COLORS.primary}
                    fill="url(#trialGradient)"
                    strokeWidth={2}
                    name="New Trials"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke={CHART_COLORS.accent}
                    fill="url(#convGradient)"
                    strokeWidth={2}
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion by Plan & Stage Duration */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Conversion by Plan */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-secondary" /> Conversion by Plan
              </h3>
              <div className="space-y-3">
                {conversionByPlan.map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary">{item.plan}</span>
                      <span className="text-xs font-mono text-text-primary">
                        {item.converted}/{item.total} ({item.rate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          item.plan === 'Enterprise'
                            ? 'bg-purple-500'
                            : item.plan === 'Professional'
                              ? 'bg-secondary'
                              : 'bg-info'
                        )}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Duration */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-secondary" /> Avg. Time per Stage
              </h3>
              <div className="space-y-3">
                {funnelStages
                  .filter((s) => s.avgDuration)
                  .map((stage) => (
                    <div key={stage.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">{stage.label}</span>
                        {stage.optional && (
                          <span className="text-[10px] text-text-muted">(optional)</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-medium text-text-primary">
                        {stage.avgDuration}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Intervention Modal ─── */}
      {showInterventionModal && (
        <InterventionModal
          tenant={selectedTenant || filteredTenants[0]}
          onClose={() => {
            setShowInterventionModal(false);
            setSelectedTenant(null);
          }}
          onSave={handleSaveIntervention}
        />
      )}
    </div>
  );
}
