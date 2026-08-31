/* src/app/admin/billing/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
  Receipt, AlertTriangle, RotateCcw, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Zap, Calendar, ChevronRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  revenueOverview, mrrHistory, revenueByPlan,
  subscriptions, invoices, creditNotes, dunningCases
} from './data';
import {
  BillingStatCard, MrrMovementBar, PlanDistributionChart,
  InvoiceMiniCard, SubscriptionMiniCard, DunningTimeline
} from './components';
import { formatCurrency } from './data';

export default function BillingDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6m');

  const stats = useMemo(() => ({
    mrr: revenueOverview.mrr,
    mrrGrowth: revenueOverview.mrrGrowth,
    arr: revenueOverview.arr,
    activeSubs: revenueOverview.activeSubscriptions,
    trialSubs: revenueOverview.trialSubscriptions,
    churnRate: revenueOverview.churnRate,
    nrr: revenueOverview.netRevenueRetention,
    arpu: revenueOverview.avgRevenuePerUser,
    ltv: revenueOverview.lifetimeValue,
    cac: revenueOverview.customerAcquisitionCost,
    payback: revenueOverview.paybackPeriod,
  }), []);

  const recentInvoices = useMemo(() => invoices.slice(0, 5), []);
  const recentSubs = useMemo(() => subscriptions.slice(0, 5), []);
  const activeDunning = useMemo(() => dunningCases.filter(d => d.status === 'in_progress'), []);

  const pendingAmount = useMemo(() =>
    invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0),
  []);

  const overdueAmount = useMemo(() =>
    invoices.filter(i => i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0),
  []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Billing & Revenue</h1>
          <p className="text-sm text-text-secondary">Subscription management, invoicing, and revenue analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-background p-1">
            {[
              { id: '1m', label: '1M' },
              { id: '3m', label: '3M' },
              { id: '6m', label: '6M' },
              { id: '1y', label: '1Y' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  timeRange === r.id ? 'bg-secondary text-white' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BillingStatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(stats.mrr)}
          icon={DollarSign}
          color="text-secondary"
          subtext={`ARR: ${formatCurrency(stats.arr)}`}
          trend={stats.mrrGrowth}
        />
        <BillingStatCard
          label="Active Subscriptions"
          value={stats.activeSubs}
          icon={Users}
          color="text-accent"
          subtext={`${stats.trialSubs} in trial`}
        />
        <BillingStatCard
          label="Net Revenue Retention"
          value={`${stats.nrr}%`}
          icon={TrendingUp}
          color="text-accent"
          subtext="Annual metric"
          trend={stats.nrr - 100}
        />
        <BillingStatCard
          label="Churn Rate"
          value={`${stats.churnRate}%`}
          icon={TrendingDown}
          color="text-warning"
          subtext="Monthly"
          trend={-(stats.churnRate)}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BillingStatCard
          label="ARPU"
          value={formatCurrency(stats.arpu)}
          icon={Users}
          color="text-info"
          subtext="Per active subscriber"
        />
        <BillingStatCard
          label="Lifetime Value"
          value={formatCurrency(stats.ltv)}
          icon={DollarSign}
          color="text-purple-500"
          subtext="Average LTV"
        />
        <BillingStatCard
          label="CAC"
          value={formatCurrency(stats.cac)}
          icon={CreditCard}
          color="text-danger"
          subtext="Customer acquisition cost"
        />
        <BillingStatCard
          label="CAC Payback"
          value={`${stats.payback}m`}
          icon={Calendar}
          color="text-accent"
          subtext="Months to recover CAC"
        />
      </div>

      {/* Pending Revenue Alert */}
      {(pendingAmount > 0 || overdueAmount > 0) && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              {overdueAmount > 0
                ? `${formatCurrency(overdueAmount)} overdue across ${invoices.filter(i => i.status === 'overdue').length} invoices`
                : `${formatCurrency(pendingAmount)} pending across ${invoices.filter(i => i.status === 'pending').length} invoices`}
            </p>
            <p className="text-xs text-text-muted">
              {activeDunning.length > 0
                ? `${activeDunning.length} dunning case${activeDunning.length > 1 ? 's' : ''} in progress`
                : 'All payments on track'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/billing/invoices')}>
            View Invoices <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* MRR Movement */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-secondary" /> MRR Movement
            </h3>
            <div className="flex gap-3 text-[10px] text-text-muted">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />New</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" />Expansion</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />Contraction</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" />Churn</span>
            </div>
          </div>
          <MrrMovementBar data={mrrHistory} />
        </div>

        {/* Plan Distribution */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-secondary" /> Revenue by Plan
          </h3>
          <PlanDistributionChart data={revenueByPlan} />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Subscriptions', count: subscriptions.length, icon: Users, path: '/admin/billing/subscriptions', color: 'text-accent', desc: 'Manage plans & billing cycles' },
          { label: 'Invoices', count: invoices.length, icon: Receipt, path: '/admin/billing/invoices', color: 'text-secondary', desc: 'Generate & track invoices' },
          { label: 'Credit Notes', count: creditNotes.length, icon: RotateCcw, path: '/admin/billing/credit-notes', color: 'text-info', desc: 'Refunds & adjustments' },
          { label: 'Dunning', count: activeDunning.length, icon: AlertTriangle, path: '/admin/billing/dunning', color: 'text-warning', desc: 'Failed payment recovery' },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            className="rounded-xl border border-border bg-surface p-4 text-left hover:border-secondary/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('rounded-lg p-2', card.color.replace('text-', 'bg-').replace('accent', 'accent/10').replace('secondary', 'secondary/10').replace('info', 'info/10').replace('warning', 'warning/10'))}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <span className="text-2xl font-bold font-mono text-text-primary">{card.count}</span>
            </div>
            <p className="text-sm font-medium text-text-primary group-hover:text-secondary transition-colors">{card.label}</p>
            <p className="text-xs text-text-muted">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Receipt className="h-4 w-4 text-secondary" /> Recent Invoices
            </h3>
            <button
              onClick={() => navigate('/admin/billing/invoices')}
              className="text-xs text-secondary hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <InvoiceMiniCard key={inv.id} invoice={inv} />
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" /> Recent Subscriptions
            </h3>
            <button
              onClick={() => navigate('/admin/billing/subscriptions')}
              className="text-xs text-secondary hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {recentSubs.map((sub) => (
              <SubscriptionMiniCard key={sub.id} subscription={sub} />
            ))}
          </div>
        </div>
      </div>

      {/* Active Dunning Cases */}
      {activeDunning.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Active Dunning Cases
            </h3>
            <button
              onClick={() => navigate('/admin/billing/dunning')}
              className="text-xs text-secondary hover:underline"
            >
              Manage All →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeDunning.map((dun) => (
              <div key={dun.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{dun.tenantName}</p>
                    <p className="text-xs text-text-muted">{dun.id} · {dun.invoiceId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-danger">{formatCurrency(dun.amount)}</p>
                    <p className="text-[10px] text-text-muted">Attempt {dun.retryCount}/{dun.maxRetries}</p>
                  </div>
                </div>
                <DunningTimeline actions={dun.actions} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
