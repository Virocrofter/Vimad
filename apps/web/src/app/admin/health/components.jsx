/* src/app/admin/health/components.jsx */
import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Server,
  X,
  XCircle,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  severityMeta,
  serviceStatusMeta,
  errorStatusMeta,
  incidentSeverityMeta,
  timeAgo,
} from './data';

/* ─── Stat Card ─── */
export function HealthStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last period
            </p>
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
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Service Status Badge ─── */
export function ServiceStatusBadge({ status }) {
  const meta = serviceStatusMeta[status] || serviceStatusMeta.operational;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity }) {
  const meta = severityMeta[severity] || severityMeta.info;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Error Status Badge ─── */
export function ErrorStatusBadge({ status }) {
  const meta = errorStatusMeta[status] || errorStatusMeta.open;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Incident Severity Badge ─── */
export function IncidentSeverityBadge({ severity }) {
  const meta = incidentSeverityMeta[severity] || incidentSeverityMeta.info;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Mini Sparkline (SVG) ─── */
export function MiniSparkline({ data, color = 'text-accent', width = 80, height = 24 }) {
  if (!data || data.length < 2) return <div className="h-6 w-20 bg-border rounded" />;

  const values = data.map((d) => (typeof d === 'number' ? d : d.value || 0));
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

  const colorClass = color.replace('text-', '');
  const strokeColors = {
    accent: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    secondary: '#863bff',
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColors[colorClass] || strokeColors.accent}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * height}
        r="2"
        fill={strokeColors[colorClass] || strokeColors.accent}
      />
    </svg>
  );
}

/* ─── Service Card ─── */
export function ServiceCard({ service, onClick }) {
  const meta = serviceStatusMeta[service.status] || serviceStatusMeta.operational;
  const StatusIcon =
    service.status === 'operational'
      ? CheckCircle2
      : service.status === 'degraded'
        ? AlertTriangle
        : XCircle;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border bg-surface p-4 cursor-pointer transition-all hover:shadow-md',
        service.status === 'critical'
          ? 'border-danger/30 hover:border-danger/50'
          : service.status === 'degraded'
            ? 'border-warning/30 hover:border-warning/50'
            : 'border-border hover:border-secondary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.class)}>
            <Server className={cn('h-4 w-4', meta.iconColor)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{service.name}</h3>
            <p className="text-[10px] text-text-muted">
              {service.version} · {service.region}
            </p>
          </div>
        </div>
        <ServiceStatusBadge status={service.status} />
      </div>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Latency (p95)</p>
          <p className="text-sm font-mono font-medium text-text-primary">{service.latency.p95}ms</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Uptime</p>
          <p className="text-sm font-mono font-medium text-text-primary">{service.uptime}</p>
        </div>
      </div>

      {service.alert && (
        <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-2 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">{service.alert}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span>
          {service.requestsPerMin
            ? `${service.requestsPerMin.toLocaleString()} req/min`
            : service.connections
              ? `${service.connections.active} conns`
              : service.queueDepth
                ? `${service.queueDepth.toLocaleString()} queued`
                : `${service.sentPerMin?.toLocaleString() || service.storageUsed?.used || service.memoryUsage?.used} ${service.storageUsed?.unit || service.memoryUsage?.unit || 'sent/min'}`}
        </span>
        <span>
          {service.lastRestart ? `Restarted ${timeAgo(service.lastRestart)}` : 'Always on'}
        </span>
      </div>
    </div>
  );
}

/* ─── Error Log Row ─── */
export function ErrorLogRow({ error, expanded, onToggle }) {
  const sevMeta = severityMeta[error.severity] || severityMeta.info;

  return (
    <>
      <tr className="hover:bg-background/50 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{error.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={error.severity} />
        </td>
        <td className="px-4 py-3 text-text-secondary text-xs">{error.service}</td>
        <td className="px-4 py-3">
          <p className="text-sm text-text-primary truncate max-w-[300px]">{error.message}</p>
        </td>
        <td className="px-4 py-3 text-text-secondary text-xs">{timeAgo(error.timestamp)}</td>
        <td className="px-4 py-3">
          <ErrorStatusBadge status={error.status} />
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-xs font-mono text-text-muted">×{error.count}</span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">First seen: {error.firstSeen}</span>
                  {error.assignedTo && (
                    <span className="text-xs text-text-secondary">
                      Assigned: {error.assignedTo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated">
                    <ExternalLink className="h-3 w-3" /> Trace
                  </button>
                </div>
              </div>
              {error.stack && (
                <div className="rounded-md bg-background border border-border p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    Stack Trace
                  </p>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90">
                  Mark Resolved
                </button>
                <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
                  Assign
                </button>
                <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
                  Create Incident
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Incident Card ─── */
export function IncidentCard({ incident }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <IncidentSeverityBadge severity={incident.severity} />
          <span className="font-mono text-xs text-text-muted">{incident.id}</span>
        </div>
        <span className="text-xs text-text-muted">{incident.duration}</span>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-text-primary">{incident.title}</h4>
      <p className="mt-1 text-xs text-text-secondary">{incident.date}</p>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-secondary">Root Cause:</span> {incident.rootCause}
        </p>
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-secondary">Resolution:</span> {incident.resolution}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {incident.affectedServices.map((svc) => (
          <span
            key={svc}
            className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary"
          >
            {svc}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Simple Bar Chart (no recharts dependency for simple cases) ─── */
export function SimpleBarChart({
  data,
  dataKey,
  labelKey,
  color = 'bg-secondary',
  maxHeight = 120,
}) {
  const max = Math.max(...data.map((d) => d[dataKey]));

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => {
        const height = max > 0 ? (d[dataKey] / max) * maxHeight : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn('w-full rounded-t-sm transition-all hover:opacity-80', color)}
              style={{ height: `${height}px` }}
              title={`${d[labelKey]}: ${d[dataKey]}`}
            />
            <span className="text-[9px] text-text-muted rotate-0">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── System Health Indicator ─── */
export function SystemHealthIndicator({ status }) {
  const configs = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      label: 'All Systems Operational',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      label: 'Degraded Performance',
    },
    critical: {
      icon: XCircle,
      color: 'text-danger',
      bg: 'bg-danger/10',
      border: 'border-danger/20',
      label: 'Critical Issues Detected',
    },
  };

  const config = configs[status] || configs.healthy;
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-4 flex items-center gap-4', config.bg, config.border)}>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-background',
          config.color
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className={cn('text-lg font-bold', config.color)}>{config.label}</p>
        <p className="text-xs text-text-secondary">
          Last checked: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
