'use client';

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
  Pencil,
  Trash2,
  Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
} from './constants';

// ─── Badge Components (keep existing) ───

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

// ─── Quota Stat Card (keep existing) ───

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

// ─── Quota Rule Card (updated with real actions) ───

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
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Hard Limit</p>
          <p className="text-sm font-mono font-medium text-danger">{rule.hardLimit}%</p>
        </div>
      </div>

      {/* Scope & Overage */}
      <div className="mt-3 flex items-center gap-2">
        <ScopeBadge scope={rule.scope} target={rule.scopeTarget} />
        {rule.overageEnabled && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <DollarSign className="h-3 w-3" />
            Overage: ${rule.overageRate}/{rule.unit}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> More
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              'h-7 w-7 p-0',
              rule.enabled
                ? 'text-warning hover:text-warning/80'
                : 'text-accent hover:text-accent/80'
            )}
            title={rule.enabled ? 'Disable rule' : 'Enable rule'}
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 w-7 p-0 text-text-muted hover:text-text-primary"
            title="Edit rule"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-danger hover:text-danger/80"
            title="Delete rule"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-muted">Created:</span>{' '}
              <span className="text-text-primary">{rule.createdAt}</span>
            </div>
            <div>
              <span className="text-text-muted">Updated:</span>{' '}
              <span className="text-text-primary">{rule.updatedAt}</span>
            </div>
            {rule.throttleRate && (
              <div>
                <span className="text-text-muted">Throttle Rate:</span>{' '}
                <span className="text-text-primary">{rule.throttleRate} req/s</span>
              </div>
            )}
            {rule.overageCap > 0 && (
              <div>
                <span className="text-text-muted">Overage Cap:</span>{' '}
                <span className="text-text-primary">{formatCurrency(rule.overageCap)}/mo</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Usage Bar Component ───

export function UsageBar({ entry }) {
  const percent = getUsagePercent(entry.used, entry.limit);
  const colorClass = getUsageColor(percent);
  const barColor = getUsageBarColor(percent);

  return (
    <tr className="hover:bg-neutral/5">
      <td className="px-4 py-3">
        <p className="font-medium text-text-primary">{entry.tenantName}</p>
      </td>
      <td className="px-4 py-3">
        <ResourceBadge resource={entry.resource} />
      </td>
      <td className="px-4 py-3">
        <span className={cn('font-mono font-medium', colorClass)}>{formatNumber(entry.used)}</span>
        <span className="text-text-muted text-xs"> / {formatNumber(entry.limit)}</span>
      </td>
      <td className="px-4 py-3 text-text-muted font-mono text-xs">
        {formatNumber(entry.limit)} {entry.unit}
      </td>
      <td className="px-4 py-3 w-48">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-neutral/20 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <span className={cn('text-xs font-mono font-medium w-10', colorClass)}>{percent}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-muted text-xs">
        {new Date(entry.resetAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

// ─── Overage History Row ───

export function OverageHistoryRow({ entry, onEdit }) {
  return (
    <tr className="hover:bg-neutral/5">
      <td className="px-4 py-3">
        <OverageStatusBadge status={entry.status} />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-text-primary">{entry.tenantName}</p>
      </td>
      <td className="px-4 py-3">
        <ResourceBadge resource={entry.resource} />
      </td>
      <td className="px-4 py-3 text-text-muted text-xs">{entry.period}</td>
      <td className="px-4 py-3 font-mono text-sm">{formatNumber(entry.excessAmount)}</td>
      <td className="px-4 py-3 font-mono text-xs text-text-muted">
        ${entry.rate}/{entry.resource === 'storage' ? 'GB' : 'call'}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'font-mono font-medium',
            entry.status === 'billed'
              ? 'text-accent'
              : entry.status === 'waived'
                ? 'text-text-muted'
                : 'text-warning'
          )}
        >
          {formatCurrency(entry.charge)}
        </span>
      </td>
      <td className="px-4 py-3 text-text-muted text-xs">{entry.invoiceId || '—'}</td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs">
          Manage
        </Button>
      </td>
    </tr>
  );
}

// ─── Throttle Event Row ───

export function ThrottleEventRow({ event }) {
  const duration = event.duration || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <tr className="hover:bg-neutral/5">
      <td className="px-4 py-3">
        <ResourceBadge resource={event.resource} />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-text-primary">{event.tenantName}</p>
      </td>
      <td className="px-4 py-3 text-text-muted text-xs">
        {new Date(event.timestamp).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{event.reason}</td>
      <td className="px-4 py-3 font-mono text-xs">
        {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
      </td>
      <td className="px-4 py-3">
        {event.resolved ? (
          <span className="inline-flex items-center gap-1 text-accent text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-warning text-xs">
            <Clock className="h-3.5 w-3.5" />
            Active
          </span>
        )}
      </td>
    </tr>
  );
}
