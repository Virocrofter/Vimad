import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const fmtMoney = (n) =>
  `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const VIP_COLORS = {
  bronze: 'bg-amber-700/15 text-amber-700',
  silver: 'bg-slate-400/15 text-slate-500',
  gold: 'bg-yellow-500/15 text-yellow-700',
  platinum: 'bg-violet-500/15 text-violet-700',
  diamond: 'bg-cyan-500/15 text-cyan-700',
};

export function VipBadge({ tier }) {
  if (!tier) return null;
  return <Badge className={VIP_COLORS[tier] ?? 'bg-muted'}>{tier}</Badge>;
}

export function RfmBadge({ score }) {
  const label = ['No stays', 'Dormant', 'At risk', 'Cooling', 'Active', 'Champion'][score] ?? '—';
  const color =
    score >= 4
      ? 'bg-emerald-500/15 text-emerald-700'
      : score === 3
        ? 'bg-blue-500/15 text-blue-700'
        : score >= 1
          ? 'bg-orange-500/15 text-orange-700'
          : 'bg-muted text-muted-foreground';
  return (
    <Badge className={color}>
      RFM {score} · {label}
    </Badge>
  );
}

export const TIMELINE_KIND = {
  reservation: { label: 'Reservation', dot: 'bg-blue-500' },
  payment: { label: 'Payment', dot: 'bg-emerald-500' },
  note: { label: 'Note', dot: 'bg-amber-500' },
  follow_up: { label: 'Follow-up', dot: 'bg-violet-500' },
  email: { label: 'Email', dot: 'bg-slate-400' },
};

export function SectionCard({ title, action, children, className = '' }) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
