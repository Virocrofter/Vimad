/* src/app/guest-portal/loyalty/page.jsx — G3: real loyalty summary */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Gift, History, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { getGuestToken } from '../../../hooks/guestPortalApi';
import { useGuestLoyalty, useGuestLoyaltyTransactions } from '../../../hooks/useGuestLoyalty';
import { formatDate } from '../../../lib/guest-utils';

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useGuestLoyalty();
  const { data: txData } = useGuestLoyaltyTransactions();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your loyalty account…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your loyalty account.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const recent = (txData?.transactions ?? []).slice(0, 5);
  const progressPct =
    data.nextTier && data.nextTier.minPoints > data.tier.minPoints
      ? Math.min(
          100,
          Math.round(
            ((data.balance - data.tier.minPoints) /
              (data.nextTier.minPoints - data.tier.minPoints)) *
              100
          )
        )
      : 100;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Loyalty</h1>
          <p className="text-xs text-text-muted">Member since {formatDate(data.memberSince)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-secondary/10 to-accent/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted mb-1">Points balance</p>
            <p className="text-3xl font-bold font-mono text-text-primary">{data.balance}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 border border-secondary/30 px-3 py-1 text-xs font-semibold text-secondary">
            <Award className="h-3.5 w-3.5" /> {data.tier.name}
          </span>
        </div>

        {data.nextTier ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
              <span>{data.tier.name}</span>
              <span>
                {data.pointsToNext} pts to {data.nextTier.name}
              </span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-accent flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> You've reached our highest tier — enjoy the
            perks.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Earn rate</p>
          <p className="text-lg font-bold font-mono text-text-primary">{data.earnRate} pt / R1</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Point value</p>
          <p className="text-lg font-bold font-mono text-text-primary">
            R{data.redeemValue.toFixed(2)} / pt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => navigate('/guest-portal/loyalty/rewards')}>
          <Gift className="mr-2 h-4 w-4" /> Redeem rewards
        </Button>
        <Button variant="outline" onClick={() => navigate('/guest-portal/loyalty/history')}>
          <History className="mr-2 h-4 w-4" /> Points history
        </Button>
      </div>

      {recent.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{t.description}</p>
                  <p className="text-[10px] text-text-muted">
                    {formatDate(t.createdAt)} · {t.source}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-mono font-medium shrink-0',
                    t.type === 'redemption' ? 'text-danger' : 'text-accent'
                  )}
                >
                  {t.type === 'redemption' ? '-' : '+'}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
