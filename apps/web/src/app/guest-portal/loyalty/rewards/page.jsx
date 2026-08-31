/* src/app/guest-portal/loyalty/rewards/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gift, Search, Filter, CheckCircle2, AlertCircle,
  Star, Crown, Sparkles, Hotel, UtensilsCrossed, Heart,
  Car, Clock, Wine, Coffee, Dumbbell, ArrowRight, Minus
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestProfile, rewardsCatalog, formatPoints } from '../../data';

const categoryIcons = {
  stay: Hotel,
  dining: UtensilsCrossed,
  wellness: Heart,
  services: Car,
};

const categoryLabels = {
  stay: 'Stays',
  dining: 'Dining',
  wellness: 'Wellness',
  services: 'Services',
};

export default function RewardsPage() {
  const navigate = useNavigate();
  const { points, tier } = guestProfile;
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [redeeming, setRedeeming] = useState(null);
  const [redeemed, setRedeemed] = useState([]);
  const [showConfirm, setShowConfirm] = useState(null);

  const filteredRewards = rewardsCatalog.filter(r => {
    const matchesQuery = !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const canAfford = (cost) => points >= cost;

  const handleRedeem = async (reward) => {
    setShowConfirm(null);
    setRedeeming(reward.id);
    await new Promise(r => setTimeout(r, 1500));
    setRedeeming(null);
    setRedeemed(prev => [...prev, reward.id]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/loyalty')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Rewards Catalog</h1>
          <p className="text-sm text-text-secondary">Redeem your points for exclusive perks</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-secondary">{formatPoints(points)}</p>
          <p className="text-xs text-text-muted">Available Points</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search rewards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['all', 'stay', 'dining', 'wellness', 'services'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-secondary text-white'
                  : 'border border-border bg-surface text-text-secondary hover:bg-surface-elevated'
              )}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => {
          const affordable = canAfford(reward.pointsCost);
          const isRedeemed = redeemed.includes(reward.id);
          const Icon = categoryIcons[reward.category] || Gift;

          return (
            <div
              key={reward.id}
              className={cn(
                'rounded-xl border bg-surface p-5 transition-all',
                isRedeemed ? 'border-accent/30 bg-accent/5' :
                affordable ? 'border-border hover:shadow-md hover:border-secondary/30' :
                'border-border opacity-60'
              )}
            >
              {/* Image / Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-2xl">
                  {reward.image}
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-lg font-bold font-mono',
                    affordable ? 'text-secondary' : 'text-text-muted'
                  )}>
                    {formatPoints(reward.pointsCost)}
                  </p>
                  <p className="text-[10px] text-text-muted">points</p>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-text-primary">{reward.name}</h3>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">{reward.description}</p>

              {/* Category */}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                  <Icon className="h-3 w-3" />
                  {categoryLabels[reward.category]}
                </span>
                {isRedeemed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    <CheckCircle2 className="h-3 w-3" /> Redeemed
                  </span>
                )}
              </div>

              {/* Action */}
              <div className="mt-4">
                {isRedeemed ? (
                  <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 p-2.5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium text-accent">Added to your account</span>
                  </div>
                ) : affordable ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setShowConfirm(reward)}
                    disabled={redeeming === reward.id}
                  >
                    {redeeming === reward.id ? (
                      <><Sparkles className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <><Gift className="mr-1.5 h-3.5 w-3.5" /> Redeem {formatPoints(reward.pointsCost)} pts</>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-border/50 p-2.5">
                    <AlertCircle className="h-4 w-4 text-text-muted" />
                    <span className="text-xs text-text-muted">
                      Need {formatPoints(reward.pointsCost - points)} more points
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRewards.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Gift className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No rewards match your search.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background shadow-2xl p-6">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mx-auto">
                <Gift className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-text-primary">Redeem Reward?</h3>
              <p className="mt-1 text-sm text-text-secondary">
                {showConfirm.name}
              </p>
              <div className="mt-4 rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Cost</span>
                  <span className="font-bold font-mono text-secondary">{formatPoints(showConfirm.pointsCost)} pts</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-text-muted">Balance after</span>
                  <span className="font-mono text-text-primary">{formatPoints(points - showConfirm.pointsCost)} pts</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => handleRedeem(showConfirm)}>
                  <Gift className="mr-1.5 h-4 w-4" /> Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
