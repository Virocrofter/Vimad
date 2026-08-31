/* src/app/admin/components.jsx */
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Building2,
  Users,
  BedDouble,
  DollarSign,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  statusMeta,
  billingStatusMeta,
  planMeta,
  getUsagePercent,
  getUsageColor,
  getUsageBarColor,
  formatCurrency,
} from './data';

/* ─── Status Badge ─── */
export function TenantStatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.pending;
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

/* ─── Billing Status Badge ─── */
export function BillingStatusBadge({ status }) {
  const meta = billingStatusMeta[status] || billingStatusMeta.pending;
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

/* ─── Plan Badge ─── */
export function PlanBadge({ plan }) {
  const meta = planMeta[plan] || planMeta.Starter;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
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
              .replace('purple-500', 'purple-500/10')
              .replace('text-', 'bg-')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Usage Bar ─── */
export function MiniUsageBar({ used, total, label, unit = '' }) {
  const pct = getUsagePercent(used, total);
  const colorClass = getUsageColor(pct);
  const barColor = getUsageBarColor(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted">{label}</span>
        <span className={cn('font-mono font-medium', colorClass)}>
          {used}
          {unit} / {typeof total === 'string' ? total : `${total}${unit}`}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: pct !== null ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  );
}

/* ─── MRR Trend Mini Chart ─── */
export function MrrSparkline({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const trend = data[data.length - 1] - data[0];
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 100 100" className="h-8 w-20 text-secondary" preserveAspectRatio="none">
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
      </svg>
      <TrendIcon className={cn('h-3.5 w-3.5', trend >= 0 ? 'text-accent' : 'text-danger')} />
    </div>
  );
}

/* ─── Tenant Avatar ─── */
export function TenantAvatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg font-bold text-secondary bg-secondary/10',
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
