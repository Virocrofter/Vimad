/* src/app/guest-portal/billing/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, CreditCard, Download, ArrowRight, ChevronDown, ChevronUp,
  Hotel, UtensilsCrossed, Sparkles, ConciergeBell, AlertCircle,
  CheckCircle2, Clock, TrendingUp, TrendingDown, Minus, FileText,
  Split, Users, Plus
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { guestStay, formatCurrency, formatDate, getCategoryTotal, folioCategoryMeta } from '../data';

const categoryIcons = {
  room: Hotel,
  dining: UtensilsCrossed,
  spa: Sparkles,
  services: ConciergeBell,
};

export default function BillingPage() {
  const navigate = useNavigate();
  const { folio, rate, property, dates } = guestStay;
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const categories = useMemo(() => {
    const cats = {};
    folio.charges.forEach(c => {
      if (!cats[c.category]) cats[c.category] = [];
      cats[c.category].push(c);
    });
    return cats;
  }, [folio.charges]);

  const categoryTotals = useMemo(() => {
    return Object.entries(categories).map(([cat, items]) => ({
      category: cat,
      total: items.reduce((s, i) => s + i.amount, 0),
      count: items.length,
    })).sort((a, b) => b.total - a.total);
  }, [categories]);

  const handlePayBalance = () => setShowPaymentModal(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Billing & Folio</h1>
          <p className="text-sm text-text-secondary">
            {property.name} · Room {guestStay.room.number} · {formatDate(dates.arrival)} – {formatDate(dates.departure)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/guest-portal/billing/invoice')}>
            <FileText className="mr-1.5 h-4 w-4" /> Invoices
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/guest-portal/billing/split')}>
            <Users className="mr-1.5 h-4 w-4" /> Split Bill
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Balance */}
          <div className="text-center lg:text-left">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Current Balance</p>
            <p className={cn(
              'mt-1 text-4xl font-bold font-mono',
              folio.balance > 0 ? 'text-danger' : 'text-accent'
            )}>
              {formatCurrency(folio.balance)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {folio.balance > 0 ? 'Payment required at checkout' : 'Fully paid'}
            </p>
            {folio.balance > 0 && (
              <Button className="mt-3" size="sm" onClick={handlePayBalance}>
                <CreditCard className="mr-1.5 h-4 w-4" /> Pay Now
              </Button>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Total Charges</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">{formatCurrency(folio.total)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Amount Paid</p>
              <p className="mt-1 text-xl font-bold font-mono text-accent">{formatCurrency(folio.paid)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Room Rate ({guestStay.dates.nights} nights)</p>
              <p className="mt-1 text-lg font-bold font-mono text-text-primary">{formatCurrency(rate.total)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Taxes & Fees</p>
              <p className="mt-1 text-lg font-bold font-mono text-text-primary">{formatCurrency(rate.taxes + rate.fees)}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Payment Methods</p>
            {folio.payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{p.method}</p>
                  <p className="text-xs text-text-muted">{formatDate(p.date)}</p>
                </div>
                <p className="text-sm font-mono font-medium text-text-primary">{formatCurrency(p.amount)}</p>
              </div>
            ))}
            {folio.balance > 0 && (
              <div className="mt-2 flex items-center gap-3 py-2 border-t border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10">
                  <AlertCircle className="h-4 w-4 text-danger" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger">Balance Due</p>
                  <p className="text-xs text-text-muted">Due at checkout</p>
                </div>
                <p className="text-sm font-mono font-bold text-danger">{formatCurrency(folio.balance)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categoryTotals.map(({ category, total, count }) => {
          const meta = folioCategoryMeta[category] || folioCategoryMeta.services;
          const Icon = categoryIcons[category] || ConciergeBell;
          return (
            <button
              key={category}
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className={cn(
                'rounded-xl border bg-surface p-4 text-left transition-all hover:shadow-md',
                expandedCategory === category ? 'border-secondary/30 ring-1 ring-secondary/10' : 'border-border'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.bg)}>
                  <Icon className={cn('h-4 w-4', meta.color)} />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{meta.label}</p>
                  <p className={cn('text-lg font-bold font-mono', meta.color)}>{formatCurrency(total)}</p>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-text-muted">{count} charge{count !== 1 ? 's' : ''}</p>
            </button>
          );
        })}
      </div>

      {/* Charges List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 text-secondary" /> Folio Charges
          </h3>
          <span className="text-xs text-text-muted">{folio.charges.length} items</span>
        </div>
        <div className="divide-y divide-border">
          {folio.charges.map((charge) => {
            const meta = folioCategoryMeta[charge.category] || folioCategoryMeta.services;
            return (
              <div key={charge.id} className="flex items-center gap-4 px-6 py-4 hover:bg-background/50 transition-colors">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                  <span className="text-lg">{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{charge.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[10px] font-medium uppercase tracking-wider', meta.color)}>{meta.label}</span>
                    <span className="text-[10px] text-text-muted">·</span>
                    <span className="text-[10px] text-text-muted">{formatDate(charge.date)}</span>
                  </div>
                </div>
                <p className="text-sm font-mono font-medium text-text-primary">{formatCurrency(charge.amount)}</p>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Subtotal</span>
            <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(folio.total)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-text-muted">Amount Paid</span>
            <span className="text-sm font-mono text-accent">-{formatCurrency(folio.paid)}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span className="text-sm font-bold text-text-primary">Balance Due</span>
            <span className={cn('text-xl font-bold font-mono', folio.balance > 0 ? 'text-danger' : 'text-accent')}>
              {formatCurrency(folio.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => navigate('/guest-portal/billing/invoice')}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <FileText className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Download Invoice</p>
            <p className="text-xs text-text-muted">View and download receipts</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-text-muted" />
        </button>
        <button
          onClick={() => navigate('/guest-portal/billing/split')}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Split Bill</p>
            <p className="text-xs text-text-muted">Share charges with guests</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-text-muted" />
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <CreditCard className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Make Payment</p>
            <p className="text-xs text-text-muted">Pay balance with saved card</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-text-muted" />
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          balance={folio.balance}
          paymentMethods={guestStay.paymentMethods}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

/* ─── Payment Modal ─── */
function PaymentModal({ balance, paymentMethods, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods.find(m => m.isDefault)?.id || '');
  const [amount, setAmount] = useState(balance.toString());
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => onClose(), 2000);
  };

  const brandIcons = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Make Payment</h3>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <Minus className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-text-primary">Payment Successful</h4>
            <p className="mt-1 text-sm text-text-muted">Your payment has been processed.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount */}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface pl-8 pr-4 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                />
              </div>
              <p className="mt-1 text-xs text-text-muted">Balance due: {formatCurrency(balance)}</p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Payment Method</label>
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedMethod(pm.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    selectedMethod === pm.id
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-surface hover:bg-surface-elevated'
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border flex items-center justify-center',
                    selectedMethod === pm.id ? 'border-secondary bg-secondary' : 'border-border'
                  )}>
                    {selectedMethod === pm.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {brandIcons[pm.brand] || pm.brand} ending {pm.last4}
                    </p>
                    <p className="text-xs text-text-muted">Expires {pm.expiry}</p>
                  </div>
                  {pm.isDefault && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">Default</span>
                  )}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Payment amount</span>
                <span className="font-mono font-medium text-text-primary">{formatCurrency(parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Processing fee</span>
                <span className="font-mono text-text-primary">$0.00</span>
              </div>
              <div className="pt-1 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Total</span>
                <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(parseFloat(amount) || 0)}</span>
              </div>
            </div>

            <Button className="w-full" onClick={handlePay} disabled={processing || !selectedMethod || parseFloat(amount) <= 0}>
              {processing ? (
                <><Clock className="mr-1.5 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="mr-1.5 h-4 w-4" /> Pay {formatCurrency(parseFloat(amount) || 0)}</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
