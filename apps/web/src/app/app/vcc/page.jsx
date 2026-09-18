/* src/app/app/vcc/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Download,
  MoreHorizontal,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Zap,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Ban,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Bell,
  Settings,
  History,
  Wallet,
  Receipt,
  Globe,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const initialCards = [
  {
    id: 'VCC-2026-001',
    last4: '4242',
    brand: 'visa',
    holderName: 'Grand Hotel Corp',
    type: 'single_use',
    status: 'active',
    limit: 5000.0,
    spent: 1890.5,
    remaining: 3109.5,
    currency: 'USD',
    issued: '2026-08-01',
    expires: '2026-09-01',
    merchantLock: 'booking.com',
    autoRecharge: true,
    rechargeThreshold: 500.0,
    rechargeAmount: 2000.0,
    transactions: [
      {
        id: 'TXN-001',
        date: '2026-08-12',
        merchant: 'Booking.com',
        amount: 450.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-002',
        date: '2026-08-10',
        merchant: 'Booking.com',
        amount: 890.5,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-003',
        date: '2026-08-08',
        merchant: 'Booking.com',
        amount: 550.0,
        status: 'settled',
        category: 'OTA Commission',
      },
    ],
    alerts: [{ id: 1, type: 'warning', message: 'Card expires in 17 days', date: '2026-08-15' }],
  },
  {
    id: 'VCC-2026-002',
    last4: '8891',
    brand: 'mastercard',
    holderName: 'Grand Hotel Corp',
    type: 'multi_use',
    status: 'active',
    limit: 10000.0,
    spent: 3240.0,
    remaining: 6760.0,
    currency: 'USD',
    issued: '2026-07-15',
    expires: '2026-10-15',
    merchantLock: null,
    autoRecharge: true,
    rechargeThreshold: 1000.0,
    rechargeAmount: 5000.0,
    transactions: [
      {
        id: 'TXN-004',
        date: '2026-08-14',
        merchant: 'Expedia Group',
        amount: 1200.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-005',
        date: '2026-08-11',
        merchant: 'Expedia Group',
        amount: 890.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-006',
        date: '2026-08-09',
        merchant: 'Hotelbeds',
        amount: 650.0,
        status: 'pending',
        category: 'Wholesaler',
      },
      {
        id: 'TXN-007',
        date: '2026-08-07',
        merchant: 'Expedia Group',
        amount: 500.0,
        status: 'settled',
        category: 'OTA Commission',
      },
    ],
    alerts: [],
  },
  {
    id: 'VCC-2026-003',
    last4: '3312',
    brand: 'visa',
    holderName: 'Grand Hotel Corp',
    type: 'single_use',
    status: 'active',
    limit: 2500.0,
    spent: 2500.0,
    remaining: 0.0,
    currency: 'USD',
    issued: '2026-08-05',
    expires: '2026-09-05',
    merchantLock: 'airbnb.com',
    autoRecharge: false,
    rechargeThreshold: 0,
    rechargeAmount: 0,
    transactions: [
      {
        id: 'TXN-008',
        date: '2026-08-13',
        merchant: 'Airbnb',
        amount: 1200.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-009',
        date: '2026-08-12',
        merchant: 'Airbnb',
        amount: 800.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-010',
        date: '2026-08-10',
        merchant: 'Airbnb',
        amount: 500.0,
        status: 'settled',
        category: 'OTA Commission',
      },
    ],
    alerts: [
      {
        id: 2,
        type: 'danger',
        message: 'Card limit reached — auto-recharge disabled',
        date: '2026-08-15',
      },
      { id: 3, type: 'warning', message: 'Card expires in 21 days', date: '2026-08-15' },
    ],
  },
  {
    id: 'VCC-2026-004',
    last4: '7721',
    brand: 'amex',
    holderName: 'Grand Hotel Corp',
    type: 'multi_use',
    status: 'frozen',
    limit: 7500.0,
    spent: 1200.0,
    remaining: 6300.0,
    currency: 'USD',
    issued: '2026-06-20',
    expires: '2026-09-20',
    merchantLock: null,
    autoRecharge: false,
    rechargeThreshold: 0,
    rechargeAmount: 0,
    transactions: [
      {
        id: 'TXN-011',
        date: '2026-07-28',
        merchant: 'Hotelbeds',
        amount: 600.0,
        status: 'settled',
        category: 'Wholesaler',
      },
      {
        id: 'TXN-012',
        date: '2026-07-15',
        merchant: 'Hotelbeds',
        amount: 600.0,
        status: 'settled',
        category: 'Wholesaler',
      },
    ],
    alerts: [{ id: 4, type: 'info', message: 'Card frozen by user', date: '2026-08-10' }],
  },
  {
    id: 'VCC-2026-005',
    last4: '9999',
    brand: 'visa',
    holderName: 'Grand Hotel Corp',
    type: 'single_use',
    status: 'expired',
    limit: 3000.0,
    spent: 2100.0,
    remaining: 0.0,
    currency: 'USD',
    issued: '2026-05-01',
    expires: '2026-07-01',
    merchantLock: 'booking.com',
    autoRecharge: false,
    rechargeThreshold: 0,
    rechargeAmount: 0,
    transactions: [
      {
        id: 'TXN-013',
        date: '2026-06-15',
        merchant: 'Booking.com',
        amount: 900.0,
        status: 'settled',
        category: 'OTA Commission',
      },
      {
        id: 'TXN-014',
        date: '2026-06-01',
        merchant: 'Booking.com',
        amount: 1200.0,
        status: 'settled',
        category: 'OTA Commission',
      },
    ],
    alerts: [{ id: 5, type: 'danger', message: 'Card expired on 2026-07-01', date: '2026-07-01' }],
  },
  {
    id: 'VCC-2026-006',
    last4: '1102',
    brand: 'mastercard',
    holderName: 'Grand Hotel Corp',
    type: 'multi_use',
    status: 'active',
    limit: 15000.0,
    spent: 8750.0,
    remaining: 6250.0,
    currency: 'USD',
    issued: '2026-07-01',
    expires: '2026-12-01',
    merchantLock: null,
    autoRecharge: true,
    rechargeThreshold: 2000.0,
    rechargeAmount: 10000.0,
    transactions: [
      {
        id: 'TXN-015',
        date: '2026-08-14',
        merchant: 'Direct Website',
        amount: 2500.0,
        status: 'settled',
        category: 'Direct Booking',
      },
      {
        id: 'TXN-016',
        date: '2026-08-12',
        merchant: 'Direct Website',
        amount: 1800.0,
        status: 'settled',
        category: 'Direct Booking',
      },
      {
        id: 'TXN-017',
        date: '2026-08-10',
        merchant: 'Direct Website',
        amount: 2200.0,
        status: 'settled',
        category: 'Direct Booking',
      },
      {
        id: 'TXN-018',
        date: '2026-08-08',
        merchant: 'Direct Website',
        amount: 1250.0,
        status: 'pending',
        category: 'Direct Booking',
      },
      {
        id: 'TXN-019',
        date: '2026-08-05',
        merchant: 'Direct Website',
        amount: 1000.0,
        status: 'settled',
        category: 'Direct Booking',
      },
    ],
    alerts: [
      {
        id: 6,
        type: 'info',
        message: 'Auto-recharge triggered 3 times this month',
        date: '2026-08-14',
      },
    ],
  },
];

const cardBrandMeta = {
  visa: {
    label: 'Visa',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-500/10',
  },
  mastercard: {
    label: 'Mastercard',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    bgLight: 'bg-orange-500/10',
  },
  amex: {
    label: 'Amex',
    color: 'bg-teal-500',
    textColor: 'text-teal-500',
    bgLight: 'bg-teal-500/10',
  },
};

const statusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  frozen: {
    label: 'Frozen',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: Lock,
  },
  expired: {
    label: 'Expired',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: Ban,
  },
};

const alertTypeMeta = {
  danger: {
    icon: AlertTriangle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  info: { icon: Bell, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  success: {
    icon: CheckCircle2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
};

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function getExpiringCards(cards) {
  return cards.filter((c) => c.status === 'active' && daysUntil(c.expires) <= 30);
}

function getLowBalanceCards(cards) {
  return cards.filter((c) => c.status === 'active' && c.remaining < c.limit * 0.2);
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
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

function CardVisual({ card, showNumber = false }) {
  const brand = cardBrandMeta[card.brand] || cardBrandMeta.visa;
  const pctUsed = card.limit > 0 ? (card.spent / card.limit) * 100 : 0;
  const daysLeft = daysUntil(card.expires);

  return (
    <div
      className={cn(
        'relative rounded-xl border p-5 transition-all overflow-hidden',
        card.status === 'active'
          ? 'border-border bg-surface hover:shadow-lg hover:border-secondary/30'
          : card.status === 'frozen'
            ? 'border-warning/30 bg-warning/5 opacity-80'
            : 'border-danger/30 bg-danger/5 opacity-60'
      )}
    >
      {/* Card Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div
          className={cn('w-full h-full rounded-full -translate-y-1/2 translate-x-1/2', brand.color)}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-12 rounded-md flex items-center justify-center text-[10px] font-bold text-white',
                brand.color
              )}
            >
              {brand.label.toUpperCase()}
            </div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {card.type === 'single_use' ? 'Single Use' : 'Multi Use'}
            </span>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              statusMeta[card.status].class
            )}
          >
            <div className={cn('h-1.5 w-1.5 rounded-full', statusMeta[card.status].dot)} />
            {statusMeta[card.status].label}
          </span>
        </div>

        {/* Card Number */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold text-text-primary tracking-wider">
              •••• •••• •••• {card.last4}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="rounded-md p-1 hover:bg-surface-elevated text-text-muted transition-colors"
              title="Copy last 4"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">{card.holderName}</p>
        </div>

        {/* Balance Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">Limit: {formatCurrency(card.limit)}</span>
            <span
              className={cn(
                'text-xs font-bold font-mono',
                card.remaining < card.limit * 0.2 ? 'text-danger' : 'text-accent'
              )}
            >
              {formatCurrency(card.remaining)} left
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pctUsed >= 90 ? 'bg-danger' : pctUsed >= 70 ? 'bg-warning' : 'bg-accent'
              )}
              style={{ width: `${Math.min(100, pctUsed)}%` }}
            />
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">
              <Calendar className="h-3 w-3 inline mr-1" />
              Exp {card.expires}
            </span>
            {daysLeft <= 30 && card.status === 'active' && (
              <span className={cn('font-medium', daysLeft <= 7 ? 'text-danger' : 'text-warning')}>
                {daysLeft}d left
              </span>
            )}
          </div>
          {card.merchantLock && (
            <span className="text-text-muted">
              <Lock className="h-3 w-3 inline mr-1" />
              {card.merchantLock}
            </span>
          )}
        </div>

        {/* Auto-recharge indicator */}
        {card.autoRecharge && card.status === 'active' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-secondary">
            <Zap className="h-3 w-3" />
            <span className="font-medium">Auto-recharge</span>
            <span className="text-text-muted">at {formatCurrency(card.rechargeThreshold)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Card Modal ─── */
function NewCardModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    type: 'single_use',
    limit: '',
    currency: 'USD',
    merchantLock: '',
    autoRecharge: false,
    rechargeThreshold: '',
    rechargeAmount: '',
    expiresInDays: 30,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const limit = parseFloat(form.limit) || 0;
    const issued = new Date();
    const expires = new Date();
    expires.setDate(expires.getDate() + parseInt(form.expiresInDays));

    onCreate({
      id: `VCC-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      last4: String(Math.floor(Math.random() * 9000) + 1000),
      brand: ['visa', 'mastercard', 'amex'][Math.floor(Math.random() * 3)],
      holderName: 'Grand Hotel Corp',
      type: form.type,
      status: 'active',
      limit,
      spent: 0,
      remaining: limit,
      currency: form.currency,
      issued: issued.toISOString().split('T')[0],
      expires: expires.toISOString().split('T')[0],
      merchantLock: form.merchantLock || null,
      autoRecharge: form.autoRecharge,
      rechargeThreshold: parseFloat(form.rechargeThreshold) || 0,
      rechargeAmount: parseFloat(form.rechargeAmount) || 0,
      transactions: [],
      alerts: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Issue New Virtual Card</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Card Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'single_use', label: 'Single Use', desc: 'One merchant, auto-expires' },
                { key: 'multi_use', label: 'Multi Use', desc: 'Flexible, recurring charges' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.key })}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    form.type === opt.key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Spending Limit
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: e.target.value })}
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Merchant Lock (Optional)
            </label>
            <input
              type="text"
              value={form.merchantLock}
              onChange={(e) => setForm({ ...form, merchantLock: e.target.value })}
              placeholder="e.g. booking.com"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-text-muted">
              Restricts card to a single merchant domain
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Expires In
            </label>
            <select
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
            </select>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoRecharge}
                onChange={(e) => setForm({ ...form, autoRecharge: e.target.checked })}
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Enable Auto-Recharge</p>
                <p className="text-xs text-text-muted">
                  Automatically top up when balance falls below threshold
                </p>
              </div>
            </label>

            {form.autoRecharge && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">
                    Recharge Threshold
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    <input
                      type="number"
                      value={form.rechargeThreshold}
                      onChange={(e) => setForm({ ...form, rechargeThreshold: e.target.value })}
                      placeholder="500.00"
                      className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-2 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Recharge Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    <input
                      type="number"
                      value={form.rechargeAmount}
                      onChange={(e) => setForm({ ...form, rechargeAmount: e.target.value })}
                      placeholder="2000.00"
                      className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-2 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Issue Card
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Card Detail Drawer ─── */
function CardDetailDrawer({ card, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFreeze = () => {
    onUpdate(card.id, { status: card.status === 'frozen' ? 'active' : 'frozen' });
  };

  const handleCancel = () => {
    onUpdate(card.id, { status: 'cancelled' });
    onClose();
  };

  const totalTxns = card.transactions.length;
  const settledTxns = card.transactions.filter((t) => t.status === 'settled');
  const pendingTxns = card.transactions.filter((t) => t.status === 'pending');
  const totalSpent = settledTxns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-10 w-16 rounded-md flex items-center justify-center text-xs font-bold text-white',
                  cardBrandMeta[card.brand]?.color || 'bg-blue-500'
                )}
              >
                {(cardBrandMeta[card.brand]?.label || 'VISA').toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">•••• {card.last4}</h2>
                <p className="text-xs text-text-muted">
                  {card.id} · {card.type === 'single_use' ? 'Single Use' : 'Multi Use'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  statusMeta[card.status].class
                )}
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', statusMeta[card.status].dot)} />
                {statusMeta[card.status].label}
              </span>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
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

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Card Number */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Card Details</h3>
                  <button
                    onClick={() => setShowFullNumber(!showFullNumber)}
                    className="text-xs text-secondary hover:underline flex items-center gap-1"
                  >
                    {showFullNumber ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showFullNumber ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      Card Number
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-text-primary">
                        {showFullNumber
                          ? '4242 4242 4242 ' + card.last4
                          : '•••• •••• •••• ' + card.last4}
                      </span>
                      <button
                        onClick={() => copyToClipboard('424242424242' + card.last4)}
                        className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Expiry</span>
                    <span className="text-sm text-text-primary">{card.expires}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">CVC</span>
                    <span className="font-mono text-sm text-text-primary">
                      {showFullNumber ? '123' : '•••'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Holder</span>
                    <span className="text-sm text-text-primary">{card.holderName}</span>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Spent</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(card.spent)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Remaining</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold font-mono',
                      card.remaining < card.limit * 0.2 ? 'text-danger' : 'text-accent'
                    )}
                  >
                    {formatCurrency(card.remaining)}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Activity Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{totalTxns}</p>
                    <p className="text-xs text-text-muted">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{settledTxns.length}</p>
                    <p className="text-xs text-text-muted">Settled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{pendingTxns.length}</p>
                    <p className="text-xs text-text-muted">Pending</p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {card.alerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">Active Alerts</h3>
                  {card.alerts.map((alert) => {
                    const meta = alertTypeMeta[alert.type];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          'rounded-lg border p-3 flex items-start gap-2',
                          meta.bg,
                          meta.border
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', meta.color)} />
                        <div>
                          <p className="text-sm text-text-primary">{alert.message}</p>
                          <p className="text-xs text-text-muted">{alert.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Transaction History</h3>
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                </Button>
              </div>

              {card.transactions.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <Receipt className="mx-auto h-10 w-10 mb-3" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {card.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            tx.status === 'settled' ? 'bg-accent/10' : 'bg-warning/10'
                          )}
                        >
                          {tx.status === 'settled' ? (
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                          ) : (
                            <Clock className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{tx.merchant}</p>
                          <p className="text-xs text-text-muted">
                            {tx.date} · {tx.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-text-primary">
                          {formatCurrency(tx.amount)}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            tx.status === 'settled'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-warning/10 text-warning'
                          )}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Card Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleFreeze}
                    disabled={card.status === 'expired' || card.status === 'cancelled'}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg border p-3 transition-colors',
                      card.status === 'frozen'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-background hover:bg-surface-elevated'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {card.status === 'frozen' ? (
                        <Unlock className="h-4 w-4 text-accent" />
                      ) : (
                        <Lock className="h-4 w-4 text-warning" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">
                          {card.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {card.status === 'frozen'
                            ? 'Resume all transactions'
                            : 'Temporarily block all charges'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'h-5 w-9 rounded-full transition-colors',
                        card.status === 'frozen' ? 'bg-accent' : 'bg-border'
                      )}
                    >
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5',
                          card.status === 'frozen' ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </div>
                  </button>

                  <button
                    onClick={handleCancel}
                    disabled={card.status === 'cancelled' || card.status === 'expired'}
                    className="w-full flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/5 p-3 text-left hover:bg-danger/10 transition-colors disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4 text-danger" />
                    <div>
                      <p className="text-sm font-medium text-danger">Cancel Card</p>
                      <p className="text-xs text-text-muted">Permanently close this virtual card</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Auto-Recharge</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Status</span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        card.autoRecharge ? 'text-accent' : 'text-text-muted'
                      )}
                    >
                      {card.autoRecharge ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {card.autoRecharge && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Threshold</span>
                        <span className="text-sm font-mono text-text-primary">
                          {formatCurrency(card.rechargeThreshold)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Recharge Amount</span>
                        <span className="text-sm font-mono text-text-primary">
                          {formatCurrency(card.rechargeAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function VCCPage() {
  const [cards, setCards] = useState(initialCards);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showNewCard, setShowNewCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showLowBalanceOnly, setShowLowBalanceOnly] = useState(false);

  const filteredCards = useMemo(() => {
    let result = cards.filter((c) => {
      const matchesQuery =
        !query ||
        c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.last4.includes(query) ||
        (c.merchantLock && c.merchantLock.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });

    if (showExpiringOnly) {
      result = result.filter((c) => c.status === 'active' && daysUntil(c.expires) <= 30);
    }
    if (showLowBalanceOnly) {
      result = result.filter((c) => c.status === 'active' && c.remaining < c.limit * 0.2);
    }

    return result;
  }, [cards, query, statusFilter, typeFilter, showExpiringOnly, showLowBalanceOnly]);

  const stats = useMemo(() => {
    const active = cards.filter((c) => c.status === 'active');
    const totalLimit = active.reduce((s, c) => s + c.limit, 0);
    const totalSpent = active.reduce((s, c) => s + c.spent, 0);
    const totalRemaining = active.reduce((s, c) => s + c.remaining, 0);
    const expiringSoon = getExpiringCards(active).length;
    const lowBalance = getLowBalanceCards(active).length;
    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      expiringSoon,
      lowBalance,
      activeCount: active.length,
    };
  }, [cards]);

  const allAlerts = useMemo(() => {
    return cards.flatMap((c) => c.alerts.map((a) => ({ ...a, cardId: c.id, cardLast4: c.last4 })));
  }, [cards]);

  const handleCreate = (newCard) => {
    setCards((prev) => [newCard, ...prev]);
  };

  const handleUpdate = (id, updates) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Virtual Credit Cards</h1>
          <p className="text-sm text-text-secondary">
            Issue, manage, and monitor VCCs for OTA commissions and vendor payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewCard(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Issue Card
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Active Cards"
          value={stats.activeCount}
          icon={CreditCard}
          color="text-secondary"
          subtext={`of ${cards.length} total`}
        />
        <StatCard
          label="Total Limit"
          value={formatCurrency(stats.totalLimit)}
          icon={DollarSign}
          color="text-accent"
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(stats.totalRemaining)}
          icon={Wallet}
          color="text-info"
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          color={stats.expiringSoon > 0 ? 'text-danger' : 'text-accent'}
          subtext="Within 30 days"
        />
      </div>

      {/* Alerts Banner */}
      {allAlerts.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">Alerts & Notifications</h3>
              <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                {allAlerts.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {allAlerts.slice(0, 5).map((alert, idx) => {
              const meta = alertTypeMeta[alert.type];
              const Icon = meta.icon;
              return (
                <div
                  key={`${alert.cardId}-${alert.id}-${idx}`}
                  className={cn('px-4 py-3 flex items-start gap-3', meta.bg)}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', meta.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">•••• {alert.cardLast4}</span> — {alert.message}
                    </p>
                    <p className="text-xs text-text-muted">{alert.date}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCard(cards.find((c) => c.id === alert.cardId))}
                    className="text-xs text-secondary hover:underline shrink-0"
                  >
                    View Card
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search cards, merchants..."
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
          <button
            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showExpiringOnly
                ? 'border-warning bg-warning/10 text-warning'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Clock className="h-4 w-4" /> Expiring
          </button>
          <button
            onClick={() => setShowLowBalanceOnly(!showLowBalanceOnly)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showLowBalanceOnly
                ? 'border-danger bg-danger/10 text-danger'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <AlertTriangle className="h-4 w-4" /> Low Balance
          </button>
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
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'list'
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
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Card Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="single_use">Single Use</option>
                <option value="multi_use">Multi Use</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setShowExpiringOnly(false);
                  setShowLowBalanceOnly(false);
                  setQuery('');
                }}
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredCards.length}</span> of{' '}
        {cards.length} cards
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <button key={card.id} onClick={() => setSelectedCard(card)} className="text-left">
              <CardVisual card={card} />
            </button>
          ))}
          {filteredCards.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No cards match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Card</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Limit</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Spent</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Merchant</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCards.map((card) => {
                  const brand = cardBrandMeta[card.brand] || cardBrandMeta.visa;
                  const daysLeft = daysUntil(card.expires);
                  return (
                    <tr
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="hover:bg-background/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-6 w-10 rounded flex items-center justify-center text-[9px] font-bold text-white',
                              brand.color
                            )}
                          >
                            {brand.label.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">•••• {card.last4}</p>
                            <p className="text-xs text-text-muted">{card.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary capitalize">
                          {card.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                            statusMeta[card.status].class
                          )}
                        >
                          <div
                            className={cn('h-1.5 w-1.5 rounded-full', statusMeta[card.status].dot)}
                          />
                          {statusMeta[card.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatCurrency(card.limit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatCurrency(card.spent)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={
                            card.remaining < card.limit * 0.2 ? 'text-danger' : 'text-accent'
                          }
                        >
                          {formatCurrency(card.remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-xs',
                            daysLeft <= 7
                              ? 'text-danger font-medium'
                              : daysLeft <= 30
                                ? 'text-warning'
                                : 'text-text-secondary'
                          )}
                        >
                          {card.expires}
                          {daysLeft <= 30 && card.status === 'active' && ` (${daysLeft}d)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {card.merchantLock || <span className="text-text-muted">Any</span>}
                      </td>
                      <td className="px-4 py-3">
                        <MoreHorizontal className="h-4 w-4 text-text-muted" />
                      </td>
                    </tr>
                  );
                })}
                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                      No cards match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewCard && (
        <NewCardModal onClose={() => setShowNewCard(false)} onCreate={handleCreate} />
      )}
      {selectedCard && (
        <CardDetailDrawer
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
