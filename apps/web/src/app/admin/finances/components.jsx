/* src/app/admin/finances/components.jsx */
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  CreditCard,
  Globe,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { gatewayStatusMeta, formatCurrency, formatCompactCurrency, formatPercent } from './data';

/* ─── Stat Card ─── */
export function FinanceStatCard({ label, value, subtext, icon: Icon, color, trend, trendLabel }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <div
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                trend >= 0 ? 'text-accent' : 'text-danger'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trend >= 0 ? '+' : ''}
              {trend}%
              {trendLabel && <span className="text-text-muted font-normal">{trendLabel}</span>}
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

/* ─── Mini Sparkline ─── */
export function MiniSparkline({ data, dataKey, color = '#3b82f6', width = 120, height = 32 }) {
  if (!data || data.length < 2) return <div className="h-8 w-28 bg-border rounded" />;
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`url(#spark-${dataKey})`}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── MRR Breakdown Chart ─── */
export function MrrBreakdownChart({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="newMrr" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="New" />
          <Bar
            dataKey="expansionMrr"
            stackId="a"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]}
            name="Expansion"
          />
          <Bar
            dataKey="contractionMrr"
            stackId="a"
            fill="#f59e0b"
            radius={[0, 0, 0, 0]}
            name="Contraction"
          />
          <Bar dataKey="churnedMrr" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Churn" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── MRR Trend Line Chart ─── */
export function MrrTrendChart({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => [formatCurrency(value), 'MRR']}
          />
          <Area
            type="monotone"
            dataKey="mrr"
            stroke="#3b82f6"
            fill="url(#mrrGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Churn Trend Chart ─── */
export function ChurnTrendChart({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            unit="%"
            domain={[0, 6]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            domain={[100, 115]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            yAxisId="left"
            dataKey="logoChurn"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            name="Logo Churn %"
          />
          <Bar
            yAxisId="left"
            dataKey="revenueChurn"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            name="Revenue Churn %"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="nrr"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="NRR %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Cohort Retention Heatmap ─── */
export function CohortHeatmap({ data }) {
  const monthLabels = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];

  const getColor = (value) => {
    if (value === null) return 'bg-surface';
    if (value >= 95) return 'bg-emerald-500/90';
    if (value >= 90) return 'bg-emerald-400/80';
    if (value >= 85) return 'bg-emerald-300/70';
    if (value >= 80) return 'bg-teal-300/60';
    if (value >= 75) return 'bg-cyan-300/50';
    if (value >= 70) return 'bg-sky-300/50';
    return 'bg-blue-300/40';
  };

  const getTextColor = (value) => {
    if (value === null) return 'text-text-muted';
    if (value >= 85) return 'text-white';
    return 'text-text-primary';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium">Cohort</th>
            <th className="px-2 py-1.5 text-center text-text-muted font-medium">Size</th>
            {monthLabels.map((m) => (
              <th key={m} className="px-2 py-1.5 text-center text-text-muted font-medium w-12">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cohort) => (
            <tr key={cohort.cohort} className="border-t border-border">
              <td className="px-2 py-1.5 font-medium text-text-primary whitespace-nowrap">
                {cohort.cohort}
              </td>
              <td className="px-2 py-1.5 text-center text-text-secondary">{cohort.size}</td>
              {cohort.months.map((val, i) => (
                <td key={i} className="px-1 py-1">
                  <div
                    className={cn(
                      'h-7 w-full rounded flex items-center justify-center text-[10px] font-medium',
                      getColor(val),
                      getTextColor(val)
                    )}
                  >
                    {val !== null ? `${val.toFixed(1)}` : '—'}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── LTV Comparison Chart ─── */
export function LtvComparisonChart({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="segment"
            tick={{ fontSize: 11 }}
            stroke="var(--text-muted)"
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="avgLtv" fill="#3b82f6" radius={[0, 4, 4, 0]} name="LTV" />
          <Bar dataKey="cac" fill="#f59e0b" radius={[0, 4, 4, 0]} name="CAC" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── LTV Trend Chart ─── */
export function LtvTrendChart({ data }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="quarter" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line
            type="monotone"
            dataKey="enterprise"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Enterprise"
          />
          <Line
            type="monotone"
            dataKey="professional"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Professional"
          />
          <Line
            type="monotone"
            dataKey="starter"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Starter"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Payment Gateway Card ─── */
export function GatewayCard({ gateway }) {
  const meta = gatewayStatusMeta[gateway.status] || gatewayStatusMeta.healthy;
  const StatusIcon =
    gateway.status === 'healthy'
      ? CheckCircle2
      : gateway.status === 'degraded'
        ? AlertTriangle
        : WifiOff;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all',
        gateway.status === 'critical'
          ? 'border-danger/30'
          : gateway.status === 'degraded'
            ? 'border-warning/30'
            : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.class)}>
            <CreditCard
              className={cn(
                'h-4 w-4',
                gateway.status === 'healthy'
                  ? 'text-accent'
                  : gateway.status === 'degraded'
                    ? 'text-warning'
                    : 'text-danger'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{gateway.name}</h3>
            <p className="text-[10px] text-text-muted">
              {gateway.methods.map((m) => m.replace('_', ' ')).join(', ')}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            meta.class
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Success Rate</p>
          <p
            className={cn(
              'text-sm font-mono font-medium',
              gateway.successRate >= 98
                ? 'text-accent'
                : gateway.successRate >= 95
                  ? 'text-warning'
                  : 'text-danger'
            )}
          >
            {gateway.successRate}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg Latency</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {gateway.avgProcessingTime}ms
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Today</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {gateway.volumeToday.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Failures</p>
          <p
            className={cn(
              'text-sm font-mono font-medium',
              gateway.failuresToday > 100 ? 'text-warning' : 'text-text-primary'
            )}
          >
            {gateway.failuresToday}
          </p>
        </div>
      </div>

      {gateway.alert && (
        <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-2 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">{gateway.alert}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span>Uptime: {gateway.uptime}</span>
        <span>Last incident: {gateway.lastIncident}</span>
      </div>
    </div>
  );
}

/* ─── Payment Method Distribution ─── */
export function PaymentMethodChart({ data }) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="pct"
            nameKey="method"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value, name, props) => [
              `${value}% — ${formatCurrency(props.payload.volume)}`,
              props.payload.method,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Forecast Chart ─── */
export function ForecastChart({ data, currentMrr }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="optimisticGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="conservativeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Area
            type="monotone"
            dataKey="optimistic"
            stroke="#10b981"
            fill="url(#optimisticGrad)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            name="Optimistic"
          />
          <Area
            type="monotone"
            dataKey="realistic"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Realistic"
          />
          <Area
            type="monotone"
            dataKey="conservative"
            stroke="#ef4444"
            fill="url(#conservativeGrad)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            name="Conservative"
          />
          <ReferenceLine
            y={currentMrr}
            stroke="#64748b"
            strokeDasharray="3 3"
            label={{
              value: 'Current MRR',
              position: 'insideBottomRight',
              fontSize: 10,
              fill: 'var(--text-muted)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Plan Distribution Chart ─── */
export function PlanDistributionChart({ data }) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="mrr"
            nameKey="plan"
            label={({ plan, pct }) => `${plan}: ${pct}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value, name, props) => [
              formatCurrency(value),
              `${props.payload.plan} (${props.payload.customers} customers)`,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Tax Jurisdiction Table ─── */
export function TaxJurisdictionTable({ jurisdictions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Jurisdiction
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Rate
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Collected
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Remitted
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Pending
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jurisdictions.map((j) => (
            <tr
              key={`${j.country}-${j.state || 'all'}`}
              className="hover:bg-background/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-text-muted" />
                  <span className="text-text-primary font-medium">
                    {j.country}
                    {j.state ? ` — ${j.state}` : ''}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-text-primary">{j.rate}%</td>
              <td className="px-4 py-3 text-right font-mono text-text-primary">
                {formatCurrency(j.collected)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-text-secondary">
                {formatCurrency(j.remitted)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-warning">
                {formatCurrency(j.pending)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    j.pending < 5000
                      ? 'bg-accent/10 text-accent border-accent/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  )}
                >
                  {j.pending < 5000 ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {j.pending < 5000 ? 'Current' : 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Revenue Recognition Table ─── */
export function RevenueRecognitionTable({ obligations }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Contract
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Period
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Recognized
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Remaining
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Progress
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {obligations.map((po) => {
            const pct = po.amount > 0 ? (po.recognized / po.amount) * 100 : 0;
            return (
              <tr key={po.id} className="hover:bg-background/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-text-primary font-medium">{po.customer}</p>
                    <p className="text-[10px] text-text-muted font-mono">{po.id}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">{po.period}</td>
                <td className="px-4 py-3 text-right font-mono text-text-primary">
                  {formatCurrency(po.amount)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent">
                  {formatCurrency(po.recognized)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-secondary">
                  {formatCurrency(po.remaining)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          pct >= 100 ? 'bg-accent' : 'bg-secondary'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-text-muted w-8 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Churn Reason Bar Chart ─── */
export function ChurnReasonChart({ data }) {
  const max = Math.max(...data.map((d) => d.pct));
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.reason}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">{item.reason}</span>
            <span className="text-xs font-mono font-medium text-text-primary">
              {item.count} ({item.pct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-danger/70 transition-all"
              style={{ width: `${(item.pct / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
