/* apps/web/src/app/app/billing/payments/page.jsx
 * Payments command center: hosted checkout deposits, saved-card charges,
 * refunds, and the live transaction ledger (all Paystack-backed).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getPaymentConfig,
  listPayments,
  initializePayment,
  verifyPayment,
  chargeSavedCard,
  refundPayment,
  listGuestPaymentMethods,
} from '../../../../api/payments';
import { usePaystack } from '../../../../hooks/usePaystack';

const TYPES = {
  deposit: 'Deposit',
  balance_charge: 'Balance Charge',
  no_show_fee: 'No-Show Fee',
  vcc_charge: 'VCC Capture',
  refund: 'Refund',
};
const STATUSES = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  partially_refunded: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};
const fmt = (minor, currency = 'ZAR') =>
  `${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`;
const newKey = () => `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function PaymentsPage() {
  const [config, setConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ status: '', type: '', search: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null); // 'pay' | 'charge' | 'refund'
  const { payWithPopup } = usePaystack();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPayments(filters);
      setRows(res.data);
      setMeta(res.meta);
      setSummary(res.summary);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    getPaymentConfig()
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({ configured: false }));
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // Paystack redirect callback: /app/billing/payments?verified=1&reference=PSK-...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    const t = setTimeout(() => setNotice({ kind: 'info', text: `Verifying ${reference}…` }), 0);
    verifyPayment(reference)
      .then(() => {
        setNotice({ kind: 'ok', text: `Payment ${reference} confirmed and posted to folio.` });
        window.history.replaceState({}, '', '/app/billing/payments');
        load();
      })
      .catch((err) => setNotice({ kind: 'err', text: err.message ?? 'Verification failed' }));
  }, [load]);

  async function startHostedPayment(form) {
    const amountMinor = Math.round(parseFloat(form.amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      setNotice({ kind: 'err', text: 'Enter a valid amount.' });
      return;
    }
    const { data } = await initializePayment({
      email: form.email,
      amountMinor,
      type: form.type,
      guestId: form.guestId || undefined,
      reservationId: form.reservationId || undefined,
      idempotencyKey: newKey(),
    });
    if (config?.publicKey) {
      payWithPopup({
        publicKey: config.publicKey,
        email: form.email,
        amountMinor,
        currency: config.currency,
        reference: data.reference,
        onSuccess: async (ref) => {
          await verifyPayment(ref);
          setNotice({ kind: 'ok', text: 'Payment confirmed and posted to folio.' });
          setModal(null);
          load();
        },
        onClose: () => setNotice({ kind: 'info', text: 'Checkout closed before completion.' }),
      });
    } else {
      window.location.href = data.authorizationUrl;
    }
  }

  async function doChargeSavedCard(form) {
    const amountMinor = Math.round(parseFloat(form.amount) * 100);
    const { data } = await chargeSavedCard({
      paymentMethodId: form.paymentMethodId,
      amountMinor,
      type: form.type,
      reservationId: form.reservationId || undefined,
      idempotencyKey: newKey(),
    });
    setModal(null);
    setNotice(
      data.status === 'success'
        ? { kind: 'ok', text: `Charged ${fmt(amountMinor)} to saved card.` }
        : { kind: 'err', text: `Charge failed: ${data.failureReason ?? 'unknown'}` }
    );
    load();
  }

  async function doRefund(row, amount, reason) {
    const amountMinor = amount ? Math.round(parseFloat(amount) * 100) : undefined;
    await refundPayment(row.id, { amountMinor, reason });
    setModal(null);
    setNotice({ kind: 'ok', text: `Refund submitted for ${row.reference}.` });
    load();
  }

  const kpis = useMemo(
    () => [
      { label: 'Collected (24h)', value: fmt(summary?.collectedTodayMinor ?? 0) },
      { label: 'Refunded (total)', value: fmt(summary?.refundedTotalMinor ?? 0) },
      { label: 'Pending', value: summary?.pendingCount ?? 0 },
    ],
    [summary]
  );

  if (config && !config.configured) {
    return (
      <div className="p-6 text-sm text-amber-400">
        Paystack is not configured. Set PAYSTACK_SECRET_KEY / PAYSTACK_PUBLIC_KEY in apps/api/.env
        and restart the API.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModal('charge')}
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm"
          >
            Charge Saved Card
          </button>
          <button
            onClick={() => setModal('pay')}
            className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
          >
            Take Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-white/10 p-4">
            <div className="text-xs text-gray-400">{k.label}</div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      {notice && (
        <div
          className={`text-sm rounded px-3 py-2 border ${
            notice.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : notice.kind === 'err'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-white/10 bg-white/5 text-gray-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          placeholder="Search reference / name / last4"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm w-64"
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUSES).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Folio</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  No payments yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 font-mono text-xs">{p.reference}</td>
                  <td className="px-3 py-2">
                    {p.guest ? `${p.guest.firstName} ${p.guest.lastName}` : '—'}
                    {p.cardLast4 && (
                      <span className="text-gray-500 text-xs ml-1">•••• {p.cardLast4}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{TYPES[p.type] ?? p.type}</td>
                  <td className="px-3 py-2">
                    {fmt(p.amountMinor - p.refundedMinor, p.currency)}
                    {p.refundedMinor > 0 && (
                      <div className="text-xs text-orange-400">
                        -{fmt(p.refundedMinor)} refunded
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${STATUSES[p.status] ?? ''}`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.postedToFolio ? '✓ posted' : p.status === 'success' ? 'posting…' : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {(p.status === 'success' || p.status === 'partially_refunded') && (
                      <button
                        onClick={() => setModal({ refund: p })}
                        className="text-xs text-red-300 hover:underline"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <button
          disabled={meta.page <= 1}
          onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-gray-400">
          {meta.page} / {meta.totalPages}
        </span>
        <button
          disabled={meta.page >= meta.totalPages}
          onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
          className="px-3 py-1 rounded bg-white/10 disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {modal === 'pay' && (
        <TakePaymentModal onSubmit={startHostedPayment} onClose={() => setModal(null)} />
      )}
      {modal === 'charge' && (
        <ChargeCardModal onSubmit={doChargeSavedCard} onClose={() => setModal(null)} />
      )}
      {modal?.refund && (
        <RefundModal row={modal.refund} onSubmit={doRefund} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
const inputCls = 'w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm';

function TakePaymentModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    email: '',
    amount: '',
    type: 'deposit',
    guestId: '',
    reservationId: '',
  });
  return (
    <Modal title="Take Payment (Paystack Checkout)" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Guest email *">
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Amount (major units, e.g. 1500.00) *">
          <input
            className={inputCls}
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </Field>
        <Field label="Type">
          <select
            className={inputCls}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="deposit">Deposit</option>
            <option value="balance_charge">Balance Charge</option>
            <option value="no_show_fee">No-Show Fee</option>
          </select>
        </Field>
        <Field label="Guest ID (optional — links + saves card)">
          <input
            className={inputCls}
            value={form.guestId}
            onChange={(e) => setForm({ ...form, guestId: e.target.value })}
          />
        </Field>
        <Field label="Reservation ID (optional — posts to folio)">
          <input
            className={inputCls}
            value={form.reservationId}
            onChange={(e) => setForm({ ...form, reservationId: e.target.value })}
          />
        </Field>
        <ModalActions
          onClose={onClose}
          submitLabel="Open Paystack Checkout"
          onSubmit={() => onSubmit(form)}
          disabled={!form.email || !form.amount}
        />
      </div>
    </Modal>
  );
}

function ChargeCardModal({ onSubmit, onClose }) {
  const [guestId, setGuestId] = useState('');
  const [methods, setMethods] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('balance_charge');
  const [reservationId, setReservationId] = useState('');

  useEffect(() => {
    if (!guestId) return;
    listGuestPaymentMethods(guestId)
      .then((res) => {
        setMethods(res.data);
        setPaymentMethodId(res.data[0]?.id ?? '');
      })
      .catch(() => setMethods([]));
  }, [guestId]);

  return (
    <Modal title="Charge Saved Card" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Guest ID *">
          <input
            className={inputCls}
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
          />
        </Field>
        {guestId && (
          <Field label="Saved card">
            <select
              className={inputCls}
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              {methods.length === 0 && (
                <option value="">
                  No saved cards (cards save after first successful checkout)
                </option>
              )}
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {(m.cardType ?? 'card').toUpperCase()} •••• {m.cardLast4} — exp {m.cardExpMonth}/
                  {m.cardExpYear}
                  {m.bank ? ` (${m.bank})` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Amount *">
          <input
            className={inputCls}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Type">
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="balance_charge">Balance Charge</option>
            <option value="no_show_fee">No-Show Fee</option>
            <option value="deposit">Deposit</option>
          </select>
        </Field>
        <Field label="Reservation ID (optional)">
          <input
            className={inputCls}
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
          />
        </Field>
        <ModalActions
          onClose={onClose}
          submitLabel="Charge Card"
          disabled={!paymentMethodId || !amount}
          onSubmit={() => onSubmit({ paymentMethodId, amount, type, reservationId })}
        />
      </div>
    </Modal>
  );
}

function RefundModal({ row, onSubmit, onClose }) {
  const max = (row.amountMinor - row.refundedMinor) / 100;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <Modal title={`Refund ${row.reference}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Outstanding:{' '}
          <span className="text-gray-200 font-medium">
            {max.toFixed(2)} {row.currency}
          </span>
          {row.cardBrand && ` — ${row.cardBrand} •••• ${row.cardLast4}`}
        </p>
        <Field label={`Amount (leave empty for full refund, max ${max.toFixed(2)})`}>
          <input
            className={inputCls}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Reason">
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <ModalActions
          onClose={onClose}
          submitLabel="Process Refund"
          onSubmit={() => onSubmit(row, amount, reason)}
        />
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#14141f] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSubmit, submitLabel, disabled }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onClose} className="px-3 py-2 rounded bg-white/10 text-sm">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}
