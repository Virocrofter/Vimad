/* src/app/guest-portal/loyalty/history/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar, Filter,
  Hotel, Gift, Star, ArrowUpRight, ArrowDownRight, Minus,
  Search, Download, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestProfile, pointsHistory, formatPoints, formatDate } from '../../data';

export default function LoyaltyHistoryPage() {
  const navigate = useNavigate();
  const { points } = guestProfile;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const filteredHistory = useMemo(() => {
    return pointsHistory.filter(t => {
      const matchesQuery = !query ||
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      
      let matchesTime = true;
      const txnDate = new Date(t.date);
      const now = new Date('2026-08-17');
      if (timeFilter === '7d') matchesTime = (now - txnDate) <= 7 * 24 * 60 * 60 * 1000;
      if (timeFilter === '30d') matchesTime = (now - txnDate) <= 30 * 24 * 60 * 60 * 1000;
      if (timeFilter === '90d') matchesTime = (now - txnDate) <= 90 * 24 * 60 * 60 * 1000;
      if (timeFilter === '2026') matchesTime = txnDate.getFullYear() === 2026;
      if (timeFilter === '2025') matchesTime = txnDate.getFullYear() === 2025;
      
      return matchesQuery && matchesType && matchesTime;
    });
  }, [query, typeFilter, timeFilter]);

  // Stats
  const earnedTotal = useMemo(() =>
    filteredHistory.filter(t => t.type === 'earned').reduce((s, t) => s + t.points, 0),
  [filteredHistory]);
  const redeemedTotal = useMemo(() =>
    Math.abs(filteredHistory.filter(t => t.type === 'redeemed').reduce((s, t) => s + t.points, 0)),
  [filteredHistory]);

  const handleExport = () => {
    const csv = [
      'Date,Type,Description,Points,Balance',
      ...filteredHistory.map(t => `${t.date},${t.type},"${t.description}",${t.points},${t.balance}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vimad-points-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/guest-portal/loyalty')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Points History</h1>
            <p className="text-sm text-text-secondary">Track your earning and redemption activity</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-secondary">{formatPoints(points)}</p>
          <p className="text-xs text-text-muted">Current Balance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Earned</p>
              <p className="text-lg font-bold font-mono text-accent">+{formatPoints(earnedTotal)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10">
              <ArrowDownRight className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Redeemed</p>
              <p className="text-lg font-bold font-mono text-danger">-{formatPoints(redeemedTotal)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
              <Star className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Net</p>
              <p className="text-lg font-bold font-mono text-text-primary">+{formatPoints(earnedTotal - redeemedTotal)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
              <Calendar className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Transactions</p>
              <p className="text-lg font-bold font-mono text-text-primary">{filteredHistory.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="earned">Earned</option>
            <option value="redeemed">Redeemed</option>
          </select>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredHistory.length}</span> of {pointsHistory.length} transactions
      </p>

      {/* History Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Points</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredHistory.map((txn) => (
                <tr key={txn.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-primary">{formatDate(txn.date)}</p>
                    <p className="text-[10px] text-text-muted font-mono">{txn.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                        txn.type === 'earned' ? 'bg-accent/10' : 'bg-danger/10'
                      )}>
                        {txn.type === 'earned' ? (
                          <TrendingUp className="h-3 w-3 text-accent" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-danger" />
                        )}
                      </div>
                      <span className="text-sm text-text-primary">{txn.description}</span>
                    </div>
                    {txn.stayId && (
                      <p className="text-[10px] text-text-muted ml-8">Stay: {txn.stayId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'font-mono font-medium',
                      txn.type === 'earned' ? 'text-accent' : 'text-danger'
                    )}>
                      {txn.type === 'earned' ? '+' : ''}{formatPoints(txn.points)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-text-primary">{formatPoints(txn.balance)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="px-4 py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No transactions match your filters.</p>
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Summary</h3>
        <div className="space-y-3">
          {[
            { month: 'August 2026', earned: 1131, redeemed: 0 },
            { month: 'July 2026', earned: 0, redeemed: 0 },
            { month: 'June 2026', earned: 892, redeemed: 0 },
            { month: 'May 2026', earned: 0, redeemed: 0 },
            { month: 'April 2026', earned: 1451, redeemed: 5000 },
            { month: 'March 2026', earned: 0, redeemed: 0 },
            { month: 'February 2026', earned: 612, redeemed: 0 },
            { month: 'January 2026', earned: 1000, redeemed: 3500 },
          ].map(m => (
            <div key={m.month} className="flex items-center gap-4">
              <span className="w-28 text-xs text-text-secondary shrink-0">{m.month}</span>
              <div className="flex-1 flex items-center gap-2">
                {m.earned > 0 && (
                  <div className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5">
                    <TrendingUp className="h-3 w-3 text-accent" />
                    <span className="text-[10px] font-mono text-accent">+{formatPoints(m.earned)}</span>
                  </div>
                )}
                {m.redeemed > 0 && (
                  <div className="flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5">
                    <TrendingDown className="h-3 w-3 text-danger" />
                    <span className="text-[10px] font-mono text-danger">-{formatPoints(m.redeemed)}</span>
                  </div>
                )}
                {m.earned === 0 && m.redeemed === 0 && (
                  <span className="text-[10px] text-text-muted">No activity</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
