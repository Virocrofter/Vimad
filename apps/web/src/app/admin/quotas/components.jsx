/* src/app/admin/quotas/components.jsx */
import { useState } from 'react';
import {
  Zap,
  HardDrive,
  BedDouble,
  Users,
  Tag,
  Building2,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Gauge,
  DollarSign,
  Ban,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  resourceMeta,
  actionMeta,
  scopeMeta,
  periodMeta,
  overageStatusMeta,
  getUsagePercent,
  getUsageColor,
  getUsageBarColor,
  formatNumber,
  formatCurrency,
} from './data';

/* ─── Resource Badge ─── */
export function ResourceBadge({ resource }) {
  const meta = resourceMeta[resource] || resourceMeta.api_calls;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Scope Badge ─── */
export function ScopeBadge({ scope, target }) {
  const meta = scopeMeta[scope] || scopeMeta.plan;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.color
          .replace('text-', 'bg-')
          .replace('warning', 'warning/10')
          .replace('accent', 'accent/10')
          .replace('secondary', 'secondary/10'),
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
      {target && <span className="opacity-70">· {target}</span>}
    </span>
  );
}

/* ─── Action Badge ─── */
export function ActionBadge({ action }) {
  const meta = actionMeta[action] || actionMeta.notify;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Overage Status Badge ─── */
export function OverageStatusBadge({ status }) {
  const meta = overageStatusMeta[status] || overageStatusMeta.projected;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Quota Stat Card ─── */
export function QuotaStatCard({ label, value, subtext, icon: Icon, color, trend }) {
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

/* ─── Quota Rule Card ─── */
export function QuotaRuleCard({ rule, onEdit, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const action = actionMeta[rule.action] || actionMeta.notify;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 transition-all hover:shadow-md',
        rule.enabled ? 'border-border hover:border-secondary/30' : 'border-border opacity-60'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              resourceMeta[rule.resource]?.bg || 'bg-secondary/10'
            )}
          >
            <Zap
              className={cn('h-4 w-4', resourceMeta[rule.resource]?.color || 'text-secondary')}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{rule.name}</h3>
            <p className="text-[10px] text-text-muted">
              {rule.id} · {rule.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ActionBadge action={rule.action} />
          {!rule.enabled && (
            <span className="inline-flex items-center rounded-full border border-border bg-neutral/10 px-2 py-0.5 text-[10px] font-medium text-text-muted">
              Disabled
            </span>
          )}
        </div>
      </div>

      {/* Limits */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Limit</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {formatNumber(rule.limit)}{' '}
            <span className="text-[10px] text-text-muted">
              {rule.unit}/{periodMeta[rule.period]?.short || rule.period}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Warn At</p>
          <p className="text-sm font-mono font-medium text-warning">{rule.warnThreshold}%</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Scope</p>
          <p className="text-sm font-medium text-text-primary">
            <ScopeBadge scope={rule.scope} target={rule.scopeTarget} />
          </p>
        </div>
      </div>

      {/* Overage */}
      {rule.overageEnabled && (
        <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-accent font-medium">Overage enabled</span>
          </div>
          <span className="text-xs font-mono text-text-secondary">
            {formatCurrency(rule.overageRate)}/{rule.unit} · cap {formatCurrency(rule.overageCap)}
          </span>
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-background transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Less details' : 'More details'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-background p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-muted">Hard Limit:</span>{' '}
              <span className="font-mono text-text-primary">{rule.hardLimit}%</span>
            </div>
            <div>
              <span className="text-text-muted">Period:</span>{' '}
              <span className="text-text-primary">
                {periodMeta[rule.period]?.label || rule.period}
              </span>
            </div>
            {rule.throttleRate && (
              <div>
                <span className="text-text-muted">Throttle Rate:</span>{' '}
                <span className="font-mono text-text-primary">{rule.throttleRate} req/s</span>
              </div>
            )}
            <div>
              <span className="text-text-muted">Updated:</span>{' '}
              <span className="text-text-primary">{rule.updatedAt}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <button
          onClick={() => onToggle(rule.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            rule.enabled
              ? 'text-accent hover:bg-accent/10'
              : 'text-text-muted hover:bg-surface-elevated'
          )}
        >
          {rule.enabled ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {rule.enabled ? 'Enabled' : 'Disabled'}
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors"
        >
          <Activity className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <Ban className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Tenant Usage Row ─── */
export function TenantUsageRow({ usage, expanded, onToggle }) {
  const pct = getUsagePercent(usage.used, usage.limit);
  const colorClass = getUsageColor(pct);
  const barColor = getUsageBarColor(pct);
  const meta = resourceMeta[usage.resource] || resourceMeta.api_calls;

  return (
    <>
      <tr
        className={cn(
          'hover:bg-background/50 transition-colors cursor-pointer',
          pct >= 100 && 'bg-danger/5'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <ResourceBadge resource={usage.resource} />
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-text-primary">{usage.tenantName}</td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
              usage.plan === 'Enterprise'
                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                : usage.plan === 'Professional'
                  ? 'bg-secondary/10 text-secondary border-secondary/20'
                  : 'bg-info/10 text-info border-info/20'
            )}
          >
            {usage.plan}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-border overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barColor)}
                style={{ width: `${Math.min(100, pct || 0)}%` }}
              />
            </div>
            <span className={cn('text-xs font-mono font-medium', colorClass)}>{pct}%</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-mono text-text-primary">
          {typeof usage.used === 'number' && usage.used % 1 !== 0
            ? usage.used.toFixed(1)
            : usage.used}
          <span className="text-text-muted text-xs">
            {' '}
            / {formatNumber(usage.limit)} {usage.unit}
          </span>
        </td>
        <td className="px-4 py-3">
          {pct >= 100 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-xs font-medium text-danger">
              <XCircle className="h-3 w-3" /> Exceeded
            </span>
          ) : pct >= 90 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              <AlertTriangle className="h-3 w-3" /> Critical
            </span>
          ) : pct >= 75 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 border border-info/20 px-2 py-0.5 text-xs font-medium text-info">
              <Info className="h-3 w-3" /> Warning
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              <CheckCircle2 className="h-3 w-3" /> OK
            </span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Remaining</p>
                  <p className={cn('font-mono font-medium', colorClass)}>
                    {Math.max(0, usage.limit - usage.used).toFixed(usage.used % 1 !== 0 ? 1 : 0)}{' '}
                    {usage.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Overage (if any)</p>
                  <p className="font-mono text-text-primary">
                    {usage.used > usage.limit ? (usage.used - usage.limit).toFixed(1) : 0}{' '}
                    {usage.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Projected Monthly</p>
                  <p className="font-mono text-text-primary">
                    {Math.round(usage.used * 1.2)} {usage.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90">
                  Adjust Limit
                </button>
                <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
                  View History
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Overage History Row ─── */
export function OverageHistoryRow({ entry }) {
  return (
    <tr className="hover:bg-background/50 transition-colors">
      <td className="px-4 py-3">
        <OverageStatusBadge status={entry.status} />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.tenantName}</td>
      <td className="px-4 py-3">
        <ResourceBadge resource={entry.resource} />
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{entry.period}</td>
      <td className="px-4 py-3 text-sm font-mono text-text-primary">
        {entry.excess}{' '}
        {entry.resource === 'storage' ? 'GB' : entry.resource === 'users' ? 'seats' : 'calls'}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-text-primary">
        {formatCurrency(entry.rate)}
      </td>
      <td className="px-4 py-3 text-sm font-mono font-medium text-text-primary">
        {formatCurrency(entry.charge)}
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">{entry.invoiceId || '—'}</td>
    </tr>
  );
}

/* ─── Throttle Event Row ─── */
export function ThrottleEventRow({ event }) {
  return (
    <tr
      className={cn('hover:bg-background/50 transition-colors', !event.resolved && 'bg-warning/5')}
    >
      <td className="px-4 py-3">
        <ResourceBadge resource={event.resource} />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-text-primary">{event.tenantId}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">{event.timestamp}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">{event.reason}</td>
      <td className="px-4 py-3 text-sm font-mono text-text-primary">
        {event.duration ? `${event.duration}s` : <span className="text-warning">Ongoing</span>}
      </td>
      <td className="px-4 py-3">
        {event.resolved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
            <Clock className="h-3 w-3" /> Active
          </span>
        )}
      </td>
    </tr>
  );
}

/* ─── Mini Progress Ring (SVG) ─── */
export function MiniProgressRing({ percent, size = 40, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  const getColor = () => {
    if (percent >= 100) return '#ef4444';
    if (percent >= 90) return '#f59e0b';
    if (percent >= 75) return '#3b82f6';
    return '#22c55e';
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--border)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={getColor()}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      <text
        x="50%"
        y="50%"
        dy="0.3em"
        textAnchor="middle"
        className="text-[10px] font-mono font-bold"
        fill="currentColor"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}
