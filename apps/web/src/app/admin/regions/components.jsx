/* src/app/admin/regions/components.jsx */
import { useState } from 'react';
import {
  Globe,
  Server,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  HardDrive,
  Zap,
  Shield,
  Database,
  Users,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  regionStatusMeta,
  migrationStatusMeta,
  complianceStatusMeta,
  formatDuration,
} from './data';

/* ─── Region Card ─── */
export function RegionCard({ region, onClick }) {
  const meta = regionStatusMeta[region.status] || regionStatusMeta.operational;
  const utilization = Math.round((region.tenantCount / region.capacity) * 100);
  const storagePct = Math.round((region.storageUsedTB / region.storageTotalTB) * 100);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        region.status === 'critical'
          ? 'border-danger/30 hover:border-danger/50'
          : region.status === 'degraded'
            ? 'border-warning/30 hover:border-warning/50'
            : region.status === 'maintenance'
              ? 'border-info/30 hover:border-info/50'
              : 'border-border hover:border-secondary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.class)}>
            <Globe className={cn('h-5 w-5', meta.iconColor)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{region.name}</h3>
            <p className="text-[10px] text-text-muted">{region.location}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            meta.class
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Tenants</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {region.tenantCount}{' '}
            <span className="text-text-muted text-[10px]">/ {region.capacity}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Latency</p>
          <p className="text-sm font-mono font-medium text-text-primary">{region.latencyMs}ms</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-text-muted">Utilization</span>
          <span
            className={cn(
              'font-mono font-medium',
              utilization > 85 ? 'text-danger' : utilization > 70 ? 'text-warning' : 'text-accent'
            )}
          >
            {utilization}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              utilization > 85 ? 'bg-danger' : utilization > 70 ? 'bg-warning' : 'bg-accent'
            )}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      {/* Storage Bar */}
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-text-muted">Storage</span>
          <span
            className={cn(
              'font-mono font-medium',
              storagePct > 80 ? 'text-danger' : storagePct > 60 ? 'text-warning' : 'text-accent'
            )}
          >
            {storagePct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              storagePct > 80 ? 'bg-danger' : storagePct > 60 ? 'bg-warning' : 'bg-accent'
            )}
            style={{ width: `${storagePct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" /> {region.throughputRps.toLocaleString()} RPS
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" /> {region.storageUsedTB} / {region.storageTotalTB} TB
        </span>
      </div>
    </div>
  );
}

/* ─── Migration Job Card ─── */
export function MigrationJobCard({ job, onClick }) {
  const meta = migrationStatusMeta[job.status] || migrationStatusMeta.pending;
  const isActive =
    job.status === 'in_progress' || job.status === 'pending' || job.status === 'scheduled';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        job.status === 'failed'
          ? 'border-danger/30 hover:border-danger/50'
          : job.status === 'in_progress'
            ? 'border-secondary/30 hover:border-secondary/50'
            : 'border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.class)}>
            {job.status === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : job.status === 'failed' ? (
              <XCircle className="h-4 w-4 text-danger" />
            ) : job.status === 'in_progress' ? (
              <Activity className="h-4 w-4 text-secondary animate-pulse" />
            ) : (
              <Clock className="h-4 w-4 text-text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{job.tenantName}</h3>
            <p className="text-[10px] text-text-muted font-mono">{job.id}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            meta.class
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      {/* Route */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="rounded-md bg-background border border-border px-2 py-0.5 text-text-secondary font-mono text-[10px]">
          {job.sourceRegion}
        </span>
        <ArrowRight className="h-3 w-3 text-text-muted" />
        <span className="rounded-md bg-background border border-border px-2 py-0.5 text-text-secondary font-mono text-[10px]">
          {job.targetRegion}
        </span>
      </div>

      {/* Progress */}
      {job.status === 'in_progress' && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-muted">Progress</span>
            <span className="font-mono font-medium text-secondary">{job.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-[10px] text-text-muted">
        <div>
          <span className="text-text-muted">Data:</span>{' '}
          <span className="font-mono text-text-primary">{job.dataSizeGB} GB</span>
        </div>
        <div>
          <span className="text-text-muted">By:</span>{' '}
          <span className="text-text-primary">{job.initiatedBy}</span>
        </div>
        {job.startedAt && (
          <div>
            <span className="text-text-muted">Started:</span>{' '}
            <span className="text-text-primary">{job.startedAt}</span>
          </div>
        )}
        {job.duration && (
          <div>
            <span className="text-text-muted">Duration:</span>{' '}
            <span className="font-mono text-text-primary">{job.duration}</span>
          </div>
        )}
        {job.downtimeSeconds !== null && (
          <div>
            <span className="text-text-muted">Downtime:</span>{' '}
            <span
              className={cn('font-mono', job.downtimeSeconds > 60 ? 'text-warning' : 'text-accent')}
            >
              {formatDuration(job.downtimeSeconds)}
            </span>
          </div>
        )}
      </div>

      {job.error && (
        <div className="mt-2 rounded-lg border border-danger/20 bg-danger/5 p-2">
          <p className="text-[10px] text-danger flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {job.error}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Compliance Rule Card ─── */
export function ComplianceCard({ rule }) {
  const meta = complianceStatusMeta[rule.status] || complianceStatusMeta.compliant;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all',
        rule.status === 'non_compliant'
          ? 'border-danger/30'
          : rule.status === 'at_risk'
            ? 'border-warning/30'
            : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.class)}>
            <Shield
              className={cn(
                'h-4 w-4',
                rule.status === 'non_compliant'
                  ? 'text-danger'
                  : rule.status === 'at_risk'
                    ? 'text-warning'
                    : 'text-accent'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{rule.name}</h3>
            <p className="text-[10px] text-text-muted">
              {rule.regulation} · {rule.jurisdiction}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            meta.class
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      <p className="mt-2 text-xs text-text-secondary">{rule.requirement}</p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {rule.affectedRegions.map((r) => (
          <span
            key={r}
            className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary font-mono"
          >
            {r}
          </span>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <div className="flex items-center gap-3">
          <span>Last audit: {rule.lastAudit}</span>
          <span>Next: {rule.nextAudit}</span>
        </div>
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>{rule.evidenceCount} evidence files</span>
        </div>
      </div>

      {rule.riskNote && (
        <div className="mt-2 rounded-lg border border-warning/20 bg-warning/5 p-2">
          <p className="text-[10px] text-warning flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {rule.riskNote}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Mini Latency Sparkline ─── */
export function LatencySparkline({ data, regionKey, color = '#863bff', width = 100, height = 28 }) {
  if (!data || data.length < 2) return <div className="h-7 w-24 bg-border rounded" />;

  const values = data.map((d) => d[regionKey] || 0);
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

  const last = values[values.length - 1];
  const first = values[0];
  const trend = last - first;

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={width} cy={height - ((last - min) / range) * height} r="2" fill={color} />
      </svg>
      {trend !== 0 && (
        <span className={cn('text-[10px] font-medium', trend > 0 ? 'text-danger' : 'text-accent')}>
          {trend > 0 ? '+' : ''}
          {trend}ms
        </span>
      )}
    </div>
  );
}

/* ─── Region Stat Card ─── */
export function RegionStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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
              {trend}% vs last month
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

/* ─── Tenant Row (for region detail) ─── */
export function TenantRow({ tenant }) {
  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
            {tenant.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{tenant.name}</p>
            <p className="text-[10px] text-text-muted font-mono">{tenant.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            tenant.plan === 'Enterprise'
              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
              : tenant.plan === 'Professional'
                ? 'bg-secondary/10 text-secondary border-secondary/20'
                : 'bg-info/10 text-info border-info/20'
          )}
        >
          {tenant.plan}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-mono text-text-primary">
        ${tenant.mrr.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-text-primary">{tenant.storageGB} GB</td>
      <td className="px-4 py-3 text-xs text-text-secondary">{tenant.lastActive}</td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            tenant.compliance === 'gdpr'
              ? 'bg-accent/10 text-accent border-accent/20'
              : tenant.compliance === 'pdpa'
                ? 'bg-info/10 text-info border-info/20'
                : tenant.compliance === 'trial'
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : tenant.compliance === 'churned'
                    ? 'bg-neutral/10 text-text-muted border-border'
                    : 'bg-accent/10 text-accent border-accent/20'
          )}
        >
          {tenant.compliance === 'gdpr' && <Shield className="h-3 w-3" />}
          {tenant.compliance === 'pdpa' && <Shield className="h-3 w-3" />}
          {tenant.compliance.toUpperCase()}
        </span>
      </td>
    </tr>
  );
}
