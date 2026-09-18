/* src/app/app/ar/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Building2,
  Search,
  Filter,
  Download,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Printer,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  ArrowRightLeft,
  MoreHorizontal,
  Edit3,
  Trash2,
  Send,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Wallet,
  Landmark,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Layers,
  User,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const corporateAccounts = [
  {
    id: 'CORP-001',
    name: 'Acme Corporation',
    contact: 'Sarah Williams',
    email: 's.williams@acme.com',
    phone: '+1 555-1001',
    address: '100 Corporate Plaza, New York, NY 10001',
    taxId: '12-3456789',
    creditLimit: 50000,
    currentBalance: 28450,
    paymentTerms: 'Net 30',
    status: 'active',
    lastPayment: '2026-07-15',
    avgDaysToPay: 28,
    totalInvoiced: 145000,
    totalPaid: 116550,
  },
  {
    id: 'CORP-002',
    name: 'Nexus Pharma',
    contact: 'David Park',
    email: 'd.park@nexuspharma.com',
    phone: '+1 555-1002',
    address: '200 Biotech Way, Boston, MA 02101',
    taxId: '98-7654321',
    creditLimit: 75000,
    currentBalance: 42100,
    paymentTerms: 'Net 30',
    status: 'active',
    lastPayment: '2026-08-01',
    avgDaysToPay: 32,
    totalInvoiced: 210000,
    totalPaid: 167900,
  },
  {
    id: 'CORP-003',
    name: 'DevSummit Inc.',
    contact: 'Michael Chen',
    email: 'm.chen@devsummit.io',
    phone: '+1 555-1003',
    address: '300 Tech Blvd, San Francisco, CA 94102',
    taxId: '45-6789012',
    creditLimit: 25000,
    currentBalance: 8750,
    paymentTerms: 'Net 15',
    status: 'active',
    lastPayment: '2026-08-10',
    avgDaysToPay: 14,
    totalInvoiced: 68000,
    totalPaid: 59250,
  },
  {
    id: 'CORP-004',
    name: 'State Youth Soccer League',
    contact: 'Coach Martinez',
    email: 'coach.m@sysl.org',
    phone: '+1 555-1004',
    address: '400 Sports Complex Dr, Austin, TX 78701',
    taxId: '22-3344556',
    creditLimit: 10000,
    currentBalance: 3200,
    paymentTerms: 'Net 15',
    status: 'hold',
    lastPayment: '2026-06-20',
    avgDaysToPay: 45,
    totalInvoiced: 25000,
    totalPaid: 21800,
  },
  {
    id: 'CORP-005',
    name: 'Grand Hotel Corp',
    contact: 'Billing Department',
    email: 'billing@grandhotel.com',
    phone: '+1 555-1005',
    address: '123 Hotel Ave, Boston, MA 02101',
    taxId: '11-2233445',
    creditLimit: 100000,
    currentBalance: 0,
    paymentTerms: 'Net 30',
    status: 'active',
    lastPayment: '2026-08-12',
    avgDaysToPay: 22,
    totalInvoiced: 320000,
    totalPaid: 320000,
  },
];

const invoices = [
  {
    id: 'INV-2026-0812-001',
    accountId: 'CORP-001',
    date: '2026-08-12',
    dueDate: '2026-09-11',
    amount: 8500,
    paid: 0,
    status: 'open',
    description: 'Group block — TechConf 2026 (45 rooms × 3 nights)',
  },
  {
    id: 'INV-2026-0801-001',
    accountId: 'CORP-001',
    date: '2026-08-01',
    dueDate: '2026-08-31',
    amount: 12400,
    paid: 0,
    status: 'open',
    description: 'Monthly corporate lodging — July 2026',
  },
  {
    id: 'INV-2026-0715-001',
    accountId: 'CORP-001',
    date: '2026-07-15',
    dueDate: '2026-08-14',
    amount: 7550,
    paid: 7550,
    status: 'paid',
    description: 'Q3 Sales Meeting (25 rooms × 2 nights)',
  },
  {
    id: 'INV-2026-0810-001',
    accountId: 'CORP-002',
    date: '2026-08-10',
    dueDate: '2026-09-09',
    amount: 15200,
    paid: 0,
    status: 'open',
    description: 'Regional Sales Kickoff (60 rooms × 4 nights)',
  },
  {
    id: 'INV-2026-0720-001',
    accountId: 'CORP-002',
    date: '2026-07-20',
    dueDate: '2026-08-19',
    amount: 18900,
    paid: 5000,
    status: 'partial',
    description: 'Pharma Conference (80 rooms × 3 nights)',
  },
  {
    id: 'INV-2026-0800-001',
    accountId: 'CORP-002',
    date: '2026-08-05',
    dueDate: '2026-09-04',
    amount: 8000,
    paid: 0,
    status: 'open',
    description: 'Executive retreat — August 2026',
  },
  {
    id: 'INV-2026-0815-001',
    accountId: 'CORP-003',
    date: '2026-08-15',
    dueDate: '2026-08-30',
    amount: 4500,
    paid: 0,
    status: 'open',
    description: 'DevSummit team lodging (12 rooms × 3 nights)',
  },
  {
    id: 'INV-2026-0805-001',
    accountId: 'CORP-003',
    date: '2026-08-05',
    dueDate: '2026-08-20',
    amount: 4250,
    paid: 0,
    status: 'overdue',
    description: 'July developer meetup (10 rooms × 3 nights)',
  },
  {
    id: 'INV-2026-0720-002',
    accountId: 'CORP-004',
    date: '2026-07-20',
    dueDate: '2026-08-04',
    amount: 3200,
    paid: 0,
    status: 'overdue',
    description: 'Youth Soccer Tournament (20 rooms × 2 nights)',
  },
  {
    id: 'INV-2026-0812-002',
    accountId: 'CORP-005',
    date: '2026-08-12',
    dueDate: '2026-09-11',
    amount: 6500,
    paid: 6500,
    status: 'paid',
    description: 'Corporate training event (15 rooms × 2 nights)',
  },
  {
    id: 'INV-2026-0801-002',
    accountId: 'CORP-001',
    date: '2026-08-01',
    dueDate: '2026-08-31',
    amount: 3400,
    paid: 0,
    status: 'open',
    description: 'Catering — Executive lunch series',
  },
  {
    id: 'INV-2026-0710-001',
    accountId: 'CORP-002',
    date: '2026-07-10',
    dueDate: '2026-08-09',
    amount: 11200,
    paid: 11200,
    status: 'paid',
    description: 'Monthly corporate lodging — June 2026',
  },
  {
    id: 'INV-2026-0818-001',
    accountId: 'CORP-003',
    date: '2026-08-18',
    dueDate: '2026-09-02',
    amount: 2800,
    paid: 0,
    status: 'open',
    description: 'Board meeting — August 18-19',
  },
  {
    id: 'INV-2026-0808-001',
    accountId: 'CORP-001',
    date: '2026-08-08',
    dueDate: '2026-09-07',
    amount: 5600,
    paid: 0,
    status: 'open',
    description: 'Event space rental — Grand Ballroom',
  },
];

const payments = [
  {
    id: 'PAY-2026-0812-001',
    accountId: 'CORP-005',
    invoiceId: 'INV-2026-0812-002',
    date: '2026-08-12',
    amount: 6500,
    method: 'Wire Transfer',
    reference: 'WF-88721',
    postedBy: 'Sarah J.',
  },
  {
    id: 'PAY-2026-0801-001',
    accountId: 'CORP-002',
    invoiceId: 'INV-2026-0710-001',
    date: '2026-08-01',
    amount: 11200,
    method: 'ACH',
    reference: 'ACH-44291',
    postedBy: 'Mike C.',
  },
  {
    id: 'PAY-2026-0725-001',
    accountId: 'CORP-002',
    invoiceId: 'INV-2026-0720-001',
    date: '2026-07-25',
    amount: 5000,
    method: 'Check',
    reference: 'CHK-11203',
    postedBy: 'Sarah J.',
  },
  {
    id: 'PAY-2026-0715-001',
    accountId: 'CORP-001',
    invoiceId: 'INV-2026-0715-001',
    date: '2026-07-15',
    amount: 7550,
    method: 'ACH',
    reference: 'ACH-33812',
    postedBy: 'Mike C.',
  },
  {
    id: 'PAY-2026-0810-001',
    accountId: 'CORP-003',
    invoiceId: 'INV-2026-0715-002',
    date: '2026-08-10',
    amount: 2500,
    method: 'Credit Card',
    reference: 'CC-****4242',
    postedBy: 'Sarah J.',
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function daysOverdue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date('2026-08-15');
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getAgingBucket(dueDate, status) {
  if (status === 'paid') return 'current';
  const overdue = daysOverdue(dueDate);
  if (overdue === 0) return 'current';
  if (overdue <= 30) return '1-30';
  if (overdue <= 60) return '31-60';
  if (overdue <= 90) return '61-90';
  return '90+';
}

const statusMeta = {
  open: { label: 'Open', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  paid: { label: 'Paid', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  partial: {
    label: 'Partial',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  overdue: {
    label: 'Overdue',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  void: {
    label: 'Void',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

const accountStatusMeta = {
  active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20' },
  hold: { label: 'Credit Hold', class: 'bg-danger/10 text-danger border-danger/20' },
  inactive: { label: 'Inactive', class: 'bg-neutral/10 text-text-muted border-border' },
};

const agingColors = {
  current: 'bg-accent',
  '1-30': 'bg-info',
  '31-60': 'bg-warning',
  '61-90': 'bg-orange-500',
  '90+': 'bg-danger',
};

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last month
            </p>
          )}
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

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.open;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function AccountStatusBadge({ status }) {
  const meta = accountStatusMeta[status] || accountStatusMeta.active;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Aging Report Chart ─── */
function AgingChart({ data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0)
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-text-muted mb-3" />
        <p className="text-text-muted">No outstanding receivables</p>
      </div>
    );

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Aging Breakdown</h3>
      <div className="space-y-3">
        {[
          { key: 'current', label: 'Current (0-30 days)', color: 'text-accent', bar: 'bg-accent' },
          { key: '1-30', label: '1-30 Days Past Due', color: 'text-info', bar: 'bg-info' },
          { key: '31-60', label: '31-60 Days Past Due', color: 'text-warning', bar: 'bg-warning' },
          {
            key: '61-90',
            label: '61-90 Days Past Due',
            color: 'text-orange-500',
            bar: 'bg-orange-500',
          },
          { key: '90+', label: '90+ Days Past Due', color: 'text-danger', bar: 'bg-danger' },
        ].map((bucket) => {
          const amount = data[bucket.key] || 0;
          const pct = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={bucket.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">{bucket.label}</span>
                <span className={cn('text-xs font-bold font-mono', bucket.color)}>
                  {formatCurrency(amount)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', bucket.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Total Outstanding</span>
          <span className="text-lg font-bold font-mono text-text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Invoice Detail Modal ─── */
function InvoiceDetailModal({ invoice, account, onClose, onPostPayment }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.amount - invoice.paid);
  const [paymentMethod, setPaymentMethod] = useState('ach');
  const [reference, setReference] = useState('');

  const balance = invoice.amount - invoice.paid;
  const overdue = daysOverdue(invoice.dueDate);

  const handlePayment = (e) => {
    e.preventDefault();
    onPostPayment(invoice.id, parseFloat(paymentAmount) || 0, paymentMethod, reference);
    setShowPaymentForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{invoice.id}</h3>
            <p className="text-xs text-text-muted">{account.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Invoice Amount</p>
              <p className="mt-1 text-lg font-bold font-mono text-text-primary">
                {formatCurrency(invoice.amount)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Paid</p>
              <p className="mt-1 text-lg font-bold font-mono text-accent">
                {formatCurrency(invoice.paid)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Balance</p>
              <p
                className={cn(
                  'mt-1 text-lg font-bold font-mono',
                  balance > 0 ? 'text-danger' : 'text-accent'
                )}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Invoice Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="h-4 w-4 text-text-muted" />
                Invoice Date: <span className="text-text-primary">{invoice.date}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="h-4 w-4 text-text-muted" />
                Due Date: <span className="text-text-primary">{invoice.dueDate}</span>
              </div>
              {overdue > 0 && (
                <div className="flex items-center gap-2 text-danger col-span-2">
                  <AlertTriangle className="h-4 w-4" />
                  {overdue} days overdue
                </div>
              )}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-text-secondary">{invoice.description}</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Bill To
            </h4>
            <p className="text-sm font-medium text-text-primary">{account.name}</p>
            <p className="text-xs text-text-secondary">{account.contact}</p>
            <div className="space-y-1 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" /> {account.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> {account.phone}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {account.address}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {showPaymentForm ? (
            <form
              onSubmit={handlePayment}
              className="rounded-xl border border-border bg-surface p-4 space-y-4"
            >
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-secondary" /> Post Payment
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={balance}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ach">ACH / Wire</option>
                    <option value="check">Check</option>
                    <option value="cc">Credit Card</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Reference #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Check #, Wire ref, etc."
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="secondary" size="sm">
                  <Check className="mr-1.5 h-4 w-4" /> Post Payment
                </Button>
              </div>
            </form>
          ) : (
            balance > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowPaymentForm(true)}>
                  <DollarSign className="mr-1.5 h-4 w-4" /> Post Payment
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="mr-1.5 h-4 w-4" /> Send Reminder
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="mr-1.5 h-4 w-4" /> Print
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Account Detail Drawer ─── */
function AccountDetailDrawer({ account, invoices, onClose, onPostPayment }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const accountInvoices = invoices.filter((inv) => inv.accountId === account.id);
  const openInvoices = accountInvoices.filter((inv) => inv.status !== 'paid');
  const paidInvoices = accountInvoices.filter((inv) => inv.status === 'paid');

  const creditUtilization = (account.currentBalance / account.creditLimit) * 100;

  return (
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
                <h2 className="text-lg font-bold text-text-primary">{account.name}</h2>
                <p className="text-xs text-text-muted">
                  {account.id} · {account.taxId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AccountStatusBadge status={account.status} />
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
          {/* Balance & Credit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Current Balance</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold font-mono',
                  account.currentBalance > 0 ? 'text-danger' : 'text-accent'
                )}
              >
                {formatCurrency(account.currentBalance)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Credit Limit</p>
              <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(account.creditLimit)}
              </p>
            </div>
          </div>

          {/* Credit Utilization */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Credit Utilization</span>
              <span
                className={cn(
                  'text-sm font-bold font-mono',
                  creditUtilization > 80
                    ? 'text-danger'
                    : creditUtilization > 50
                      ? 'text-warning'
                      : 'text-accent'
                )}
              >
                {creditUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  creditUtilization > 80
                    ? 'bg-danger'
                    : creditUtilization > 50
                      ? 'bg-warning'
                      : 'bg-accent'
                )}
                style={{ width: `${Math.min(100, creditUtilization)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Available: {formatCurrency(account.creditLimit - account.currentBalance)}
            </p>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <User className="h-4 w-4 text-text-muted" /> {account.contact}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="h-4 w-4 text-text-muted" /> {account.email}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="h-4 w-4 text-text-muted" /> {account.phone}
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="h-4 w-4 text-text-muted" /> {account.address}
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Invoiced</p>
              <p className="mt-1 text-lg font-bold font-mono text-text-primary">
                {formatCurrency(account.totalInvoiced)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Paid</p>
              <p className="mt-1 text-lg font-bold font-mono text-accent">
                {formatCurrency(account.totalPaid)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Payment Terms</p>
              <p className="mt-1 text-lg font-bold text-text-primary">{account.paymentTerms}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                Avg. Days to Pay
              </p>
              <p className="mt-1 text-lg font-bold text-text-primary">{account.avgDaysToPay}</p>
            </div>
          </div>

          {/* Open Invoices */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Open Invoices ({openInvoices.length})
            </h4>
            <div className="space-y-2">
              {openInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="w-full rounded-lg border border-border bg-surface p-3 text-left hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-muted">{inv.id}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <span className="text-sm font-bold font-mono text-text-primary">
                      {formatCurrency(inv.amount - inv.paid)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary truncate">{inv.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-text-muted">
                    <span>Due: {inv.dueDate}</span>
                    {daysOverdue(inv.dueDate) > 0 && (
                      <span className="text-danger">{daysOverdue(inv.dueDate)} days overdue</span>
                    )}
                  </div>
                </button>
              ))}
              {openInvoices.length === 0 && (
                <div className="text-center py-4 text-text-muted text-sm">No open invoices</div>
              )}
            </div>
          </div>

          {/* Paid Invoices */}
          {paidInvoices.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Paid Invoices ({paidInvoices.length})
              </h4>
              <div className="space-y-2 opacity-60">
                {paidInvoices.map((inv) => (
                  <div key={inv.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-text-muted">{inv.id}</span>
                      <span className="text-sm font-bold font-mono text-accent">
                        {formatCurrency(inv.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary truncate">{inv.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          account={account}
          onClose={() => setSelectedInvoice(null)}
          onPostPayment={onPostPayment}
        />
      )}
    </div>
  );
}

/* ─── New Invoice Modal ─── */
function NewInvoiceModal({ accounts, onClose, onCreate }) {
  const [form, setForm] = useState({
    accountId: accounts[0]?.id || '',
    amount: '',
    dueDate: '',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const account = accounts.find((a) => a.id === form.accountId);
    onCreate({
      id: `INV-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-001`,
      accountId: form.accountId,
      date: new Date().toISOString().split('T')[0],
      dueDate: form.dueDate,
      amount: parseFloat(form.amount) || 0,
      paid: 0,
      status: 'open',
      description: form.description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Create Invoice</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Corporate Account
            </label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Due Date
            </label>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Invoice description..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AccountsReceivablePage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'invoices' | 'accounts'
  const [accounts, setAccounts] = useState(corporateAccounts);
  const [invoiceList, setInvoiceList] = useState(invoices);
  const [paymentList, setPaymentList] = useState(payments);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* ─── Computed Data ─── */
  const totalOutstanding = useMemo(
    () =>
      invoiceList
        .filter((inv) => inv.status !== 'paid')
        .reduce((s, inv) => s + (inv.amount - inv.paid), 0),
    [invoiceList]
  );

  const totalOverdue = useMemo(
    () =>
      invoiceList.filter((inv) => inv.status === 'overdue').reduce((s, inv) => s + inv.amount, 0),
    [invoiceList]
  );

  const agingData = useMemo(() => {
    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    invoiceList
      .filter((inv) => inv.status !== 'paid')
      .forEach((inv) => {
        const bucket = getAgingBucket(inv.dueDate, inv.status);
        const balance = inv.amount - inv.paid;
        buckets[bucket] += balance;
      });
    return buckets;
  }, [invoiceList]);

  const filteredInvoices = useMemo(() => {
    let result = invoiceList.filter((inv) => {
      const matchesQuery =
        !query ||
        inv.id.toLowerCase().includes(query.toLowerCase()) ||
        inv.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [invoiceList, query, statusFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesQuery =
        !query ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.id.toLowerCase().includes(query.toLowerCase()) ||
        a.contact.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [accounts, query]);

  /* ─── Handlers ─── */
  const handlePostPayment = (invoiceId, amount, method, reference) => {
    setInvoiceList((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPaid = inv.paid + amount;
        let newStatus = inv.status;
        if (newPaid >= inv.amount) newStatus = 'paid';
        else if (newPaid > 0) newStatus = 'partial';
        return { ...inv, paid: newPaid, status: newStatus };
      })
    );

    // Update account balance
    const invoice = invoiceList.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== invoice.accountId) return acc;
          return {
            ...acc,
            currentBalance: Math.max(0, acc.currentBalance - amount),
            totalPaid: acc.totalPaid + amount,
          };
        })
      );
    }

    setPaymentList((prev) => [
      ...prev,
      {
        id: `PAY-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-001`,
        accountId: invoice?.accountId,
        invoiceId,
        date: new Date().toISOString().split('T')[0],
        amount,
        method,
        reference,
        postedBy: 'You',
      },
    ]);
  };

  const handleCreateInvoice = (newInvoice) => {
    setInvoiceList((prev) => [newInvoice, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== newInvoice.accountId) return acc;
        return {
          ...acc,
          currentBalance: acc.currentBalance + newInvoice.amount,
          totalInvoiced: acc.totalInvoiced + newInvoice.amount,
        };
      })
    );
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Accounts Receivable</h1>
          <p className="text-sm text-text-secondary">
            Aging reports, invoice tracking, and corporate accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewInvoice(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={Wallet}
          color="text-danger"
          subtext={`${invoiceList.filter((inv) => inv.status !== 'paid').length} open invoices`}
        />
        <StatCard
          label="Overdue Amount"
          value={formatCurrency(totalOverdue)}
          icon={AlertTriangle}
          color="text-danger"
          subtext={`${invoiceList.filter((inv) => inv.status === 'overdue').length} overdue invoices`}
        />
        <StatCard
          label="Total Invoiced (YTD)"
          value={formatCurrency(accounts.reduce((s, a) => s + a.totalInvoiced, 0))}
          icon={FileText}
          color="text-secondary"
          trend={12}
        />
        <StatCard
          label="Collection Rate"
          value={`${((accounts.reduce((s, a) => s + a.totalPaid, 0) / accounts.reduce((s, a) => s + a.totalInvoiced, 0)) * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="text-accent"
          subtext="YTD performance"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'accounts', label: 'Corporate Accounts', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Aging Chart */}
          <div className="lg:col-span-2">
            <AgingChart data={agingData} />
          </div>

          {/* Quick Summary */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">At a Glance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Open Invoices</span>
                  <span className="font-bold font-mono text-text-primary">
                    {invoiceList.filter((inv) => inv.status !== 'paid').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Overdue</span>
                  <span className="font-bold font-mono text-danger">
                    {invoiceList.filter((inv) => inv.status === 'overdue').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Partially Paid</span>
                  <span className="font-bold font-mono text-warning">
                    {invoiceList.filter((inv) => inv.status === 'partial').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Paid (This Month)</span>
                  <span className="font-bold font-mono text-accent">
                    {
                      invoiceList.filter(
                        (inv) => inv.status === 'paid' && inv.date.startsWith('2026-08')
                      ).length
                    }
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Active Accounts</span>
                  <span className="font-bold font-mono text-text-primary">
                    {accounts.filter((a) => a.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">On Credit Hold</span>
                  <span className="font-bold font-mono text-danger">
                    {accounts.filter((a) => a.status === 'hold').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Debtors */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Top Debtors</h3>
              <div className="space-y-3">
                {[...accounts]
                  .filter((a) => a.currentBalance > 0)
                  .sort((a, b) => b.currentBalance - a.currentBalance)
                  .slice(0, 5)
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccount(account)}
                      className="w-full flex items-center justify-between text-left hover:bg-background/50 rounded-lg p-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{account.name}</p>
                        <p className="text-xs text-text-muted">{account.paymentTerms}</p>
                      </div>
                      <span className="text-sm font-bold font-mono text-danger">
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Invoices Tab ─── */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((inv) => {
                    const account = accounts.find((a) => a.id === inv.accountId);
                    const balance = inv.amount - inv.paid;
                    const overdue = daysOverdue(inv.dueDate);
                    return (
                      <tr key={inv.id} className="hover:bg-background/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-text-muted" />
                            <span className="font-mono text-xs text-text-primary">{inv.id}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted truncate max-w-[200px]">
                            {inv.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{account?.name}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{inv.date}</td>
                        <td className="px-4 py-3">
                          <div className="text-text-secondary text-xs">{inv.dueDate}</div>
                          {overdue > 0 && (
                            <div className="text-[10px] text-danger font-medium">
                              {overdue} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                          {formatCurrency(balance)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {balance > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                                title="Post Payment"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <FileText className="mx-auto h-10 w-10 mb-3" />
                        <p>No invoices match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Accounts Tab ─── */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Account Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => {
              const creditUtilization = (account.currentBalance / account.creditLimit) * 100;
              const accountInvoices = invoiceList.filter(
                (inv) => inv.accountId === account.id && inv.status !== 'paid'
              );
              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className="group rounded-xl border border-border bg-surface p-5 cursor-pointer transition-all hover:border-secondary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                        <Building2 className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{account.name}</h3>
                        <p className="text-xs text-text-muted">{account.id}</p>
                      </div>
                    </div>
                    <AccountStatusBadge status={account.status} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Current Balance</span>
                      <span
                        className={cn(
                          'text-sm font-bold font-mono',
                          account.currentBalance > 0 ? 'text-danger' : 'text-accent'
                        )}
                      >
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Credit Limit</span>
                      <span className="text-sm font-mono text-text-primary">
                        {formatCurrency(account.creditLimit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Open Invoices</span>
                      <span className="text-sm font-bold text-text-primary">
                        {accountInvoices.length}
                      </span>
                    </div>
                  </div>

                  {/* Credit Utilization Bar */}
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          creditUtilization > 80
                            ? 'bg-danger'
                            : creditUtilization > 50
                              ? 'bg-warning'
                              : 'bg-accent'
                        )}
                        style={{ width: `${Math.min(100, creditUtilization)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-text-muted">
                      {creditUtilization.toFixed(1)}% utilized
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
                    <span>Terms: {account.paymentTerms}</span>
                    <span>Avg Pay: {account.avgDaysToPay} days</span>
                  </div>
                </div>
              );
            })}
            {filteredAccounts.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No accounts match your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showNewInvoice && (
        <NewInvoiceModal
          accounts={accounts}
          onClose={() => setShowNewInvoice(false)}
          onCreate={handleCreateInvoice}
        />
      )}

      {selectedAccount && (
        <AccountDetailDrawer
          account={selectedAccount}
          invoices={invoiceList}
          onClose={() => setSelectedAccount(null)}
          onPostPayment={handlePostPayment}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          account={accounts.find((a) => a.id === selectedInvoice.accountId)}
          onClose={() => setSelectedInvoice(null)}
          onPostPayment={handlePostPayment}
        />
      )}
    </div>
  );
}
