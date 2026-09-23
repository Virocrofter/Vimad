// apps/web/src/app/admin/billing/components.jsx
// Components for the Billing Management page
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { cn } from '../../../lib/utils';
import { subscriptionStatusMeta, invoiceStatusMeta } from './data';

/* ─── BillingStatCard ─── */
export function BillingStatCard({ label, value, icon: Icon, color, subtext }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
      </div>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
      {subtext && <p className="mt-1 text-xs text-text-muted">{subtext}</p>}
    </div>
  );
}

/* ─── MrrMovementBar ─── */
export function MrrMovementBar({ data }) {
  // data: [{ month: 'Jan', mrr: 12000 }, ...]
  if (!data || data.length === 0) return null;

  const maxMrr = Math.max(...data.map((d) => d.mrr ?? 0), 1);

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const pct = ((item.mrr ?? 0) / maxMrr) * 100;
        return (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-10 text-xs text-text-muted shrink-0">{item.month}</span>
            <div className="flex-1 h-6 bg-background rounded overflow-hidden">
              <div
                className="h-full bg-secondary/80 rounded transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-20 text-xs font-mono text-text-primary text-right shrink-0">
              {formatCurrency(item.mrr ?? 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── PlanDistributionChart ─── */
export function PlanDistributionChart({ data }) {
  // data: [{ plan: 'Starter', revenue: 5000 }, ...]
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + (d.revenue ?? 0), 0);
  const colors = ['bg-accent', 'bg-secondary', 'bg-info', 'bg-warning', 'bg-danger'];

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-8 w-full rounded-lg overflow-hidden">
        {data.map((item, idx) => {
          const pct = total > 0 ? ((item.revenue ?? 0) / total) * 100 : 0;
          return (
            <div
              key={idx}
              className={`${colors[idx % colors.length]} h-full transition-all`}
              style={{ width: `${pct}%` }}
              title={`${item.plan}: ${formatCurrency(item.revenue ?? 0)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round(((item.revenue ?? 0) / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors[idx % colors.length]} shrink-0`} />
              <span className="text-xs text-text-primary truncate">{item.plan}</span>
              <span className="text-xs text-text-muted ml-auto">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Values */}
      <div className="pt-2 border-t border-border space-y-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-text-muted">{item.plan}</span>
            <span className="font-mono text-text-primary">{formatCurrency(item.revenue ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── InvoiceMiniCard ─── */
const invoiceStatusStyles = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  overdue: 'bg-danger/10 text-danger',
  void: 'bg-text-muted/10 text-text-muted',
  cancelled: 'bg-text-muted/10 text-text-muted',
};

export function InvoiceMiniCard({ invoice }) {
  const statusStyle = invoiceStatusStyles[invoice.status] ?? invoiceStatusStyles.pending;

  return (
    <Link
      to={`/admin/billing/invoices/${invoice.id}`}
      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:border-secondary/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{invoice.tenantName}</p>
        <p className="text-[10px] text-text-muted">
          {invoice.id} · {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyle}`}
        >
          {invoice.status}
        </span>
        <p className="text-sm font-mono font-medium text-text-primary">
          {formatCurrency(invoice.amount ?? 0)}
        </p>
        <ArrowRight className="h-3 w-3 text-text-muted" />
      </div>
    </Link>
  );
}

/* ─── SubscriptionMiniCard ─── */
const subStatusStyles = {
  active: 'bg-success/10 text-success',
  trial: 'bg-info/10 text-info',
  past_due: 'bg-warning/10 text-warning',
  cancelled: 'bg-text-muted/10 text-text-muted',
  expired: 'bg-danger/10 text-danger',
};

export function SubscriptionMiniCard({ subscription }) {
  const statusStyle = subStatusStyles[subscription.status] ?? subStatusStyles.active;

  return (
    <Link
      to={`/admin/billing/subscriptions/${subscription.id}`}
      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:border-secondary/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{subscription.tenantName}</p>
        <p className="text-[10px] text-text-muted">
          {subscription.plan ?? '—'} · {subscription.billingCycle ?? 'monthly'} ·{' '}
          {subscription.seats ?? 0} seats
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusStyle}`}
        >
          {subscription.status}
        </span>
        <p className="text-sm font-mono font-medium text-text-primary">
          {formatCurrency(subscription.amount ?? 0)}/mo
        </p>
        <ArrowRight className="h-3 w-3 text-text-muted" />
      </div>
    </Link>
  );
}

/* ─── DunningTimeline ─── */
const dunningStatusConfig = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
  sent: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
};

export function DunningTimeline({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="space-y-0">
      {actions.map((action, idx) => {
        const config = dunningStatusConfig[action.status] ?? dunningStatusConfig.sent;
        const Icon = config.icon;
        const isLast = idx === actions.length - 1;

        return (
          <div key={idx} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border my-1" />}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{action.action}</p>
                <span className="text-[10px] text-text-muted shrink-0">
                  {action.date ? new Date(action.date).toLocaleDateString() : '—'}
                </span>
              </div>
              {action.reason && <p className="text-xs text-danger mt-0.5">{action.reason}</p>}
              <span
                className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${config.bg} ${config.color}`}
              >
                {action.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
/* ─── Subscription Status Badge ─── */
export function SubscriptionStatusBadge({ status }) {
  const meta = subscriptionStatusMeta[status] || subscriptionStatusMeta.active;
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

/* ─── Invoice Status Badge ─── */
export function InvoiceStatusBadge({ status }) {
  const meta = invoiceStatusMeta[status] || invoiceStatusMeta.pending;
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

/* ─── Proration Display ─── */
export function ProrationDisplay({ calculation }) {
  if (!calculation) return null;
  const { prorationAmount, newTotalMonthly, daysRemaining, creditApplied } = calculation;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Proration Calculation
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-text-muted">Days Remaining</p>
          <p className="font-mono font-medium text-text-primary">{daysRemaining}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">New Monthly Total</p>
          <p className="font-mono font-medium text-text-primary">
            {formatCurrency(newTotalMonthly)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Proration Charge</p>
          <p
            className={cn(
              'font-mono font-medium',
              prorationAmount >= 0 ? 'text-danger' : 'text-accent'
            )}
          >
            {prorationAmount >= 0 ? '+' : ''}
            {formatCurrency(prorationAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Credit Applied</p>
          <p className="font-mono font-medium text-accent">{formatCurrency(creditApplied)}</p>
        </div>
      </div>
      <div className="rounded-lg bg-background border border-border p-3">
        <p className="text-xs text-text-secondary">
          {prorationAmount > 0
            ? `Customer will be charged ${formatCurrency(prorationAmount)} immediately for the remaining ${daysRemaining} days.`
            : creditApplied > 0
              ? `Customer will receive a credit of ${formatCurrency(creditApplied)} applied to their next invoice.`
              : 'No proration adjustment needed.'}
        </p>
      </div>
    </div>
  );
}
