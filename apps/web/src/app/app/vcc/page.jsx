/* src/app/app/vcc/page.jsx
 * OTA Virtual Card captures — REAL DATA (Paystack payments API).
 * Cards are grouped from vcc_charge payments by OTA + last4.
 * Only last4/expiry are stored — no PAN, out of PCI scope.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  MoreHorizontal,
  Lock,
  Zap,
  Calendar,
  DollarSign,
  Wallet,
  Receipt,
  Settings,
  Ban,
  LayoutGrid,
  List,
  Bell,
  History,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { listPayments, recordVccCharge, refundPayment } from '../../../api/payments';

/* ─── Helpers ─── */
function formatCurrency(minor, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format((minor ?? 0) / 100);
}

function daysUntil(dateStr) {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function expDate(payment) {
  const m = payment.metadata || {};
  if (!m.expYear) return null;
  const y = String(m.expYear).length === 2 ? `20${m.expYear}` : String(m.expYear);
  return `${y}-${String(m.expMonth || '01').padStart(2, '0')}-28`;
}

const newKey = () => `vcc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/* ─── Group vcc_charge payments into display "cards" ─── */
function groupCards(payments) {
  const groups = new Map();
  for (const p of payments) {
    const ota = p.metadata?.ota || 'other';
    const key = `${ota}:${p.cardLast4}`;
    if (!groups.has(key)) {
      groups.set(key, { key, ota, last4: p.cardLast4, payments: [] });
    }
    groups.get(key).payments.push(p);
  }

  return [...groups.values()].map((g) => {
    const sorted = [...g.payments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const first = sorted[0];
    const expires = expDate(first);
    const spent = g.payments.reduce((s, p) => s + (p.amountMinor - p.refundedMinor), 0);
    const limit = g.payments.reduce((s, p) => s + p.amountMinor, 0);
    const refunded = g.payments.reduce((s, p) => s + p.refundedMinor, 0);
    const dLeft = daysUntil(expires);
    return {
      id: g.key,
      ota: g.ota,
      last4: g.last4,
      holderName: 'OTA Virtual Card',
      status: expires && dLeft < 0 ? 'expired' : 'active',
      limit,
      spent,
      remaining: Math.max(0, limit - spent),
      refunded,
      currency: first.currency || 'ZAR',
      issued: first.createdAt?.slice(0, 10),
      expires,
      reservation: first.reservation ?? null,
      payments: sorted,
      postedAll: g.payments.every((p) => p.postedToFolio),
    };
  });
}

const otaMeta = {
  bookingcom: { label: 'Booking.com', color: 'bg-blue-600', short: 'BKNG' },
  expedia: { label: 'Expedia', color: 'bg-orange-500', short: 'EXPD' },
  airbnb: { label: 'Airbnb', color: 'bg-rose-500', short: 'AIRB' },
  agoda: { label: 'Agoda', color: 'bg-purple-600', short: 'AGOD' },
  tripcom: { label: 'Trip.com', color: 'bg-sky-600', short: 'TRIP' },
  vrbo: { label: 'VRBO', color: 'bg-green-600', short: 'VRBO' },
  other: { label: 'OTA', color: 'bg-neutral-500', short: 'OTA' },
};

const statusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertCircle,
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

function CardVisual({ card }) {
  const ota = otaMeta[card.ota] || otaMeta.other;
  const pctUsed = card.limit > 0 ? (card.spent / card.limit) * 100 : 0;
  const daysLeft = daysUntil(card.expires);
  const [copied, setCopied] = useState(false);

  const copyLast4 = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(card.last4);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border p-5 transition-all overflow-hidden',
        card.status === 'active'
          ? 'border-border bg-surface hover:shadow-lg hover:border-secondary/30'
          : 'border-danger/30 bg-danger/5 opacity-60'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div
          className={cn('w-full h-full rounded-full -translate-y-1/2 translate-x-1/2', ota.color)}
        />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-12 rounded-md flex items-center justify-center text-[9px] font-bold text-white',
                ota.color
              )}
            >
              {ota.short}
            </div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {ota.label} VCC
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

        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold text-text-primary tracking-wider">
              •••• •••• •••• {card.last4}
            </span>
            <button
              onClick={copyLast4}
              className="rounded-md p-1 hover:bg-surface-elevated text-text-muted transition-colors"
              title="Copy last 4"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {card.reservation?.confirmationNumber
              ? `Reservation ${card.reservation.confirmationNumber}`
              : card.holderName}
          </p>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">
              Captured: {formatCurrency(card.spent, card.currency)}
            </span>
            <span
              className={cn(
                'text-xs font-bold font-mono',
                card.refunded > 0 ? 'text-warning' : 'text-accent'
              )}
            >
              {card.refunded > 0
                ? `${formatCurrency(card.refunded, card.currency)} refunded`
                : 'No refunds'}
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

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">
              <Calendar className="h-3 w-3 inline mr-1" />
              Exp {card.expires ?? '—'}
            </span>
            {daysLeft <= 30 && card.status === 'active' && (
              <span className={cn('font-medium', daysLeft <= 7 ? 'text-danger' : 'text-warning')}>
                {daysLeft}d left
              </span>
            )}
          </div>
          <span
            className={cn(
              'flex items-center gap-1',
              card.postedAll ? 'text-accent' : 'text-warning'
            )}
          >
            <Shield className="h-3 w-3" />
            {card.postedAll ? 'Folio ✓' : 'Posting…'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Record Capture Modal (replaces mock "Issue Card") ─── */
function RecordCaptureModal({ onClose, onCreated, showError }) {
  const [form, setForm] = useState({
    ota: 'bookingcom',
    cardLast4: '',
    expMonth: '',
    expYear: '',
    amount: '',
    currency: 'ZAR',
    reservationId: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const valid =
    /^\d{4}$/.test(form.cardLast4) &&
    /^\d{2}$/.test(form.expMonth) &&
    /^\d{2,4}$/.test(form.expYear) &&
    parseFloat(form.amount) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const amountMinor = Math.round(parseFloat(form.amount) * 100);
      await recordVccCharge({
        ota: form.ota,
        cardLast4: form.cardLast4,
        expMonth: form.expMonth,
        expYear: form.expYear.length === 2 ? `20${form.expYear}` : form.expYear,
        amountMinor,
        currency: form.currency,
        reservationId: form.reservationId || undefined,
        note: form.note || undefined,
        idempotencyKey: newKey(),
      });
      onCreated();
      onClose();
    } catch (err) {
      showError(err.message ?? 'Capture failed — check the reservation ID and try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Record VCC Capture</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-text-muted">
          Record money received from an OTA virtual card. The capture posts to the reservation
          folio. Only last4 + expiry are stored — the PAN never touches this system (PCI-safe).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              OTA *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(otaMeta).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, ota: key })}
                  className={cn(
                    'rounded-lg border p-2 text-center transition-colors',
                    form.ota === key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <p className="text-xs font-semibold truncate">{meta.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Last 4 *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={form.cardLast4}
                onChange={(e) => setForm({ ...form, cardLast4: e.target.value.replace(/\D/g, '') })}
                placeholder="1234"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Exp MM *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                required
                value={form.expMonth}
                onChange={(e) => setForm({ ...form, expMonth: e.target.value.replace(/\D/g, '') })}
                placeholder="12"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Exp YY *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={form.expYear}
                onChange={(e) => setForm({ ...form, expYear: e.target.value.replace(/\D/g, '') })}
                placeholder="2027"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Amount *
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
                  placeholder="2450.00"
                  className={cn(inputCls, 'pl-9 font-mono')}
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
                className={inputCls}
              >
                <option value="ZAR">ZAR</option>
                <option value="ZAR">ZAR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reservation ID (posts to its folio)
            </label>
            <input
              type="text"
              value={form.reservationId}
              onChange={(e) => setForm({ ...form, reservationId: e.target.value })}
              placeholder="Reservation ID — links capture to the guest folio"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Note
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Commission-adjusted net, OTA payout ref…"
              className={inputCls}
            />
          </div>

          <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Idempotency-protected: double-clicks and retries cannot double-post to the folio.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={!valid || saving}>
              <Plus className="mr-1.5 h-4 w-4" /> {saving ? 'Recording…' : 'Record Capture'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Card Detail Drawer ─── */
function CardDetailDrawer({ card, onClose, onRefund, refresh }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [refunding, setRefunding] = useState(null); // payment db id
  const [refundAmount, setRefundAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const ota = otaMeta[card.ota] || otaMeta.other;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'transactions', label: 'Captures', icon: Receipt },
    { id: 'settings', label: 'Actions', icon: Settings },
  ];

  const copyLast4 = () => {
    navigator.clipboard?.writeText(card.last4);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCaptured = card.payments.reduce((s, p) => s + (p.amountMinor - p.refundedMinor), 0);
  const totalRefunded = card.payments.reduce((s, p) => s + p.refundedMinor, 0);
  const fullyRefunded = card.payments.filter((p) => p.refundedMinor >= p.amountMinor).length;

  const handleRefund = async (p) => {
    const outstanding = (p.amountMinor - p.refundedMinor) / 100;
    const amt = parseFloat(refundAmount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > outstanding) {
      onRefund.error(`Enter an amount between 0 and ${outstanding.toFixed(2)}.`);
      return;
    }
    try {
      await refundPayment(p.id, { amountMinor: Math.round(amt * 100), reason: 'VCC adjustment' });
      setRefunding(null);
      setRefundAmount('');
      onRefund.done(`Refund submitted for ${p.reference}.`);
      refresh();
    } catch (err) {
      onRefund.error(err.message ?? 'Refund failed.');
    }
  };

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
                  'h-10 w-16 rounded-md flex items-center justify-center text-[10px] font-bold text-white',
                  ota.color
                )}
              >
                {ota.short}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">•••• {card.last4}</h2>
                <p className="text-xs text-text-muted">
                  {ota.label} Virtual Card · {card.id}
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Card Details</h3>
                  <button
                    onClick={copyLast4}
                    className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
                    title="Copy last 4"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      Card Number
                    </span>
                    <span className="font-mono text-sm text-text-primary">
                      •••• •••• •••• {card.last4}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Expiry</span>
                    <span className="text-sm text-text-primary">{card.expires ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">OTA</span>
                    <span className="text-sm text-text-primary">{ota.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      Reservation
                    </span>
                    <span className="text-sm text-text-primary">
                      {card.reservation?.confirmationNumber ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    PAN is not stored in Vimad — only last4 and expiry. Capture the card through the
                    OTA payout process; this page records the settlement.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Captured</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(totalCaptured, card.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Refunded</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold font-mono',
                      totalRefunded > 0 ? 'text-warning' : 'text-accent'
                    )}
                  >
                    {formatCurrency(totalRefunded, card.currency)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Capture Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{card.payments.length}</p>
                    <p className="text-xs text-text-muted">Captures</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {card.payments.filter((p) => p.postedToFolio).length}
                    </p>
                    <p className="text-xs text-text-muted">Posted to folio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{fullyRefunded}</p>
                    <p className="text-xs text-text-muted">Fully refunded</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Capture History</h3>
              </div>

              {card.payments.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <Receipt className="mx-auto h-10 w-10 mb-3" />
                  <p>No captures yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {card.payments.map((p) => {
                    const outstanding = (p.amountMinor - p.refundedMinor) / 100;
                    return (
                      <div key={p.id} className="rounded-lg border border-border bg-surface p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                p.status === 'refunded'
                                  ? 'bg-danger/10'
                                  : p.refundedMinor > 0
                                    ? 'bg-warning/10'
                                    : 'bg-accent/10'
                              )}
                            >
                              {p.status === 'refunded' ? (
                                <Ban className="h-4 w-4 text-danger" />
                              ) : p.refundedMinor > 0 ? (
                                <History className="h-4 w-4 text-warning" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-accent" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary font-mono">
                                {p.reference}
                              </p>
                              <p className="text-xs text-text-muted">
                                {new Date(p.createdAt).toLocaleString()}
                                {p.reservation?.confirmationNumber &&
                                  ` · ${p.reservation.confirmationNumber}`}
                                {p.metadata?.note && ` · ${p.metadata.note}`}
                              </p>
                              <p className="text-xs mt-0.5">
                                {p.postedToFolio ? (
                                  <span className="text-accent">Posted to folio</span>
                                ) : (
                                  <span className="text-warning">Awaiting folio post</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold font-mono text-text-primary">
                              {formatCurrency(p.amountMinor - p.refundedMinor, p.currency)}
                            </p>
                            {p.refundedMinor > 0 && (
                              <p className="text-xs text-warning font-mono">
                                -{formatCurrency(p.refundedMinor, p.currency)} refunded
                              </p>
                            )}
                            {outstanding > 0 && (
                              <button
                                onClick={() => {
                                  setRefunding(refunding === p.id ? null : p.id);
                                  setRefundAmount('');
                                }}
                                className="mt-1 text-xs text-danger hover:underline"
                              >
                                {refunding === p.id ? 'Cancel' : 'Refund'}
                              </button>
                            )}
                          </div>
                        </div>

                        {refunding === p.id && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={outstanding}
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                              placeholder={`Max ${outstanding.toFixed(2)}`}
                              className="h-9 w-40 rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <Button size="sm" variant="secondary" onClick={() => handleRefund(p)}>
                              Confirm Refund
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Card Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={refresh}
                    className="w-full flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left hover:bg-surface-elevated transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Refresh from server</p>
                      <p className="text-xs text-text-muted">Reload captures and folio status</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Settlement</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Folio posting</span>
                    <span
                      className={cn(
                        'font-semibold',
                        card.postedAll ? 'text-accent' : 'text-warning'
                      )}
                    >
                      {card.postedAll ? 'All posted' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Captures</span>
                    <span className="font-mono text-text-primary">{card.payments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Total value</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(
                        card.payments.reduce((s, p) => s + p.amountMinor, 0),
                        card.currency
                      )}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  Funds settle on the OTA's payout cycle (Booking.com ~weekly, Expedia per
                  contract). Reconcile captures against the OTA payout statement.
                </p>
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
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null); // {kind, text}
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [otaFilter, setOtaFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showCapture, setShowCapture] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showLowBalanceOnly, setShowLowBalanceOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPayments({ type: 'vcc_charge', page: 1, pageSize: 500 });
      setPayments(res.data);
      setSummary(res.summary);
    } catch (err) {
      setError(err.message ?? 'Failed to load VCC captures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const cards = useMemo(() => groupCards(payments), [payments]);

  const filteredCards = useMemo(() => {
    let result = cards.filter((c) => {
      const matchesQuery =
        !query ||
        c.last4.includes(query) ||
        c.id.toLowerCase().includes(query.toLowerCase()) ||
        (c.reservation?.confirmationNumber || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesOta = otaFilter === 'all' || c.ota === otaFilter;
      return matchesQuery && matchesStatus && matchesOta;
    });
    if (showExpiringOnly) {
      result = result.filter((c) => c.status === 'active' && daysUntil(c.expires) <= 30);
    }
    if (showLowBalanceOnly) {
      result = result.filter(
        (c) => c.status === 'active' && c.spent > 0 && c.remaining < c.limit * 0.2
      );
    }
    return result;
  }, [cards, query, statusFilter, otaFilter, showExpiringOnly, showLowBalanceOnly]);

  const stats = useMemo(() => {
    const active = cards.filter((c) => c.status === 'active');
    const totalCaptured = cards.reduce((s, c) => s + c.spent, 0);
    const totalRefunded = cards.reduce((s, c) => s + c.refunded, 0);
    const expiringSoon = active.filter((c) => daysUntil(c.expires) <= 30).length;
    return {
      totalCaptured,
      totalRefunded,
      expiringSoon,
      activeCount: active.length,
      total: cards.length,
    };
  }, [cards]);

  const allAlerts = useMemo(() => {
    const alerts = [];
    for (const c of cards) {
      const d = daysUntil(c.expires);
      if (c.status === 'active' && d <= 30) {
        alerts.push({
          id: `exp-${c.id}`,
          type: d <= 7 ? 'danger' : 'warning',
          message: `expires in ${d} day${d === 1 ? '' : 's'}`,
          cardLast4: c.last4,
          ota: c.ota,
          card: c,
        });
      }
      if (c.status === 'active' && c.spent > 0 && c.remaining < c.limit * 0.2) {
        alerts.push({
          id: `low-${c.id}`,
          type: 'warning',
          message: 'nearly fully captured',
          cardLast4: c.last4,
          ota: c.ota,
          card: c,
        });
      }
      const unposted = c.payments.filter((p) => !p.postedToFolio);
      if (unposted.length > 0) {
        alerts.push({
          id: `post-${c.id}`,
          type: 'info',
          message: `${unposted.length} capture${unposted.length === 1 ? '' : 's'} awaiting folio post`,
          cardLast4: c.last4,
          ota: c.ota,
          card: c,
        });
      }
    }
    return alerts;
  }, [cards]);

  const refundHandlers = {
    done: (text) => setNotice({ kind: 'ok', text }),
    error: (text) => setNotice({ kind: 'err', text }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">OTA Virtual Cards</h1>
          <p className="text-sm text-text-secondary">
            Record and reconcile virtual card captures from OTAs against reservation folios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCapture(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Record Capture
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
          subtext={`of ${stats.total} tracked`}
        />
        <StatCard
          label="Total Captured"
          value={formatCurrency(stats.totalCaptured)}
          icon={DollarSign}
          color="text-accent"
        />
        <StatCard
          label="Refunded"
          value={formatCurrency(stats.totalRefunded)}
          icon={Wallet}
          color={stats.totalRefunded > 0 ? 'text-warning' : 'text-accent'}
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          color={stats.expiringSoon > 0 ? 'text-danger' : 'text-accent'}
          subtext="Within 30 days"
        />
      </div>

      {notice && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm flex items-start gap-2',
            notice.kind === 'ok'
              ? 'border-accent/20 bg-accent/10 text-accent'
              : 'border-danger/20 bg-danger/10 text-danger'
          )}
        >
          {notice.kind === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

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
          <div className="divide-y divide-border max-h-56 overflow-auto">
            {allAlerts.slice(0, 6).map((alert) => {
              const meta = alertTypeMeta[alert.type];
              const Icon = meta.icon;
              return (
                <div key={alert.id} className={cn('px-4 py-3 flex items-start gap-3', meta.bg)}>
                  <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', meta.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">
                        {otaMeta[alert.ota]?.label ?? alert.ota} •••• {alert.cardLast4}
                      </span>{' '}
                      — {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCard(alert.card)}
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
            placeholder="Search last4, reservation, OTA…"
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
            <AlertTriangle className="h-4 w-4" /> Mostly Captured
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
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">OTA</label>
              <select
                value={otaFilter}
                onChange={(e) => setOtaFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All OTAs</option>
                {Object.entries(otaMeta).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setOtaFilter('all');
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

      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredCards.length}</span> of{' '}
        {cards.length} tracked cards
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center text-text-muted">
              <RefreshCw className="mx-auto h-6 w-6 mb-3 animate-spin" />
              Loading captures…
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">
                {cards.length === 0
                  ? 'No VCC captures yet — record your first OTA virtual card capture.'
                  : 'No cards match your filters.'}
              </p>
            </div>
          ) : (
            filteredCards.map((card) => (
              <button key={card.id} onClick={() => setSelectedCard(card)} className="text-left">
                <CardVisual card={card} />
              </button>
            ))
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
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">OTA</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Captured</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Refunded</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">
                    Reservation
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Folio</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCards.map((card) => {
                  const ota = otaMeta[card.ota] || otaMeta.other;
                  const dLeft = daysUntil(card.expires);
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
                              ota.color
                            )}
                          >
                            {ota.short}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">•••• {card.last4}</p>
                            <p className="text-xs text-text-muted">
                              {card.payments.length} capture{card.payments.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{ota.label}</td>
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
                        {formatCurrency(card.spent, card.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={card.refunded > 0 ? 'text-warning' : 'text-text-muted'}>
                          {formatCurrency(card.refunded, card.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-xs',
                            dLeft <= 7
                              ? 'text-danger font-medium'
                              : dLeft <= 30
                                ? 'text-warning'
                                : 'text-text-secondary'
                          )}
                        >
                          {card.expires ?? '—'}
                          {dLeft <= 30 && card.status === 'active' && ` (${dLeft}d)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {card.reservation?.confirmationNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn('text-xs', card.postedAll ? 'text-accent' : 'text-warning')}
                        >
                          {card.postedAll ? 'Posted ✓' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MoreHorizontal className="h-4 w-4 text-text-muted" />
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                      {cards.length === 0 ? 'No VCC captures yet.' : 'No cards match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCapture && (
        <RecordCaptureModal
          onClose={() => setShowCapture(false)}
          onCreated={() => {
            setNotice({ kind: 'ok', text: 'VCC capture recorded and posted to folio.' });
            load();
          }}
          showError={(text) => setNotice({ kind: 'err', text })}
        />
      )}
      {selectedCard && (
        <CardDetailDrawer
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onRefund={refundHandlers}
          refresh={() => {
            setSelectedCard(null);
            load();
          }}
        />
      )}
    </div>
  );
}
