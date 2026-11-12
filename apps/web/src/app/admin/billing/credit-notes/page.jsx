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

export default function CreditNotesPage() {
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((msg, isErr) => {
    clearTimeout(timer.current);
    setToast({ msg, isErr });
    timer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listInvoices();
      const list = Array.isArray(data) ? data : data?.invoices || data?.data || [];
      setInvoices(list);
    } catch (e) {
      setError(e.message);
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const creditNotes = useMemo(
    () => (invoices || []).filter((i) => Number(i.totalAmount) < 0),
    [invoices]
  );
  const openInvoices = useMemo(
    () =>
      (invoices || []).filter(
        (i) => Number(i.totalAmount) > 0 && !['paid', 'void', 'cancelled'].includes(i.status)
      ),
    [invoices]
  );

  const kpis = useMemo(() => {
    if (!invoices)
      return [
        { l: 'Issued', v: '—' },
        { l: 'Credited (total)', v: '—' },
        { l: 'This month', v: '—' },
        { l: 'Avg credit', v: '—' },
      ];
    const total = creditNotes.reduce((a, c) => a + Math.abs(Number(c.totalAmount)), 0);
    const nowKey = new Date().toISOString().slice(0, 7);
    const thisMonth = creditNotes.filter(
      (c) => String(c.createdAt || '').slice(0, 7) === nowKey
    ).length;
    return [
      { l: 'Issued', v: creditNotes.length },
      { l: 'Credited (total)', v: fmt(total) },
      { l: 'This month', v: thisMonth },
      { l: 'Avg credit', v: creditNotes.length ? fmt(total / creditNotes.length) : '—' },
    ];
  }, [invoices, creditNotes]);

  const tenantOf = (i) => i.tenant?.name || i.tenantName || '—';
  const reasonOf = (i) => {
    const item = Array.isArray(i.items) && i.items[0];
    const d = item?.description || '';
    return d.startsWith('Credit note: ') ? d.slice(13) : d || '—';
  };
  const originalOf = (i) => {
    const item = Array.isArray(i.items) && i.items[0];
    return item?.originalInvoiceId || null;
  };

  return (
    <div className="vb2-wrap">
      <KpiStrip items={kpis} />

      <div className="vb2-toolbar">
        <div className="vb2-section" style={{ margin: 0 }}>
          Credit notes
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="vb2-btn primary" onClick={() => setModal('issue')}>
          Issue credit note
        </button>
      </div>

      <div className="vb2-table-card">
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load credit notes</div>
            <div>{error}</div>
          </div>
        )}
        {!error &&
          invoices === null &&
          [1, 2, 3].map((n) => (
            <div className="vb2-skel" key={n}>
              <div className="vb2-skel-bar" style={{ width: 45 + n * 15 + '%' }} />
            </div>
          ))}
        {!error && invoices !== null && creditNotes.length === 0 && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">No credit notes yet</div>
            <div>
              Issue one against any open invoice — it nets against the tenant's balance with a full
              audit trail.
            </div>
          </div>
        )}
        {!error && invoices !== null && creditNotes.length > 0 && (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Credit note</th>
                  <th>Tenant</th>
                  <th>Issued</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((c) => {
                  const orig = originalOf(c) ? invoices.find((i) => i.id === originalOf(c)) : null;
                  return (
                    <tr key={c.id} style={{ cursor: 'default' }}>
                      <td className="vb2-num">{c.billingPeriod || c.id.slice(0, 8)}</td>
                      <td>{tenantOf(c)}</td>
                      <td className="vb2-muted">{fmtDate(c.createdAt)}</td>
                      <td className="vb2-muted">
                        {reasonOf(c)}
                        {orig ? (
                          <span style={{ marginLeft: 8 }} className="vb2-badge muted">
                            against {orig.number || orig.billingPeriod || orig.id.slice(0, 8)}
                          </span>
                        ) : null}
                      </td>
                      <td className="vb2-right" style={{ color: '#16a34a', fontWeight: 700 }}>
                        −{fmt(Math.abs(Number(c.totalAmount))).slice(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'issue' && (
        <IssueCreditNoteModal
          invoices={openInvoices}
          tenantOf={tenantOf}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            notify('Credit note issued');
          }}
          notify={notify}
        />
      )}

      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}

function IssueCreditNoteModal({ invoices, tenantOf, onClose, onDone, notify }) {
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const inv = invoices.find((i) => i.id === invoiceId);

  const submit = async () => {
    if (!invoiceId) return notify('Pick an invoice', true);
    const amt = Number(amount);
    if (!amt || amt <= 0) return notify('Enter an amount', true);
    if (inv && amt > Number(inv.totalAmount))
      return notify('Amount exceeds the invoice total', true);
    if (!reason.trim()) return notify('A reason is required (goes on the credit note)', true);
    setBusy(true);
    try {
      await api.createCreditNote(invoiceId, { amount: amt, reason: reason.trim() });
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Issue credit note</div>
        <div className="vb2-field">
          <label>Against invoice</label>
          <select
            className="vb2-select"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            <option value="">Select open invoice…</option>
            {invoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.number || i.billingPeriod || i.id.slice(0, 8)} · {tenantOf(i)} ·{' '}
                {fmt(i.totalAmount)}
              </option>
            ))}
          </select>
        </div>
        {inv && (
          <div className="vb2-kv">
            <dt>Invoice total</dt>
            <dd>{fmt(inv.totalAmount)}</dd>
            <dt>Status</dt>
            <dd>{inv.status}</dd>
          </div>
        )}
        <div className="vb2-field">
          <label>Credit amount (ZAR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="vb2-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={inv ? String(Number(inv.totalAmount)) : '0.00'}
          />
        </div>
        <div className="vb2-field">
          <label>Reason (printed on the credit note + audit log)</label>
          <textarea
            className="vb2-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Service outage credit agreed with GM"
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
