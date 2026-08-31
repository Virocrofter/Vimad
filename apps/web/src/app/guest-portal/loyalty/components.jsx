/* src/app/guest-portal/loyalty/components.jsx */
import { cn } from '../../../lib/utils';

/* ─── Tier Badge ─── */
export function TierBadge({ tier }) {
  const meta = {
    bronze: { label: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-700/10', border: 'border-amber-700/20' },
    silver: { label: 'Silver', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
    gold: { label: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    platinum: { label: 'Platinum', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  }[tier] || meta.bronze;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
      meta.bg, meta.color, meta.border
    )}>
      <span className={cn('h-2 w-2 rounded-full', meta.color.replace('text-', 'bg-'))} />
      {meta.label} Member
    </span>
  );
}

/* ─── Points Display ─── */
export function PointsDisplay({ points, toNextTier, tier }) {
  const meta = {
    bronze: { color: 'text-amber-700', bg: 'bg-amber-700' },
    silver: { color: 'text-slate-400', bg: 'bg-slate-400' },
    gold: { color: 'text-yellow-500', bg: 'bg-yellow-500' },
    platinum: { color: 'text-purple-500', bg: 'bg-purple-500' },
  }[tier] || { color: 'text-secondary', bg: 'bg-secondary' };

  const percent = toNextTier > 0
    ? Math.min(100, Math.round((points / (points + toNextTier)) * 100))
    : 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">Points Balance</span>
        {toNextTier > 0 && (
          <span className="text-[10px] text-text-muted">{toNextTier.toLocaleString()} to next tier</span>
        )}
      </div>
      <p className={cn('text-3xl font-bold font-mono', meta.color)}>
        {points.toLocaleString()}
      </p>
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', meta.bg)}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Reward Card ─── */
export function RewardCard({ reward, canAfford, onRedeem, isRedeeming, isRedeemed }) {
  const categoryIcons = {
    stay: '🏨',
    dining: '🍽️',
    wellness: '💆',
    services: '🚗',
  };

  return (
    <div className={cn(
      'rounded-xl border bg-surface p-4 transition-all',
      isRedeemed ? 'border-accent/30 bg-accent/5' :
      canAfford ? 'border-border hover:shadow-md' :
      'border-border opacity-50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-lg">
          {categoryIcons[reward.category] || '🎁'}
        </div>
        <div className="text-right">
          <p className={cn(
            'text-lg font-bold font-mono',
            canAfford ? 'text-secondary' : 'text-text-muted'
          )}>
            {reward.pointsCost.toLocaleString()}
          </p>
          <p className="text-[10px] text-text-muted">pts</p>
        </div>
      </div>
      <h4 className="mt-3 text-sm font-semibold text-text-primary">{reward.name}</h4>
      <p className="mt-1 text-xs text-text-secondary">{reward.description}</p>
      <div className="mt-3">
        {isRedeemed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            ✓ Redeemed
          </span>
        ) : canAfford ? (
          <button
            onClick={onRedeem}
            disabled={isRedeeming}
            className="w-full rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {isRedeeming ? 'Processing...' : 'Redeem'}
          </button>
        ) : (
          <span className="text-xs text-text-muted">
            Need {(reward.pointsCost - points).toLocaleString()} more pts
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Points Transaction Row ─── */
export function PointsTransactionRow({ transaction }) {
  const isEarned = transaction.type === 'earned';

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-background/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          isEarned ? 'bg-accent/10' : 'bg-danger/10'
        )}>
          <span className={cn('text-xs font-bold', isEarned ? 'text-accent' : 'text-danger')}>
            {isEarned ? '+' : '−'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{transaction.description}</p>
          <p className="text-[10px] text-text-muted">{transaction.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          'text-sm font-mono font-medium',
          isEarned ? 'text-accent' : 'text-danger'
        )}>
          {isEarned ? '+' : ''}{transaction.points.toLocaleString()}
        </p>
        <p className="text-[10px] text-text-muted font-mono">
          Bal: {transaction.balance.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
