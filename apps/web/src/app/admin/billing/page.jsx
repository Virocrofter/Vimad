// apps/web/src/app/admin/billing/page.jsx — wired to api/billing.ts (Phase 3E)
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  RefreshCw,
  FileText,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiError } from '../../../hooks/useApiError';
import {
  getBillingDashboard,
  getInvoices,
  getSubscriptions,
  getCreditNotes,
  getDunningEvents,
  getRevenueAnalytics,
} from '@/api/billing';
import { api } from '@/api/client';
// Static metadata + formatters only — entity data comes from the API.
import { formatCurrency } from './data';
import {
  BillingStatCard,
  MrrMovementBar,
  PlanDistributionChart,
  InvoiceMiniCard,
  SubscriptionMiniCard,
  DunningTimeline,
} from './components';

/* ─── Normalizers: API shapes → component shapes ─── */
const invoiceStatusMap = { sent: 'pending', cancelled: 'void' };
const normalizeInvoice = (inv) => ({
  ...inv,
  tenantName: inv.tenantName ?? inv.tenantId,
  amount: inv.totalAmount ?? inv.amount ?? 0,
  status: invoiceStatusMap[inv.status] ?? inv.status,
});

const subStatusMap = { trialing: 'trial' };
const normalizeSubscription = (s) => ({
  ...s,
  tenantName: s.tenantName ?? s.tenantId,
  status: subStatusMap[s.status] ?? s.status,
  billingCycle: s.billingCycle ?? 'monthly',
  seats: s.usage?.users ?? s.seats ?? 0,
  amount: s.amount ?? 0,
});

const normalizeCreditNote = (cn) => ({
  ...cn,
  tenantName: cn.tenantName ?? cn.invoiceId,
});

const dunningEventToAction = (e) => ({
  date: e.sentAt,
  action: `Payment attempt #${e.attempt}`,
  status: e.status === 'resolved' ? 'success' : e.status, // sent | failed | success
  reason: e.failureReason,
});

export default function BillingPage() {
  /* ─── Data fetching (real API) ─── */
  const dashboardQuery = useApiFetch(() => getBillingDashboard(), []);
  const invoicesQuery = useApiFetch(async () => {
    const res = await getInvoices({ page: 1, pageSize: 5 });
    return (res?.data ?? res ?? []).map(normalizeInvoice);
  }, []);
  const subscriptionsQuery = useApiFetch(async () => {
    const res = await getSubscriptions({ page: 1, pageSize: 5 });
    return (res?.data ?? res ?? []).map(normalizeSubscription);
  }, []);
  const creditNotesQuery = useApiFetch(async () => {
    const res = await getCreditNotes();
    return (Array.isArray(res) ? res : (res?.data ?? [])).map(normalizeCreditNote);
  }, []);
  const dunningQuery = useApiFetch(async () => {
    const res = await getDunningEvents();
    return Array.isArray(res) ? res : (res?.data ?? []);
  }, []);

  // MRR movement history — endpoint: GET /admin/billing/mrr-history
  const mrrHistoryQuery = useApiFetch(
    async () => {
      const res = await api.get('/admin/billing/mrr-history');
      return res?.data ?? res ?? [];
    },
    [],
    { initialData: [] }
  );

  // Revenue by plan — endpoint: GET /admin/billing/revenue-by-plan
  const planRevenueQuery = useApiFetch(
    async () => {
      const res = await api.get('/admin/billing/revenue-by-plan');
      return res?.data ?? res ?? [];
    },
    [],
    { initialData: [] }
  );

  useApiError(dashboardQuery.error);
  useApiError(invoicesQuery.error);

  const dashboard = dashboardQuery.data;
  const invoices = invoicesQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const creditNotes = creditNotesQuery.data ?? [];
  const mrrHistory = mrrHistoryQuery.data ?? [];
  const planRevenue = planRevenueQuery.data ?? [];

  const loading = dashboardQuery.loading || invoicesQuery.loading || subscriptionsQuery.loading;

  // Group dunning events by invoice → timeline of the most recent case
  const latestDunningActions = useMemo(() => {
    const dunningEvents = dunningQuery.data ?? [];
    if (!dunningEvents.length) return [];
    const byInvoice = new Map();
    dunningEvents.forEach((e) => {
      if (!byInvoice.has(e.invoiceId)) byInvoice.set(e.invoiceId, []);
      byInvoice.get(e.invoiceId).push(dunningEventToAction(e));
    });
    const first = byInvoice.values().next().value;
    return first.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dunningQuery.data]);

  const refetchAll = () => {
    dashboardQuery.refetch();
    invoicesQuery.refetch();
    subscriptionsQuery.refetch();
    creditNotesQuery.refetch();
    dunningQuery.refetch();
    mrrHistoryQuery.refetch();
    planRevenueQuery.refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-text-muted">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading billing data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Billing Management</h1>
          <p className="text-sm text-text-secondary">
            Revenue, subscriptions, invoices, credit notes, and dunning
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BillingStatCard
            label="MRR"
            value={formatCurrency(dashboard.mrr ?? 0)}
            icon={DollarSign}
            color="text-accent"
            subtext="Monthly recurring revenue"
          />
          <BillingStatCard
            label="Total Revenue"
            value={formatCurrency(dashboard.totalRevenue ?? 0)}
            icon={TrendingUp}
            color="text-secondary"
            subtext="All time"
          />
          <BillingStatCard
            label="Active Subscriptions"
            value={dashboard.activeSubscriptions ?? 0}
            icon={Users}
            color="text-info"
            subtext={`${dashboard.trialConversions ?? 0} trial conversions`}
          />
          <BillingStatCard
            label="Overdue"
            value={formatCurrency(dashboard.overdueAmount ?? 0)}
            icon={AlertTriangle}
            color="text-danger"
            subtext={`${dashboard.outstandingInvoices ?? 0} outstanding invoices`}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" /> MRR Movement
          </h3>
          {mrrHistory.length > 0 ? (
            <MrrMovementBar data={mrrHistory} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">No MRR history available.</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-secondary" /> Revenue by Plan
          </h3>
          {planRevenue.length > 0 ? (
            <PlanDistributionChart data={planRevenue} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">
              No plan revenue data available.
            </p>
          )}
        </div>
      </div>

      {/* Lists row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent invoices */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-secondary" /> Recent Invoices
            </h3>
            <Link
              to="/admin/billing/invoices"
              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {invoices.map((inv) => (
              <InvoiceMiniCard key={inv.id} invoice={inv} />
            ))}
            {invoices.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">No invoices yet.</p>
            )}
          </div>
        </div>

        {/* Recent subscriptions */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" /> Recent Subscriptions
            </h3>
            <Link
              to="/admin/billing/subscriptions"
              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {subscriptions.map((sub) => (
              <SubscriptionMiniCard key={sub.id} subscription={sub} />
            ))}
            {subscriptions.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">No subscriptions yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Credit notes + dunning row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Recent Credit Notes</h3>
            <Link
              to="/admin/billing/credit-notes"
              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-3 space-y-2">
            {creditNotes.slice(0, 5).map((cn) => (
              <div
                key={cn.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{cn.tenantName}</p>
                  <p className="text-[10px] text-text-muted">
                    {cn.id} · {cn.reason}
                  </p>
                </div>
                <p className="text-sm font-mono font-medium text-accent">
                  -{formatCurrency(cn.amount ?? 0)}
                </p>
              </div>
            ))}
            {creditNotes.length === 0 && (
              <p className="py-6 text-center text-sm text-text-muted">No credit notes.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Latest Dunning Activity</h3>
            <Link
              to="/admin/billing/dunning"
              className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {latestDunningActions.length > 0 ? (
              <DunningTimeline actions={latestDunningActions} />
            ) : (
              <p className="py-6 text-center text-sm text-text-muted">No dunning activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
