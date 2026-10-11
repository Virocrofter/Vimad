/* src/app/app/loyalty/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  Crown,
  Star,
  Gem,
  Award,
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowUpDown,
  LayoutGrid,
  List,
  ChevronRight,
  MoreHorizontal,
  BarChart3,
  X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { tierMeta } from './data';
import { useLoyaltyMembers, useLoyaltyTransactions } from '../../../hooks/useloyalty';
import { TierBadge, StatCard, TierProgressBar } from './components';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { LTVPredictiveModal } from './LTVPredictiveModal';

/* ─── Helpers ─── */
function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/* ─── Main Page ─── */
export default function LoyaltyPage() {
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('points');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPredictive, setShowPredictive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* Real data */
  const { data: membersResp, isLoading } = useLoyaltyMembers({ page: 1, pageSize: 500 });
  const { data: txResp } = useLoyaltyTransactions({ page: 1, pageSize: 6 });
  const members = useMemo(() => membersResp?.data ?? [], [membersResp]);
  const transactions = useMemo(() => txResp?.data ?? [], [txResp]);

  /* Stats */
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalPoints = members.reduce((s, m) => s + m.points, 0);
    const totalLTV = members.reduce((s, m) => s + m.lifetimeValue, 0);
    const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
    const redemptions = transactions.filter((t) => t.type === 'redemption').length;
    return { totalMembers, totalPoints, totalLTV, avgPoints, redemptions };
  }, [members, transactions]);

  /* Tier distribution */
  const tierDistribution = useMemo(() => {
    const dist = { platinum: 0, gold: 0, silver: 0, bronze: 0, none: 0 };
    members.forEach((m) => {
      dist[m.tier] = (dist[m.tier] || 0) + 1;
    });
    return dist;
  }, [members]);

  /* Filtered & sorted members */
  const filteredMembers = useMemo(() => {
    let result = members.filter((m) => {
      const matchesQuery =
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase()) ||
        m.phone.includes(query) ||
        m.id.toLowerCase().includes(query.toLowerCase());
      const matchesTier = tierFilter === 'all' || m.tier === tierFilter;
      return matchesQuery && matchesTier;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'ltv') return b.lifetimeValue - a.lifetimeValue;
      if (sortBy === 'stays') return b.totalStays - a.totalStays;
      if (sortBy === 'recent') return new Date(b.lastStay) - new Date(a.lastStay);
      return 0;
    });

    return result;
  }, [members, query, tierFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Loyalty & Rewards</h1>
          <p className="text-sm text-text-secondary">
            Membership tiers, points balance, and guest retention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPredictive(true)}>
            <BarChart3 className="mr-1.5 h-4 w-4" /> Predictive LTV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Enroll Member
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-muted">
          Loading loyalty data…
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="text-secondary"
        />
        <StatCard
          label="Points in Circulation"
          value={formatNumber(stats.totalPoints)}
          icon={Zap}
          color="text-accent"
        />
        <StatCard
          label="Avg. Member LTV"
          value={`$${formatNumber(stats.totalMembers > 0 ? stats.totalLTV / stats.totalMembers : 0)}`}
          icon={DollarSign}
          color="text-info"
        />
        <StatCard
          label="Redemptions"
          value={stats.redemptions}
          icon={TrendingUp}
          color="text-warning"
          subtext="This month"
        />
      </div>

      {/* Tier Distribution Bar */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Tier Distribution</h3>
          <span className="text-xs text-text-muted">{stats.totalMembers} enrolled</span>
        </div>
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          {Object.entries(tierDistribution).map(([tier, count]) => {
            if (count === 0) return null;
            const meta = tierMeta[tier];
            if (!meta) return null;
            const pct = (count / stats.totalMembers) * 100;
            return (
              <div
                key={tier}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', meta.dot)}
                style={{ width: `${pct}%` }}
                title={`${meta.label}: ${count}`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {Object.entries(tierDistribution).map(([tier, count]) => {
            if (count === 0) return null;
            const meta = tierMeta[tier];
            if (!meta) return null;
            return (
              <div key={tier} className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
                <span className="text-xs text-text-secondary">{meta.label}</span>
                <span className="text-xs font-mono font-medium text-text-primary">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search members by name, email, ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="points">Sort by Points</option>
            <option value="ltv">Sort by LTV</option>
            <option value="stays">Sort by Stays</option>
            <option value="recent">Sort by Recent</option>
            <option value="name">Sort by Name</option>
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'table'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Loyalty Tier</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTierFilter('all');
                setQuery('');
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredMembers.length}</span> of{' '}
        {members.length} members
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => {
            const nextTier = Object.entries(tierMeta).find(([_, m]) => m.req > member.points);
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group rounded-xl border border-border bg-surface p-5 text-left transition-all hover:border-secondary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                    {member.avatar}
                  </div>
                  <TierBadge tier={member.tier} size="sm" />
                </div>

                <h3 className="mt-3 text-base font-semibold text-text-primary group-hover:text-secondary transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs text-text-muted">{member.id}</p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Zap className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-mono font-medium text-text-primary">
                      {member.points.toLocaleString()}
                    </span>{' '}
                    pts
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-mono font-medium text-text-primary">
                      ${member.lifetimeValue.toLocaleString()}
                    </span>{' '}
                    LTV
                  </div>
                </div>

                {nextTier && (
                  <div className="mt-4">
                    <TierProgressBar
                      current={member.points}
                      nextTierReq={nextTier[1].req}
                      tier={member.tier}
                    />
                    <p className="mt-1 text-[10px] text-text-muted">
                      {(nextTier[1].req - member.points).toLocaleString()} pts to{' '}
                      {nextTier[1].label}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Stays</p>
                    <p className="text-sm font-bold text-text-primary">{member.totalStays}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Nights</p>
                    <p className="text-sm font-bold text-text-primary">{member.totalNights}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredMembers.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No members match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Tier</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Points</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">LTV</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Stays</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Stay</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Progress</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => {
                  const nextTier = Object.entries(tierMeta).find(([_, m]) => m.req > member.points);
                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="hover:bg-background/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{member.name}</p>
                            <p className="text-xs text-text-muted">{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={member.tier} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {member.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        ${member.lifetimeValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {member.totalStays}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{member.lastStay}</td>
                      <td className="px-4 py-3">
                        {nextTier ? (
                          <div className="w-24">
                            <TierProgressBar
                              current={member.points}
                              nextTierReq={nextTier[1].req}
                              tier={member.tier}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-accent font-medium">Max Tier</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                      No members match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Points Activity */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Recent Points Activity</h3>
          <Button variant="ghost" size="sm">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" /> View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-text-secondary text-xs font-mono">{tx.date}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{tx.memberName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                        tx.type === 'accrual'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : tx.type === 'bonus'
                            ? 'bg-secondary/10 text-secondary border-secondary/20'
                            : 'bg-danger/10 text-danger border-danger/20'
                      )}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-mono font-medium',
                      tx.type === 'redemption' ? 'text-danger' : 'text-accent'
                    )}
                  >
                    {tx.type === 'redemption' ? '' : '+'}
                    {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    No points activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Drawer */}
      {selectedMember && (
        <MemberDetailDrawer
          member={selectedMember}
          transactions={transactions}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Predictive LTV Modal */}
      {showPredictive && (
        <LTVPredictiveModal members={members} onClose={() => setShowPredictive(false)} />
      )}
    </div>
  );
}
