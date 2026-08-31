import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, DollarSign, ArrowRightLeft, Receipt, Calculator,
  X, Check, Printer, Download, Lock, User, BedDouble, Calendar,
  ChevronDown, ChevronUp, AlertCircle, Plus, FileText, Eye
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const mockReservation = {
  id: '4021',
  guest: 'John Smith',
  room: '204',
  roomType: 'Deluxe King',
  arrival: '2026-08-12',
  departure: '2026-08-15',
  nights: 3,
  adults: 2,
  status: 'checked_in',
};

const initialTransactions = {
  1: [
    { id: 1, date: '2026-08-12', description: 'Room Charge — Deluxe King (1/3)', code: '1000', charge: 189.00, payment: 0, postedBy: 'System', routing: 'guest' },
    { id: 2, date: '2026-08-12', description: 'Resort Fee', code: '2000', charge: 35.00, payment: 0, postedBy: 'System', routing: 'guest' },
    { id: 3, date: '2026-08-12', description: 'Payment — Visa •••• 4242', code: '5000', charge: 0, payment: 178.50, postedBy: 'Sarah J.', routing: 'guest' },
    { id: 4, date: '2026-08-13', description: 'Room Charge — Deluxe King (2/3)', code: '1000', charge: 189.00, payment: 0, postedBy: 'System', routing: 'guest' },
    { id: 5, date: '2026-08-13', description: 'Room Service — Dinner', code: '3000', charge: 67.00, payment: 0, postedBy: 'Mike C.', routing: 'guest' },
  ],
  2: [
    { id: 6, date: '2026-08-12', description: 'Parking — Daily', code: '2100', charge: 25.00, payment: 0, postedBy: 'System', routing: 'company' },
    { id: 7, date: '2026-08-13', description: 'Payment — Amex •••• 1001', code: '5000', charge: 0, payment: 25.00, postedBy: 'Sarah J.', routing: 'company' },
  ],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
};

const transactionCodes = [
  { code: '1000', name: 'Room Charge', type: 'charge' },
  { code: '2000', name: 'Resort Fee', type: 'charge' },
  { code: '2100', name: 'Parking', type: 'charge' },
  { code: '3000', name: 'Room Service', type: 'charge' },
  { code: '5000', name: 'Payment', type: 'payment' },
  { code: '6000', name: 'Adjustment', type: 'adjustment' },
  { code: '9000', name: 'Visa Payment', type: 'payment' },
  { code: '9001', name: 'Amex Payment', type: 'payment' },
  { code: '9002', name: 'Cash Payment', type: 'payment' },
];

const routingTargets = [
  { key: 'guest', label: 'Guest Folio', icon: User, color: 'text-info' },
  { key: 'company', label: 'Company / Master', icon: BedDouble, color: 'text-warning' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/* ─── Proration Logic ─── */
function calculateProration(currentPlan, newPlan, billingInterval) {
  const now = new Date();
  const renewalDate = new Date(currentPlan.renewalDate);
  const daysInCycle = billingInterval === 'annual' ? 365 : 30;
  const daysRemaining = Math.max(0, Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24)));
  const daysUsed = daysInCycle - daysRemaining;

  // Current plan pricing
  const currentPrice = billingInterval === 'annual' ? currentPlan.annualPrice : currentPlan.price;
  const currentDailyRate = currentPrice / daysInCycle;
  
  // New plan pricing
  const newPrice = billingInterval === 'annual' ? newPlan.annualPrice : newPlan.price;
  const newDailyRate = newPrice / daysInCycle;

  // Calculate prorated amounts
  const unusedCredit = Math.round(currentDailyRate * daysRemaining * 100) / 100;
  const newPlanCharge = Math.round(newDailyRate * daysRemaining * 100) / 100;
  const netDueToday = Math.round((newPlanCharge - unusedCredit) * 100) / 100;

  return {
    daysRemaining,
    daysUsed,
    currentDailyRate: Math.round(currentDailyRate * 100) / 100,
    newDailyRate: Math.round(newDailyRate * 100) / 100,
    unusedCredit,
    newPlanCharge,
    netDueToday,
    newRecurringAmount: newPrice,
    isCredit: netDueToday < 0,
  };
}

/* ─── Main Component ─── */
export default function BillingPage() {
  const navigate = useNavigate();

  // State
  const [activeWindow, setActiveWindow] = useState(1);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showPostCharge, setShowPostCharge] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [showShiftClose, setShowShiftClose] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const [selectedTxIds, setSelectedTxIds] = useState([]);

  const currentTransactions = transactions[activeWindow] || [];

  const runningBalance = useMemo(() => {
    let balance = 0;
    return currentTransactions.map((t) => {
      balance += t.charge - t.payment;
      return { ...t, balance };
    });
  }, [currentTransactions]);

  const totalBalance = runningBalance.length > 0 ? runningBalance[runningBalance.length - 1].balance : 0;
  const currentBalance = totalBalance;
  const totalCharges = currentTransactions.reduce((sum, t) => sum + t.charge, 0);
  const totalPayments = currentTransactions.reduce((sum, t) => sum + t.payment, 0);

  // Consolidated add transaction handler
  const handlePostTransaction = (tx) => {
    setTransactions(prev => ({
      ...prev,
      [activeWindow]: [...(prev[activeWindow] || []), { ...tx, id: Date.now() }]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Folio & Billing</h1>
            <p className="text-sm text-text-secondary">Reservation #{mockReservation.id} • {mockReservation.guest}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowReceipt(true)}>
            <Eye className="mr-1.5 h-4 w-4" /> Preview Receipt
          </Button>
          <Button variant="outline" size="sm"><Printer className="mr-1.5 h-4 w-4" /> Print</Button>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
        </div>
      </div>        

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setShowPostCharge(true)} variant="secondary" size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Post Charge
        </Button>
        <Button onClick={() => setShowPostPayment(true)} variant="outline" size="sm">
          <DollarSign className="mr-1.5 h-4 w-4" /> Post Payment
        </Button>
        <Button onClick={() => setShowRouting(true)} variant="outline" size="sm">
          <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Routing
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setShowShiftClose(true)} variant="outline" size="sm" className="text-danger border-danger/30 hover:bg-danger/10">
          <Lock className="mr-1.5 h-4 w-4" /> Close Shift
        </Button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Charges</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {formatCurrency(totalCharges)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Payments</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {formatCurrency(totalPayments)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Balance Due</p>
          <p className={cn('mt-1 text-xl font-bold font-mono', currentBalance > 0 ? 'text-danger' : 'text-accent')}>
            {formatCurrency(Math.abs(currentBalance))}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Window Count</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {currentTransactions.length} txns
          </p>
        </div>
      </div>

      {/* Folio Windows & Transaction Table */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex flex-wrap border-b border-border px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(windowNum => (
            <button
              key={windowNum}
              onClick={() => setActiveWindow(windowNum)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeWindow === windowNum 
                  ? 'border-secondary text-secondary' 
                  : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              Window {windowNum}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Charge</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runningBalance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-text-muted">
                    No transactions in this window
                  </td>
                </tr>
              ) : (
                runningBalance.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{tx.code}</td>
                    <td className="px-4 py-3 text-text-primary">{tx.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {tx.charge > 0 ? formatCurrency(tx.charge) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {tx.payment > 0 ? formatCurrency(tx.payment) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                      {formatCurrency(tx.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showPostCharge && (
        <PostChargeModal
          onClose={() => setShowPostCharge(false)}
          onPost={(tx) => {
            handlePostTransaction(tx);
            setShowPostCharge(false);
          }}
          transactionCodes={transactionCodes}
        />
      )}

      {showPostPayment && (
        <PostPaymentModal
          onClose={() => setShowPostPayment(false)}
          onPost={(tx) => {
            handlePostTransaction(tx);
            setShowPostPayment(false);
          }}
          transactionCodes={transactionCodes}
        />
      )}

      {showRouting && (
        <RoutingModal
          transactions={currentTransactions}
          selectedIds={selectedTxIds}
          onClose={() => setShowRouting(false)}
          onRoute={(txId, target) => {
            setTransactions(prev => {
              const updatedWindow = prev[activeWindow].map(t => 
                t.id === txId ? { ...t, routing: target } : t
              );
              return { ...prev, [activeWindow]: updatedWindow };
            });
          }}
          routingTargets={routingTargets}
        />
      )}

      {showShiftClose && (
        <ShiftCloseModal
          onClose={() => setShowShiftClose(false)}
          transactions={Object.values(transactions).flat()}
        />
      )}

      {showReceipt && (
        <ReceiptPreviewModal
          onClose={() => setShowReceipt(false)}
          reservation={mockReservation}
          transactions={currentTransactions}
        />
      )}
    </div>
  );
}


/* ─── Post Charge Modal ─── */
function PostChargeModal({ onClose, onPost, transactionCodes }) {
  const [code, setCode] = useState('1000');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [routing, setRouting] = useState('guest');

  const selectedCode = transactionCodes.find(c => c.code === code);

  const handleSubmit = (e) => {
    e.preventDefault();
    onPost({
      date: new Date().toISOString().split('T')[0],
      description: description || selectedCode?.name || 'Charge',
      code,
      charge: parseFloat(amount) || 0,
      payment: 0,
      routing,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Post Charge</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Transaction Code</label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {transactionCodes.filter(c => c.type === 'charge').map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selectedCode?.name}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Route To</label>
            <div className="grid grid-cols-2 gap-2">
              {routingTargets.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRouting(r.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    routing === r.key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <r.icon className={cn('h-4 w-4', r.color)} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> Post Charge
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Post Payment Modal ─── */
function PostPaymentModal({ onClose, onPost, transactionCodes }) {
  const [code, setCode] = useState('9000');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [routing, setRouting] = useState('guest');

  const handleSubmit = (e) => {
    e.preventDefault();
    const codeObj = transactionCodes.find(c => c.code === code);
    onPost({
      date: new Date().toISOString().split('T')[0],
      description: `${codeObj?.name || 'Payment'}${reference ? ` — Ref: ${reference}` : ''}`,
      code,
      charge: 0,
      payment: parseFloat(amount) || 0,
      routing,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Post Payment</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Payment Method</label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {transactionCodes.filter(c => c.type === 'payment').map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Reference / Card Last 4</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="4242"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Route To</label>
            <div className="grid grid-cols-2 gap-2">
              {routingTargets.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRouting(r.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    routing === r.key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <r.icon className={cn('h-4 w-4', r.color)} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> Post Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Routing Modal ─── */
function RoutingModal({ transactions, selectedIds, onClose, onRoute, routingTargets }) {
  const [targetMap, setTargetMap] = useState({});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Routing Visualization</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center gap-4">
            {routingTargets.map(r => {
              const count = transactions.filter(t => t.routing === r.key).length;
              const total = transactions.filter(t => t.routing === r.key).reduce((s, t) => s + t.charge - t.payment, 0);
              return (
                <div key={r.key} className="flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-2">
                  <r.icon className={cn('h-4 w-4', r.color)} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-secondary">{r.label}</p>
                    <p className={cn('text-sm font-mono font-semibold truncate', total > 0 ? 'text-danger' : total < 0 ? 'text-accent' : 'text-text-primary')}>
                      {count} items · ${Math.abs(total).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">Current Route</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">New Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map(tx => {
                const current = routingTargets.find(r => r.key === tx.routing);
                return (
                  <tr key={tx.id} className="hover:bg-surface/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{tx.description}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                      {tx.charge > 0 ? `$${tx.charge.toFixed(2)}` : `-$${tx.payment.toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium border border-border">
                        {current && <current.icon className={cn('h-3 w-3', current.color)} />}
                        {current?.label || 'Guest'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={targetMap[tx.id] || tx.routing || 'guest'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetMap(prev => ({ ...prev, [tx.id]: val }));
                          onRoute(tx.id, val);
                        }}
                        className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {routingTargets.map(r => (
                          <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            <Check className="mr-1.5 h-4 w-4" /> Done
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Receipt Preview Modal ─── */
function ReceiptPreviewModal({ onClose, reservation, transactions }) {
  const totalCharges = transactions.reduce((s, t) => s + t.charge, 0);
  const totalPayments = transactions.reduce((s, t) => s + t.payment, 0);
  const balance = totalCharges - totalPayments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-white">
                U
              </div>
              <span className="text-sm font-semibold text-text-primary">Unified PMS</span>
            </div>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-elevated text-text-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider">Guest Folio Receipt</p>
            <p className="text-lg font-bold text-text-primary">{reservation.guest}</p>
            <p className="text-xs text-text-muted">Res #{reservation.id} • Room {reservation.room}</p>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Arrival: {reservation.arrival}</span>
            <span>Departure: {reservation.departure}</span>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-text-secondary">{tx.description}</span>
                <span className={cn('font-mono', tx.charge > 0 ? 'text-text-primary' : 'text-accent')}>
                  {tx.charge > 0 ? formatCurrency(tx.charge) : `-${formatCurrency(tx.payment)}`}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total Charges</span>
              <span className="font-mono font-medium text-text-primary">{formatCurrency(totalCharges)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total Payments</span>
              <span className="font-mono font-medium text-accent">-{formatCurrency(totalPayments)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-1">
              <span className="text-text-primary">Balance Due</span>
              <span className={cn('font-mono', balance > 0 ? 'text-danger' : 'text-accent')}>
                {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-text-muted">Thank you for choosing Unified PMS</p>
            <p className="text-[10px] text-text-muted">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Receipt Footer Actions */}
        <div className="border-t border-border bg-surface px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shift Close Modal ─── */
function ShiftCloseModal({ onClose, transactions }) {
  const [step, setStep] = useState(1); // 1: verify, 2: count, 3: confirm
  const [cashCount, setCashCount] = useState('');
  const [cardCount, setCardCount] = useState('');
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const shiftTxns = transactions.filter(t => t.date === today);
  const systemCash = shiftTxns.filter(t => t.code === '9002').reduce((s, t) => s + t.payment, 0);
  const systemCard = shiftTxns.filter(t => ['9000', '9001', '9003'].includes(t.code)).reduce((s, t) => s + t.payment, 0);
  const systemTotal = systemCash + systemCard;

  const cashDiff = (parseFloat(cashCount) || 0) - systemCash;
  const cardDiff = (parseFloat(cardCount) || 0) - systemCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Cashier Shift Close</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-secondary' : 'bg-border'
            )} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Shift Summary — {today}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Cash Payments</span>
                  <span className="font-mono font-medium text-text-primary">${systemCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Card Payments</span>
                  <span className="font-mono font-medium text-text-primary">${systemCard.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-text-primary">System Total</span>
                  <span className="font-mono text-secondary">${systemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Transactions</span>
                  <span>{shiftTxns.length} posted</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                Closing a shift is irreversible. Ensure all payments are posted and folios are balanced before proceeding.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Begin Count <ArrowRightLeft className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-text-secondary uppercase">Cash Drawer</span>
                </div>
                <p className="text-xs text-text-muted mb-1">System: ${systemCash.toFixed(2)}</p>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="number"
                    step="0.01"
                    value={cashCount}
                    onChange={(e) => setCashCount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {cashCount && (
                  <p className={cn('mt-1 text-xs font-mono', Math.abs(cashDiff) < 0.01 ? 'text-secondary' : 'text-danger')}>
                    {Math.abs(cashDiff) < 0.01 ? '✓ Balanced' : `Diff: ${cashDiff > 0 ? '+' : ''}$${cashDiff.toFixed(2)}`}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-info" />
                  <span className="text-xs font-medium text-text-secondary uppercase">Card Batch</span>
                </div>
                <p className="text-xs text-text-muted mb-1">System: ${systemCard.toFixed(2)}</p>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="number"
                    step="0.01"
                    value={cardCount}
                    onChange={(e) => setCardCount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {cardCount && (
                  <p className={cn('mt-1 text-xs font-mono', Math.abs(cardDiff) < 0.01 ? 'text-secondary' : 'text-danger')}>
                    {Math.abs(cardDiff) < 0.01 ? '✓ Balanced' : `Diff: ${cardDiff > 0 ? '+' : ''}$${cardDiff.toFixed(2)}`}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Shift Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any discrepancies or notes..."
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                Review & Close <Lock className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-6 text-center">
              <Check className="mx-auto h-8 w-8 text-secondary mb-2" />
              <p className="text-sm font-medium text-text-primary">Ready to Close Shift</p>
              <p className="text-xs text-text-muted mt-1">
                Cash: ${(parseFloat(cashCount) || 0).toFixed(2)} · Card: ${(parseFloat(cardCount) || 0).toFixed(2)}
              </p>
              {notes && (
                <p className="mt-2 text-xs text-text-secondary italic border-t border-border pt-2">
                  "{notes}"
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  // In real app: API call to close shift
                  onClose();
                }}
              >
                <Lock className="mr-1.5 h-4 w-4" /> Confirm Shift Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}