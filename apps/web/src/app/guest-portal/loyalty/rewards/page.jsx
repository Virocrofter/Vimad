/* src/app/guest-portal/loyalty/rewards/page.jsx — G3: real rewards catalog + redeem */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Loader2, AlertTriangle, CheckCircle2, Award } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import {
  useGuestLoyalty,
  useGuestLoyaltyRewards,
  useLoyaltyRedeem,
} from '../../../../hooks/useGuestLoyalty';

function newKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `gr-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function LoyaltyRewardsPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: loyalty, isLoading: loyaltyLoading, isError: loyaltyError } = useGuestLoyalty();
  const {
    data: rewardsData,
    isLoading: rewardsLoading,
    isError: rewardsError,
    refetch,
  } = useGuestLoyaltyRewards();
  const redeem = useLoyaltyRedeem();

  const [feedback, setFeedback] = useState(null); // { ok, text }
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (loyaltyLoading || rewardsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading rewards…</p>
      </div>
    );
  }

  if (loyaltyError || rewardsError || !loyalty || !rewardsData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load the rewards catalog.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const balance = loyalty.balance;
  const rewards = rewardsData.rewards ?? [];

  const handleRedeem = (reward) => {
    setFeedback(null);
    redeem.mutate(
      { rewardId: reward.id, idempotencyKey: newKey() },
      {
        onSuccess: (d) => {
          setFeedback({
            ok: true,
            text: `"${d.rewardName}" redeemed for ${d.pointsCost} points — the team will arrange it. New balance: ${d.newBalance}.`,
          });
          setConfirmingId(null);
        },
        onError: (e) => {
          setFeedback({ ok: false, text: e.message });
          setConfirmingId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/loyalty')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Rewards</h1>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Award className="h-3 w-3" /> {balance} points available
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            feedback.ok ? 'border-accent/20 bg-accent/5' : 'border-danger/20 bg-danger/5'
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          )}
          <p className="text-sm text-text-primary">{feedback.text}</p>
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <Gift className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            No rewards available right now — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r) => {
            const affordable = balance >= r.pointsCost;
            const confirming = confirmingId === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                  <span className="text-sm font-mono font-medium text-secondary shrink-0">
                    {r.pointsCost} pts
                  </span>
                </div>
                {r.description && <p className="text-xs text-text-muted">{r.description}</p>}
                <div className="flex items-center gap-2 pt-1">
                  {confirming ? (
                    <>
                      <Button size="sm" onClick={() => handleRedeem(r)} disabled={redeem.isPending}>
                        {redeem.isPending ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Confirm {r.pointsCost} pts
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant={affordable ? 'default' : 'outline'}
                      disabled={!affordable}
                      onClick={() => setConfirmingId(r.id)}
                    >
                      <Gift className="mr-1 h-3.5 w-3.5" />
                      {affordable ? 'Redeem' : `Need ${r.pointsCost - balance} more pts`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
