/* src/app/admin/analytics/page.jsx */
import { useState, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  Target,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  MousePointer,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Timer,
  Layers,
  Crown,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Percent,
  MousePointerClick,
  Star,
  Flame,
  RefreshCw,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  featureUsageHeatmap,
  funnelData,
  sessionDurationDistribution,
  engagementScores,
  dropOffPoints,
  wauTrend,
  dauTrend,
  powerUsers,
  classificationMeta,
  getHeatmapColor,
  formatNumber,
} from './data';

import {
  AnalyticsStatCard,
  ClassificationBadge,
  SeverityBadge,
  CategoryBadge,
  FeatureHeatmap,
  FunnelChart,
  EngagementCard,
  DropOffCard,
  PowerUserRow,
  SessionDurationChart,
} from './components';

/* ─── Main Page ─── */
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [query, setQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  /* ─── Computed Stats ─── */
  const stats = useMemo(() => {
    const totalEvents = featureUsageHeatmap.reduce((s, f) => s + f.totalEvents, 0);
    const totalUsers = featureUsageHeatmap.reduce((s, f) => s + f.uniqueUsers, 0);
    const avgSession =
      featureUsageHeatmap.reduce((s, f) => s + f.avgSessionMin * f.uniqueUsers, 0) / totalUsers;
    const powerUserCount = engagementScores.filter((e) => e.classification === 'power').length;
    const atRiskCount = engagementScores.filter((e) => e.classification === 'at-risk').length;
    const totalDropOff =
      dropOffPoints.reduce((s, d) => s + d.dropOffRate, 0) / dropOffPoints.length;
    const latestDau = dauTrend[dauTrend.length - 1];
    const prevDau = dauTrend[dauTrend.length - 8];
    const dauGrowth = (((latestDau.dau - prevDau.dau) / prevDau.dau) * 100).toFixed(1);

    return {
      totalEvents,
      totalUsers,
      avgSession: avgSession.toFixed(1),
      powerUsers: powerUserCount,
      atRisk: atRiskCount,
      avgDropOff: totalDropOff.toFixed(1),
      dau: latestDau.dau,
      dauGrowth,
      sessions: latestDau.sessions,
    };
  }, []);

  /* ─── Filtered Data ─── */
  const filteredEngagement = useMemo(() => {
    return engagementScores.filter((e) => {
      const matchesQuery =
        !query ||
        e.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        e.tenantId.toLowerCase().includes(query.toLowerCase());
      const matchesClass =
        classificationFilter === 'all' || e.classification === classificationFilter;
      return matchesQuery && matchesClass;
    });
  }, [query, classificationFilter]);

  const filteredDropOffs = useMemo(() => {
    return dropOffPoints.filter((d) => {
      const matchesQuery =
        !query ||
        d.location.toLowerCase().includes(query.toLowerCase()) ||
        d.reason.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [query]);

  const maxHeatmapValue = useMemo(() => {
    return Math.max(...featureUsageHeatmap.flatMap((f) => f.hourly));
  }, []);

  /* ─── Classification Distribution for Pie Chart ─── */
  const classificationDistribution = useMemo(() => {
    const dist = {};
    engagementScores.forEach((e) => {
      dist[e.classification] = (dist[e.classification] || 0) + 1;
    });
    return Object.entries(dist).map(([key, value]) => ({
      name: classificationMeta[key]?.label || key,
      value,
      color:
        key === 'power'
          ? '#a855f7'
          : key === 'engaged'
            ? '#22c55e'
            : key === 'at-risk'
              ? '#f59e0b'
              : '#ef4444',
    }));
  }, []);

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'features', label: 'Feature Usage', icon: Layers },
    { id: 'funnels', label: 'Funnels', icon: Target },
    { id: 'engagement', label: 'Engagement', icon: Zap },
    { id: 'dropoffs', label: 'Drop-offs', icon: AlertTriangle },
  ];

  const handleRefresh = () => setLastRefresh(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Platform Analytics</h1>
          <p className="text-sm text-text-secondary">
            Feature usage, user engagement, funnel analysis, and drop-off insights
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

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-text-muted" />
        <span className="text-xs text-text-muted">Time range:</span>
        {['7d', '30d', '90d'].map((range) => (
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AnalyticsStatCard
          label="Daily Active Users"
          value={stats.dau.toLocaleString()}
          icon={Users}
          color="text-accent"
          subtext={`${stats.sessions.toLocaleString()} sessions today`}
          trend={stats.dauGrowth}
        />
        <AnalyticsStatCard
          label="Total Events"
          value={formatNumber(stats.totalEvents)}
          icon={MousePointerClick}
          color="text-secondary"
          subtext="Across all features"
          trend={8.4}
        />
        <AnalyticsStatCard
          label="Avg Session"
          value={`${stats.avgSession}m`}
          icon={Timer}
          color="text-info"
          subtext="Platform-wide average"
          trend={-2.1}
        />
        <AnalyticsStatCard
          label="Power Users"
          value={stats.powerUsers}
          icon={Crown}
          color="text-purple-500"
          subtext={`${stats.atRisk} at risk`}
          trend={12.5}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* DAU + WAU Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* DAU Trend */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" /> Daily Active Users (30d)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dauTrend}>
                    <defs>
                      <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      stroke="var(--text-muted)"
                      tickFormatter={(v) => v.slice(5)}
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
                    <Area
                      type="monotone"
                      dataKey="dau"
                      stroke="#22c55e"
                      fill="url(#dauGradient)"
                      strokeWidth={2}
                      name="DAU"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WAU Trend */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" /> Weekly Active Users
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wauTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="newUsers"
                      stackId="a"
                      fill="#863bff"
                      radius={[0, 0, 0, 0]}
                      name="New"
                    />
                    <Bar
                      dataKey="returning"
                      stackId="a"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name="Returning"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Session Duration + Classification */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Session Duration */}
            <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Timer className="h-4 w-4 text-secondary" /> Session Duration Distribution
              </h3>
              <SessionDurationChart data={sessionDurationDistribution} />
            </div>

            {/* Classification Pie */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-secondary" /> User Classification
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {classificationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {classificationDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-text-secondary">{item.name}</span>
                    </div>
                    <span className="font-mono font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Features Preview */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Layers className="h-4 w-4 text-secondary" /> Most Used Features
              </h3>
              <button
                onClick={() => setActiveTab('features')}
                className="text-xs text-secondary hover:underline"
              >
                View Heatmap →
              </button>
            </div>
            <div className="space-y-3">
              {featureUsageHeatmap
                .sort((a, b) => b.totalEvents - a.totalEvents)
                .slice(0, 5)
                .map((feature, idx) => (
                  <div key={feature.feature} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-text-muted w-4">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {feature.feature}
                          </span>
                          <CategoryBadge category={feature.category} />
                        </div>
                        <span className="text-xs font-mono text-text-primary">
                          {formatNumber(feature.totalEvents)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full bg-secondary transition-all')}
                          style={{
                            width: `${(feature.totalEvents / featureUsageHeatmap[0].totalEvents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-xs text-text-muted">{feature.uniqueUsers} users</p>
                      <p className="text-xs text-text-muted">{feature.avgSessionMin}m avg</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Power Users Preview */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" /> Top Power Users
              </h3>
              <button
                onClick={() => setActiveTab('engagement')}
                className="text-xs text-secondary hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {powerUsers.map((user, idx) => (
                <PowerUserRow key={user.tenantId} user={user} rank={idx + 1} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── FEATURE USAGE TAB ─── */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Feature Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AnalyticsStatCard
              label="Total Features"
              value={featureUsageHeatmap.length}
              icon={Layers}
              color="text-text-primary"
              subtext="Active modules"
            />
            <AnalyticsStatCard
              label="Peak Hour"
              value="14:00"
              icon={Clock}
              color="text-warning"
              subtext="Highest activity"
            />
            <AnalyticsStatCard
              label="Most Active"
              value="Guest Portal"
              icon={Flame}
              color="text-danger"
              subtext="342K events"
            />
            <AnalyticsStatCard
              label="Avg Events/User"
              value="680"
              icon={MousePointer}
              color="text-info"
              subtext="Per feature"
            />
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-secondary" /> Feature Usage Heatmap
              </h3>
              <p className="text-xs text-text-muted">Hourly event volume by feature (24h)</p>
            </div>
            <FeatureHeatmap data={featureUsageHeatmap} maxValue={maxHeatmapValue} />
          </div>

          {/* Feature Detail Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Feature Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Events
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Users
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Avg Session
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Events/User
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {featureUsageHeatmap
                    .sort((a, b) => b.totalEvents - a.totalEvents)
                    .map((feature) => (
                      <tr
                        key={feature.feature}
                        className="hover:bg-background/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {feature.feature}
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={feature.category} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatNumber(feature.totalEvents)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {feature.uniqueUsers}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {feature.avgSessionMin}m
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {Math.round(feature.totalEvents / feature.uniqueUsers)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── FUNNELS TAB ─── */}
      {activeTab === 'funnels' && (
        <div className="space-y-6">
          {/* Funnel Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AnalyticsStatCard
              label="Active Funnels"
              value={funnelData.length}
              icon={Target}
              color="text-text-primary"
              subtext="Being tracked"
            />
            <AnalyticsStatCard
              label="Avg Conversion"
              value={`${(funnelData.reduce((s, f) => s + f.totalConversion, 0) / funnelData.length).toFixed(1)}%`}
              icon={Percent}
              color="text-accent"
              subtext="Across all funnels"
            />
            <AnalyticsStatCard
              label="Total Drop-offs"
              value={dropOffPoints.length}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Identified issues"
            />
            <AnalyticsStatCard
              label="Critical Issues"
              value={dropOffPoints.filter((d) => d.severity === 'critical').length}
              icon={Zap}
              color="text-danger"
              subtext="Require immediate fix"
            />
          </div>

          {/* Funnel Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {funnelData.map((funnel) => (
              <FunnelChart key={funnel.id} funnel={funnel} onSelect={setSelectedFunnel} />
            ))}
          </div>

          {/* Selected Funnel Detail */}
          {selectedFunnel && (
            <div className="rounded-xl border border-secondary/30 bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  {selectedFunnel.name} — Step Details
                </h3>
                <button
                  onClick={() => setSelectedFunnel(null)}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                {selectedFunnel.steps.map((step, idx) => {
                  const prevCount = idx > 0 ? selectedFunnel.steps[idx - 1].count : step.count;
                  const retention = idx === 0 ? 100 : ((step.count / prevCount) * 100).toFixed(1);
                  return (
                    <div key={step.name} className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        <span className="text-xs font-mono text-text-muted">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary">{step.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted">{retention}% retention</span>
                            <span className="text-xs font-mono font-medium text-text-primary">
                              {step.count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              parseFloat(retention) > 80
                                ? 'bg-accent'
                                : parseFloat(retention) > 60
                                  ? 'bg-warning'
                                  : 'bg-danger'
                            )}
                            style={{ width: `${retention}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ENGAGEMENT TAB ─── */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AnalyticsStatCard
              label="Avg Score"
              value={Math.round(
                engagementScores.reduce((s, e) => s + e.score, 0) / engagementScores.length
              )}
              icon={Star}
              color="text-purple-500"
              subtext="Out of 100"
              trend={3.2}
            />
            <AnalyticsStatCard
              label="Power Users"
              value={engagementScores.filter((e) => e.classification === 'power').length}
              icon={Crown}
              color="text-purple-500"
              subtext="Top 10% performers"
            />
            <AnalyticsStatCard
              label="At Risk"
              value={engagementScores.filter((e) => e.classification === 'at-risk').length}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Need attention"
              trend={-5.4}
            />
            <AnalyticsStatCard
              label="Dormant"
              value={engagementScores.filter((e) => e.classification === 'dormant').length}
              icon={Zap}
              color="text-danger"
              subtext="Re-engagement needed"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Classifications</option>
                <option value="power">Power Users</option>
                <option value="engaged">Engaged</option>
                <option value="at-risk">At Risk</option>
                <option value="dormant">Dormant</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredEngagement.length}</span> of{' '}
            {engagementScores.length} tenants
          </p>

          {/* Engagement Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEngagement.map((user) => (
              <EngagementCard key={user.tenantId} user={user} />
            ))}
            {filteredEngagement.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No tenants match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DROP-OFFS TAB ─── */}
      {activeTab === 'dropoffs' && (
        <div className="space-y-6">
          {/* Drop-off Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AnalyticsStatCard
              label="Total Issues"
              value={dropOffPoints.length}
              icon={Target}
              color="text-text-primary"
              subtext="Identified drop-offs"
            />
            <AnalyticsStatCard
              label="Critical"
              value={dropOffPoints.filter((d) => d.severity === 'critical').length}
              icon={Zap}
              color="text-danger"
              subtext="Immediate action required"
            />
            <AnalyticsStatCard
              label="Avg Drop-off"
              value={`${stats.avgDropOff}%`}
              icon={Percent}
              color="text-warning"
              subtext="Across all points"
            />
            <AnalyticsStatCard
              label="Potential Revenue"
              value="$92.4K"
              icon={DollarSign}
              color="text-accent"
              subtext="Monthly recovery potential"
            />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search drop-off points..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Drop-off Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDropOffs.map((dropOff) => (
              <DropOffCard key={dropOff.id} dropOff={dropOff} />
            ))}
            {filteredDropOffs.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <Target className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No drop-off points match your search.</p>
              </div>
            )}
          </div>

          {/* Priority Action List */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" /> Priority Actions
            </h3>
            <div className="space-y-3">
              {dropOffPoints
                .filter((d) => d.severity === 'critical' || d.severity === 'high')
                .sort((a, b) => b.dropOffRate - a.dropOffRate)
                .map((dropOff, idx) => (
                  <div
                    key={dropOff.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        dropOff.severity === 'critical' ? 'bg-danger/10' : 'bg-warning/10'
                      )}
                    >
                      <span className="text-xs font-bold text-text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-text-primary">
                          {dropOff.location}
                        </h4>
                        <SeverityBadge severity={dropOff.severity} />
                      </div>
                      <p className="text-xs text-text-secondary">{dropOff.suggestedFix}</p>
                      <p className="text-xs text-text-muted mt-1">Impact: {dropOff.impact}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'text-sm font-bold font-mono',
                          dropOff.dropOffRate >= 35 ? 'text-danger' : 'text-warning'
                        )}
                      >
                        {dropOff.dropOffRate}%
                      </p>
                      <p className="text-[10px] text-text-muted">drop-off</p>
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
