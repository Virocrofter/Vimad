/* src/app/guest-portal/loyalty/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Star, Gift, TrendingUp, ArrowRight, Zap, Coffee,
  Car, Wifi, Wine, DoorOpen, UtensilsCrossed, Dumbbell,
  CheckCircle2, Lock, ChevronRight, Sparkles, Trophy,
  Calendar, MapPin
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  guestProfile, guestStay, tierBenefits, pastStays, pointsHistory,
  formatPoints, formatCurrency, getTierProgress
} from '../data';

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const { tier, points, pointsToNextTier, memberSince } = guestProfile;
  const progress = getTierProgress(tier, points);
  const tierMeta = tierBenefits[tier];

  // Stats
  const totalPointsEarned = useMemo(() =>
    pointsHistory.filter(t => t.type === 'earned').reduce((s, t) => s + t.points, 0),
  []);
  const totalNights = useMemo(() =>
    pastStays.reduce((s, st) => s + st.dates.nights, 0) + guestStay.dates.nights,
  []);
  const totalStays = pastStays.length + 1;

  // All tiers for comparison
  const allTiers = ['bronze', 'silver', 'gold', 'platinum'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Loyalty Program</h1>
        <p className="text-sm text-text-secondary">Your points, tier status, and exclusive benefits</p>
      </div>

      {/* Tier Card */}
      <div className={cn(
        'rounded-xl border p-6 relative overflow-hidden',
        tier === 'bronze' ? 'border-amber-700/30 bg-amber-700/5' :
        tier === 'silver' ? 'border-slate-400/30 bg-slate-400/5' :
        tier === 'gold' ? 'border-yellow-500/30 bg-yellow-500/5' :
        'border-purple-500/30 bg-purple-500/5'
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10"
          style={{
            background: tier === 'gold' ? 'radial-gradient(circle, #facc15 0%, transparent 70%)' :
                       tier === 'platinum' ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)' :
                       'radial-gradient(circle, #863bff 0%, transparent 70%)'
          }}
        />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl',
                tierMeta.bg
              )}>
                <Crown className={cn('h-8 w-8', tierMeta.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={cn('text-2xl font-bold', tierMeta.color)}>
                    {tierMeta.label}
                  </h2>
                  <span className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-mono text-text-muted">
                    Since {memberSince}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {formatPoints(points)} points · {tierMeta.pointsMultiplier}x multiplier
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-text-primary">{formatPoints(points)}</p>
              <p className="text-xs text-text-muted">Available Points</p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {progress.nextTier && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">
                  {formatPoints(progress.pointsNeeded)} points to {tierBenefits[progress.nextTier].label}
                </span>
                <span className="text-xs font-mono text-text-muted">{progress.percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-border overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    tier === 'bronze' ? 'bg-amber-700' :
                    tier === 'silver' ? 'bg-slate-400' :
                    tier === 'gold' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  )}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                <span>{tierMeta.label}</span>
                <span>{tierBenefits[progress.nextTier].label}</span>
              </div>
            </div>
          )}

          {progress.nextTier === null && (
            <div className="mt-4 rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">You've reached the highest tier! Enjoy Platinum benefits.</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{totalStays}</p>
          <p className="text-xs text-text-muted">Total Stays</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{totalNights}</p>
          <p className="text-xs text-text-muted">Nights Booked</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-secondary">{formatPoints(totalPointsEarned)}</p>
          <p className="text-xs text-text-muted">Lifetime Points</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-accent">{tierMeta.pointsMultiplier}x</p>
          <p className="text-xs text-text-muted">Point Multiplier</p>
        </div>
      </div>

      {/* Current Benefits */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-secondary" /> Your {tierMeta.label} Benefits
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tierMeta.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <span className="text-sm text-text-primary">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Comparison */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" /> Tier Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Benefit</th>
                {allTiers.map(t => (
                  <th key={t} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                      tierBenefits[t].bg, tierBenefits[t].color
                    )}>
                      <Crown className="h-3 w-3" />
                      {tierBenefits[t].label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: 'Free Wi-Fi', key: 'wifi', tiers: ['bronze', 'silver', 'gold', 'platinum'] },
                { label: 'Late Checkout (12pm)', key: 'late', tiers: ['bronze', 'silver', 'gold', 'platinum'] },
                { label: 'Member Rates', key: 'rates', tiers: ['bronze', 'silver', 'gold', 'platinum'] },
                { label: 'Room Upgrade (Subject)', key: 'upgrade', tiers: ['', 'silver', 'gold', 'platinum'] },
                { label: 'Welcome Drink', key: 'drink', tiers: ['', 'silver', 'gold', 'platinum'] },
                { label: 'Guaranteed Upgrade', key: 'guaranteed', tiers: ['', '', 'gold', 'platinum'] },
                { label: 'Free Breakfast', key: 'breakfast', tiers: ['', '', 'gold', 'platinum'] },
                { label: 'Early Check-in', key: 'early', tiers: ['', '', 'gold', 'platinum'] },
                { label: 'Suite Upgrade', key: 'suite', tiers: ['', '', '', 'platinum'] },
                { label: 'Executive Lounge', key: 'lounge', tiers: ['', '', '', 'platinum'] },
                { label: 'Free Parking', key: 'parking', tiers: ['', '', '', 'platinum'] },
                { label: 'Spa Credit', key: 'spa', tiers: ['', '', '', 'platinum'] },
              ].map(row => (
                <tr key={row.key} className={cn(
                  'hover:bg-background/50',
                  row.tiers.includes(tier) && 'bg-accent/5'
                )}>
                  <td className="px-4 py-3 text-sm text-text-primary">{row.label}</td>
                  {allTiers.map(t => (
                    <td key={t} className="px-4 py-3 text-center">
                      {row.tiers.includes(t) ? (
                        <CheckCircle2 className={cn(
                          'h-4 w-4 mx-auto',
                          t === tier ? 'text-accent' : 'text-text-muted'
                        )} />
                      ) : (
                        <Lock className="h-4 w-4 mx-auto text-border" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate('/guest-portal/loyalty/rewards')}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Gift className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Redeem Rewards</p>
            <p className="text-xs text-text-muted">Browse catalog and redeem points</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted" />
        </button>
        <button
          onClick={() => navigate('/guest-portal/loyalty/history')}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Points History</p>
            <p className="text-xs text-text-muted">View earning and spending activity</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
}
