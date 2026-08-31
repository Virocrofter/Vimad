/* src/app/admin/billing/subscriptions/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Calendar,
  ArrowRightLeft,
  Building2,
  Edit3,
  Pause,
  Play,
  Ban,
  Trash2,
  RefreshCw,
  Download,
  Info,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { subscriptions, planConfig, calculateProration, formatCurrency, formatDate } from '../data';
import { SubscriptionStatusBadge, ProrationDisplay, SubscriptionMiniCard } from '../components';

/* ─── Plan Change Modal ─── */
function PlanChangeModal({ subscription, onClose, onSave }) {
  const [newPlan, setNewPlan] = useState(subscription?.plan || 'Starter');
  const [newSeats, setNewSeats] = useState(subscription?.seats || 1);
  const [newCycle, setNewCycle] = useState(subscription?.billingCycle || 'monthly');

  const proration = useMemo(() => {
    if (!subscription) return null;
    const daysRemaining = subscription.nextBillingDate
      ? Math.max(
          0,
          Math.ceil((new Date(subscription.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24))
        )
      : 30;
    return calculateProration(
      subscription.plan,
      newPlan,
      subscription.seats,
      newSeats,
      subscription.billingCycle,
      daysRemaining
    );
  }, [subscription, newPlan, newSeats]);

  if (!subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <ArrowRightLeft className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Change Plan</h3>
              <p className="text-xs text-text-muted">{subscription.tenantName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Plan */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-text-muted uppercase tracking-wider">Current Plan</p>
            <p className="text-sm font-medium text-text-primary">
              {subscription.plan} · {subscription.seats} seats · {subscription.billingCycle}
            </p>
            <p className="text-sm font-mono text-text-primary">
              {formatCurrency(subscription.amount)}/mo
            </p>
          </div>

          {/* New Plan Selection */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              New Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(planConfig).map(([plan, config]) => (
                <button
                  key={plan}
                  onClick={() => setNewPlan(plan)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left',
                    newPlan === plan
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <p className="font-semibold">{plan}</p>
                  <p className="text-xs text-text-muted">{formatCurrency(config.basePrice)}/mo</p>
                </button>
              ))}
            </div>
          </div>

          {/* Seats */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Seats
            </label>
            <input
              type="number"
              min="1"
              value={newSeats}
              onChange={(e) => setNewSeats(parseInt(e.target.value) || 1)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              {newSeats > planConfig[newPlan].includedSeats
                ? `${newSeats - planConfig[newPlan].includedSeats} extra seats @ ${formatCurrency(planConfig[newPlan].extraSeatPrice)}/seat`
                : `${planConfig[newPlan].includedSeats} seats included`}
            </p>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Billing Cycle
            </label>
            <div className="flex gap-2">
              {['monthly', 'annual'].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setNewCycle(cycle)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors capitalize',
                    newCycle === cycle
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>

          {/* Proration */}
          <ProrationDisplay calculation={proration} />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave({ plan: newPlan, seats: newSeats, billingCycle: newCycle });
                onClose();
              }}
            >
              <Check className="mr-1.5 h-4 w-4" /> Apply Change
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Subscription Detail Drawer ─── */
function SubscriptionDrawer({ subscription, onClose, onUpdate }) {
  const [showPlanChange, setShowPlanChange] = useState(false);
  if (!subscription) return null;

  const plan = planConfig[subscription.plan];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{subscription.tenantName}</h2>
                  <p className="text-xs text-text-muted">
                    {subscription.id} · {subscription.tenantId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SubscriptionStatusBadge status={subscription.status} />
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Plan Info */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Current Plan</p>
                  <p className="text-lg font-bold text-text-primary">{subscription.plan}</p>
                  <p className="text-sm text-text-muted">
                    {subscription.billingCycle} billing · {subscription.seats} seats
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(subscription.amount)}
                  </p>
                  <p className="text-xs text-text-muted">
                    per {subscription.billingCycle === 'annual' ? 'year' : 'month'}
                  </p>
                </div>
              </div>

              {plan && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-text-muted">Base Price</p>
                    <p className="font-mono font-medium text-text-primary">
                      {formatCurrency(plan.basePrice)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-text-muted">Included Seats</p>
                    <p className="font-mono font-medium text-text-primary">{plan.includedSeats}</p>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-text-muted">Extra Seat</p>
                    <p className="font-mono font-medium text-text-primary">
                      {formatCurrency(plan.extraSeatPrice)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Add-ons */}
            {subscription.addOns.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Add-ons
                </h4>
                <div className="space-y-2">
                  {subscription.addOns.map((addon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-text-primary">{addon.name}</span>
                      <span className="text-sm font-mono text-text-primary">
                        {formatCurrency(addon.amount)} × {addon.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discount */}
            {subscription.discount && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Discount Applied</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {subscription.discount.type === 'percentage'
                    ? `${subscription.discount.value}% off`
                    : `${formatCurrency(subscription.discount.value)} off`}
                  {' — '}
                  {subscription.discount.reason}
                </p>
              </div>
            )}

            {/* Billing Details */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Billing Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-muted">Payment Method:</span>{' '}
                  <span className="text-text-primary">{subscription.paymentMethod || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Billing Email:</span>{' '}
                  <span className="text-text-primary">{subscription.billingEmail}</span>
                </div>
                <div>
                  <span className="text-text-muted">Tax Rate:</span>{' '}
                  <span className="text-text-primary">
                    {subscription.taxRate}% ({subscription.taxRegion})
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Auto-Renew:</span>{' '}
                  <span className={subscription.autoRenew ? 'text-accent' : 'text-danger'}>
                    {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Started:</span>{' '}
                  <span className="text-text-primary">{formatDate(subscription.startDate)}</span>
                </div>
                <div>
                  <span className="text-text-muted">Next Billing:</span>{' '}
                  <span className="text-text-primary">
                    {formatDate(subscription.nextBillingDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPlanChange(true)}>
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Change Plan
              </Button>
              {subscription.status === 'active' && (
                <Button
                  variant="outline"
                  className="text-warning border-warning/30 hover:bg-warning/10"
                >
                  <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
                </Button>
              )}
              {subscription.status === 'paused' && (
                <Button
                  variant="outline"
                  className="text-accent border-accent/30 hover:bg-accent/10"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
                </Button>
              )}
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/10 ml-auto"
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPlanChange && (
        <PlanChangeModal
          subscription={subscription}
          onClose={() => setShowPlanChange(false)}
          onSave={(updates) => onUpdate(subscription.id, updates)}
        />
      )}
    </>
  );
}

/* ─── Main Page ─── */
export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState(subscriptions);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'nextBillingDate', dir: 'asc' });

  const filteredSubs = useMemo(() => {
    let result = subs.filter((s) => {
      const matchesQuery =
        !query ||
        s.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.tenantId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPlan = planFilter === 'all' || s.plan === planFilter;
      return matchesQuery && matchesStatus && matchesPlan;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.dir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortConfig.key === 'nextBillingDate') {
        const aDate = a.nextBillingDate ? new Date(a.nextBillingDate) : new Date('9999');
        const bDate = b.nextBillingDate ? new Date(b.nextBillingDate) : new Date('9999');
        return sortConfig.dir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (sortConfig.key === 'tenantName') {
        return sortConfig.dir === 'asc'
          ? a.tenantName.localeCompare(b.tenantName)
          : b.tenantName.localeCompare(a.tenantName);
      }
      return 0;
    });

    return result;
  }, [subs, query, statusFilter, planFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: subs.length,
      active: subs.filter((s) => s.status === 'active').length,
      trial: subs.filter((s) => s.status === 'trial').length,
      pastDue: subs.filter((s) => s.status === 'past_due').length,
      totalMrr: subs.filter((s) => s.status === 'active').reduce((s, sub) => s + sub.amount, 0),
    }),
    [subs]
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleUpdate = (id, updates) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
          <p className="text-sm text-text-secondary">
            Manage tenant subscriptions, plans, and billing cycles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Subscription
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Subscriptions</p>
          <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Active</p>
          <p className="mt-1 text-2xl font-bold font-mono text-accent">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">In Trial</p>
          <p className="mt-1 text-2xl font-bold font-mono text-info">{stats.trial}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total MRR</p>
          <p className="mt-1 text-2xl font-bold font-mono text-secondary">
            {formatCurrency(stats.totalMrr)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search subscriptions by tenant, ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="all">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPlanFilter('all');
                setQuery('');
              }}
              className="text-xs text-secondary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredSubs.length}</span> of{' '}
        {subs.length} subscriptions
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { key: 'tenantName', label: 'Tenant' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'status', label: 'Status' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'nextBillingDate', label: 'Next Billing' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key &&
                        (sortConfig.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-background/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedSub(sub)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{sub.tenantName}</p>
                      <p className="text-[10px] text-text-muted font-mono">{sub.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-text-primary">{sub.plan}</span>
                    <p className="text-[10px] text-text-muted">
                      {sub.seats} seats · {sub.billingCycle}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <SubscriptionStatusBadge status={sub.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono font-medium text-text-primary">
                      {formatCurrency(sub.amount)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      per {sub.billingCycle === 'annual' ? 'year' : 'month'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-text-secondary">{formatDate(sub.nextBillingDate)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSub(sub);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title="View Details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Users className="mx-auto h-10 w-10 mb-3" />
                    <p>No subscriptions match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedSub && (
        <SubscriptionDrawer
          subscription={selectedSub}
          onClose={() => setSelectedSub(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
