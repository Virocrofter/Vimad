/* src/app/admin/health/simulation-components.jsx */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Flame,
  Shield,
  Radio,
  Waves,
  Gauge,
  Server,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Filter,
  Download,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Eye,
  EyeOff,
  Settings2,
  Siren,
  Bomb,
  Rocket,
  TrafficCone,
  Timer,
} from 'lucide-react';
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
  ReferenceLine,
} from 'recharts';
import {
  useLiveMetrics,
  useTrafficSimulator,
  useSimulatedErrors,
  useLiveLatencyChart,
  useSystemHealth,
} from './simulation-hooks';

/* ─── Live Status Indicator ─── */
export function LiveStatusIndicator({ status, isConnected, pulse = true }) {
  const configs = {
    healthy: {
      icon: Shield,
      color: 'text-accent',
      bg: 'bg-accent',
      border: 'border-accent/30',
      label: 'All Systems Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning',
      border: 'border-warning/30',
      label: 'Degraded Performance',
    },
    critical: {
      icon: Siren,
      color: 'text-danger',
      bg: 'bg-danger',
      border: 'border-danger/30',
      label: 'Critical Issues Detected',
    },
    unknown: {
      icon: Clock,
      color: 'text-text-muted',
      bg: 'bg-text-muted',
      border: 'border-border',
      label: 'Connecting...',
    },
  };

  const config = configs[status] || configs.unknown;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-center gap-4 transition-colors duration-500',
        config.border,
        status === 'healthy'
          ? 'bg-accent/5'
          : status === 'degraded'
            ? 'bg-warning/5'
            : status === 'critical'
              ? 'bg-danger/5'
              : 'bg-surface'
      )}
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full bg-background',
          config.color
        )}
      >
        <Icon className="h-6 w-6" />
        {isConnected && pulse && (
          <span
            className={cn('absolute inset-0 rounded-full animate-ping opacity-30', config.bg)}
          />
        )}
        {isConnected && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background',
              config.bg
            )}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('text-lg font-bold', config.color)}>{config.label}</p>
          {isConnected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">
          {isConnected
            ? `Real-time simulation active · ${new Date().toLocaleTimeString()}`
            : 'Simulation paused — metrics are static'}
        </p>
      </div>
    </div>
  );
}

/* ─── Traffic Load Gauge ─── */
export function TrafficLoadGauge({ load, maxLoad = 1.0 }) {
  const percentage = Math.min(100, (load / maxLoad) * 100);
  const color = percentage > 80 ? 'text-danger' : percentage > 60 ? 'text-warning' : 'text-accent';
  const barColor = percentage > 80 ? 'bg-danger' : percentage > 60 ? 'bg-warning' : 'bg-accent';

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-secondary" />
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Traffic Load
          </p>
        </div>
        <span className={cn('text-lg font-bold font-mono', color)}>{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-text-muted">
        <span>Idle</span>
        <span>Normal</span>
        <span>Heavy</span>
        <span>Critical</span>
      </div>
    </div>
  );
}

/* ─── Live Metric Card ─── */
export function LiveMetricCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  color = 'text-secondary',
  sparklineData = [],
}) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-accent', label: 'Improving' },
    down: { icon: TrendingDown, color: 'text-danger', label: 'Degrading' },
    stable: { icon: Minus, color: 'text-text-muted', label: 'Stable' },
  };

  const t = trendConfig[trend?.direction || 'stable'];
  const TrendIcon = t.icon;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className={cn('text-2xl font-bold font-mono', color)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {unit && <span className="text-xs text-text-muted">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon className={cn('h-3 w-3', t.color)} />
              <span className={cn('text-xs font-medium', t.color)}>
                {trend.change > 0 ? '+' : ''}
                {trend.change}% {t.label}
              </span>
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
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>

      {/* Mini sparkline */}
      {sparklineData.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      color.includes('accent')
                        ? '#22c55e'
                        : color.includes('danger')
                          ? '#ef4444'
                          : '#863bff'
                    }
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      color.includes('accent')
                        ? '#22c55e'
                        : color.includes('danger')
                          ? '#ef4444'
                          : '#863bff'
                    }
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={
                  color.includes('accent')
                    ? '#22c55e'
                    : color.includes('danger')
                      ? '#ef4444'
                      : '#863bff'
                }
                fill={`url(#spark-${label})`}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ─── Live Service Card ─── */
export function LiveServiceCard({ service, onClick, expanded = false }) {
  const statusConfig = {
    operational: {
      dot: 'bg-accent',
      border: 'border-accent/20',
      bg: 'bg-accent/5',
      text: 'text-accent',
    },
    degraded: {
      dot: 'bg-warning',
      border: 'border-warning/20',
      bg: 'bg-warning/5',
      text: 'text-warning',
    },
    critical: {
      dot: 'bg-danger',
      border: 'border-danger/20',
      bg: 'bg-danger/5',
      text: 'text-danger',
    },
  };

  const cfg = statusConfig[service.status] || statusConfig.operational;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-surface p-4 cursor-pointer transition-all hover:shadow-md',
        service.status === 'critical'
          ? 'border-danger/30 hover:border-danger/50'
          : service.status === 'degraded'
            ? 'border-warning/30 hover:border-warning/50'
            : 'border-border hover:border-secondary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', cfg.bg)}>
            <Server className={cn('h-4 w-4', cfg.text)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              <span className={cn('text-xs font-medium capitalize', cfg.text)}>
                {service.status}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Uptime</p>
          <p className="text-sm font-mono font-medium text-text-primary">{service.uptime}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Latency</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {service.latency?.current}ms
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Throughput</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {service.throughput?.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Error Rate</p>
          <p
            className={cn(
              'text-sm font-mono font-medium',
              service.errorRate > 1 ? 'text-danger' : 'text-accent'
            )}
          >
            {service.errorRate}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Resources</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            CPU {service.cpu}% · MEM {service.memory}%
          </p>
        </div>
      </div>

      {/* Expanded: Mini Charts */}
      {expanded && service.history && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Live Latency (60s)</p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={service.history.latency?.slice(-30).map((p, i) => ({ i, v: p.value })) || []}
              >
                <Line type="monotone" dataKey="v" stroke="#863bff" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Live Latency Chart ─── */
export function LiveLatencyChart({ data, height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted">
        <Activity className="h-8 w-8 animate-pulse mr-2" />
        <span>Collecting live data...</span>
      </div>
    );
  }

  const colors = {
    'API Gateway': '#863bff',
    'Auth Service': '#22c55e',
    Database: '#3b82f6',
    'Redis Cache': '#f59e0b',
    Worker: '#ef4444',
    'File Storage': '#ec4899',
    'Search Index': '#06b6d4',
    Notifications: '#8b5cf6',
  };

  const services = Object.keys(data[0] || {}).filter((k) => k !== 'time');

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            stroke="var(--text-muted)"
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--text-muted)" unit="ms" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {services.map((svc) => (
            <Line
              key={svc}
              type="monotone"
              dataKey={svc}
              stroke={colors[svc] || '#888'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Simulation Control Panel ─── */
export function SimulationControlPanel() {
  const controls = useTrafficSimulator();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const patterns = [
    { id: 'steady', label: 'Steady', icon: Minus, desc: 'Consistent baseline load' },
    { id: 'rushHour', label: 'Rush Hour', icon: TrendingUp, desc: 'Morning/evening peaks' },
    { id: 'spike', label: 'Viral Spike', icon: Flame, desc: 'Sudden traffic burst' },
    { id: 'ramp', label: 'Launch Ramp', icon: Rocket, desc: 'Gradual user onboarding' },
    { id: 'erratic', label: 'Erratic', icon: Waves, desc: 'Unpredictable bursts' },
  ];

  const stressLevels = [
    { value: 0, label: 'Normal', color: 'text-accent' },
    { value: 0.5, label: 'Stressed', color: 'text-warning' },
    { value: 1.0, label: 'Overloaded', color: 'text-danger' },
    { value: 1.5, label: 'DDoS', color: 'text-danger' },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
            <Gauge className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Traffic Simulator</h3>
            <p className="text-xs text-text-muted">
              {controls.isRunning
                ? `Running · ${controls.formattedElapsed} · ${controls.pattern}`
                : 'Paused'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={controls.toggle}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors',
              controls.isRunning
                ? 'border-accent bg-accent/10 text-accent hover:bg-accent/20'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {controls.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {controls.isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
          >
            <Settings2 className="h-4 w-4" />
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <button
          onClick={controls.triggerSpike}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-warning/50 hover:bg-warning/5 transition-colors"
        >
          <Flame className="h-5 w-5 text-warning" />
          <span className="text-xs font-medium text-text-primary">Trigger Spike</span>
        </button>
        <button
          onClick={controls.triggerRamp}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-secondary/50 hover:bg-secondary/5 transition-colors"
        >
          <Rocket className="h-5 w-5 text-secondary" />
          <span className="text-xs font-medium text-text-primary">Launch Ramp</span>
        </button>
        <button
          onClick={controls.triggerDDoS}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 hover:border-danger/50 hover:bg-danger/5 transition-colors"
        >
          <Bomb className="h-5 w-5 text-danger" />
          <span className="text-xs font-medium text-text-primary">Simulate DDoS</span>
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Traffic Pattern */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
              Traffic Pattern
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {patterns.map((p) => {
                const Icon = p.icon;
                const active = controls.pattern === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => controls.setPattern(p.id)}
                    className={cn(
                      'flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all',
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 mt-0.5',
                        active ? 'text-secondary' : 'text-text-muted'
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          'text-xs font-medium',
                          active ? 'text-secondary' : 'text-text-primary'
                        )}
                      >
                        {p.label}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stress Level */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
              System Stress
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={controls.stress}
                onChange={(e) => controls.setStress(parseFloat(e.target.value))}
                className="flex-1 accent-secondary"
              />
              <span
                className={cn(
                  'text-sm font-bold font-mono w-20 text-right',
                  controls.stress > 1
                    ? 'text-danger'
                    : controls.stress > 0.5
                      ? 'text-warning'
                      : 'text-accent'
                )}
              >
                {Math.round(controls.stress * 100)}%
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-text-muted">
              {stressLevels.map((l) => (
                <span
                  key={l.value}
                  className={cn(
                    l.color,
                    controls.stress >= l.value && controls.stress < l.value + 0.5 ? 'font-bold' : ''
                  )}
                >
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Live Event Stream ─── */
export function LiveEventStream({ maxEvents = 20, filter = null }) {
  const { events, clearEvents } = useSimulatedErrors(filter);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, paused]);

  const severityConfig = {
    critical: { icon: Siren, color: 'text-danger', bg: 'bg-danger/5', border: 'border-danger/20' },
    danger: {
      icon: AlertTriangle,
      color: 'text-danger',
      bg: 'bg-danger/5',
      border: 'border-danger/20',
    },
    warning: {
      icon: TrafficCone,
      color: 'text-warning',
      bg: 'bg-warning/5',
      border: 'border-warning/20',
    },
    error: { icon: X, color: 'text-danger', bg: 'bg-danger/5', border: 'border-danger/20' },
    info: { icon: Activity, color: 'text-info', bg: 'bg-info/5', border: 'border-info/20' },
  };

  const displayEvents = paused ? events.slice(0, maxEvents) : events.slice(0, maxEvents);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio
            className={cn('h-4 w-4', paused ? 'text-text-muted' : 'text-accent animate-pulse')}
          />
          <h3 className="text-sm font-semibold text-text-primary">Live Events</h3>
          {events.length > 0 && (
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaused(!paused)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated"
          >
            {paused ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearEvents}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Clear
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-80 overflow-y-auto">
        {displayEvents.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No events yet</p>
            <p className="text-xs mt-1">Events will appear as the simulation generates them</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayEvents.map((event) => {
              const cfg = severityConfig[event.severity] || severityConfig.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={event.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    cfg.bg,
                    'hover:bg-surface-elevated'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background',
                      cfg.border
                    )}
                  >
                    <Icon className={cn('h-3 w-3', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{event.message}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-muted">
                      <span className={cn('font-medium', cfg.color)}>{event.severity}</span>
                      {event.service && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{event.service}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Traffic Visualization (Bar Wave) ─── */
export function TrafficWaveViz({ bars = 30 }) {
  const [heights, setHeights] = useState(Array(bars).fill(0.1));
  const { data } = useLiveMetrics({ refreshRate: 100 });

  useEffect(() => {
    if (data?.metrics?.trafficLoad !== undefined) {
      const load = data.metrics.trafficLoad / 100;
      setHeights((prev) => {
        const next = [...prev.slice(1), load + (Math.random() - 0.5) * 0.1];
        return next.map((h) => Math.max(0.05, Math.min(1, h)));
      });
    }
  }, [data]);

  return (
    <div className="flex items-end gap-[2px] h-12">
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-t-sm transition-all duration-300',
            h > 0.8 ? 'bg-danger' : h > 0.6 ? 'bg-warning' : h > 0.4 ? 'bg-secondary' : 'bg-accent'
          )}
          style={{ height: `${h * 100}%`, opacity: 0.3 + (i / bars) * 0.7 }}
        />
      ))}
    </div>
  );
}

/* ─── Connection Status Dot ─── */
export function ConnectionStatus({ isConnected, size = 'sm' }) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          'inline-flex rounded-full',
          sizeClasses[size],
          isConnected ? 'bg-accent' : 'bg-text-muted'
        )}
      />
      {isConnected && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            sizeClasses[size],
            'bg-accent'
          )}
        />
      )}
    </span>
  );
}

/* ─── Simulation Stats Bar ─── */
export function SimulationStatsBar() {
  const { stats } = useLiveMetrics();
  const controls = useTrafficSimulator();

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
      <div className="flex items-center gap-1.5">
        <ConnectionStatus isConnected={stats.isRunning} size="sm" />
        <span>{stats.isRunning ? 'Running' : 'Stopped'}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <span>Elapsed: {controls.formattedElapsed}</span>
      <div className="h-3 w-px bg-border" />
      <span>
        Pattern: <span className="font-mono text-text-secondary">{stats.trafficPattern}</span>
      </span>
      <div className="h-3 w-px bg-border" />
      <span>
        Stress:{' '}
        <span
          className={cn(
            'font-mono',
            stats.globalStress > 0.5 ? 'text-danger' : 'text-text-secondary'
          )}
        >
          {Math.round(stats.globalStress * 100)}%
        </span>
      </span>
      <div className="h-3 w-px bg-border" />
      <span>Listeners: {stats.listenerCount}</span>
      <div className="h-3 w-px bg-border" />
      <span>Events: {stats.eventCount}</span>
    </div>
  );
}
