/* src/app/app/loyalty/page.jsx — democked: live /v1/loyalty data, wired actions */
import { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Award,
  Search,
  Download,
  Plus,
  X,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useLoyaltyMembers } from '../../../hooks/useloyalty';
const timeAgo = (iso) => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatCurrency = (n) =>
  `R${Number(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { LTVPredictiveModal } from './LTVPredictiveModal';
import { apiClient } from '../../../api/client';

const tierConfig = {
  platinum: {
    label: 'Platinum',
    color: '#863bff',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
  },
  gold: {
    label: 'Gold',
    color: '#eab308',
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  silver: {
    label: 'Silver',
    color: '#64748b',
    bg: 'bg-neutral/10',
    text: 'text-text-secondary',
    border: 'border-border',
  },
  bronze: {
    label: 'Bronze',
    color: '#b45309',
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
  },
};

function TierBadge({ tier }) {
  const config = tierConfig[tier?.toLowerCase()] || tierConfig.bronze;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        config.border
      )}
    >
      {config.label}
    </span>
  );
}

function TierDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-text-secondary">{d.name}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-text-primary">{d.value}</span>
              <span className="ml-2 text-xs text-text-muted">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Enroll / Adjust Points modal ─── */
function AdjustPointsModal({ open, members, onClose, onDone }) {
  const [form, setForm] = useState({ guestId: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/v1/loyalty/adjust', {
        guestId: form.guestId,
        type: 'adjustment',
        amount: Number(form.amount),
        description: form.description,
        source: 'Front Desk',
      });

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setForm({ guestId: '', amount: '', description: '' });
        onClose();
        onDone();
      }, 900);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          String(err?.code || err) ||
          'Adjustment failed'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Enroll / Adjust Points</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {done ? (
          <div className="py-8 text-center">
            <Check className="mx-auto h-10 w-10 text-accent mb-2" />
            <p className="text-sm text-text-primary">Points adjusted</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Member
              </label>
              <select
                required
                value={form.guestId}
                onChange={(e) => setForm({ ...form, guestId: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ·{' '}
                    {tierConfig[m.tier?.toLowerCase()]?.label ?? m.tier} · {m.points} pts
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Points (+ / −)
              </label>
              <input
                required
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 500 or -200"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Reason
              </label>
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Welcome bonus, complaint recovery, stay accrual"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? 'Saving…' : 'Apply Adjustment'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function LoyaltyPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showLTV, setShowLTV] = useState(false);
  const [notice, setNotice] = useState(null);

  const loyaltyQuery = useLoyaltyMembers({
    search: search || undefined,
    tier: tierFilter === 'all' ? undefined : tierFilter,
    page: 1,
    pageSize: 500,
  });

  const members = useMemo(() => {
    const d = loyaltyQuery?.data?.data ?? loyaltyQuery?.data ?? [];
    const raw = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
    return raw.map((m) => ({
      ...m,
      firstName: m.firstName ?? m.name?.split(' ')[0] ?? '',
      lastName: m.lastName ?? m.name?.split(' ').slice(1).join(' ') ?? '',
      totalSpent: m.totalSpent ?? m.lifetimeValue ?? 0,
      stays: m.stays ?? m.totalStays ?? 0,
      lastActivity: m.lastActivity ?? m.lastStay ?? null,
    }));
  }, [loyaltyQuery]);

  const loading = loyaltyQuery?.isLoading ?? false;
  const refetch = loyaltyQuery?.refetch ?? (() => {});

  /* ─── Stats from live data ─── */
  const stats = useMemo(() => {
    const total = members.length;
    const totalRevenue = members.reduce((s, m) => s + (Number(m.totalSpent) || 0), 0);
    const avgValue = total ? Math.round(totalRevenue / total) : 0;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const active = members.filter(
      (m) => m.lastActivity && new Date(m.lastActivity).getTime() >= thirtyDaysAgo
    ).length;
    const tierCounts = members.reduce((acc, m) => {
      const t = (m.tier ?? 'bronze').toLowerCase();
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    return { total, totalRevenue, avgValue, active, tierCounts };
  }, [members]);

  const tierDistribution = useMemo(
    () =>
      Object.entries(tierConfig).map(([key, cfg]) => ({
        name: cfg.label,
        value: stats.tierCounts[key] ?? 0,
        color: cfg.color,
      })),
    [stats]
  );

  /* Revenue by tier — replaces the old mock trend chart with live sums */
  const revenueByTier = useMemo(
    () =>
      Object.entries(tierConfig).map(([key, cfg]) => ({
        name: cfg.label,
        revenue: members
          .filter((m) => (m.tier ?? '').toLowerCase() === key)
          .reduce((s, m) => s + (Number(m.totalSpent) || 0), 0),
      })),
    [members]
  );

  const exportCsv = () => {
    const header = 'Name,Email,Tier,Points,Lifetime Points,Stays,Spent,Last Activity';
    const rows = members.map((m) =>
      [
        `${m.firstName ?? ''} ${m.lastName ?? ''}`,
        m.email ?? '',
        m.tier ?? '',
        m.points ?? 0,
        m.lifetimePoints ?? 0,
        m.stays ?? 0,
        m.totalSpent ?? 0,
        m.lastActivity ? timeAgo(m.lastActivity) : '',
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdjusted = () => {
    setNotice('Points adjusted — member data refreshed');
    refetch?.();
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Loyalty Program</h1>
          <p className="text-sm text-text-secondary">Manage members, tiers, and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch?.()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={members.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAdjust(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Enroll Member
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-accent flex items-center gap-2">
          <Check className="h-4 w-4" /> {notice}
        </div>
      )}

      {/* Program stats — live */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: 'Total Members',
            value: stats.total.toLocaleString(),
            icon: Users,
            color: 'text-text-primary',
          },
          {
            label: 'Active (30d)',
            value: stats.active.toLocaleString(),
            icon: Users,
            color: 'text-accent',
          },
          {
            label: 'Platinum',
            value: (stats.tierCounts.platinum ?? 0).toLocaleString(),
            icon: Award,
            color: 'text-purple-500',
          },
          {
            label: 'Gold',
            value: (stats.tierCounts.gold ?? 0).toLocaleString(),
            icon: Award,
            color: 'text-warning',
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: 'text-secondary',
          },
          {
            label: 'Avg Lifetime Value',
            value: formatCurrency(stats.avgValue),
            icon: TrendingUp,
            color: 'text-info',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={cn('mt-1 text-xl font-bold truncate', s.color)}>{s.value}</p>
              </div>
              <s.icon className={cn('h-5 w-5 shrink-0', s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
            Tier Distribution
          </h3>
          {members.length > 0 ? (
            <TierDonut data={tierDistribution} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">
              {loading ? 'Loading…' : 'No members yet'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
            Revenue by Tier
          </h3>
          {members.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByTier}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={12} className="text-text-secondary" />
                <YAxis
                  fontSize={12}
                  className="text-text-secondary"
                  tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#863bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">
              {loading ? 'Loading…' : 'No members yet'}
            </p>
          )}
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Members</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
            >
              <option value="all">All Tiers</option>
              {Object.entries(tierConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Stays
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="cursor-pointer hover:bg-background/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-text-muted">{member.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={member.tier} />
                  </td>
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {(member.points ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{member.stays ?? 0}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {formatCurrency(member.totalSpent ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {member.lastActivity ? timeAgo(member.lastActivity) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
                  </td>
                </tr>
              ))}
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
                    <p className="text-text-muted">
                      {search || tierFilter !== 'all'
                        ? 'No members match your filters.'
                        : 'No loyalty members yet — enroll your first member.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-2.5 text-xs text-text-muted">
          {loading
            ? 'Loading members…'
            : `Showing ${members.length} member${members.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Drawer + modals */}
      {selectedMember && (
        <MemberDetailDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onPredict={() => setShowLTV(true)}
        />
      )}

      {showLTV && (
        <LTVPredictiveModal
          members={members.map((m) => ({
            name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
            totalStays: m.stays ?? 0,
            lifetimeValue: m.totalSpent ?? 0,
            points: m.points ?? 0,
            tier: m.tier ?? 'bronze',
          }))}
          onClose={() => setShowLTV(false)}
        />
      )}

      <AdjustPointsModal
        open={showAdjust}
        members={members}
        onClose={() => setShowAdjust(false)}
        onDone={handleAdjusted}
      />
    </div>
  );
}
