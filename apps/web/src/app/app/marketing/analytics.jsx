// pages/app/marketing/analytics.jsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity,
  Calendar, ChevronDown, Download, Filter, ArrowRight,
  Users, Mail, MousePointer, ShoppingBag, DollarSign,
  Eye, Clock, Target, Percent, Zap, RefreshCw,
  ChevronLeft, ChevronRight, MoreHorizontal, Share2,
  Printer, FileText, Layers, Globe, Smartphone,
  Monitor, Tablet, CheckCircle2, XCircle, AlertCircle,
  Star, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Mock Data ─── */
const dateRanges = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'This Year', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
];

const generateTrend = (base, variance, days) => {
  return Array.from({ length: days }, (_, i) => {
    const dayFactor = 1 + Math.sin(i / 5) * 0.3;
    const random = 0.8 + Math.random() * 0.4;
    return Math.round(base * dayFactor * random);
  });
};

const analyticsData = {
  '7d': {
    sent: generateTrend(1800, 200, 7),
    opened: generateTrend(650, 100, 7),
    clicked: generateTrend(210, 50, 7),
    converted: generateTrend(45, 15, 7),
    revenue: generateTrend(12000, 2000, 7),
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  '30d': {
    sent: generateTrend(1800, 200, 30),
    opened: generateTrend(650, 100, 30),
    clicked: generateTrend(210, 50, 30),
    converted: generateTrend(45, 15, 30),
    revenue: generateTrend(12000, 2000, 30),
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  },
  '90d': {
    sent: generateTrend(5400, 500, 12),
    opened: generateTrend(1950, 300, 12),
    clicked: generateTrend(630, 150, 12),
    converted: generateTrend(135, 45, 12),
    revenue: generateTrend(36000, 6000, 12),
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
  },
};

const campaignPerformance = [
  { name: 'Welcome Series', sent: 12450, opened: 62, clicked: 18, converted: 4.2, revenue: 45200, trend: 12 },
  { name: 'Cart Recovery', sent: 3420, opened: 52, clicked: 26, converted: 7.8, revenue: 38900, trend: 8 },
  { name: 'Birthday Rewards', sent: 560, opened: 75, clicked: 32, converted: 8.0, revenue: 8200, trend: 3 },
  { name: 'Flash Sale', sent: 8900, opened: 45, clicked: 12, converted: 2.1, revenue: 15600, trend: -5 },
  { name: 'VIP Upgrade', sent: 850, opened: 58, clicked: 22, converted: 4.9, revenue: 22100, trend: 15 },
  { name: 'Post-Stay Review', sent: 8920, opened: 70, clicked: 20, converted: 5.0, revenue: 0, trend: 2 },
];

const funnelData = {
  stages: [
    { name: 'Sent', count: 28450, color: '#3B82F6' },
    { name: 'Delivered', count: 27820, color: '#6366F1' },
    { name: 'Opened', count: 17050, color: '#8B5CF6' },
    { name: 'Clicked', count: 5120, color: '#A855F7' },
    { name: 'Converted', count: 1245, color: '#10B981' },
  ],
};

const deviceBreakdown = [
  { name: 'Desktop', value: 52, color: '#3B82F6' },
  { name: 'Mobile', value: 38, color: '#10B981' },
  { name: 'Tablet', value: 10, color: '#F59E0B' },
];

const topSegments = [
  { name: 'Platinum Members', engagement: 89, size: 1240, revenue: 45200 },
  { name: 'Corporate Accounts', engagement: 72, size: 340, revenue: 28900 },
  { name: 'Weekend Bookers', engagement: 65, size: 2800, revenue: 22100 },
  { name: 'First-Time Guests', engagement: 58, size: 4200, revenue: 18900 },
  { name: 'Birthday Month', engagement: 81, size: 560, revenue: 12400 },
];

const heatmapData = [
  [12, 18, 25, 32, 28, 22, 15],
  [15, 22, 35, 42, 38, 28, 18],
  [18, 28, 45, 52, 48, 35, 22],
  [22, 32, 48, 55, 50, 38, 25],
  [20, 30, 42, 48, 45, 32, 20],
  [15, 25, 35, 40, 38, 28, 18],
  [10, 15, 22, 28, 25, 18, 12],
];

const hourlyLabels = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'];
const dailyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Helpers ─── */
function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

/* ─── SVG Chart Components ─── */
function LineChart({ data, labels, colors, height = 200 }) {
  const allValues = data.flat();
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;
  const width = labels.length * 40;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };

  const getX = (i) => padding.left + (i / (labels.length - 1)) * (width - padding.left - padding.right);
  const getY = (v) => padding.top + (1 - (v - min) / range) * (height - padding.top - padding.bottom);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padding.left}
          y1={padding.top + t * (height - padding.top - padding.bottom)}
          x2={width - padding.right}
          y2={padding.top + t * (height - padding.top - padding.bottom)}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
          strokeDasharray="2,2"
        />
      ))}

      {/* Lines */}
      {data.map((series, si) => (
        <g key={si}>
          <defs>
            <linearGradient id={`grad-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[si]} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colors[si]} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M ${getX(0)} ${getY(series[0])} ${series.slice(1).map((v, i) => `L ${getX(i + 1)} ${getY(v)}`).join(' ')} L ${getX(series.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`}
            fill={`url(#grad-${si})`}
          />
          <path
            d={`M ${getX(0)} ${getY(series[0])} ${series.slice(1).map((v, i) => `L ${getX(i + 1)} ${getY(v)}`).join(' ')}`}
            fill="none"
            stroke={colors[si]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {series.map((v, i) => (
            <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={colors[si]} />
          ))}
        </g>
      ))}

      {/* X labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={getX(i)}
          y={height - 5}
          textAnchor="middle"
          className="fill-text-muted text-[10px]"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data, labels, color = '#3B82F6', height = 200 }) {
  const max = Math.max(...data);
  const barWidth = 24;
  const gap = 16;
  const width = labels.length * (barWidth + gap) + gap;
  const padding = { top: 10, bottom: 30 };

  const getX = (i) => gap + i * (barWidth + gap);
  const getHeight = (v) => (v / max) * (height - padding.top - padding.bottom);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((v, i) => (
        <g key={i}>
          <rect
            x={getX(i)}
            y={height - padding.bottom - getHeight(v)}
            width={barWidth}
            height={getHeight(v)}
            rx="4"
            fill={color}
            opacity="0.9"
          />
          <text
            x={getX(i) + barWidth / 2}
            y={height - 5}
            textAnchor="middle"
            className="fill-text-muted text-[10px]"
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let currentAngle = 0;
  const radius = size / 2 - 8;
  const center = size / 2;

  const getArc = (value) => {
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    const endAngle = currentAngle;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => (
        <path key={i} d={getArc(d.value)} fill={d.color} stroke="white" strokeWidth="2" />
      ))}
      <circle cx={center} cy={center} r={radius * 0.55} fill="white" className="dark:fill-surface" />
    </svg>
  );
}

function FunnelChart({ stages, height = 280 }) {
  const max = Math.max(...stages.map(s => s.count));
  const width = 400;
  const stageHeight = height / stages.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {stages.map((stage, i) => {
        const w = (stage.count / max) * width * 0.8;
        const x = (width - w) / 2;
        const y = i * stageHeight;
        const prevW = i > 0 ? (stages[i - 1].count / max) * width * 0.8 : w;
        const prevX = (width - prevW) / 2;

        const path = i === 0
          ? `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + stageHeight - 4} L ${x} ${y + stageHeight - 4} Z`
          : `M ${prevX} ${y} L ${prevX + prevW} ${y} L ${x + w} ${y + stageHeight - 4} L ${x} ${y + stageHeight - 4} Z`;

        const conversionRate = i > 0 ? Math.round((stage.count / stages[i - 1].count) * 100) : 100;

        return (
          <g key={i}>
            <path d={path} fill={stage.color} opacity="0.9" rx="4" />
            <text x={width / 2} y={y + stageHeight / 2 - 4} textAnchor="middle" className="fill-white text-xs font-semibold">
              {stage.name}
            </text>
            <text x={width / 2} y={y + stageHeight / 2 + 10} textAnchor="middle" className="fill-white/80 text-[10px]">
              {formatNumber(stage.count)}
            </text>
            {i > 0 && (
              <text x={width / 2} y={y + 2} textAnchor="middle" className="fill-text-muted text-[9px]">
                {conversionRate}% conversion
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function HeatmapChart({ data, xLabels, yLabels, height = 200 }) {
  const max = Math.max(...data.flat());
  const cellWidth = 40;
  const cellHeight = 28;
  const width = xLabels.length * cellWidth;
  const fullHeight = yLabels.length * cellHeight + 20;

  const getColor = (v) => {
    const intensity = v / max;
    if (intensity > 0.8) return '#10B981';
    if (intensity > 0.6) return '#34D399';
    if (intensity > 0.4) return '#6EE7B7';
    if (intensity > 0.2) return '#A7F3D0';
    return '#D1FAE5';
  };

  return (
    <svg viewBox={`0 0 ${width} ${fullHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {data.map((row, yi) => (
        row.map((v, xi) => (
          <g key={`${yi}-${xi}`}>
            <rect
              x={xi * cellWidth}
              y={yi * cellHeight}
              width={cellWidth - 2}
              height={cellHeight - 2}
              rx="3"
              fill={getColor(v)}
            />
            <text
              x={xi * cellWidth + (cellWidth - 2) / 2}
              y={yi * cellHeight + (cellHeight - 2) / 2 + 3}
              textAnchor="middle"
              className="fill-text-primary text-[9px] font-medium"
            >
              {v}
            </text>
          </g>
        ))
      ))}
      {xLabels.map((label, i) => (
        <text key={`x-${i}`} x={i * cellWidth + cellWidth / 2} y={fullHeight - 2} textAnchor="middle" className="fill-text-muted text-[9px]">
          {label}
        </text>
      ))}
    </svg>
  );
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-border bg-surface p-5 text-left transition-all hover:shadow-md',
        onClick && 'cursor-pointer hover:border-secondary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', color.replace('text-', 'bg-').replace('danger', 'danger/10').replace('accent', 'accent/10').replace('secondary', 'secondary/10').replace('info', 'info/10').replace('warning', 'warning/10'))}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-xs font-medium rounded-lg transition-colors',
        active ? 'bg-secondary text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated'
      )}
    >
      {children}
    </button>
  );
}

/* ─── Main Page ─── */
export function MarketingAnalyticsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('overview');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const data = analyticsData[dateRange];
  const totals = useMemo(() => ({
    sent: data.sent.reduce((a, b) => a + b, 0),
    opened: data.opened.reduce((a, b) => a + b, 0),
    clicked: data.clicked.reduce((a, b) => a + b, 0),
    converted: data.converted.reduce((a, b) => a + b, 0),
    revenue: data.revenue.reduce((a, b) => a + b, 0),
  }), [data]);

  const openRate = totals.sent > 0 ? Math.round((totals.opened / totals.sent) * 100) : 0;
  const clickRate = totals.opened > 0 ? Math.round((totals.clicked / totals.opened) * 100) : 0;
  const convRate = totals.clicked > 0 ? Math.round((totals.converted / totals.clicked) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Marketing Analytics</h1>
          <p className="text-sm text-text-secondary">Performance insights and campaign attribution</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
            >
              <Calendar className="h-4 w-4" />
              {dateRanges.find(d => d.value === dateRange)?.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg z-20 py-1">
                {dateRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => { setDateRange(range.value); setShowDatePicker(false); }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      dateRange === range.value ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <TabButton active={activeMetric === 'overview'} onClick={() => setActiveMetric('overview')}>Overview</TabButton>
        <TabButton active={activeMetric === 'campaigns'} onClick={() => setActiveMetric('campaigns')}>Campaigns</TabButton>
        <TabButton active={activeMetric === 'funnel'} onClick={() => setActiveMetric('funnel')}>Funnel</TabButton>
        <TabButton active={activeMetric === 'segments'} onClick={() => setActiveMetric('segments')}>Segments</TabButton>
      </div>

      {/* Overview Tab */}
      {activeMetric === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            <StatCard
              label="Emails Sent"
              value={formatNumber(totals.sent)}
              icon={Mail}
              color="text-info"
              trend={12}
            />
            <StatCard
              label="Open Rate"
              value={`${openRate}%`}
              icon={Eye}
              color="text-accent"
              trend={5}
              subtext={`${formatNumber(totals.opened)} opened`}
            />
            <StatCard
              label="Click Rate"
              value={`${clickRate}%`}
              icon={MousePointer}
              color="text-secondary"
              trend={-2}
              subtext={`${formatNumber(totals.clicked)} clicked`}
            />
            <StatCard
              label="Conversions"
              value={formatNumber(totals.converted)}
              icon={Target}
              color="text-warning"
              trend={8}
              subtext={`${convRate}% click-to-conv`}
            />
            <StatCard
              label="Revenue"
              value={formatCurrency(totals.revenue)}
              icon={DollarSign}
              color="text-success"
              trend={18}
              subtext="Attributed revenue"
            />
          </div>

          {/* Main Chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Performance Trend</h3>
                <p className="text-xs text-text-muted">Sent, opened, clicked, and converted over time</p>
              </div>
              <div className="flex items-center gap-3">
                {[
                  { label: 'Sent', color: '#3B82F6' },
                  { label: 'Opened', color: '#10B981' },
                  { label: 'Clicked', color: '#F59E0B' },
                  { label: 'Converted', color: '#EF4444' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-text-muted">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-64">
              <LineChart
                data={[data.sent, data.opened, data.clicked, data.converted]}
                labels={data.labels}
                colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
              />
            </div>
          </div>

          {/* Secondary Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Device Breakdown */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Device Breakdown</h3>
              <p className="text-xs text-text-muted mb-4">Opens by device type</p>
              <div className="flex items-center gap-6">
                <DonutChart data={deviceBreakdown} size={140} />
                <div className="space-y-2 flex-1">
                  {deviceBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-text-secondary">{d.name}</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-text-primary">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hourly Heatmap */}
            <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Engagement Heatmap</h3>
              <p className="text-xs text-text-muted mb-4">Opens by day and hour (local time)</p>
              <div className="h-56">
                <HeatmapChart
                  data={heatmapData}
                  xLabels={hourlyLabels}
                  yLabels={dailyLabels}
                />
              </div>
            </div>
          </div>

          {/* Revenue Attribution */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Revenue Attribution</h3>
                <p className="text-xs text-text-muted">Revenue driven by marketing campaigns</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Total: <span className="font-mono font-semibold text-text-primary">{formatCurrency(totals.revenue)}</span></span>
              </div>
            </div>
            <div className="h-48">
              <BarChart
                data={data.revenue}
                labels={data.labels}
                color="#10B981"
              />
            </div>
          </div>
        </>
      )}

      {/* Campaigns Tab */}
      {activeMetric === 'campaigns' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Campaign Performance</h3>
            <p className="text-xs text-text-muted">Compare metrics across all campaigns</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Campaign</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Open Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Click Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Conv. Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaignPerformance.map((camp) => (
                  <tr key={camp.name} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">{camp.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">{formatNumber(camp.sent)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${camp.opened}%` }} />
                        </div>
                        <span className="font-mono text-text-primary">{camp.opened}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-secondary" style={{ width: `${camp.clicked * 2}%` }} />
                        </div>
                        <span className="font-mono text-text-primary">{camp.clicked}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-mono', camp.converted > 5 ? 'text-accent' : 'text-text-primary')}>
                        {camp.converted}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {camp.revenue > 0 ? formatCurrency(camp.revenue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', camp.trend >= 0 ? 'text-accent' : 'text-danger')}>
                        {camp.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(camp.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Funnel Tab */}
      {activeMetric === 'funnel' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Conversion Funnel</h3>
            <p className="text-xs text-text-muted mb-6">End-to-end email performance funnel</p>
            <div className="h-80 flex items-center justify-center">
              <FunnelChart stages={funnelData.stages} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Delivery Rate', value: '97.8%' },
                { label: 'Open Rate', value: '61.3%' },
                { label: 'Click Rate', value: '30.0%' },
                { label: 'Conv. Rate', value: '24.3%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-background p-2">
                  <p className="text-lg font-bold font-mono text-text-primary">{stat.value}</p>
                  <p className="text-[10px] text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Funnel Drop-off Analysis</h3>
              <div className="space-y-3">
                {[
                  { stage: 'Sent → Delivered', rate: 97.8, drop: 2.2, reason: 'Bounces & invalid addresses' },
                  { stage: 'Delivered → Opened', rate: 61.3, drop: 38.7, reason: 'Subject line fatigue, timing' },
                  { stage: 'Opened → Clicked', rate: 30.0, drop: 70.0, reason: 'Weak CTAs, content relevance' },
                  { stage: 'Clicked → Converted', rate: 24.3, drop: 75.7, reason: 'Landing page friction, price' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">{item.stage}</span>
                      <span className="text-xs font-mono font-semibold text-accent">{item.rate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${item.rate}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="h-3 w-3 text-danger" />
                      <span className="text-[10px] text-text-muted">{item.drop}% drop — {item.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Optimization Tips</h3>
              <div className="space-y-2">
                {[
                  { icon: Mail, text: 'A/B test subject lines to improve open rates by ~15%', color: 'text-blue-500' },
                  { icon: MousePointer, text: 'Add urgency CTAs to increase click-through by 22%', color: 'text-amber-500' },
                  { icon: Target, text: 'Simplify checkout to reduce click-to-conversion drop', color: 'text-green-500' },
                  { icon: Clock, text: 'Send at 9am local time for 12% higher engagement', color: 'text-purple-500' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg bg-background p-2.5">
                    <tip.icon className={cn('h-4 w-4 mt-0.5 shrink-0', tip.color)} />
                    <p className="text-xs text-text-secondary">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segments Tab */}
      {activeMetric === 'segments' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {topSegments.map((segment) => (
            <div key={segment.name} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{segment.name}</h3>
                  <p className="text-xs text-text-muted">{formatNumber(segment.size)} contacts</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-text-primary">{formatCurrency(segment.revenue)}</p>
                  <p className="text-[10px] text-text-muted">Attributed revenue</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Engagement Score</span>
                    <span className="text-xs font-mono font-medium text-text-primary">{segment.engagement}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        segment.engagement > 80 ? 'bg-accent' : segment.engagement > 60 ? 'bg-secondary' : 'bg-warning'
                      )}
                      style={{ width: `${segment.engagement}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Revenue per contact</span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCurrency(segment.revenue / segment.size)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketingAnalyticsPage;