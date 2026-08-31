/* src/app/admin/demo-access/page.jsx */
import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Zap,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Calendar,
  Globe,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  MousePointerClick,
  Timer,
  Star,
  Building2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useDemoStore } from './store';
import {
  tierConfig,
  demoStatusMeta,
  funnelStages,
  formatCurrency,
  formatDate,
  getDaysUntil,
} from './data';
import {
  StatCard,
  DemoStatusBadge,
  TierBadge,
  DaysRemainingBadge,
  MiniUsageBar,
  FeatureTag,
  ConversionFunnel,
  SourceBreakdown,
  FeaturePopularityChart,
  DemoDetailDrawer,
  NewDemoModal,
} from './components';

/* ─── Simple Sparkline (SVG) ─── */
function Sparkline({ data, color = '#3b82f6', width = 120, height = 32 }) {
  if (!data || data.length < 2) return <div className="h-8 w-24 bg-border rounded" />;
  const values = data.map((d) => d.count || d);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * height}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

/* ─── Main Page ─── */
export default function DemoAccessPage() {
  const demos = useDemoStore((s) => s.demos);
  const analytics = useDemoStore((s) => s.analytics);
  const addDemo = useDemoStore((s) => s.addDemo);
  const updateDemo = useDemoStore((s) => s.updateDemo);
  const extendDemo = useDemoStore((s) => s.extendDemo);
  const convertDemo = useDemoStore((s) => s.convertDemo);
  const lockDemo = useDemoStore((s) => s.lockDemo);
  const unlockDemo = useDemoStore((s) => s.unlockDemo);
  const sendReminder = useDemoStore((s) => s.sendReminder);
  const getStats = useDemoStore((s) => s.getStats);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', dir: 'desc' });
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [showNewDemo, setShowNewDemo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState('list'); // list | analytics

  const stats = getStats();

  const filteredDemos = useMemo(() => {
    let result = demos.filter((d) => {
      const matchesQuery =
        !query ||
        d.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        d.id.toLowerCase().includes(query.toLowerCase()) ||
        d.subdomain.toLowerCase().includes(query.toLowerCase()) ||
        d.contactName.toLowerCase().includes(query.toLowerCase()) ||
        d.contactEmail.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesTier = tierFilter === 'all' || d.tier === tierFilter;
      const matchesSource = sourceFilter === 'all' || d.source === sourceFilter;
      return matchesQuery && matchesStatus && matchesTier && matchesSource;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortConfig.key === 'expiresAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.expiresAt) - new Date(b.expiresAt)
          : new Date(b.expiresAt) - new Date(a.expiresAt);
      }
      if (sortConfig.key === 'tenantName') {
        return sortConfig.dir === 'asc'
          ? a.tenantName.localeCompare(b.tenantName)
          : b.tenantName.localeCompare(a.tenantName);
      }
      if (sortConfig.key === 'sessionsCount') {
        return sortConfig.dir === 'asc'
          ? a.sessionsCount - b.sessionsCount
          : b.sessionsCount - a.sessionsCount;
      }
      return 0;
    });

    return result;
  }, [demos, query, statusFilter, tierFilter, sourceFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const funnelData = useMemo(() => {
    return funnelStages.map((stage) => ({
      ...stage,
      count: demos.filter(
        (d) =>
          d.onboardingStep === stage.key || (stage.key === 'converted' && d.status === 'converted')
      ).length,
    }));
  }, [demos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Demo Access</h1>
          <p className="text-sm text-text-secondary">
            Grant trials, track engagement, convert prospects — {stats.active + stats.expiringSoon}{' '}
            active demos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView(activeView === 'list' ? 'analytics' : 'list')}
          >
            {activeView === 'list' ? (
              <>
                <BarChart3 className="mr-1.5 h-4 w-4" /> Analytics
              </>
            ) : (
              <>
                <Building2 className="mr-1.5 h-4 w-4" /> Demo List
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewDemo(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Grant Access
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Demos"
          value={stats.active}
          icon={Zap}
          color="text-accent"
          subtext={`${stats.expiringSoon} expiring soon`}
          trend={12}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          color="text-secondary"
          subtext={`${stats.converted} of ${stats.total} converted`}
          trend={5.2}
        />
        <StatCard
          label="Potential MRR"
          value={formatCurrency(stats.potentialMrr)}
          icon={DollarSign}
          color="text-purple-500"
          subtext={`${stats.active + stats.expiringSoon} prospects`}
        />
        <StatCard
          label="Converted MRR"
          value={formatCurrency(stats.convertedMrr)}
          icon={CheckCircle2}
          color="text-info"
          subtext="Recurring from demos"
          trend={8.7}
        />
      </div>

      {activeView === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search demos by name, ID, subdomain, contact..."
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
              <select
                value={sortConfig.key}
                onChange={(e) => setSortConfig({ key: e.target.value, dir: 'desc' })}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="createdAt">Sort by Created</option>
                <option value="expiresAt">Sort by Expiry</option>
                <option value="tenantName">Sort by Name</option>
                <option value="sessionsCount">Sort by Engagement</option>
              </select>
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
                    <option value="active">Active</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="converted">Converted</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Sources</option>
                    <option value="website">Website</option>
                    <option value="ads">Ads</option>
                    <option value="referral">Referral</option>
                    <option value="event">Event</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTierFilter('all');
                    setSourceFilter('all');
                    setQuery('');
                  }}
                  className="text-xs text-secondary hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredDemos.length}</span> of{' '}
            {demos.length} demos
          </p>

          {/* Demo Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10">
                      <input type="checkbox" className="rounded border-border" />
                    </th>
                    {[
                      { key: 'tenantName', label: 'Demo' },
                      { key: 'tier', label: 'Tier' },
                      { key: 'status', label: 'Status' },
                      { key: 'expiresAt', label: 'Expiry' },
                      { key: 'engagement', label: 'Engagement' },
                      { key: 'createdAt', label: 'Created' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.key !== 'engagement' && handleSort(col.key)}
                        className={cn(
                          'px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider select-none',
                          col.key !== 'engagement' && 'cursor-pointer hover:text-text-primary'
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
                  {filteredDemos.map((demo) => {
                    const tier = tierConfig[demo.tier] || tierConfig.Starter;
                    return (
                      <tr
                        key={demo.id}
                        className="hover:bg-background/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedDemo(demo)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-border" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg',
                                tier.bg
                              )}
                            >
                              <Building2 className={cn('h-4 w-4', tier.color)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {demo.tenantName}
                              </p>
                              <p className="text-[10px] text-text-muted font-mono">
                                {demo.subdomain}.unifiedpms.com
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TierBadge tier={demo.tier} />
                        </td>
                        <td className="px-4 py-3">
                          <DemoStatusBadge status={demo.status} />
                        </td>
                        <td className="px-4 py-3">
                          <DaysRemainingBadge days={demo.daysRemaining} total={demo.totalDays} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <MousePointerClick className="h-3 w-3 text-text-muted" />
                              {demo.sessionsCount} sessions
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Calendar className="h-3 w-3 text-text-muted" />
                              {demo.reservationsCreated} reservations
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{demo.createdAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDemo(demo);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                              title="View Details"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            {demo.status === 'active' || demo.status === 'expiring_soon' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  convertDemo(demo.id, demo.tier);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-accent hover:bg-accent/10"
                                title="Convert to Paid"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDemos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <Zap className="mx-auto h-10 w-10 mb-3" />
                        <p>No demos match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ─── Analytics View ─── */
        <div className="space-y-6">
          {/* Daily Active Demos Chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" /> Daily Active Demos (30d)
              </h3>
              <div className="flex items-center gap-2">
                <Sparkline data={analytics.dailyActiveDemos} color="#3b82f6" />
                <span className="text-lg font-bold font-mono text-secondary">
                  {analytics.dailyActiveDemos[analytics.dailyActiveDemos.length - 1]?.count}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-32">
              {analytics.dailyActiveDemos.map((d, i) => {
                const max = Math.max(...analytics.dailyActiveDemos.map((x) => x.count));
                const height = max > 0 ? (d.count / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-secondary/70 transition-all hover:bg-secondary"
                      style={{ height: `${height}%` }}
                      title={`${d.date}: ${d.count} active`}
                    />
                    {i % 5 === 0 && (
                      <span className="text-[9px] text-text-muted">{d.date.slice(5)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" /> Conversion Funnel
              </h3>
              <ConversionFunnel data={funnelData} />
            </div>

            {/* Conversion by Tier */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Percent className="h-4 w-4 text-secondary" /> Conversion by Tier
              </h3>
              <div className="space-y-3">
                {analytics.conversionsByTier.map((t) => {
                  const meta = tierConfig[t.tier];
                  return (
                    <div key={t.tier} className="flex items-center gap-3">
                      <span className={cn('w-20 text-xs font-medium', meta.color)}>{t.tier}</span>
                      <div className="flex-1 h-6 rounded-md bg-border overflow-hidden relative">
                        <div
                          className={cn(
                            'h-full rounded-md flex items-center px-2',
                            meta.bg.replace('/10', '/70')
                          )}
                          style={{ width: `${t.rate}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {t.converted}/{t.started}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium text-text-primary w-12 text-right">
                        {t.rate}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Avg. Time to Convert</span>
                  <span className="font-mono font-medium text-text-primary">
                    {analytics.avgTimeToConvert} days
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Popularity */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary" /> Feature Adoption
              </h3>
              <FeaturePopularityChart features={analytics.topFeatures} />
            </div>

            {/* Source Breakdown */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-secondary" /> Acquisition Sources
              </h3>
              <SourceBreakdown sources={analytics.sources} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showNewDemo && <NewDemoModal onClose={() => setShowNewDemo(false)} onCreate={addDemo} />}

      {selectedDemo && (
        <DemoDetailDrawer
          demo={selectedDemo}
          onClose={() => setSelectedDemo(null)}
          onExtend={extendDemo}
          onConvert={convertDemo}
          onLock={lockDemo}
          onUnlock={unlockDemo}
          onSendReminder={sendReminder}
        />
      )}
    </div>
  );
}
