import { Link } from 'react-router-dom';
import { HeartHandshake, Users, Wallet, CalendarClock, ArrowRight } from 'lucide-react';
import { useCrmOverview } from '../../../hooks/useCrm';
import { VipBadge, RfmBadge, fmtMoney } from '../crm/components';

export default function CrmPulse() {
  const { data, isLoading, isError } = useCrmOverview({ refetchInterval: 30_000 });

  if (isLoading || isError || !data) return null;

  const { totals, topGuests, followUpsDue, vipBreakdown } = data;

  const stats = [
    { icon: Users, label: 'CRM guests', value: totals.guests },
    { icon: HeartHandshake, label: 'With stay history', value: totals.guestsWithStays },
    { icon: Wallet, label: 'Lifetime spend', value: fmtMoney(totals.totalSpend) },
    { icon: CalendarClock, label: 'Follow-ups due', value: followUpsDue.length },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <HeartHandshake className="h-4 w-4 text-secondary" />
          Guest pulse
          <span className="text-xs font-normal text-text-muted">· refreshes every 30s</span>
        </h3>
        <Link
          to="/app/crm"
          className="flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Open CRM <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border md:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface px-5 py-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide">{label}</span>
            </div>
            <div className="mt-1 text-lg font-bold text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-xs text-text-secondary">
        <span className="text-text-muted">VIP mix:</span>
        {Object.entries(vipBreakdown)
          .filter(([k]) => k !== 'none')
          .map(([tier, count]) => (
            <span key={tier} className="flex items-center gap-1.5">
              <VipBadge tier={tier} />
              <strong className="font-semibold text-text-primary">{count}</strong>
            </span>
          ))}
        {Object.keys(vipBreakdown).filter((k) => k !== 'none').length === 0 && (
          <span>No VIP tiers assigned yet</span>
        )}
      </div>

      {topGuests.length > 0 && (
        <div className="border-t border-border px-5 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Top guests by lifetime spend
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            {topGuests.slice(0, 3).map((g) => (
              <Link
                key={g.id}
                to={`/app/crm/guests/${g.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-text-primary">{g.name}</span>
                    <VipBadge tier={g.vipStatus} />
                  </div>
                  <RfmBadge score={g.rfm.score} />
                </div>
                <span className="shrink-0 text-sm font-semibold text-text-primary">
                  {fmtMoney(g.rfm.spend)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
