import { useMemo } from 'react';
import { Award, Star, TrendingUp, Gift, Calendar } from 'lucide-react';

export default function LoyaltyPage() {
  // Mock data - in real app this would come from API
  const guestStay = {
    id: 'stay-1',
    propertyName: 'Grand Hotel',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    dates: { nights: 4 },
  };

  const pastStays = useMemo(
    () => [{ id: 'stay-0', propertyName: 'Grand Hotel', dates: { nights: 2 } }],
    []
  );

  const pointsHistory = useMemo(
    () => [
      { id: 'txn-1', type: 'earned', points: 400, description: 'Room charges', date: '2026-09-05' },
      { id: 'txn-2', type: 'earned', points: 150, description: 'Dining', date: '2026-09-03' },
      {
        id: 'txn-3',
        type: 'redeemed',
        points: -200,
        description: 'Spa credit',
        date: '2026-09-04',
      },
    ],
    []
  );

  // Stats
  const totalPointsEarned = useMemo(
    () => pointsHistory.filter((t) => t.type === 'earned').reduce((s, t) => s + t.points, 0),
    [pointsHistory]
  );

  const totalNights = useMemo(
    () => pastStays.reduce((s, st) => s + st.dates.nights, 0) + guestStay.dates.nights,
    [pastStays, guestStay.dates.nights]
  );

  const currentTier =
    totalPointsEarned > 1000 ? 'Gold' : totalPointsEarned > 500 ? 'Silver' : 'Bronze';
  const nextTierThreshold = currentTier === 'Bronze' ? 500 : currentTier === 'Silver' ? 1000 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Loyalty Program</h1>
          <p className="text-text-secondary mt-1">Track your points and rewards</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg">
          <Award className="h-5 w-5" />
          <span className="font-medium">{currentTier} Member</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <Star className="h-4 w-4" />
            Total Points
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {totalPointsEarned.toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-1">Lifetime earned</p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <Calendar className="h-4 w-4" />
            Total Nights
          </div>
          <p className="text-3xl font-bold text-text-primary">{totalNights}</p>
          <p className="text-sm text-text-secondary mt-1">Across all stays</p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <TrendingUp className="h-4 w-4" />
            Next Tier
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {nextTierThreshold
              ? `${Math.max(0, nextTierThreshold - totalPointsEarned)} pts`
              : 'Max'}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {nextTierThreshold
              ? `to ${currentTier === 'Bronze' ? 'Silver' : 'Gold'}`
              : 'Tier achieved'}
          </p>
        </div>
      </div>

      {/* Points History */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Points History</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pointsHistory.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-4 py-3 text-sm text-text-secondary">{txn.date}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">{txn.description}</td>
                  <td
                    className={`px-4 py-3 text-sm text-right font-medium ${txn.points > 0 ? 'text-accent' : 'text-danger'}`}
                  >
                    {txn.points > 0 ? '+' : ''}
                    {txn.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rewards */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Available Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Free Night', points: 1000, icon: Calendar },
            { name: 'Room Upgrade', points: 500, icon: Star },
            { name: 'Spa Credit', points: 300, icon: Gift },
          ].map((reward) => (
            <div key={reward.name} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <reward.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{reward.name}</p>
                  <p className="text-sm text-text-secondary">{reward.points} points</p>
                </div>
              </div>
              <button
                className="w-full px-4 py-2 border border-border rounded-lg hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={totalPointsEarned < reward.points}
              >
                {totalPointsEarned >= reward.points ? 'Redeem' : 'Not enough points'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
