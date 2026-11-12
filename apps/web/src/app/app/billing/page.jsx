import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  ArrowRightLeft,
  Receipt,
  X,
  Check,
  Printer,
  Download,
  Lock,
  User,
  BedDouble,
  AlertCircle,
  Plus,
  FileText,
  Eye,
  RefreshCw,
  Trash2,
  ArrowRight,
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  listFolios,
  getFolio,
  createFolio,
  postCharge,
  postPayment,
  reverseCharge,
  transferToCityLedger,
  deleteFolio,
} from '../../../api/folio';
import FolioOverview from './components/FolioOverview';
import { flags } from '../../../lib/flags';
import PaymentExceptions from './PaymentExceptions';

/* ─── Transaction codes (kept — now mapped to backend charge/payment types) ─── */
const transactionCodes = [
  { code: '1000', name: 'Room Charge', type: 'charge', mapsTo: 'room_charge' },
  { code: '2000', name: 'Resort Fee', type: 'charge', mapsTo: 'service' },
  { code: '2100', name: 'Parking', type: 'charge', mapsTo: 'incidental' },
  { code: '3000', name: 'Room Service', type: 'charge', mapsTo: 'incidental' },
  { code: '6000', name: 'Adjustment', type: 'charge', mapsTo: 'adjustment' },
  { code: '5000', name: 'Payment', type: 'payment', mapsTo: 'card' },
  { code: '9000', name: 'Visa Payment', type: 'payment', mapsTo: 'card' },
  { code: '9001', name: 'Amex Payment', type: 'payment', mapsTo: 'card' },
  { code: '9002', name: 'Cash Payment', type: 'payment', mapsTo: 'cash' },
  { code: '9003', name: 'Bank Transfer', type: 'payment', mapsTo: 'bank_transfer' },
];

const routingTargets = [
  { key: 'guest', label: 'Guest Folio', icon: User, color: 'text-info' },
  { key: 'company', label: 'Company / Master', icon: BedDouble, color: 'text-warning' },
];

// Backend folio_items.type values that represent money IN (payments).
const PAYMENT_TYPES = new Set([
  'cash',
  'card',
  'bank_transfer',
  'check',
  'voucher',
  'refund',
  'payment',
  'deposit',
]);

const isPaymentItem = (type) => PAYMENT_TYPES.has(String(type || '').toLowerCase());
const codeForType = (type) =>
  (transactionCodes.find((c) => c.mapsTo === type) || {}).code ||
  (isPaymentItem(type) ? '5000' : '1000');

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
}

function errMsg(e) {
  return e?.response?.data?.error?.message || e?.message || 'Request failed';
}

/* ─── Main Component ─── */
export default function BillingPage() {
  const [folios, setFolios] = useState([]);
  const [foliosLoading, setFoliosLoading] = useState(true);
  const [foliosError, setFoliosError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [search, setSearch] = useState('');

  const [activeIdx, setActiveIdx] = useState(0);
  const [folio, setFolio] = useState(null); // detail incl. items
  const [items, setItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [notice, setNotice] = useState(null); // { kind: 'success' | 'error', text }
  const [routeMap, setRouteMap] = useState({});

  const [showPostCharge, setShowPostCharge] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showShiftClose, setShowShiftClose] = useState(false);
  const [showNewFolio, setShowNewFolio] = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { kind: 'transfer' | 'delete' }

  const flash = (kind, text) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 5000);
  };

  /* ─── Data loading ─── */
  const loadFolios = useCallback(async () => {
    setFoliosLoading(true);
    setFoliosError('');
    try {
      const res = await listFolios({
        page: 1,
        pageSize: 100,
        status: statusFilter || undefined,
      });
      setFolios(res.data || []);
      setActiveIdx(0);
    } catch (e) {
      setFoliosError(errMsg(e));
    } finally {
      setFoliosLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadFolios();
  }, [loadFolios]);

  const filteredFolios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return folios;
    return folios.filter((f) => {
      const g = f.reservation?.guest;
      const name = g ? `${g.firstName} ${g.lastName}`.toLowerCase() : '';
      return (
        name.includes(q) ||
        (f.reservation?.confirmationNumber || '').toLowerCase().includes(q) ||
        String(f.id).toLowerCase().includes(q)
      );
    });
  }, [folios, search]);

  const activeFolio = filteredFolios[activeIdx] || null;

  useEffect(() => {
    if (!activeFolio) {
      setFolio(null);
      setItems([]);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    getFolio(activeFolio.id)
      .then((res) => {
        if (cancelled) return;
        setFolio(res.data);
        setItems(res.data.items || []);
      })
      .catch((e) => !cancelled && setDetailError(errMsg(e)))
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeFolio?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Derived transaction view (items → charge/payment columns) ─── */
  const currentTransactions = useMemo(
    () =>
      items.map((it) => {
        const payment = isPaymentItem(it.type);
        const amt = Math.abs(Number(it.amount) || 0);
        return {
          id: it.id,
          date: (it.postedAt || '').slice(0, 10),
          description: it.description,
          code: codeForType(it.type),
          charge: payment ? 0 : amt,
          payment: payment ? amt : 0,
          postedBy: '',
          routing:
            routeMap[it.id] || (it.description?.startsWith('[Company]') ? 'company' : 'guest'),
          raw: it,
        };
      }),
    [items, routeMap]
  );

  const runningBalance = useMemo(() => {
    return currentTransactions.reduce(
      (acc, t) => {
        const balance = acc.balance + t.charge - t.payment;
        acc.items.push({ ...t, balance });
        acc.balance = balance;
        return acc;
      },
      { balance: 0, items: [] }
    ).items;
  }, [currentTransactions]);

  const totalCharges = currentTransactions.reduce((s, t) => s + t.charge, 0);
  const totalPayments = currentTransactions.reduce((s, t) => s + t.payment, 0);
  const currentBalance = runningBalance.length
    ? runningBalance[runningBalance.length - 1].balance
    : Number(folio?.balance) || 0;

  const reloadDetail = async () => {
    if (!activeFolio) return;
    const res = await getFolio(activeFolio.id);
    setFolio(res.data);
    setItems(res.data.items || []);
  };

  /* ─── Mutations ─── */
  const handlePostCharge = async (input) => {
    const code = transactionCodes.find((c) => c.code === input.code);
    await postCharge(activeFolio.id, {
      type: code?.mapsTo || 'incidental',
      description: (input.routing === 'company' ? '[Company] ' : '') + input.description,
      amount: input.charge,
      quantity: 1,
    });
    await reloadDetail();
    await loadFolios();
    flash('success', 'Charge posted');
  };

  const handlePostPayment = async (input) => {
    const code = transactionCodes.find((c) => c.code === input.code);
    await postPayment(activeFolio.id, {
      type: code?.mapsTo || 'card',
      description: (input.routing === 'company' ? '[Company] ' : '') + input.description,
      amount: input.payment,
      reference: input.reference || undefined,
    });
    await reloadDetail();
    await loadFolios();
    flash('success', 'Payment posted');
  };

  const handleReverse = async (item, reason) => {
    await reverseCharge(activeFolio.id, item.raw.id, reason);
    await reloadDetail();
    await loadFolios();
    flash('success', 'Charge reversed');
  };

  const handleTransfer = async () => {
    await transferToCityLedger(activeFolio.id);
    setConfirmAction(null);
    await loadFolios();
    flash('success', 'Folio transferred to city ledger');
  };

  const handleDelete = async () => {
    await deleteFolio(activeFolio.id);
    setConfirmAction(null);
    await loadFolios();
    flash('success', 'Folio deleted');
  };

  const handleCreateFolio = async (input) => {
    await createFolio(input);
    setShowNewFolio(false);
    setStatusFilter('');
    await loadFolios();
    flash('success', 'Folio created');
  };

  /* ─── Export CSV (wired) ─── */
  const exportCsv = () => {
    const esc = (v) =>
      /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const header = ['Date', 'Code', 'Description', 'Charge', 'Payment', 'Balance'];
    const lines = runningBalance.map((t) =>
      [t.date, t.code, t.description, t.charge, t.payment, t.balance].map(esc).join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio-${activeFolio?.id || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guestName = folio?.reservation?.guest
    ? `${folio.reservation.guest.firstName} ${folio.reservation.guest.lastName}`
    : null;

  if (flags.paymentExceptions) return <PaymentExceptions />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Folio & Billing</h1>
            <p className="text-sm text-text-secondary">
              {folio?.reservation
                ? `Reservation ${folio.reservation.confirmationNumber}${guestName ? ` • ${guestName}` : ''}`
                : 'Select a folio window below'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewFolio(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Folio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReceipt(true)}
            disabled={!folio}
          >
            <Eye className="mr-1.5 h-4 w-4" /> Preview Receipt
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={runningBalance.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Folio Overview (wired: /v1/folios + /v1/dashboard/stats) */}
      <FolioOverview />

      {/* Notice banner */}
      {notice && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
            notice.kind === 'success'
              ? 'border-accent/20 bg-accent/5 text-accent'
              : 'border-danger/20 bg-danger/5 text-danger'
          )}
        >
          {notice.kind === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {notice.text}
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Search guest or confirmation #"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="transferred">Transferred</option>
        </select>
        <Button variant="outline" size="sm" onClick={loadFolios}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', foliosLoading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setShowPostCharge(true)}
          variant="secondary"
          size="sm"
          disabled={!folio || folio.status !== 'open'}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Post Charge
        </Button>
        <Button
          onClick={() => setShowPostPayment(true)}
          variant="outline"
          size="sm"
          disabled={!folio || folio.status !== 'open'}
        >
          <DollarSign className="mr-1.5 h-4 w-4" /> Post Payment
        </Button>
        <Button onClick={() => setShowRouting(true)} variant="outline" size="sm" disabled={!folio}>
          <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Routing
        </Button>
        <Button
          onClick={() => setConfirmAction({ kind: 'transfer' })}
          variant="outline"
          size="sm"
          disabled={!folio || folio.status !== 'open'}
        >
          <ArrowRight className="mr-1.5 h-4 w-4" /> Transfer to City Ledger
        </Button>
        <Button
          onClick={() => setConfirmAction({ kind: 'delete' })}
          variant="outline"
          size="sm"
          className="text-danger border-danger/30 hover:bg-danger/10"
          disabled={!folio || items.length > 0}
          title={items.length > 0 ? 'Only empty folios can be deleted' : 'Delete empty folio'}
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
        </Button>
        <div className="flex-1" />
        <Button
          onClick={() => setShowShiftClose(true)}
          variant="outline"
          size="sm"
          className="text-danger border-danger/30 hover:bg-danger/10"
        >
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
          <p
            className={cn(
              'mt-1 text-xl font-bold font-mono',
              currentBalance > 0 ? 'text-danger' : 'text-accent'
            )}
          >
            {formatCurrency(Math.abs(currentBalance))}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Transactions</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {currentTransactions.length} txns
          </p>
        </div>
      </div>

      {/* Error states */}
      {foliosError && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {foliosError}
        </div>
      )}

      {/* Folio windows & transaction table */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex flex-wrap border-b border-border px-4">
          {foliosLoading && filteredFolios.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">Loading folios…</p>
          ) : filteredFolios.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">
              {statusFilter
                ? `No ${statusFilter} folios.`
                : 'No folios yet — create one with "New Folio".'}
            </p>
          ) : (
            filteredFolios.map((f, i) => {
              const g = f.reservation?.guest;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeIdx === i
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  )}
                >
                  Window {i + 1}
                  {g && <span className="ml-1.5 text-xs opacity-70">· {g.lastName}</span>}
                </button>
              );
            })
          )}
        </div>

        <div className="overflow-x-auto">
          {detailLoading ? (
            <p className="px-4 py-10 text-center text-sm text-text-muted">Loading folio…</p>
          ) : detailError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">{detailError}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Charge
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runningBalance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-text-muted">
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
                      <td className="px-4 py-3 text-right">
                        {!isPaymentItem(tx.raw.type) && folio?.status === 'open' && (
                          <button
                            onClick={() => setReverseTarget(tx)}
                            className="text-xs text-text-muted hover:text-danger"
                            title="Reverse charge"
                          >
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showPostCharge && (
        <PostChargeModal
          onClose={() => setShowPostCharge(false)}
          onPost={async (tx) => {
            try {
              await handlePostCharge(tx);
              setShowPostCharge(false);
            } catch (e) {
              flash('error', errMsg(e));
            }
          }}
          transactionCodes={transactionCodes}
          routingTargets={routingTargets}
        />
      )}

      {showPostPayment && (
        <PostPaymentModal
          onClose={() => setShowPostPayment(false)}
          onPost={async (tx) => {
            try {
              await handlePostPayment(tx);
              setShowPostPayment(false);
            } catch (e) {
              flash('error', errMsg(e));
            }
          }}
          transactionCodes={transactionCodes}
          routingTargets={routingTargets}
        />
      )}

      {showRouting && (
        <RoutingModal
          transactions={currentTransactions}
          onClose={() => setShowRouting(false)}
          onRoute={(txId, target) => setRouteMap((prev) => ({ ...prev, [txId]: target }))}
          routingTargets={routingTargets}
        />
      )}

      {showShiftClose && (
        <ShiftCloseModal onClose={() => setShowShiftClose(false)} items={items} folios={folios} />
      )}

      {showReceipt && (
        <ReceiptPreviewModal
          onClose={() => setShowReceipt(false)}
          folio={folio}
          guestName={guestName}
          transactions={currentTransactions}
        />
      )}

      {showNewFolio && (
        <NewFolioModal
          onClose={() => setShowNewFolio(false)}
          onCreate={async (input) => {
            try {
              await handleCreateFolio(input);
            } catch (e) {
              flash('error', errMsg(e));
            }
          }}
        />
      )}

      {reverseTarget && (
        <ReverseChargeModal
          item={reverseTarget}
          onClose={() => setReverseTarget(null)}
          onConfirm={async (reason) => {
            try {
              await handleReverse(reverseTarget, reason);
              setReverseTarget(null);
            } catch (e) {
              flash('error', errMsg(e));
            }
          }}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.kind === 'transfer' ? 'Transfer to City Ledger' : 'Delete Folio'}
          description={
            confirmAction.kind === 'transfer'
              ? 'This moves the folio balance to the city ledger and marks it transferred. This cannot be undone.'
              : 'This permanently deletes the (empty) folio. This cannot be undone.'
          }
          confirmLabel={confirmAction.kind === 'transfer' ? 'Transfer' : 'Delete'}
          danger={confirmAction.kind === 'delete'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            try {
              if (confirmAction.kind === 'transfer') await handleTransfer();
              else await handleDelete();
            } catch (e) {
              flash('error', errMsg(e));
              setConfirmAction(null);
            }
          }}
        />
      )}
    </div>
  );
}

/* ─── Post Charge Modal ─── */
function PostChargeModal({ onClose, onPost, transactionCodes, routingTargets }) {
  const [code, setCode] = useState('1000');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [routing, setRouting] = useState('guest');
  const [submitting, setSubmitting] = useState(false);
  const selectedCode = transactionCodes.find((c) => c.code === code);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onPost({
        description: description || selectedCode?.name || 'Charge',
        code,
        charge: parseFloat(amount) || 0,
        payment: 0,
        routing,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Post Charge</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Transaction Code
            </label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {transactionCodes
                .filter((c) => c.type === 'charge')
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selectedCode?.name}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Route To
            </label>
            <div className="grid grid-cols-2 gap-2">
              {routingTargets.map((r) => (
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={submitting}>
              <Check className="mr-1.5 h-4 w-4" /> {submitting ? 'Posting…' : 'Post Charge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Post Payment Modal ─── */
function PostPaymentModal({ onClose, onPost, transactionCodes, routingTargets }) {
  const [code, setCode] = useState('9000');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [routing, setRouting] = useState('guest');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const codeObj = transactionCodes.find((c) => c.code === code);
      await onPost({
        description: codeObj?.name || 'Payment',
        code,
        charge: 0,
        payment: parseFloat(amount) || 0,
        reference,
        routing,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Post Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {transactionCodes
                .filter((c) => c.type === 'payment')
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reference / Card Last 4
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="4242"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Route To
            </label>
            <div className="grid grid-cols-2 gap-2">
              {routingTargets.map((r) => (
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={submitting}>
              <Check className="mr-1.5 h-4 w-4" /> {submitting ? 'Posting…' : 'Post Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Routing Modal (kept — client-side routing visualization) ─── */
function RoutingModal({ transactions, onClose, onRoute, routingTargets }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Routing Visualization</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center gap-4">
            {routingTargets.map((r) => {
              const count = transactions.filter((t) => t.routing === r.key).length;
              const total = transactions
                .filter((t) => t.routing === r.key)
                .reduce((s, t) => s + t.charge - t.payment, 0);
              return (
                <div
                  key={r.key}
                  className="flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-2"
                >
                  <r.icon className={cn('h-4 w-4', r.color)} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-secondary">{r.label}</p>
                    <p
                      className={cn(
                        'text-sm font-mono font-semibold truncate',
                        total > 0 ? 'text-danger' : total < 0 ? 'text-accent' : 'text-text-primary'
                      )}
                    >
                      {count} items · {formatCurrency(Math.abs(total))}
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
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  Description
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  Current Route
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  New Route
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const current = routingTargets.find((r) => r.key === tx.routing);
                return (
                  <tr key={tx.id} className="hover:bg-surface/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{tx.description}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm text-text-primary">
                      {tx.charge > 0 ? formatCurrency(tx.charge) : `-${formatCurrency(tx.payment)}`}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium border border-border">
                        {current && <current.icon className={cn('h-3 w-3', current.color)} />}
                        {current?.label || 'Guest'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={tx.routing || 'guest'}
                        onChange={(e) => onRoute(tx.id, e.target.value)}
                        className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {routingTargets.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
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
function ReceiptPreviewModal({ onClose, folio, guestName, transactions }) {
  const totalCharges = transactions.reduce((s, t) => s + t.charge, 0);
  const totalPayments = transactions.reduce((s, t) => s + t.payment, 0);
  const balance = totalCharges - totalPayments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white dark:bg-slate-900 p-0 shadow-2xl overflow-hidden">
        <div className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-white">
                V
              </div>
              <span className="text-sm font-semibold text-text-primary">Vimad PMS</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider">Guest Folio Receipt</p>
            <p className="text-lg font-bold text-text-primary">{guestName || 'Guest'}</p>
            <p className="text-xs text-text-muted">
              {folio?.reservation
                ? `Res ${folio.reservation.confirmationNumber}`
                : `Folio ${folio?.id || ''}`}
              {folio?.status ? ` · ${folio.status}` : ''}
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="border-t border-border pt-3 space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-text-secondary">{tx.description}</span>
                <span
                  className={cn('font-mono', tx.charge > 0 ? 'text-text-primary' : 'text-accent')}
                >
                  {tx.charge > 0 ? formatCurrency(tx.charge) : `-${formatCurrency(tx.payment)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total Charges</span>
              <span className="font-mono font-medium text-text-primary">
                {formatCurrency(totalCharges)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Total Payments</span>
              <span className="font-mono font-medium text-accent">
                -{formatCurrency(totalPayments)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-1">
              <span className="text-text-primary">Balance Due</span>
              <span className={cn('font-mono', balance > 0 ? 'text-danger' : 'text-accent')}>
                {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          </div>
          <div className="text-center pt-2">
            <p className="text-[10px] text-text-muted">Thank you for choosing Vimad</p>
            <p className="text-[10px] text-text-muted">{new Date().toLocaleString()}</p>
          </div>
        </div>
        <div className="border-t border-border bg-surface px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Save PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shift Close Modal (cash totals derived from posted payment items) ─── */
function ShiftCloseModal({ onClose, items, folios }) {
  const [step, setStep] = useState(1);
  const [cashCount, setCashCount] = useState('');
  const [cardCount, setCardCount] = useState('');
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const todayItems = (items || []).filter((it) => (it.postedAt || '').slice(0, 10) === today);
  const systemCash = todayItems
    .filter((it) => String(it.type).toLowerCase() === 'cash')
    .reduce((s, it) => s + Math.abs(Number(it.amount) || 0), 0);
  const systemCard = todayItems
    .filter((it) => ['card', 'bank_transfer'].includes(String(it.type).toLowerCase()))
    .reduce((s, it) => s + Math.abs(Number(it.amount) || 0), 0);
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                s <= step ? 'bg-secondary' : 'bg-border'
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
                Shift Summary — {today}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Cash Payments</span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCurrency(systemCash)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Card / Transfer Payments</span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCurrency(systemCard)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-text-primary">System Total</span>
                  <span className="font-mono text-secondary">{formatCurrency(systemTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Open folios on the books</span>
                  <span>{folios?.length ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                Closing a shift is irreversible. Ensure all payments are posted and folios are
                balanced before proceeding.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
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
                  <span className="text-xs font-medium text-text-secondary uppercase">
                    Cash Drawer
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-1">System: {formatCurrency(systemCash)}</p>
                <input
                  type="number"
                  step="0.01"
                  value={cashCount}
                  onChange={(e) => setCashCount(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {cashCount && (
                  <p
                    className={cn(
                      'mt-1 text-xs font-mono',
                      Math.abs(cashDiff) < 0.01 ? 'text-secondary' : 'text-danger'
                    )}
                  >
                    {Math.abs(cashDiff) < 0.01
                      ? '✓ Balanced'
                      : `Diff: ${cashDiff > 0 ? '+' : ''}${formatCurrency(cashDiff)}`}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-info" />
                  <span className="text-xs font-medium text-text-secondary uppercase">
                    Card Batch
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-1">System: {formatCurrency(systemCard)}</p>
                <input
                  type="number"
                  step="0.01"
                  value={cardCount}
                  onChange={(e) => setCardCount(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {cardCount && (
                  <p
                    className={cn(
                      'mt-1 text-xs font-mono',
                      Math.abs(cardDiff) < 0.01 ? 'text-secondary' : 'text-danger'
                    )}
                  >
                    {Math.abs(cardDiff) < 0.01
                      ? '✓ Balanced'
                      : `Diff: ${cardDiff > 0 ? '+' : ''}${formatCurrency(cardDiff)}`}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Shift Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any discrepancies or notes..."
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
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
                Cash: {formatCurrency(parseFloat(cashCount) || 0)} · Card:{' '}
                {formatCurrency(parseFloat(cardCount) || 0)}
              </p>
              {notes && (
                <p className="mt-2 text-xs text-text-secondary italic border-t border-border pt-2">
                  "{notes}"
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                <Lock className="mr-1.5 h-4 w-4" /> Confirm Shift Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Folio Modal ─── */
function NewFolioModal({ onClose, onCreate }) {
  const [reservationId, setReservationId] = useState('');
  const [type, setType] = useState('guest');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">New Folio</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError('');
            try {
              await onCreate({
                reservationId: reservationId.trim(),
                type,
                name: name.trim() || undefined,
              });
            } catch (err) {
              setError(errMsg(err));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reservation ID
            </label>
            <input
              type="text"
              required
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              placeholder="Reservation UUID"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Folio Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="guest">Guest</option>
              <option value="master">Master</option>
              <option value="split">Split</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Label (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Company charges"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={submitting}>
              <Check className="mr-1.5 h-4 w-4" /> {submitting ? 'Creating…' : 'Create Folio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Reverse Charge Modal ─── */
function ReverseChargeModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Reverse Charge</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-sm text-text-secondary">
          {item.description} — {formatCurrency(item.charge)}
        </p>
        <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
          Reason (required)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          placeholder="Why is this charge being reversed?"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!reason.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm(reason.trim());
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Check className="mr-1.5 h-4 w-4" /> {submitting ? 'Reversing…' : 'Reverse Charge'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Generic Confirm ─── */
function ConfirmModal({ title, description, confirmLabel, danger, onCancel, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={danger ? 'outline' : 'secondary'}
            className={danger ? 'text-danger border-danger/30 hover:bg-danger/10' : ''}
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
