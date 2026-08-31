/* src/app/admin/billing/revenue/page.jsx */
import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Minus,
  CreditCard,
  Repeat,
  UserMinus,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Revenue Data ─── */
const revenueOverview = {
  mrr: 28450,
  arr: 341400,
  lastMonthMrr: 26500,
  churnRate: 2.4,
  lastMonthChurn: 3.1,
  netRevenueRetention: 108.5,
  lastMonthNrr: 105.2,
  activeCustomers: 142,
  newCustomersThisMonth: 8,
  churnedCustomersThisMonth: 3,
  avgRevenuePerUser: 200.35,
  expansionRevenue: 1850,
  contractionRevenue: 420,
};

const mrrBreakdown = [
  { month: 'Jan', mrr: 18500, new: 3200, expansion: 800, contraction: 400, churned: 1200 },
  { month: 'Feb', mrr: 19800, new: 2800, expansion: 600, contraction: 300, churned: 900 },
  { month: 'Mar', mrr: 21200, new: 3100, expansion: 900, contraction: 200, churned: 1100 },
  { month: 'Apr', mrr: 22800, new: 3500, expansion: 700, contraction: 400, churned: 800 },
  { month: 'May', mrr: 24100, new: 2900, expansion: 1100, contraction: 300, churned: 700 },
  { month: 'Jun', mrr: 25200, new: 2600, expansion: 800, contraction: 200, churned: 600 },
  { month: 'Jul', mrr: 26500, new: 3200, expansion: 950, contraction: 350, churned: 850 },
  { month: 'Aug', mrr: 28450, new: 3800, expansion: 1200, contraction: 250, churned: 700 },
];

const planDistribution = [
  { plan: 'Starter', customers: 78, mrr: 15522, color: 'bg-info', textColor: 'text-info' },
  {
    plan: 'Professional',
    customers: 45,
    mrr: 22455,
    color: 'bg-secondary',
    textColor: 'text-secondary',
  },
  {
    plan: 'Enterprise',
    customers: 19,
    mrr: 10473,
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
  },
];

const churnReasons = [
  { reason: 'Switched to competitor', count: 12, pct: 35 },
  { reason: 'Business closed', count: 8, pct: 24 },
  { reason: 'Too expensive', count: 6, pct: 18 },
  { reason: 'Missing features', count: 4, pct: 12 },
  { reason: 'Poor support', count: 3, pct: 9 },
  { reason: 'Other', count: 1, pct: 2 },
];

const topCustomers = [
  {
    id: 'TNT-001',
    name: 'Grand Hotel Boston',
    plan: 'Enterprise',
    mrr: 4990,
    trend: 5.2,
    since: '2025-03',
  },
  {
    id: 'TNT-007',
    name: 'Urban Hotel NYC',
    plan: 'Professional',
    mrr: 499,
    trend: 12.8,
    since: '2025-04',
  },
  {
    id: 'TNT-002',
    name: 'Seaside Resort Miami',
    plan: 'Professional',
    mrr: 499,
    trend: -2.1,
    since: '2025-06',
  },
  {
    id: 'TNT-005',
    name: 'Coastal Inn San Diego',
    plan: 'Starter',
    mrr: 199,
    trend: 0,
    since: '2025-09',
  },
  {
    id: 'TNT-003',
    name: 'Mountain Lodge Aspen',
    plan: 'Professional',
    mrr: 0,
    trend: 0,
    since: '2026-08',
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount}`;
}

function TrendBadge({ value, suffix = '%', invert = false }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = invert ? isNegative : isPositive;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isGood ? 'text-accent' : isNegative || isPositive ? 'text-danger' : 'text-text-muted'
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : isNegative ? (
        <ArrowDownRight className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

/* ─── Stat Card ─── */
function RevenueStatCard({ label, value, subtext, icon: Icon, color, trend, invertTrend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <div className="mt-1">
              <TrendBadge value={trend} invert={invertTrend} />
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Simple Bar Chart (SVG) ─── */
function SimpleBarChart({ data, dataKey, labelKey, color = '#863bff', height = 160 }) {
  const max = Math.max(...data.map((d) => d[dataKey]));
  const barWidth = data.length > 0 ? (100 / data.length) * 0.7 : 0;
  const gap = data.length > 0 ? (100 / data.length) * 0.3 : 0;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${data.length * 40} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d[dataKey] / max) * (height - 24) : 0;
          const x = i * 40 + 5;
          const y = height - 24 - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={30} height={barHeight} rx={4} fill={color} opacity={0.85} />
              <text
                x={x + 15}
                y={height - 6}
                textAnchor="middle"
                className="fill-text-muted"
                style={{ fontSize: '9px' }}
              >
                {d[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Stacked Bar Chart for MRR Breakdown ─── */
function MrrStackedChart({ data }) {
  const max = Math.max(...data.map((d) => d.mrr));
  const height = 200;
  const barWidth = data.length > 0 ? (100 / data.length) * 0.65 : 0;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${data.length * 60} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const totalHeight = max > 0 ? (d.mrr / max) * (height - 30) : 0;
          const newH = max > 0 ? (d.new / max) * (height - 30) : 0;
          const expH = max > 0 ? (d.expansion / max) * (height - 30) : 0;
          const conH = max > 0 ? (d.contraction / max) * (height - 30) : 0;
          const churnH = max > 0 ? (d.churned / max) * (height - 30) : 0;
          const x = i * 60 + 8;
          const baseY = height - 30;

          return (
            <g key={i}>
              {/* Base MRR */}
              <rect
                x={x}
                y={baseY - totalHeight}
                width={44}
                height={totalHeight}
                rx={4}
                fill="#e2e8f0"
                className="dark:fill-slate-700"
              />
              {/* New */}
              <rect x={x} y={baseY - newH} width={44} height={newH} rx={2} fill="#22c55e" />
              {/* Expansion */}
              <rect x={x} y={baseY - newH - expH} width={44} height={expH} rx={2} fill="#863bff" />
              {/* Contraction */}
              <rect x={x} y={baseY - conH} width={44} height={conH} rx={2} fill="#f59e0b" />
              {/* Churned (negative, shown from bottom) */}
              <rect
                x={x}
                y={baseY}
                width={44}
                height={churnH * 0.5}
                rx={2}
                fill="#ef4444"
                opacity={0.6}
              />
              {/* Label */}
              <text
                x={x + 22}
                y={height - 8}
                textAnchor="middle"
                className="fill-text-muted"
                style={{ fontSize: '10px' }}
              >
                {d.month}
              </text>
              {/* MRR value */}
              <text
                x={x + 22}
                y={baseY - totalHeight - 6}
                textAnchor="middle"
                className="fill-text-primary font-mono"
                style={{ fontSize: '9px', fontWeight: 600 }}
              >
                {formatCompactCurrency(d.mrr)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-accent" /> New
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-secondary" /> Expansion
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-warning" /> Contraction
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-danger" /> Churn
        </span>
      </div>
    </div>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.mrr, 0);
  let accumulated = 0;
  const center = size / 2;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;

  const colors = { 'bg-info': '#3b82f6', 'bg-secondary': '#863bff', 'bg-purple-500': '#a855f7' };

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = total > 0 ? d.mrr / total : 0;
          const dash = pct * circumference;
          const offset = circumference - accumulated;
          accumulated += dash;
          const color = colors[d.color] || '#94a3b8';
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset + circumference}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-text-primary"
          style={{ fontSize: '14px', fontWeight: 700 }}
        >
          {data.length}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="fill-text-muted"
          style={{ fontSize: '9px' }}
        >
          customers
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.plan} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', d.color)} />
            <span className="text-xs text-text-secondary">{d.plan}</span>
            <span className="text-xs font-mono font-medium text-text-primary">
              {formatCurrency(d.mrr)}
            </span>
            <span className="text-[10px] text-text-muted">({d.customers})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RevenuePage() {
  const [timeRange, setTimeRange] = useState('12m');
  const [showChurnDetails, setShowChurnDetails] = useState(false);

  const mrrGrowth = (
    ((revenueOverview.mrr - revenueOverview.lastMonthMrr) / revenueOverview.lastMonthMrr) *
    100
  ).toFixed(1);
  const churnChange = (revenueOverview.churnRate - revenueOverview.lastMonthChurn).toFixed(1);
  const nrrChange = (revenueOverview.netRevenueRetention - revenueOverview.lastMonthNrr).toFixed(1);

  const totalCustomers = planDistribution.reduce((s, d) => s + d.customers, 0);
  const totalMrr = planDistribution.reduce((s, d) => s + d.mrr, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Revenue Analytics</h1>
          <p className="text-sm text-text-secondary">
            MRR, ARR, churn analysis, and revenue breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="ytd">Year to Date</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RevenueStatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(revenueOverview.mrr)}
          icon={DollarSign}
          color="text-secondary"
          subtext={`vs ${formatCurrency(revenueOverview.lastMonthMrr)} last month`}
          trend={parseFloat(mrrGrowth)}
        />
        <RevenueStatCard
          label="Annual Recurring Revenue"
          value={formatCurrency(revenueOverview.arr)}
          icon={Repeat}
          color="text-purple-500"
          subtext="Based on current MRR × 12"
        />
        <RevenueStatCard
          label="Net Revenue Retention"
          value={`${revenueOverview.netRevenueRetention}%`}
          icon={Target}
          color="text-accent"
          subtext="Including expansion & contraction"
          trend={parseFloat(nrrChange)}
        />
        <RevenueStatCard
          label="Churn Rate"
          value={`${revenueOverview.churnRate}%`}
          icon={UserMinus}
          color="text-danger"
          subtext={`${revenueOverview.churnedCustomersThisMonth} customers churned`}
          trend={parseFloat(churnChange)}
          invertTrend
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RevenueStatCard
          label="Active Customers"
          value={revenueOverview.activeCustomers}
          icon={Users}
          color="text-info"
          subtext={`+${revenueOverview.newCustomersThisMonth} this month`}
          trend={5.6}
        />
        <RevenueStatCard
          label="ARPU"
          value={formatCurrency(revenueOverview.avgRevenuePerUser)}
          icon={CreditCard}
          color="text-warning"
          subtext="Average revenue per user"
          trend={3.2}
        />
        <RevenueStatCard
          label="Expansion Revenue"
          value={formatCurrency(revenueOverview.expansionRevenue)}
          icon={TrendingUp}
          color="text-accent"
          subtext="Upsells & upgrades this month"
          trend={8.4}
        />
        <RevenueStatCard
          label="Contraction Revenue"
          value={formatCurrency(revenueOverview.contractionRevenue)}
          icon={TrendingDown}
          color="text-danger"
          subtext="Downgrades this month"
          trend={-12.5}
          invertTrend
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MRR Trend */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" /> MRR Breakdown
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                Growth: <span className="font-mono font-medium text-accent">+{mrrGrowth}%</span>
              </span>
            </div>
          </div>
          <MrrStackedChart data={mrrBreakdown} />
        </div>

        {/* Plan Distribution */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-secondary" /> Plan Distribution
          </h3>
          <DonutChart data={planDistribution} />
          <div className="mt-4 space-y-2">
            {planDistribution.map((d) => {
              const pct = totalCustomers > 0 ? Math.round((d.customers / totalCustomers) * 100) : 0;
              const mrrPct = totalMrr > 0 ? Math.round((d.mrr / totalMrr) * 100) : 0;
              return (
                <div key={d.plan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{d.plan}</span>
                    <span className="font-mono text-text-primary">
                      {pct}% · {formatCurrency(d.mrr)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', d.color)}
                      style={{ width: `${mrrPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Churn Analysis */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-secondary" /> Churn Analysis
          </h3>
          <button
            onClick={() => setShowChurnDetails(!showChurnDetails)}
            className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            {showChurnDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showChurnDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Churn Reasons */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              Top Churn Reasons
            </h4>
            <div className="space-y-3">
              {churnReasons.map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{r.reason}</span>
                    <span className="font-mono text-text-primary">
                      {r.count} ({r.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        r.pct >= 30 ? 'bg-danger' : r.pct >= 15 ? 'bg-warning' : 'bg-text-muted'
                      )}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Churn Metrics */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Gross Churn</p>
                  <p className="mt-1 text-xl font-bold font-mono text-danger">
                    {revenueOverview.churnRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Monthly</p>
                  <p className="text-sm font-mono text-text-primary">
                    {revenueOverview.churnedCustomersThisMonth} customers
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Net Churn</p>
                  <p className="mt-1 text-xl font-bold font-mono text-accent">
                    {(
                      ((revenueOverview.newCustomersThisMonth -
                        revenueOverview.churnedCustomersThisMonth) /
                        revenueOverview.activeCustomers) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Net growth</p>
                  <p className="text-sm font-mono text-text-primary">
                    +
                    {revenueOverview.newCustomersThisMonth -
                      revenueOverview.churnedCustomersThisMonth}{' '}
                    customers
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">
                    Customer Lifetime Value
                  </p>
                  <p className="mt-1 text-xl font-bold font-mono text-secondary">
                    {formatCurrency(
                      revenueOverview.avgRevenuePerUser / (revenueOverview.churnRate / 100)
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">LTV:CAC</p>
                  <p className="text-sm font-mono text-text-primary">3.2:1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" /> Top Customers by MRR
          </h3>
          <span className="text-xs text-text-muted">{topCustomers.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  MRR
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Since
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-[10px] text-text-muted font-mono">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        c.plan === 'Enterprise'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : c.plan === 'Professional'
                            ? 'bg-secondary/10 text-secondary border-secondary/20'
                            : 'bg-info/10 text-info border-info/20'
                      )}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                    {formatCurrency(c.mrr)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TrendBadge value={c.trend} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{c.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
