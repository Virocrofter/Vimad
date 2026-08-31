/* src/app/admin/billing/components.jsx */
import { cn } from '../../../lib/utils';
import {
  subscriptionStatusMeta, invoiceStatusMeta, creditNoteStatusMeta,
  dunningStatusMeta, failureReasonMeta, formatCurrency, formatDate
} from './data';

/* ─── Subscription Status Badge ─── */
export function SubscriptionStatusBadge({ status }) {
  const meta = subscriptionStatusMeta[status] || subscriptionStatusMeta.active;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Invoice Status Badge ─── */
export function InvoiceStatusBadge({ status }) {
  const meta = invoiceStatusMeta[status] || invoiceStatusMeta.pending;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Credit Note Status Badge ─── */
export function CreditNoteStatusBadge({ status }) {
  const meta = creditNoteStatusMeta[status] || creditNoteStatusMeta.open;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Dunning Status Badge ─── */
export function DunningStatusBadge({ status }) {
  const meta = dunningStatusMeta[status] || dunningStatusMeta.in_progress;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      meta.class
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Billing Stat Card ─── */
export function BillingStatCard({ label, value, subtext, icon: Icon, color, trend, prefix = '' }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>
            {prefix}{value}
          </p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}>
              {trend >= 0 ? '+' : ''}{trend}% vs last month
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-lg p-2.5',
          color.replace('text-', 'bg-')
            .replace('danger', 'danger/10')
            .replace('accent', 'accent/10')
            .replace('warning', 'warning/10')
            .replace('info', 'info/10')
            .replace('secondary', 'secondary/10')
            .replace('purple-500', 'purple-500/10')
        )}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── MRR Movement Bar ─── */
export function MrrMovementBar({ data }) {
  const max = Math.max(
    ...data.map(d => Math.abs(d.new) + Math.abs(d.expansion) + Math.abs(d.contraction) + Math.abs(d.churn))
  );

  return (
    <div className="space-y-2">
      {data.map((month) => {
        const total = month.new + month.expansion + month.contraction + month.churn;
        const newWidth = (month.new / max) * 100;
        const expWidth = (month.expansion / max) * 100;
        const conWidth = (Math.abs(month.contraction) / max) * 100;
        const churnWidth = (Math.abs(month.churn) / max) * 100;

        return (
          <div key={month.month} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">{month.month}</span>
              <span className="font-mono font-medium text-text-primary">{formatCurrency(month.mrr)}</span>
            </div>
            <div className="flex h-2 w-full rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${newWidth}%` }} />
              <div className="h-full bg-secondary" style={{ width: `${expWidth}%` }} />
              <div className="h-full bg-warning" style={{ width: `${conWidth}%` }} />
              <div className="h-full bg-danger" style={{ width: `${churnWidth}%` }} />
            </div>
            <div className="flex gap-3 text-[10px] text-text-muted">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" />+{formatCurrency(month.new)} new</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />+{formatCurrency(month.expansion)} expansion</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />-{formatCurrency(month.contraction)} contraction</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-danger" />-{formatCurrency(month.churn)} churn</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Plan Distribution Donut (SVG) ─── */
export function PlanDistributionChart({ data }) {
  const total = data.reduce((s, d) => s + d.mrr, 0);
  let cumulative = 0;

  const segments = data.map((d) => {
    const pct = (d.mrr / total) * 100;
    const startAngle = (cumulative / 100) * 360;
    const endAngle = ((cumulative + pct) / 100) * 360;
    cumulative += pct;
    return { ...d, pct, startAngle, endAngle };
  });

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={describeArc(50, 50, 45, seg.startAngle, seg.endAngle)}
            fill={seg.color}
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}
        <circle cx="50" cy="50" r="28" fill="var(--surface)" />
        <text x="50" y="48" textAnchor="middle" className="text-[10px] fill-text-muted font-medium">Total</text>
        <text x="50" y="60" textAnchor="middle" className="text-[11px] fill-text-primary font-bold">{formatCurrency(total)}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-text-secondary flex-1">{seg.plan}</span>
            <span className="font-mono font-medium text-text-primary">{seg.pct.toFixed(1)}%</span>
            <span className="font-mono text-text-muted">{formatCurrency(seg.mrr)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Invoice Mini Card ─── */
export function InvoiceMiniCard({ invoice }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
          <span className="text-xs font-mono font-bold text-secondary">{invoice.id.split('-').pop()}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{invoice.tenantName}</p>
          <p className="text-[10px] text-text-muted">{invoice.id} · {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-medium text-text-primary">{formatCurrency(invoice.amount)}</p>
        <InvoiceStatusBadge status={invoice.status} />
      </div>
    </div>
  );
}

/* ─── Subscription Mini Card ─── */
export function SubscriptionMiniCard({ subscription }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
          <span className="text-xs font-bold text-secondary">{subscription.plan[0]}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{subscription.tenantName}</p>
          <p className="text-[10px] text-text-muted">{subscription.plan} · {subscription.billingCycle} · {subscription.seats} seats</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono font-medium text-text-primary">{formatCurrency(subscription.amount)}</p>
        <SubscriptionStatusBadge status={subscription.status} />
      </div>
    </div>
  );
}

/* ─── Dunning Timeline ─── */
export function DunningTimeline({ actions }) {
  return (
    <div className="space-y-0">
      {actions.map((action, i) => (
        <div key={i} className="relative flex gap-3 pb-4">
          {i < actions.length - 1 && (
            <div className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />
          )}
          <div className={cn(
            'mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 border-2',
            action.status === 'success' ? 'bg-accent border-accent' :
            action.status === 'failed' ? 'bg-danger border-danger' :
            action.status === 'sent' ? 'bg-info border-info' :
            action.status === 'cancelled' ? 'bg-text-muted border-text-muted' :
            'bg-warning border-warning'
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary">{action.action}</p>
            {action.reason && (
              <p className="text-[10px] text-danger">{failureReasonMeta[action.reason] || action.reason}</p>
            )}
            <p className="text-[10px] text-text-muted">{new Date(action.date).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Proration Calculator Display ─── */
export function ProrationDisplay({ calculation }) {
  if (!calculation) return null;
  const { prorationAmount, newTotalMonthly, daysRemaining, creditApplied } = calculation;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Proration Calculation</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-text-muted">Days Remaining</p>
          <p className="font-mono font-medium text-text-primary">{daysRemaining}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">New Monthly Total</p>
          <p className="font-mono font-medium text-text-primary">{formatCurrency(newTotalMonthly)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Proration Charge</p>
          <p className={cn('font-mono font-medium', prorationAmount >= 0 ? 'text-danger' : 'text-accent')}>
            {prorationAmount >= 0 ? '+' : ''}{formatCurrency(prorationAmount)}
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
