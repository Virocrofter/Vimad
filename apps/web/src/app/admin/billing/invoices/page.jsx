import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api';
import { KpiStrip } from '../kpi';
import '../billing-pages.css';

const fmt = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : 'R ' +
      Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'draft', label: 'Draft' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'void', label: 'Void' },
];

const badgeClass = (s) =>
  ({
    draft: 'muted',
    sent: 'info',
    paid: 'ok',
    overdue: 'danger',
    void: 'muted',
    cancelled: 'muted',
  })[s] || 'muted';

export default function InvoicesPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [invoices, setInvoices] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg, isErr) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, isErr });
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listInvoices({ status: tab === 'all' ? '' : tab, q: debouncedQ });
      const list = Array.isArray(data) ? data : data?.invoices || data?.data || data?.items || [];
      setInvoices(list);
      if (data?.counts) setCounts(data.counts);
    } catch (e) {
      setError(e.message);
      setInvoices([]);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (inv) => {
    setSelected(inv.id);
    setDetail(null);
    try {
      setDetail(await api.getInvoice(inv.id));
    } catch (e) {
      notify(e.message, true);
      setDetail({ ...inv, __error: true });
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const kpis = useMemo(() => {
    const list = invoices || [];
    const sum = (f) => list.reduce((a, i) => a + f(i), 0);
    return [
      { l: 'Shown', v: list.length },
      { l: 'Billed', v: fmt(sum((i) => Number(i.totalAmount || 0))) },
      { l: 'Outstanding', v: fmt(sum((i) => Number(i.balance ?? (i.totalAmount || 0)))) },
      { l: 'Overdue', v: list.filter((i) => i.status === 'overdue').length },
    ];
  }, [invoices]);

  const refreshAndClose = async (msg) => {
    closeDetail();
    setModal(null);
    await load();
    if (msg) notify(msg);
  };

  return (
    <div className="vb2-wrap">
      <KpiStrip items={kpis} />

      <div className="vb2-toolbar">
        <div className="vb2-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={'vb2-tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {counts[t.key] != null && <span className="vb2-count">{counts[t.key]}</span>}
            </button>
          ))}
        </div>
        <input
          className="vb2-search"
          placeholder="Search number, tenant…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        <button type="button" className="vb2-btn primary" onClick={() => setModal('create')}>
          Create invoice
        </button>
      </div>

      <div className="vb2-table-card">
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load invoices</div>
            <div>{error}</div>
            <div className="vb2-muted">
              The Bulk 3 backend wires these endpoints - until then this list stays empty.
            </div>
          </div>
        )}
        {!error &&
          invoices === null &&
          [1, 2, 3, 4, 5, 6].map((n) => (
            <div className="vb2-skel" key={n}>
              <div className="vb2-skel-bar" style={{ width: 55 + (n % 3) * 15 + '%' }} />
            </div>
          ))}
        {!error && invoices !== null && invoices.length === 0 && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">No invoices here yet</div>
            <div>Create your first platform invoice to start billing tenants.</div>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="vb2-btn primary" onClick={() => setModal('create')}>
                Create invoice
              </button>
            </div>
          </div>
        )}
        {!error && invoices !== null && invoices.length > 0 && (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Tenant</th>
                  <th>Period</th>
                  <th>Due</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={selected === inv.id ? 'selected' : ''}
                    onClick={() => openDetail(inv)}
                  >
                    <td className="vb2-num">
                      {inv.number || inv.billingPeriod || inv.id.slice(0, 8)}
                    </td>
                    <td>
                      {inv.tenant?.name || inv.tenantName || inv.tenantId?.slice(0, 8) || '—'}
                    </td>
                    <td className="vb2-muted">
                      {inv.billingPeriod ||
                        (inv.periodStart
                          ? fmtDate(inv.periodStart) + ' – ' + fmtDate(inv.periodEnd)
                          : '—')}
                    </td>
                    <td className="vb2-muted">{fmtDate(inv.dueDate)}</td>
                    <td className="vb2-right">{fmt(inv.totalAmount)}</td>
                    <td className="vb2-right">{fmt(inv.balance ?? inv.totalAmount)}</td>
                    <td>
                      <span className={'vb2-badge ' + badgeClass(inv.status)}>
                        {inv.status || 'draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="vb2-panel-backdrop" onClick={closeDetail} />
          <aside className="vb2-panel" role="complementary">
            <div className="vb2-panel-head">
              <div>
                <div className="vb2-panel-title">{detail?.number || 'Invoice'}</div>
                {detail && (
                  <span className={'vb2-badge ' + badgeClass(detail.status)}>
                    {detail.status || 'draft'}
                  </span>
                )}
              </div>
              <button type="button" className="vb2-close" onClick={closeDetail} aria-label="Close">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="vb2-panel-body">
              {!detail && (
                <div className="vb2-skel">
                  <div className="vb2-skel-bar" style={{ width: '70%' }} />
                </div>
              )}
              {detail && !detail.__error && (
                <>
                  <dl className="vb2-kv">
                    <dt>Tenant</dt>
                    <dd>{detail.tenant?.name || detail.tenantName || '—'}</dd>
                    <dt>Period</dt>
                    <dd>{detail.billingPeriod || '—'}</dd>
                    <dt>Issued</dt>
                    <dd>{fmtDate(detail.createdAt)}</dd>
                    <dt>Due</dt>
                    <dd>{fmtDate(detail.dueDate)}</dd>
                    <dt>Plan</dt>
                    <dd>{detail.plan || '—'}</dd>
                  </dl>
                  <div>
                    <div className="vb2-section" style={{ marginBottom: 8 }}>
                      Line items
                    </div>
                    <div className="vb2-items">
                      {(detail.items || []).map((it, i) => (
                        <div className="vb2-item-row" key={i}>
                          <span>{it.description || it.label || 'Item'}</span>
                          <span style={{ fontWeight: 600 }}>{fmt(it.amount)}</span>
                        </div>
                      ))}
                      {(detail.items || []).length === 0 && (
                        <div className="vb2-item-row">
                          <span className="vb2-muted">Base subscription</span>
                          <span style={{ fontWeight: 600 }}>{fmt(detail.baseAmount)}</span>
                        </div>
                      )}
                      {Number(detail.overageAmount) > 0 && (
                        <div className="vb2-item-row">
                          <span>Usage overages</span>
                          <span style={{ fontWeight: 600 }}>{fmt(detail.overageAmount)}</span>
                        </div>
                      )}
                      <div className="vb2-total-row">
                        <span>Total (incl. VAT)</span>
                        <span>{fmt(detail.totalAmount)}</span>
                      </div>
                      <div className="vb2-item-row">
                        <span className="vb2-muted">Balance due</span>
                        <span style={{ fontWeight: 700 }}>
                          {fmt(detail.balance ?? detail.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="vb2-actions">
                    {detail.status !== 'paid' && detail.status !== 'void' && (
                      <>
                        <button
                          type="button"
                          className="vb2-btn primary"
                          onClick={() => setModal('pay')}
                        >
                          Record payment
                        </button>
                        {detail.status === 'draft' && (
                          <button
                            type="button"
                            className="vb2-btn"
                            onClick={async () => {
                              try {
                                await api.sendInvoice(detail.id);
                                refreshAndClose('Invoice sent');
                              } catch (e) {
                                notify(e.message, true);
                              }
                            }}
                          >
                            Send
                          </button>
                        )}
                        <button
                          type="button"
                          className="vb2-btn"
                          onClick={() => setModal('credit')}
                        >
                          Credit note
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}

      {modal === 'create' && (
        <CreateInvoiceModal
          onClose={() => setModal(null)}
          onCreated={() => refreshAndClose('Invoice created')}
          notify={notify}
        />
      )}
      {modal === 'pay' && detail && (
        <RecordPaymentModal
          invoice={detail}
          onClose={() => setModal(null)}
          onDone={() => refreshAndClose('Payment recorded')}
          notify={notify}
        />
      )}
      {modal === 'credit' && detail && (
        <CreditNoteModal
          invoice={detail}
          onClose={() => setModal(null)}
          onDone={() => refreshAndClose('Credit note issued')}
          notify={notify}
        />
      )}

      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated, notify }) {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    tenantId: '',
    billingPeriod: new Date().toISOString().slice(0, 7),
    dueInDays: 14,
    vatRate: 15,
  });
  const [items, setItems] = useState([{ description: 'Monthly subscription', amount: '' }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listTenants()
      .then((t) => setTenants(Array.isArray(t) ? t : t.tenants || []))
      .catch(() => setTenants([]));
  }, []);

  const subtotal = items.reduce((a, it) => a + (Number(it.amount) || 0), 0);
  const vat = (subtotal * (Number(form.vatRate) || 0)) / 100;
  const total = subtotal + vat;

  const submit = async () => {
    if (!form.tenantId) return notify('Pick a tenant', true);
    if (items.every((it) => !Number(it.amount)))
      return notify('Add at least one priced line item', true);
    setBusy(true);
    try {
      await api.createInvoice({
        tenantId: form.tenantId,
        billingPeriod: form.billingPeriod,
        dueInDays: Number(form.dueInDays) || 14,
        vatRate: Number(form.vatRate) || 0,
        items: items
          .filter((it) => Number(it.amount) > 0)
          .map((it) => ({ description: it.description, amount: Number(it.amount) })),
      });
      onCreated();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Create invoice</div>
        <div className="vb2-field">
          <label>Tenant</label>
          <select
            className="vb2-select"
            value={form.tenantId}
            onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
          >
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="vb2-grid2">
          <div className="vb2-field">
            <label>Billing period</label>
            <input
              type="month"
              className="vb2-input"
              value={form.billingPeriod}
              onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
            />
          </div>
          <div className="vb2-field">
            <label>Due in (days)</label>
            <input
              type="number"
              min="0"
              className="vb2-input"
              value={form.dueInDays}
              onChange={(e) => setForm({ ...form, dueInDays: e.target.value })}
            />
          </div>
        </div>
        <div>
          <div className="vb2-field" style={{ marginBottom: 10 }}>
            <label>Line items (ex VAT)</label>
          </div>
          {items.map((it, i) => (
            <div className="vb2-item-edit" key={i} style={{ marginBottom: 8 }}>
              <input
                className="vb2-input"
                placeholder="Description"
                value={it.description}
                onChange={(e) =>
                  setItems(
                    items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x))
                  )
                }
              />
              <input
                className="vb2-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={it.amount}
                onChange={(e) =>
                  setItems(items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
                }
              />
              <button
                type="button"
                className="vb2-btn small"
                disabled={items.length === 1}
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="vb2-btn small"
            onClick={() => setItems([...items, { description: '', amount: '' }])}
          >
            + Add line
          </button>
        </div>
        <div className="vb2-items">
          <div className="vb2-item-row">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="vb2-item-row">
            <span>VAT ({form.vatRate}%)</span>
            <span>{fmt(vat)}</span>
          </div>
          <div className="vb2-total-row">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordPaymentModal({ invoice, onClose, onDone, notify }) {
  const remaining = Number(invoice.balance ?? invoice.totalAmount ?? 0);
  const [form, setForm] = useState({
    amount: remaining || '',
    method: 'bank_transfer',
    reference: '',
    note: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!Number(form.amount) || Number(form.amount) <= 0) return notify('Enter an amount', true);
    setBusy(true);
    try {
      await api.recordPayment(invoice.id, {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference,
        note: form.note,
      });
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Record payment — {invoice.number || ''}</div>
        <div className="vb2-kv">
          <dt>Total</dt>
          <dd>{fmt(invoice.totalAmount)}</dd>
          <dt>Remaining</dt>
          <dd>{fmt(remaining)}</dd>
        </div>
        <div className="vb2-grid2">
          <div className="vb2-field">
            <label>Amount (ZAR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="vb2-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="vb2-field">
            <label>Method</label>
            <select
              className="vb2-select"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="paystack">Paystack</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="vb2-field">
          <label>Reference</label>
          <input
            className="vb2-input"
            placeholder="e.g. bank ref or Paystack id"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </div>
        <div className="vb2-field">
          <label>Note</label>
          <textarea
            className="vb2-textarea"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Saving…' : 'Record payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditNoteModal({ invoice, onClose, onDone, notify }) {
  const remaining = Number(invoice.balance ?? invoice.totalAmount ?? 0);
  const [form, setForm] = useState({ amount: remaining || '', reason: '' });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!Number(form.amount) || Number(form.amount) <= 0) return notify('Enter an amount', true);
    if (!form.reason.trim()) return notify('A reason is required for audit', true);
    setBusy(true);
    try {
      await api.createCreditNote(invoice.id, {
        amount: Number(form.amount),
        reason: form.reason.trim(),
      });
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Issue credit note — {invoice.number || ''}</div>
        <div className="vb2-field">
          <label>Amount (ZAR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="vb2-input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="vb2-field">
          <label>Reason (goes on the credit note and audit log)</label>
          <textarea
            className="vb2-textarea"
            placeholder="e.g. Goodwill discount agreed on renewal"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Issuing…' : 'Issue credit note'}
          </button>
        </div>
      </div>
    </div>
  );
}
