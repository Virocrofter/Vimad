/* src/app/admin/backups/components.jsx */
import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Database,
  HardDrive,
  Cloud,
  Server,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  FileCheck,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Gauge,
  Target,
  Crosshair,
  AlertOctagon,
  Info,
  FileText,
  Terminal,
  Bug,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  backupTypeMeta,
  scheduleStatusMeta,
  restorePointStatusMeta,
  replicationStatusMeta,
  testStatusMeta,
  timeAgo,
} from './data';

/* ─── Type Badge ─── */
export function BackupTypeBadge({ type }) {
  const meta = backupTypeMeta[type] || backupTypeMeta.full;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Schedule Status Badge ─── */
export function ScheduleStatusBadge({ status }) {
  const meta = scheduleStatusMeta[status] || scheduleStatusMeta.success;
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

/* ─── Restore Point Status Badge ─── */
export function RestorePointStatusBadge({ status }) {
  const meta = restorePointStatusMeta[status] || restorePointStatusMeta.available;
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

/* ─── Replication Status Badge ─── */
export function ReplicationStatusBadge({ status }) {
  const meta = replicationStatusMeta[status] || replicationStatusMeta.active;
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

/* ─── Test Status Badge ─── */
export function TestStatusBadge({ status }) {
  const meta = testStatusMeta[status] || testStatusMeta.success;
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

/* ─── Stat Card ─── */
export function BackupStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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

/* ─── Progress Bar ─── */
export function BackupProgressBar({ used, total, label, unit = '', color = 'bg-accent' }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted">{label}</span>
        <span
          className={cn(
            'font-mono font-medium',
            pct > 80 ? 'text-danger' : pct > 60 ? 'text-warning' : 'text-accent'
          )}
        >
          {used}
          {unit} / {total}
          {unit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct > 80 ? 'bg-danger' : pct > 60 ? 'bg-warning' : color
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Replication Lag Indicator ─── */
export function ReplicationLagIndicator({ lagSeconds, targetSeconds }) {
  const pct = targetSeconds > 0 ? Math.min(100, (lagSeconds / targetSeconds) * 100) : 0;
  const isHealthy = pct < 50;
  const isWarning = pct >= 50 && pct < 90;

  let display;
  if (lagSeconds < 60) display = `${lagSeconds}s`;
  else if (lagSeconds < 3600) display = `${Math.floor(lagSeconds / 60)}m ${lagSeconds % 60}s`;
  else display = `${Math.floor(lagSeconds / 3600)}h ${Math.floor((lagSeconds % 3600) / 60)}m`;

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isHealthy ? 'bg-accent' : isWarning ? 'bg-warning' : 'bg-danger'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono font-medium',
          isHealthy ? 'text-accent' : isWarning ? 'text-warning' : 'text-danger'
        )}
      >
        {display}
      </span>
    </div>
  );
}

/* ─── RTO/RPO Gauge ─── */
export function RtoRpoGauge({ actual, target, label, unit = 'min' }) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const isHealthy = pct <= 80;
  const isWarning = pct > 80 && pct <= 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <span
          className={cn(
            'text-xs font-mono font-bold',
            isHealthy ? 'text-accent' : isWarning ? 'text-warning' : 'text-danger'
          )}
        >
          {actual}
          {unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isHealthy ? 'bg-accent' : isWarning ? 'bg-warning' : 'bg-danger'
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted">
        <span>
          Target: {target}
          {unit}
        </span>
        <span>{Math.round(pct)}% of target</span>
      </div>
    </div>
  );
}

/* ─── Health Check Dot ─── */
export function HealthCheckDot({ status }) {
  return (
    <span
      className={cn(
        'inline-flex h-2 w-2 rounded-full',
        status === 'healthy' && 'bg-accent',
        status === 'warning' && 'bg-warning',
        status === 'failed' && 'bg-danger',
        status === 'unknown' && 'bg-text-muted'
      )}
    />
  );
}

/* ─── Test Result Row ─── */
export function TestResultRow({ label, status, detail }) {
  const configs = {
    passed: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10' },
    failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
    not_started: { icon: Minus, color: 'text-text-muted', bg: 'bg-neutral/10' },
  };
  const config = configs[status] || configs.not_started;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', config.bg)}>
          <Icon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
        <span className="text-sm text-text-primary">{label}</span>
      </div>
      <div className="text-right">
        <span className={cn('text-xs font-medium', config.color)}>
          {status === 'passed'
            ? 'Passed'
            : status === 'failed'
              ? 'Failed'
              : status === 'warning'
                ? 'Warning'
                : 'Not started'}
        </span>
        {detail && <p className="text-[10px] text-text-muted">{detail}</p>}
      </div>
    </div>
  );
}

/* ─── Log Entry ─── */
export function LogEntry({ time, level, message }) {
  const levelColors = {
    info: 'text-info',
    warning: 'text-warning',
    error: 'text-danger',
    success: 'text-accent',
  };

  return (
    <div className="flex items-start gap-3 py-1.5 font-mono text-xs">
      <span className="shrink-0 text-text-muted w-20">{time}</span>
      <span
        className={cn(
          'shrink-0 w-14 font-semibold uppercase',
          levelColors[level] || 'text-text-muted'
        )}
      >
        {level}
      </span>
      <span className="text-text-secondary">{message}</span>
    </div>
  );
}

/* ─── Storage Tier Badge ─── */
export function StorageTierBadge({ tier }) {
  const tiers = {
    Standard: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
    'Standard-IA': { color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
    'Glacier Deep Archive': {
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      border: 'border-secondary/20',
    },
  };
  const meta = tiers[tier] || tiers.Standard;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      <Cloud className="mr-1 h-3 w-3" />
      {tier}
    </span>
  );
}

/* ─── Region Badge ─── */
export function RegionBadge({ region }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary font-mono">
      <Globe className="h-3 w-3" />
      {region}
    </span>
  );
}

/* ─── Copyable ID ─── */
export function CopyableId({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
      title="Click to copy"
    >
      {id}
      {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/* ─── Timeline Item ─── */
export function TimelineItem({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  time,
  status,
  children,
}) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border-2',
            iconBg,
            iconColor.replace('text-', 'border-')
          )}
        >
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        <div className="mt-1 h-full w-px bg-border" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          {status}
        </div>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        {time && <p className="text-[10px] text-text-muted mt-0.5">{time}</p>}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

/* ─── Issue Alert ─── */
export function IssueAlert({ severity, message, component }) {
  const configs = {
    critical: {
      icon: AlertOctagon,
      color: 'text-danger',
      bg: 'bg-danger/5',
      border: 'border-danger/20',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/5',
      border: 'border-warning/20',
    },
    info: { icon: Info, color: 'text-info', bg: 'bg-info/5', border: 'border-info/20' },
  };
  const config = configs[severity] || configs.info;
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border p-3 flex items-start gap-2', config.bg, config.border)}>
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.color)} />
      <div className="min-w-0">
        <p className={cn('text-xs font-medium', config.color)}>{message}</p>
        {component && <p className="text-[10px] text-text-muted mt-0.5">Component: {component}</p>}
      </div>
    </div>
  );
}
