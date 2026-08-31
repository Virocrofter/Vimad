/* src/app/admin/health/page-simulation.jsx */
import { useState, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  Zap,
  Server,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Radio,
  Gauge,
  Flame,
  Siren,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

// Simulation imports
import {
  useLiveMetrics,
  useTrafficSimulator,
  useLiveLatencyChart,
  useSystemHealth,
} from './simulation-hooks';
import {
  LiveStatusIndicator,
  TrafficLoadGauge,
  LiveMetricCard,
  LiveServiceCard,
  LiveLatencyChart,
  SimulationControlPanel,
  LiveEventStream,
  TrafficWaveViz,
  SimulationStatsBar,
} from './simulation-components';

// Original health components
import { HealthStatCard, ServiceStatusBadge, SystemHealthIndicator } from './components';

/* ─── Main Page: System Health with Live Simulation ─── */
export default function SystemHealthSimulationPage() {
  const [activeTab, setActiveTab] = useState('live'); // live | original | performance | events
  const [expandedService, setExpandedService] = useState(null);
  const [showSimStats, setShowSimStats] = useState(false);

  // Live simulation data
  const { data: liveData, isConnected, lastUpdate } = useLiveMetrics();
  const health = useSystemHealth();
  const latencyChartData = useLiveLatencyChart(60);
  const controls = useTrafficSimulator();

  // Computed metrics from live data
  const liveMetrics = useMemo(() => {
    if (!liveData?.snapshots) return null;

    const snapshots = Object.values(liveData.snapshots);
    const operational = snapshots.filter((s) => s.status === 'operational').length;
    const degraded = snapshots.filter((s) => s.status === 'degraded').length;
    const critical = snapshots.filter((s) => s.status === 'critical').length;

    const avgLatency =
      snapshots.reduce((s, svc) => s + (svc.metrics?.latency?.value || 0), 0) / snapshots.length;
    const totalThroughput = snapshots.reduce(
      (s, svc) => s + (svc.metrics?.throughput?.value || 0),
      0
    );
    const avgErrorRate =
      snapshots.reduce((s, svc) => s + (svc.metrics?.errorRate?.value || 0), 0) / snapshots.length;
    const avgCpu =
      snapshots.reduce((s, svc) => s + (svc.metrics?.cpu?.value || 0), 0) / snapshots.length;
    const avgMemory =
      snapshots.reduce((s, svc) => s + (svc.metrics?.memory?.value || 0), 0) / snapshots.length;

    // Generate sparkline data from history
    const sparkline = (metric) => {
      return (
        snapshots[0]?.history?.[metric]?.slice(-20).map((p, i) => ({
          index: i,
          value: p.value,
        })) || []
      );
    };

    return {
      operational,
      degraded,
      critical,
      total: snapshots.length,
      avgLatency: Math.round(avgLatency),
      totalThroughput: Math.round(totalThroughput),
      avgErrorRate: Math.round(avgErrorRate * 1000) / 1000,
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgMemory: Math.round(avgMemory * 10) / 10,
      trafficLoad: Math.round((liveData.metrics?.trafficLoad || 0) * 10) / 10,
      sparklines: {
        latency: sparkline('latency'),
        errorRate: sparkline('errorRate'),
        cpu: sparkline('cpu'),
      },
    };
  }, [liveData]);

  // Service cards data
  const serviceCards = useMemo(() => {
    if (!liveData?.snapshots) return [];
    return Object.entries(liveData.snapshots).map(([id, snap]) => ({
      id,
      name: snap.name,
      status: snap.status,
      uptime: snap.uptime,
      latency: snap.metrics?.latency,
      throughput: snap.metrics?.throughput?.value,
      errorRate: snap.metrics?.errorRate?.value,
      cpu: snap.metrics?.cpu?.value,
      memory: snap.metrics?.memory?.value,
      history: snap.history,
    }));
  }, [liveData]);

  const tabs = [
    { id: 'live', label: 'Live Dashboard', icon: Radio },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'events', label: 'Event Stream', icon: Siren },
    { id: 'controls', label: 'Simulator', icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">System Health</h1>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            Real-time platform monitoring with simulated traffic and live metric updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimStats(!showSimStats)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
              showSimStats
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Gauge className="h-3.5 w-3.5" />
            Sim Stats
          </button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Simulation Stats Bar (collapsible) */}
      {showSimStats && (
        <div className="rounded-lg border border-border bg-background px-4 py-2">
          <SimulationStatsBar />
        </div>
      )}

      {/* Live Status Indicator */}
      <LiveStatusIndicator status={health.status} isConnected={isConnected} />

      {/* Traffic Wave Visualization */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-secondary" />
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Live Traffic Intensity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrafficWaveViz bars={40} />
            <span className="text-sm font-bold font-mono text-text-primary w-12 text-right">
              {liveMetrics?.trafficLoad || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <LiveMetricCard
          label="Avg Latency"
          value={liveMetrics?.avgLatency || 0}
          unit="ms"
          icon={Zap}
          color={
            liveMetrics?.avgLatency > 500
              ? 'text-danger'
              : liveMetrics?.avgLatency > 200
                ? 'text-warning'
                : 'text-accent'
          }
          trend={health.trend}
          sparklineData={liveMetrics?.sparklines?.latency || []}
        />
        <LiveMetricCard
          label="Throughput"
          value={liveMetrics?.totalThroughput || 0}
          unit="req/min"
          icon={Activity}
          color="text-secondary"
          sparklineData={liveMetrics?.sparklines?.errorRate || []}
        />
        <LiveMetricCard
          label="Error Rate"
          value={liveMetrics?.avgErrorRate || 0}
          unit="%"
          icon={Shield}
          color={liveMetrics?.avgErrorRate > 1 ? 'text-danger' : 'text-accent'}
        />
        <LiveMetricCard
          label="Services Up"
          value={`${liveMetrics?.operational || 0}/${liveMetrics?.total || 0}`}
          unit=""
          icon={Server}
          color={
            liveMetrics?.critical > 0
              ? 'text-danger'
              : liveMetrics?.degraded > 0
                ? 'text-warning'
                : 'text-accent'
          }
        />
      </div>

      {/* Traffic Load & Resource Gauges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TrafficLoadGauge load={liveData?.metrics?.trafficLoad || 0} />
        <LiveMetricCard
          label="Avg CPU"
          value={liveMetrics?.avgCpu || 0}
          unit="%"
          icon={Cpu}
          color={
            liveMetrics?.avgCpu > 80
              ? 'text-danger'
              : liveMetrics?.avgCpu > 60
                ? 'text-warning'
                : 'text-accent'
          }
          sparklineData={liveMetrics?.sparklines?.cpu || []}
        />
        <LiveMetricCard
          label="Avg Memory"
          value={liveMetrics?.avgMemory || 0}
          unit="%"
          icon={Activity}
          color={
            liveMetrics?.avgMemory > 85
              ? 'text-danger'
              : liveMetrics?.avgMemory > 70
                ? 'text-warning'
                : 'text-accent'
          }
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

      {/* ─── LIVE DASHBOARD TAB ─── */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Service Status Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Server className="h-4 w-4 text-secondary" /> Live Service Status
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  {liveMetrics?.operational || 0} Operational
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  {liveMetrics?.degraded || 0} Degraded
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                  {liveMetrics?.critical || 0} Critical
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {serviceCards.map((service) => (
                <LiveServiceCard
                  key={service.id}
                  service={service}
                  expanded={expandedService === service.id}
                  onClick={() =>
                    setExpandedService(expandedService === service.id ? null : service.id)
                  }
                />
              ))}
            </div>
          </div>

          {/* Live Latency Chart */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Zap className="h-4 w-4 text-secondary" /> Live Latency (60s window)
              </h3>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  Updating every 1s
                </span>
              </div>
            </div>
            <LiveLatencyChart data={latencyChartData} height={320} />
          </div>
        </div>
      )}

      {/* ─── PERFORMANCE TAB ─── */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Per-Service Performance */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {serviceCards.map((service) => (
              <div key={service.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
                  <ServiceStatusBadge status={service.status} />
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted uppercase">Latency</p>
                    <p className="text-lg font-mono font-bold text-text-primary">
                      {service.latency?.current}ms
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted uppercase">p95</p>
                    <p className="text-lg font-mono font-bold text-text-primary">
                      {service.latency?.p95}ms
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted uppercase">Errors</p>
                    <p
                      className={cn(
                        'text-lg font-mono font-bold',
                        service.errorRate > 1 ? 'text-danger' : 'text-accent'
                      )}
                    >
                      {service.errorRate}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted uppercase">Throughput</p>
                    <p className="text-lg font-mono font-bold text-text-primary">
                      {service.throughput}
                    </p>
                  </div>
                </div>
                {service.history?.latency && (
                  <div className="h-32">
                    <LiveLatencyChart
                      data={service.history.latency.slice(-30).map((p, i) => ({
                        time: new Date(p.timestamp).toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }),
                        value: p.value,
                      }))}
                      height={128}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EVENTS TAB ─── */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LiveEventStream maxEvents={30} />
            <LiveEventStream severity="critical" maxEvents={20} />
          </div>
        </div>
      )}

      {/* ─── CONTROLS TAB ─── */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <SimulationControlPanel />

          {/* Quick Stats */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Simulation Diagnostics</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Tick Rate</p>
                <p className="text-xl font-mono font-bold text-text-primary">1s</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Services</p>
                <p className="text-xl font-mono font-bold text-text-primary">8</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">History</p>
                <p className="text-xl font-mono font-bold text-text-primary">60s</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Pattern</p>
                <p className="text-xl font-mono font-bold text-secondary">{controls.pattern}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
