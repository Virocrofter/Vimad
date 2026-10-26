/* src/app/app/billing/dashboard/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Download,
  Check,
  AlertCircle,
  Zap,
  Shield,
  Users,
  BedDouble,
  Calendar,
  ArrowUpRight,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit3,
  X,
  ChevronDown,
  Receipt,
  TrendingUp,
  Clock,
  FileText,
  Lock,
  Sparkles,
  Ban,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const currentPlan = {
  name: 'Professional',
  price: 499,
  interval: 'month',
  annualPrice: 4990,
  annualSavings: 998,
  renewalDate: '2026-09-12',
  status: 'active',
  trialEnds: null,
  features: [
    'Up to 200 rooms',
    'Unlimited users',
    'Channel Manager',
    'Booking Engine',
    'Guest Portal',
    'CRM & Loyalty',
    'Marketing Automation',
    'Priority Support',
  ],
  limits: {
    rooms: { used: 142, total: 200 },
    users: { used: 18, total: 'Unlimited' },
    storage: { used: 45.2, total: 100, unit: 'GB' },
    apiCalls: { used: 28400, total: 100000, unit: 'calls/mo' },
  },
};

const invoices = [
  {
    id: 'INV-2026-0812',
    date: '2026-08-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0712',
    date: '2026-07-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0612',
    date: '2026-06-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0512',
    date: '2026-05-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0412',
    date: '2026-04-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0312',
    date: '2026-03-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0212',
    date: '2026-02-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2026-0112',
    date: '2026-01-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2025-1212',
    date: '2025-12-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2025-1112',
    date: '2025-11-12',
    amount: 499.0,
    status: 'paid',
    plan: 'Professional (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2025-1012',
    date: '2025-10-12',
    amount: 199.0,
    status: 'paid',
    plan: 'Starter (Monthly)',
    method: 'Visa •••• 4242',
  },
  {
    id: 'INV-2025-0912',
    date: '2025-09-12',
    amount: 199.0,
    status: 'paid',
    plan: 'Starter (Monthly)',
    method: 'Visa •••• 4242',
  },
];

const paymentMethods = [
  {
    id: 'pm-1',
    type: 'visa',
    last4: '4242',
    expiry: '09/28',
    isDefault: true,
    name: 'Grand Hotel Corp',
  },
  {
    id: 'pm-2',
    type: 'mastercard',
    last4: '8891',
    expiry: '12/27',
    isDefault: false,
    name: 'Grand Hotel Corp',
  },
];

const planTiers = [
  {
    name: 'Starter',
    price: 199,
    annualPrice: 1990,
    description: 'For independent hotels & B&Bs',
    roomLimit: 75,
    features: [
      'Core PMS (Reservations, Front Desk, Billing)',
      'Basic Housekeeping',
      'Standard Reporting',
      'Email Support',
    ],
    notIncluded: [
      'Channel Manager',
      'Booking Engine',
      'Guest Portal',
      'CRM & Loyalty',
      'Marketing Automation',
    ],
  },
  {
    name: 'Professional',
    price: 499,
    annualPrice: 4990,
    description: 'For boutique hotels & small chains',
    roomLimit: 200,
    popular: true,
    features: [
      'Everything in Starter',
      'Channel Manager',
      'Booking Engine',
      'Guest Portal',
      'CRM & Loyalty',
      'Marketing Automation',
      'Priority Support',
    ],
    notIncluded: ['White-Label Portal', 'Dedicated Account Manager'],
  },
  {
    name: 'Enterprise',
    price: 999,
    annualPrice: 9990,
    description: 'For hotel chains & management groups',
    roomLimit: 500,
    features: [
      'Everything in Professional',
      'Multi-Property Dashboard',
      'AI Revenue Manager',
      'Advanced Analytics',
      'White-Label Portal',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA Guarantee',
    ],
    notIncluded: [],
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}

function getUsagePercent(used, total) {
  if (typeof total === 'string') return null;
  return Math.min(100, Math.round((used / total) * 100));
}

function getUsageColor(percent) {
  if (percent === null) return 'text-accent';
  if (percent >= 90) return 'text-danger';
  if (percent >= 75) return 'text-warning';
  return 'text-accent';
}

function getUsageBarColor(percent) {
  if (percent >= 90) return 'bg-danger';
  if (percent >= 75) return 'bg-warning';
  return 'bg-accent';
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isCurrent, onSelect, billingInterval }) {
  const price = billingInterval === 'annual' ? plan.annualPrice : plan.price;
  const isPopular = plan.popular;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-5 transition-all',
        isCurrent
          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/20'
          : 'border-border bg-surface hover:border-secondary/30 hover:shadow-md'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Sparkles className="h-3 w-3" /> Most Popular
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> Current Plan
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
        <p className="text-xs text-text-muted mt-0.5">{plan.description}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-mono text-text-primary">
            {formatCurrency(price)}
          </span>
          <span className="text-sm text-text-muted">/mo</span>
        </div>
        {billingInterval === 'annual' && (
          <p className="text-xs text-accent mt-1">
            Billed annually · Save {formatCurrency(plan.price * 12 - plan.annualPrice)}/year
          </p>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
          <BedDouble className="h-3.5 w-3.5 text-text-muted" />
          Up to {plan.roomLimit} rooms
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>{f}</span>
          </div>
        ))}
        {plan.notIncluded.map((f) => (
          <div key={f} className="flex items-start gap-2 text-sm text-text-muted opacity-60">
            <Ban className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <Button
        variant={isCurrent ? 'outline' : 'secondary'}
        className="w-full"
        size="sm"
        onClick={() => onSelect(plan)}
        disabled={isCurrent}
      >
        {isCurrent ? 'Current Plan' : 'Upgrade'}
      </Button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BillingDashboardPage() {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradePreview, setUpgradePreview] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [invoicesData, setInvoicesData] = useState(invoices);
  const [paymentMethodsData, setPaymentMethodsData] = useState(paymentMethods);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const totalSpent = useMemo(
    () => invoicesData.reduce((s, inv) => s + inv.amount, 0),
    [invoicesData]
  );
  const avgMonthly = useMemo(() => {
    const paid = invoicesData.filter((i) => i.status === 'paid');
    return paid.length > 0 ? paid.reduce((s, i) => s + i.amount, 0) / paid.length : 0;
  }, [invoicesData]);

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === 'all') return invoicesData;
    return invoicesData.filter((i) => i.status === invoiceFilter);
  }, [invoicesData, invoiceFilter]);

  const handleSetDefault = (id) => {
    setPaymentMethodsData((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  const handleDeleteCard = (id) => {
    setPaymentMethodsData((prev) => prev.filter((pm) => pm.id !== id));
  };

  const handleUpgrade = (plan) => {
    setUpgradePreview({ plan });
    setShowUpgrade(false);
    setShowUpgradeConfirm(true);
  };

  const confirmUpgrade = () => {
    // In real app: API call to change plan
    setShowUpgradeConfirm(false);
    setUpgradePreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Billing & Subscription</h1>
          <p className="text-sm text-text-secondary">Manage your plan, usage, and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUpgrade(true)}>
            <ArrowUpRight className="mr-1.5 h-4 w-4" /> Change Plan
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {currentPlan.limits.rooms.used / currentPlan.limits.rooms.total >= 0.9 && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              You're approaching your room limit
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              You're using {currentPlan.limits.rooms.used} of {currentPlan.limits.rooms.total} rooms
              ({Math.round((currentPlan.limits.rooms.used / currentPlan.limits.rooms.total) * 100)}
              %).
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-secondary hover:underline ml-1"
              >
                Upgrade now
              </button>{' '}
              to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Current Plan"
          value={currentPlan.name}
          icon={Zap}
          color="text-secondary"
          subtext={formatCurrency(currentPlan.price) + '/mo'}
        />
        <StatCard
          label="Next Billing"
          value={new Date(currentPlan.renewalDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          icon={Calendar}
          color="text-info"
          subtext={formatCurrency(currentPlan.price) + ' due'}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={TrendingUp}
          color="text-accent"
          subtext="Lifetime"
        />
        <StatCard
          label="Avg. Monthly"
          value={formatCurrency(avgMonthly)}
          icon={Receipt}
          color="text-warning"
          subtext="Last 12 months"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-text-primary">{currentPlan.name} Plan</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  Renews on{' '}
                  <span className="font-medium text-text-primary">
                    {new Date(currentPlan.renewalDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-mono text-text-primary">
                  {formatCurrency(currentPlan.price)}
                  <span className="text-sm font-normal text-text-muted">/mo</span>
                </p>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-xs text-secondary hover:underline mt-1"
                >
                  Change plan or billing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentPlan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button size="sm" variant="secondary" onClick={() => setShowUpgrade(true)}>
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> Upgrade Plan
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="mr-1.5 h-4 w-4" /> View Plan Details
              </Button>
            </div>
          </div>

          {/* Usage Metrics */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" /> Usage This Cycle
              </h3>
              <span className="text-xs text-text-muted">
                Resets on {new Date(currentPlan.renewalDate).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-5">
              {/* Rooms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <BedDouble className="h-4 w-4 text-text-muted" />
                    Rooms
                  </div>
                  <div className="text-sm">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        getUsageColor(
                          getUsagePercent(
                            currentPlan.limits.rooms.used,
                            currentPlan.limits.rooms.total
                          )
                        )
                      )}
                    >
                      {currentPlan.limits.rooms.used}
                    </span>
                    <span className="text-text-muted"> / {currentPlan.limits.rooms.total}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      getUsageBarColor(
                        getUsagePercent(
                          currentPlan.limits.rooms.used,
                          currentPlan.limits.rooms.total
                        )
                      )
                    )}
                    style={{
                      width: `${getUsagePercent(currentPlan.limits.rooms.used, currentPlan.limits.rooms.total)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Users */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Users className="h-4 w-4 text-text-muted" />
                    Team Members
                  </div>
                  <div className="text-sm">
                    <span className="font-mono font-bold text-accent">
                      {currentPlan.limits.users.used}
                    </span>
                    <span className="text-text-muted"> / {currentPlan.limits.users.total}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: '15%' }} />
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText className="h-4 w-4 text-text-muted" />
                    Storage
                  </div>
                  <div className="text-sm">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        getUsageColor(
                          getUsagePercent(
                            currentPlan.limits.storage.used,
                            currentPlan.limits.storage.total
                          )
                        )
                      )}
                    >
                      {currentPlan.limits.storage.used}
                      {currentPlan.limits.storage.unit}
                    </span>
                    <span className="text-text-muted">
                      {' '}
                      / {currentPlan.limits.storage.total}
                      {currentPlan.limits.storage.unit}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      getUsageBarColor(
                        getUsagePercent(
                          currentPlan.limits.storage.used,
                          currentPlan.limits.storage.total
                        )
                      )
                    )}
                    style={{
                      width: `${getUsagePercent(currentPlan.limits.storage.used, currentPlan.limits.storage.total)}%`,
                    }}
                  />
                </div>
              </div>

              {/* API Calls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Zap className="h-4 w-4 text-text-muted" />
                    API Calls
                  </div>
                  <div className="text-sm">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        getUsageColor(
                          getUsagePercent(
                            currentPlan.limits.apiCalls.used,
                            currentPlan.limits.apiCalls.total
                          )
                        )
                      )}
                    >
                      {currentPlan.limits.apiCalls.used.toLocaleString()}
                    </span>
                    <span className="text-text-muted">
                      {' '}
                      / {currentPlan.limits.apiCalls.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      getUsageBarColor(
                        getUsagePercent(
                          currentPlan.limits.apiCalls.used,
                          currentPlan.limits.apiCalls.total
                        )
                      )
                    )}
                    style={{
                      width: `${getUsagePercent(currentPlan.limits.apiCalls.used, currentPlan.limits.apiCalls.total)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-background px-6 py-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Receipt className="h-4 w-4 text-secondary" /> Invoice History
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Invoices</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-text-muted" />
                          <span className="font-mono text-xs text-text-primary">{inv.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{inv.date}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{inv.plan}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                            inv.status === 'paid'
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : inv.status === 'pending'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : 'bg-danger/10 text-danger border-danger/20'
                          )}
                        >
                          {inv.status === 'paid' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : inv.status === 'pending' ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="View"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        <Receipt className="mx-auto h-10 w-10 mb-3" />
                        <p>No invoices match your filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Methods & Quick Actions */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-secondary" /> Payment Methods
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddCard(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <div className="space-y-3">
              {paymentMethodsData.map((pm) => (
                <div
                  key={pm.id}
                  className={cn(
                    'rounded-lg border p-4 transition-all',
                    pm.isDefault
                      ? 'border-secondary/30 bg-secondary/5'
                      : 'border-border bg-background'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          pm.type === 'visa' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                        )}
                      >
                        <CreditCard
                          className={cn(
                            'h-5 w-5',
                            pm.type === 'visa' ? 'text-blue-500' : 'text-orange-500'
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary capitalize">
                          {pm.type} •••• {pm.last4}
                        </p>
                        <p className="text-xs text-text-muted">Expires {pm.expiry}</p>
                      </div>
                    </div>
                    {pm.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {!pm.isDefault && (
                      <button
                        onClick={() => handleSetDefault(pm.id)}
                        className="text-xs text-secondary hover:underline"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCard(pm.id)}
                      className={cn(
                        'text-xs text-danger hover:underline',
                        !pm.isDefault && 'ml-auto'
                      )}
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
              {paymentMethodsData.length === 0 && (
                <div className="text-center py-6 text-text-muted text-sm">
                  <CreditCard className="mx-auto h-8 w-8 mb-2" />
                  <p>No payment methods on file.</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" /> Billing Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Billing Email</span>
                <span className="text-text-primary">billing@grandhotel.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax ID</span>
                <span className="text-text-primary font-mono">US-12-3456789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Address</span>
                <span className="text-text-primary text-right">
                  123 Hotel Ave
                  <br />
                  Boston, MA 02101
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Details
            </Button>
          </div>

          {/* Security Note */}
          <div className="rounded-lg border border-border bg-background p-4 flex items-start gap-3">
            <Lock className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">
              Your payment information is encrypted and processed securely via Stripe. Unified PMS
              is PCI DSS compliant.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Upgrade Modal ─── */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgrade(false)}
          />
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Change Your Plan</h2>
                <p className="text-xs text-text-muted">
                  Upgrade or downgrade at any time. Changes take effect next billing cycle.
                </p>
              </div>
              <button
                onClick={() => setShowUpgrade(false)}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3">
                <span
                  className={cn(
                    'text-sm',
                    billingInterval === 'monthly'
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted'
                  )}
                >
                  Monthly
                </span>
                <button
                  onClick={() =>
                    setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')
                  }
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    billingInterval === 'annual' ? 'bg-secondary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                      billingInterval === 'annual' ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span
                  className={cn(
                    'text-sm',
                    billingInterval === 'annual'
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted'
                  )}
                >
                  Annual
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Save 17%
                  </span>
                </span>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {planTiers.map((plan) => (
                  <PlanCard
                    key={plan.name}
                    plan={plan}
                    isCurrent={plan.name === currentPlan.name}
                    onSelect={(p) => handleUpgrade(p)}
                    billingInterval={billingInterval}
                  />
                ))}
              </div>

              <div className="rounded-lg border border-border bg-surface p-4 text-center">
                <p className="text-sm text-text-secondary">
                  Need a custom solution?{' '}
                  <button className="text-secondary hover:underline font-medium">
                    Contact Sales
                  </button>{' '}
                  for Enterprise pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upgrade Confirmation Modal ─── */}
      {showUpgradeConfirm && upgradePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgradeConfirm(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-surface px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Confirm Plan Change</h3>
                  <p className="text-xs text-text-muted">Prorated billing breakdown</p>
                </div>
                <button
                  onClick={() => setShowUpgradeConfirm(false)}
                  className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Proration Breakdown */}
            <div className="p-6 space-y-5">
              {/* Plan comparison */}
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Current</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">{currentPlan.name}</p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(
                      billingInterval === 'annual' ? currentPlan.annualPrice : currentPlan.price
                    )}
                    /{billingInterval === 'annual' ? 'yr' : 'mo'}
                  </p>
                </div>
                <ArrowRightLeft className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex-1 rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-center">
                  <p className="text-xs text-secondary uppercase tracking-wider font-medium">New</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {upgradePreview.plan.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(
                      billingInterval === 'annual'
                        ? upgradePreview.plan.annualPrice
                        : upgradePreview.plan.price
                    )}
                    /{billingInterval === 'annual' ? 'yr' : 'mo'}
                  </p>
                </div>
              </div>

              {/* Billing cycle info */}
              <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Billing cycle resets</span>
                  <span className="text-text-primary font-medium">
                    {new Date(currentPlan.renewalDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Prorated charge today</span>
                  <span className="text-text-primary font-medium font-mono">
                    {formatCurrency(
                      billingInterval === 'annual'
                        ? Math.round(
                            (upgradePreview.plan.annualPrice - currentPlan.annualPrice) * 0.3
                          )
                        : Math.round((upgradePreview.plan.price - currentPlan.price) * 0.3)
                    )}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary font-medium">New recurring charge</span>
                  <span className="text-text-primary font-bold font-mono">
                    {formatCurrency(
                      billingInterval === 'annual'
                        ? upgradePreview.plan.annualPrice
                        : upgradePreview.plan.price
                    )}
                    /{billingInterval === 'annual' ? 'yr' : 'mo'}
                  </span>
                </div>
              </div>

              {/* Feature delta */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  What changes
                </p>
                <div className="space-y-2">
                  {upgradePreview.plan.features
                    .filter((f) => !currentPlan.features.includes(f))
                    .map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>+ {f}</span>
                      </div>
                    ))}
                  {currentPlan.features
                    .filter((f) => !upgradePreview.plan.features.includes(f))
                    .map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Ban className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                        <span className="text-text-muted">– {f}</span>
                      </div>
                    ))}
                  {upgradePreview.plan.features.filter((f) => !currentPlan.features.includes(f))
                    .length === 0 &&
                    currentPlan.features.filter((f) => !upgradePreview.plan.features.includes(f))
                      .length === 0 && (
                      <p className="text-sm text-text-muted">
                        Same feature set — billing change only
                      </p>
                    )}
                </div>
              </div>

              {/* Room limit warning */}
              {currentPlan.limits.rooms.used > upgradePreview.plan.roomLimit && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-danger">
                    You currently have {currentPlan.limits.rooms.used} rooms, but{' '}
                    {upgradePreview.plan.name} supports up to {upgradePreview.plan.roomLimit}.
                    Please reduce rooms or choose a higher plan.
                  </p>
                </div>
              )}

              {/* Confirm button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradeConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={confirmUpgrade}
                  disabled={currentPlan.limits.rooms.used > upgradePreview.plan.roomLimit}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Confirm Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Card Modal ─── */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddCard(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Add Payment Method</h3>
              <button
                onClick={() => setShowAddCard(false)}
                className="rounded-md p-1 hover:bg-surface text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddCard(false);
              }}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    CVC
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="123"
                      className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Name on Card
                </label>
                <input
                  type="text"
                  placeholder="Grand Hotel Corp"
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCard(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="secondary">
                  <Check className="mr-1.5 h-4 w-4" /> Add Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Invoice Detail Modal ─── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden">
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-white">
                  U
                </div>
                <span className="text-sm font-semibold text-text-primary">Unified PMS</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider">Invoice</p>
                <p className="text-lg font-bold text-text-primary">{selectedInvoice.id}</p>
                <p className="text-xs text-text-muted">{selectedInvoice.date}</p>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Plan</span>
                  <span className="text-text-primary">{selectedInvoice.plan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Payment Method</span>
                  <span className="text-text-primary">{selectedInvoice.method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      selectedInvoice.status === 'paid' ? 'text-accent' : 'text-warning'
                    )}
                  >
                    {selectedInvoice.status.charAt(0).toUpperCase() +
                      selectedInvoice.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-bold">
                <span className="text-text-primary">Total</span>
                <span className="font-mono text-text-primary">
                  {formatCurrency(selectedInvoice.amount)}
                </span>
              </div>
            </div>
            <div className="border-t border-border bg-surface px-6 py-3 flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
