/* src/app/admin/finances/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Globe,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Percent,
  Wallet,
  Receipt,
  Landmark,
  LineChart,
  Layers,
  Calculator,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

import {
  revenueOverview,
  mrrHistory,
  arrHistory,
  churnMetrics,
  churnHistory,
  cohortData,
  ltvData,
  ltvTrend,
  revenueRecognition,
  paymentGateways,
  paymentMethodDistribution,
  taxSummary,
  forecastData,
  planDistribution,
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
} from './data';

import {
  FinanceStatCard,
  MrrBreakdownChart,
  MrrTrendChart,
  ChurnTrendChart,
  CohortHeatmap,
  LtvComparisonChart,
  LtvTrendChart,
  GatewayCard,
  PaymentMethodChart,
  ForecastChart,
  PlanDistributionChart,
  TaxJurisdictionTable,
  RevenueRecognitionTable,
  ChurnReasonChart,
} from './components';

/* ─── Tabs ─── */
const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'mrr-arr', label: 'MRR / ARR', icon: TrendingUp },
  { id: 'churn', label: 'Churn & Retention', icon: Users },
  { id: 'ltv', label: 'LTV & Cohorts', icon: Target },
  { id: 'recognition', label: 'Revenue Recognition', icon: Receipt },
  { id: 'payments', label: 'Payment Health', icon: CreditCard },
  { id: 'tax', label: 'Tax Reporting', icon: Landmark },
  { id: 'forecast', label: 'Forecast', icon: LineChart },
];

/* ─── Main Page ─── */
export default function FinancesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => setLastRefresh(new Date());

  /* ─── Computed Stats ─── */
  const mrrGrowth = useMemo(() => {
    const current = revenueOverview.mrr;
    const prev = revenueOverview.lastMonthMrr;
    return ((current - prev) / prev) * 100;
  }, []);

  const arrGrowth = useMemo(() => {
    const current = revenueOverview.arr;
    const prev = revenueOverview.lastYearArr;
    return ((current - prev) / prev) * 100;
  }, []);

  const totalCustomers = useMemo(() => planDistribution.reduce((s, p) => s + p.customers, 0), []);
  const avgRevenuePerCustomer = useMemo(
    () => revenueOverview.mrr / totalCustomers,
    [totalCustomers]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Financial Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Revenue metrics, churn analysis, forecasting, and financial health
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

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
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

      {/* ═══════════════════════════════════════
          OVERVIEW TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Monthly Recurring Revenue"
              value={formatCurrency(revenueOverview.mrr)}
              icon={DollarSign}
              color="text-secondary"
              trend={mrrGrowth}
              trendLabel="vs last month"
              subtext={formatCurrency(revenueOverview.arr) + ' ARR'}
            />
            <FinanceStatCard
              label="Annual Recurring Revenue"
              value={formatCurrency(revenueOverview.arr)}
              icon={TrendingUp}
              color="text-accent"
              trend={arrGrowth}
              trendLabel="vs last year"
              subtext="Net of discounts & refunds"
            />
            <FinanceStatCard
              label="Net Revenue Retention"
              value={formatPercent(churnMetrics.netRevenueRetention)}
              icon={Users}
              color="text-accent"
              subtext={`Gross: ${formatPercent(churnMetrics.grossRevenueRetention)}`}
            />
            <FinanceStatCard
              label="Avg Revenue / Customer"
              value={formatCurrency(avgRevenuePerCustomer)}
              icon={PieChart}
              color="text-purple-500"
              subtext={`${totalCustomers} total customers`}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="YTD Net Revenue"
              value={formatCurrency(revenueOverview.netRevenue)}
              icon={Wallet}
              color="text-text-primary"
              subtext={`Gross: ${formatCurrency(revenueOverview.grossRevenue)}`}
            />
            <FinanceStatCard
              label="YTD Refunds"
              value={formatCurrency(revenueOverview.refunds)}
              icon={ArrowDownRight}
              color="text-danger"
              subtext={`${((revenueOverview.refunds / revenueOverview.grossRevenue) * 100).toFixed(1)}% of gross`}
            />
            <FinanceStatCard
              label="YTD Discounts"
              value={formatCurrency(revenueOverview.discounts)}
              icon={Percent}
              color="text-warning"
              subtext={`${((revenueOverview.discounts / revenueOverview.grossRevenue) * 100).toFixed(1)}% of gross`}
            />
            <FinanceStatCard
              label="Deferred Revenue"
              value={formatCurrency(revenueRecognition.deferredRevenue)}
              icon={Clock}
              color="text-info"
              subtext={`${formatCurrency(revenueRecognition.unbilledRevenue)} unbilled`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* MRR Trend */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" /> MRR Trend (8 months)
                </h3>
                <span className="text-xs text-text-muted">+{mrrGrowth.toFixed(1)}% growth</span>
              </div>
              <MrrTrendChart data={mrrHistory} />
            </div>

            {/* Plan Distribution */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-secondary" /> Revenue by Plan
                </h3>
              </div>
              <PlanDistributionChart data={planDistribution} />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {planDistribution.map((p) => (
                  <div key={p.plan} className="rounded-lg border border-border bg-background p-2">
                    <p className="text-xs text-text-muted">{p.plan}</p>
                    <p className="text-sm font-bold font-mono text-text-primary">
                      {formatCurrency(p.mrr)}
                    </p>
                    <p className="text-[10px] text-text-muted">{p.customers} customers</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Churn Snapshot */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" /> Churn Snapshot
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Logo Churn (monthly)</span>
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      churnMetrics.logoChurnRate > 5 ? 'text-danger' : 'text-text-primary'
                    )}
                  >
                    {churnMetrics.logoChurnRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Revenue Churn (monthly)</span>
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      churnMetrics.revenueChurnRate > 4 ? 'text-danger' : 'text-text-primary'
                    )}
                  >
                    {churnMetrics.revenueChurnRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Net Revenue Retention</span>
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      churnMetrics.netRevenueRetention >= 100 ? 'text-accent' : 'text-danger'
                    )}
                  >
                    {formatPercent(churnMetrics.netRevenueRetention)}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-xs text-text-muted mb-2">Top Churn Reasons</p>
                  <ChurnReasonChart data={churnMetrics.avgChurnReasons.slice(0, 3)} />
                </div>
              </div>
            </div>

            {/* Payment Health */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-secondary" /> Payment Health
              </h3>
              <div className="space-y-3">
                {paymentGateways.map((gw) => (
                  <div
                    key={gw.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          gw.status === 'healthy'
                            ? 'bg-accent'
                            : gw.status === 'degraded'
                              ? 'bg-warning'
                              : 'bg-danger'
                        )}
                      />
                      <span className="text-sm text-text-primary">{gw.name}</span>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-mono font-medium',
                          gw.successRate >= 98
                            ? 'text-accent'
                            : gw.successRate >= 95
                              ? 'text-warning'
                              : 'text-danger'
                        )}
                      >
                        {gw.successRate}%
                      </p>
                      <p className="text-[10px] text-text-muted">{gw.avgProcessingTime}ms</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-muted mb-2">Payment Methods</p>
                <div className="flex flex-wrap gap-1">
                  {paymentMethodDistribution.slice(0, 4).map((m) => (
                    <span
                      key={m.method}
                      className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary"
                    >
                      {m.method} {m.pct}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Forecast Preview */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-secondary" /> 12-Month Forecast
              </h3>
              <div className="space-y-3">
                {forecastData.forecastPeriods.slice(0, 6).map((f) => (
                  <div key={f.month} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{f.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary/60"
                          style={{ width: `${(f.realistic / 500000) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-text-primary">
                        {formatCompactCurrency(f.realistic)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Projected ARR (12mo)</span>
                  <span className="font-bold font-mono text-accent">
                    {formatCompactCurrency(forecastData.forecastPeriods[11].realistic * 12)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MRR / ARR TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'mrr-arr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Current MRR"
              value={formatCurrency(revenueOverview.mrr)}
              icon={DollarSign}
              color="text-secondary"
              trend={mrrGrowth}
              trendLabel="MoM"
            />
            <FinanceStatCard
              label="Current ARR"
              value={formatCurrency(revenueOverview.arr)}
              icon={TrendingUp}
              color="text-accent"
              trend={arrGrowth}
              trendLabel="YoY"
            />
            <FinanceStatCard
              label="New MRR (Aug)"
              value={formatCurrency(mrrHistory[mrrHistory.length - 1].newMrr)}
              icon={Zap}
              color="text-emerald-500"
              subtext="New customers"
            />
            <FinanceStatCard
              label="Expansion MRR"
              value={formatCurrency(mrrHistory[mrrHistory.length - 1].expansionMrr)}
              icon={ArrowUpRight}
              color="text-blue-500"
              subtext="Upsells & upgrades"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">MRR Trend</h3>
              <MrrTrendChart data={mrrHistory} />
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                MRR Breakdown by Type
              </h3>
              <MrrBreakdownChart data={mrrHistory} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">ARR Growth History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arrHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="var(--text-muted)"
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'ARR']}
                  />
                  <Bar dataKey="arr" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MRR Movement Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Monthly MRR Movement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Starting MRR
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-emerald-500">
                      + New
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-blue-500">
                      + Expansion
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-amber-500">
                      − Contraction
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-danger">
                      − Churn
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Ending MRR
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Net Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mrrHistory.map((m, i) => {
                    const startMrr =
                      i > 0
                        ? mrrHistory[i - 1].mrr
                        : m.mrr - (m.newMrr + m.expansionMrr - m.contractionMrr - m.churnedMrr);
                    const netChange = m.newMrr + m.expansionMrr - m.contractionMrr - m.churnedMrr;
                    return (
                      <tr key={m.month} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-text-primary">{m.month}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-secondary">
                          {formatCurrency(startMrr)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">
                          +{formatCurrency(m.newMrr)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-500">
                          +{formatCurrency(m.expansionMrr)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-500">
                          −{formatCurrency(m.contractionMrr)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-danger">
                          −{formatCurrency(m.churnedMrr)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                          {formatCurrency(m.mrr)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-mono font-medium',
                            netChange >= 0 ? 'text-accent' : 'text-danger'
                          )}
                        >
                          {netChange >= 0 ? '+' : ''}
                          {formatCurrency(netChange)}
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

      {/* ═══════════════════════════════════════
          CHURN & RETENTION TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'churn' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Logo Churn Rate"
              value={`${churnMetrics.logoChurnRate}%`}
              icon={Users}
              color={churnMetrics.logoChurnRate > 5 ? 'text-danger' : 'text-text-primary'}
              subtext="Monthly"
            />
            <FinanceStatCard
              label="Revenue Churn"
              value={`${churnMetrics.revenueChurnRate}%`}
              icon={TrendingDown}
              color={churnMetrics.revenueChurnRate > 4 ? 'text-danger' : 'text-text-primary'}
              subtext="Monthly"
            />
            <FinanceStatCard
              label="Net Revenue Retention"
              value={formatPercent(churnMetrics.netRevenueRetention)}
              icon={TrendingUp}
              color={churnMetrics.netRevenueRetention >= 100 ? 'text-accent' : 'text-danger'}
              subtext="NRR"
            />
            <FinanceStatCard
              label="Gross Retention"
              value={formatPercent(churnMetrics.grossRevenueRetention)}
              icon={Shield}
              color="text-info"
              subtext="GRR"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Churn Trend vs NRR</h3>
              <ChurnTrendChart data={churnHistory} />
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Churn Reasons</h3>
              <ChurnReasonChart data={churnMetrics.avgChurnReasons} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          LTV & COHORTS TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'ltv' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Enterprise LTV"
              value={formatCurrency(ltvData[0].avgLtv)}
              icon={Target}
              color="text-purple-500"
              subtext={`CAC: ${formatCurrency(ltvData[0].cac)}`}
            />
            <FinanceStatCard
              label="Professional LTV"
              value={formatCurrency(ltvData[1].avgLtv)}
              icon={Target}
              color="text-secondary"
              subtext={`CAC: ${formatCurrency(ltvData[1].cac)}`}
            />
            <FinanceStatCard
              label="Starter LTV"
              value={formatCurrency(ltvData[2].avgLtv)}
              icon={Target}
              color="text-accent"
              subtext={`CAC: ${formatCurrency(ltvData[2].cac)}`}
            />
            <FinanceStatCard
              label="Avg LTV:CAC Ratio"
              value={ltvData.reduce((s, d) => s + d.ltvCacRatio, 0) / ltvData.length}
              icon={Percent}
              color="text-accent"
              subtext="Target: >3x"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                LTV vs CAC by Segment
              </h3>
              <LtvComparisonChart data={ltvData} />
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">LTV Trend by Segment</h3>
              <LtvTrendChart data={ltvTrend} />
            </div>
          </div>

          {/* LTV Detail Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ltvData.map((segment) => (
              <div key={segment.segment} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-text-primary">{segment.segment}</h4>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      segment.ltvCacRatio >= 5
                        ? 'bg-accent/10 text-accent border-accent/20'
                        : segment.ltvCacRatio >= 3
                          ? 'bg-info/10 text-info border-info/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                    )}
                  >
                    LTV:CAC {segment.ltvCacRatio}x
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Avg LTV</span>
                    <span className="font-mono font-medium text-text-primary">
                      {formatCurrency(segment.avgLtv)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">CAC</span>
                    <span className="font-mono font-medium text-text-primary">
                      {formatCurrency(segment.cac)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Avg Lifetime</span>
                    <span className="font-mono font-medium text-text-primary">
                      {segment.avgLifetimeMonths} months
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Monthly Revenue</span>
                    <span className="font-mono font-medium text-text-primary">
                      {formatCurrency(segment.monthlyRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cohort Retention Heatmap */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Cohort Retention Analysis</h3>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-emerald-500" /> 95%+
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-teal-300" /> 85-95%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-sky-300" /> 75-85%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded bg-blue-300" /> &lt;75%
                </span>
              </div>
            </div>
            <CohortHeatmap data={cohortData} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          REVENUE RECOGNITION TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'recognition' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Deferred Revenue"
              value={formatCurrency(revenueRecognition.deferredRevenue)}
              icon={Clock}
              color="text-info"
              subtext="Unearned"
            />
            <FinanceStatCard
              label="Recognized YTD"
              value={formatCurrency(revenueRecognition.recognizedRevenueYtd)}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Earned revenue"
            />
            <FinanceStatCard
              label="Unbilled Revenue"
              value={formatCurrency(revenueRecognition.unbilledRevenue)}
              icon={Receipt}
              color="text-warning"
              subtext="Accrued"
            />
            <FinanceStatCard
              label="Contract Liabilities"
              value={formatCurrency(revenueRecognition.contractLiabilities)}
              icon={Layers}
              color="text-purple-500"
              subtext="Prepayments"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Performance Obligations</h3>
            </div>
            <RevenueRecognitionTable obligations={revenueRecognition.performanceObligations} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          PAYMENT HEALTH TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Overall Success Rate"
              value={`${(paymentGateways.reduce((s, g) => s + g.successRate, 0) / paymentGateways.length).toFixed(1)}%`}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Across all gateways"
            />
            <FinanceStatCard
              label="Total Volume (Month)"
              value={formatCompactCurrency(paymentGateways.reduce((s, g) => s + g.volumeMonth, 0))}
              icon={DollarSign}
              color="text-secondary"
              subtext="All gateways"
            />
            <FinanceStatCard
              label="Failed Today"
              value={paymentGateways.reduce((s, g) => s + g.failuresToday, 0)}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Transactions"
            />
            <FinanceStatCard
              label="Avg Latency"
              value={`${Math.round(paymentGateways.reduce((s, g) => s + g.avgProcessingTime, 0) / paymentGateways.length)}ms`}
              icon={Zap}
              color="text-info"
              subtext="All gateways"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {paymentGateways.map((gw) => (
              <GatewayCard key={gw.id} gateway={gw} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Payment Method Distribution
              </h3>
              <PaymentMethodChart data={paymentMethodDistribution} />
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Gateway Volume Comparison
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentGateways}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [value.toLocaleString(), 'Transactions']}
                    />
                    <Bar
                      dataKey="volumeMonth"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Monthly Volume"
                    />
                    <Bar
                      dataKey="volumeToday"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Today's Volume"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          TAX REPORTING TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Tax Collected YTD"
              value={formatCurrency(taxSummary.totalTaxCollectedYtd)}
              icon={Landmark}
              color="text-secondary"
              subtext="All jurisdictions"
            />
            <FinanceStatCard
              label="Tax Remitted YTD"
              value={formatCurrency(taxSummary.totalTaxRemittedYtd)}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Paid to authorities"
            />
            <FinanceStatCard
              label="Pending Remittance"
              value={formatCurrency(taxSummary.pendingRemittance)}
              icon={Clock}
              color="text-warning"
              subtext="Due soon"
            />
            <FinanceStatCard
              label="Jurisdictions"
              value={taxSummary.jurisdictions.length}
              icon={Globe}
              color="text-info"
              subtext="Active tax regions"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Tax by Jurisdiction</h3>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export Report
              </Button>
            </div>
            <TaxJurisdictionTable jurisdictions={taxSummary.jurisdictions} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          FORECAST TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FinanceStatCard
              label="Current MRR"
              value={formatCurrency(forecastData.currentMrr)}
              icon={DollarSign}
              color="text-secondary"
              subtext="Baseline"
            />
            <FinanceStatCard
              label="12mo Realistic"
              value={formatCurrency(forecastData.forecastPeriods[11].realistic)}
              icon={Target}
              color="text-blue-500"
              subtext="Projected MRR"
            />
            <FinanceStatCard
              label="12mo Optimistic"
              value={formatCurrency(forecastData.forecastPeriods[11].optimistic)}
              icon={TrendingUp}
              color="text-accent"
              subtext="Best case"
            />
            <FinanceStatCard
              label="12mo Conservative"
              value={formatCurrency(forecastData.forecastPeriods[11].conservative)}
              icon={TrendingDown}
              color="text-info"
              subtext="Worst case"
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">12-Month MRR Forecast</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Optimistic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Realistic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Conservative
                </span>
              </div>
            </div>
            <ForecastChart
              data={forecastData.forecastPeriods}
              currentMrr={forecastData.currentMrr}
            />
          </div>

          {/* Assumptions */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-secondary" /> Forecast Assumptions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  New Customer Growth
                </p>
                <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                  {forecastData.assumptions.newCustomerGrowth}%
                </p>
                <p className="text-xs text-text-muted">Monthly</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Expansion Rate</p>
                <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                  {forecastData.assumptions.avgExpansionRate}%
                </p>
                <p className="text-xs text-text-muted">Monthly</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Churn Rate</p>
                <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                  {forecastData.assumptions.churnRate}%
                </p>
                <p className="text-xs text-text-muted">Monthly</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">ASP Growth</p>
                <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                  {forecastData.assumptions.avgSellingPriceGrowth}%
                </p>
                <p className="text-xs text-text-muted">Quarterly</p>
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary">Forecast Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-emerald-500">
                      Optimistic
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-blue-500">
                      Realistic
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase text-red-500">
                      Conservative
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {forecastData.forecastPeriods.map((f) => (
                    <tr key={f.month} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">{f.month}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-500">
                        {formatCurrency(f.optimistic)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-blue-500">
                        {formatCurrency(f.realistic)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">
                        {formatCurrency(f.conservative)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        ±{formatPercent(((f.optimistic - f.conservative) / f.realistic) * 50)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
