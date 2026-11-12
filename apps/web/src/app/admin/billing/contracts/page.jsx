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
  { key: 'active', label: 'Active' },
  { key: 'pending_activation', label: 'Pending' },
  { key: 'draft', label: 'Draft' },
  { key: 'renewed', label: 'Renewed' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
];

const badgeClass = (s) =>
  ({
    active: 'ok',
    renewed: 'ok',
    pending_activation: 'info',
    draft: 'muted',
    expired: 'warn',
    cancelled: 'danger',
  })[s] || 'muted';

const label = (s) => (s || '').replace(/_/g, ' ');

const ACTIONS = {
  draft: ['sign', 'cancel'],
  pending_activation: ['activate', 'cancel'],
  active: ['amend', 'renew', 'cancel'],
  renewed: ['amend', 'renew', 'cancel'],
  expired: ['renew'],
  cancelled: [],
};

const ACTION_LABEL = {
  sign: 'Sign',
  activate: 'Activate',
  amend: 'Amend',
  renew: 'Renew',
  cancel: 'Cancel',
};

export default function ContractsPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [contracts, setContracts] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((msg, isErr) => {
    clearTimeout(timer.current);
    setToast({ msg, isErr });
    timer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.listContracts({ status: tab === 'all' ? '' : tab, q: debouncedQ });
      setContracts(Array.isArray(data) ? data : data?.contracts || data?.data || []);
    } catch (e) {
      setError(e.message);
      setContracts([]);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (c) => {
    setSelected(c.id);
    setDetail(null);
    try {
      setDetail(await api.getContract(c.id));
    } catch (e) {
      setDetail({ ...c, __fallback: true });
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const kpis = useMemo(() => {
    const list = contracts || [];
    const now = Date.now();
    const in90 = list.filter(
      (c) =>
        ['active', 'renewed'].includes(c.status) &&
        c.endDate &&
        new Date(c.endDate).getTime() - now <= 90 * 86400000 &&
        new Date(c.endDate).getTime() > now
    );
    return [
      { l: 'Contracts', v: list.length },
      {
        l: 'Contracted MRR',
        v: fmt(
          list
            .filter((c) => ['active', 'renewed'].includes(c.status))
            .reduce((a, c) => a + Number(c.netFee || 0), 0)
        ),
      },
      { l: 'Expiring ≤90 days', v: in90.length },
      { l: 'Drafts', v: list.filter((c) => c.status === 'draft').length },
    ];
  }, [contracts]);

  const act = async (action, payload) => {
    if (!detail) return;
    try {
      await api.contractAction(detail.id, action, payload);
      closeDetail();
      setModal(null);
      await load();
      notify('Contract ' + ACTION_LABEL[action].toLowerCase + '' === 'x' ? 'updated' : 'updated');
    } catch (e) {
      notify(e.message, true);
    }
  };

  const runAction = (action) => {
    if (
      action === 'cancel' ||
      action === 'amend' ||
      action === 'renew' ||
      action === 'sign' ||
      action === 'approve-discount'
    ) {
      setModal(action);
    } else {
      act(action, {});
    }
  };

  const needsApproval = detail && Number(detail.discountPct) >= 10 && !detail.discountApprovedBy;

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
            </button>
          ))}
        </div>
        <input
          className="vb2-search"
          placeholder="Search tenant, entity…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        <button type="button" className="vb2-btn primary" onClick={() => setModal('create')}>
          New contract
        </button>
      </div>

      <div className="vb2-table-card">
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load contracts</div>
            <div>{error}</div>
          </div>
        )}
        {!error &&
          contracts === null &&
          [1, 2, 3, 4].map((n) => (
            <div className="vb2-skel" key={n}>
              <div className="vb2-skel-bar" style={{ width: 48 + (n % 3) * 20 + '%' }} />
            </div>
          ))}
        {!error && contracts !== null && contracts.length === 0 && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">No contracts here</div>
            <div>
              Create a contract to lock in negotiated pricing — it overrides the plan fee at invoice
              time.
            </div>
          </div>
        )}
        {!error && contracts !== null && contracts.length > 0 && (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Legal entity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Net fee</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th>Ends</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    className={selected === c.id ? 'selected' : ''}
                    onClick={() => openDetail(c)}
                  >
                    <td className="vb2-num">{c.tenantName || c.tenant?.name || '—'}</td>
                    <td>{c.legalEntity}</td>
                    <td>
                      <span className={'vb2-badge ' + badgeClass(c.status)}>{label(c.status)}</span>
                    </td>
                    <td className="vb2-right">{fmt(c.netFee)}</td>
                    <td className="vb2-right">
                      {Number(c.discountPct) > 0 ? Number(c.discountPct) + '%' : '—'}
                    </td>
                    <td className="vb2-muted">{fmtDate(c.endDate)}</td>
                    <td className="vb2-muted">v{c.version}</td>
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
                <div className="vb2-panel-title">{detail?.legalEntity || 'Contract'}</div>
                {detail && (
                  <span className={'vb2-badge ' + badgeClass(detail.status)}>
                    {label(detail.status)}
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
              {detail && (
                <>
                  <dl className="vb2-kv">
                    <dt>Tenant</dt>
                    <dd>{detail.tenantName || detail.tenant?.name || '—'}</dd>
                    <dt>List fee</dt>
                    <dd>{fmt(detail.listFee)}</dd>
                    <dt>Initial fee</dt>
                    <dd>
                      <b>{fmt(detail.netFee)}</b>
                    </dd>
                    <dt>Renews at</dt>
                    <dd>
                      {detail.renewalFee != null ? fmt(detail.renewalFee) : fmt(detail.listFee)}
                    </dd>
                    <dt>Discount</dt>
                    <dd>
                      {Number(detail.discountPct) > 0
                        ? Number(detail.discountPct) +
                          '%' +
                          (detail.discountApprovedBy
                            ? ` (approved by ${detail.discountApprovedBy})`
                            : '')
                        : '—'}
                    </dd>
                    <dt>Term</dt>
                    <dd>
                      {fmtDate(detail.startDate)} → {fmtDate(detail.endDate)}
                    </dd>
                    <dt>Renewal</dt>
                    <dd>
                      {detail.autoRenew
                        ? `Auto-renews, ${detail.renewalNoticeDays}d notice`
                        : `Manual, ${detail.renewalNoticeDays}d notice`}
                    </dd>
                    <dt>Payment</dt>
                    <dd>{detail.paymentMethod || 'invoice'}</dd>
                    <dt>Data use</dt>
                    <dd>
                      {(detail.modules || []).includes('data-use:opted-out')
                        ? 'Opted out of aggregate benchmarks'
                        : 'Aggregate benchmarks consented'}
                    </dd>
                    <dt>Document</dt>
                    <dd>
                      {detail.documentUrl ? (
                        <a href={detail.documentUrl} target="_blank" rel="noreferrer">
                          Open signed document
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </dl>

                  <div className="vb2-actions">
                    {needsApproval && (
                      <button
                        type="button"
                        className="vb2-btn"
                        onClick={() => runAction('approve-discount')}
                      >
                        Approve discount
                      </button>
                    )}
                    {(ACTIONS[detail.status] || []).map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={
                          'vb2-btn' +
                          (a === 'cancel'
                            ? ' danger'
                            : a === 'sign' || a === 'activate'
                              ? ' primary'
                              : '')
                        }
                        onClick={() => runAction(a)}
                      >
                        {ACTION_LABEL[a]}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="vb2-section" style={{ marginBottom: 8 }}>
                      History
                    </div>
                    <div className="vb2-items">
                      {(detail.events || []).map((ev) => (
                        <div className="vb2-item-row" key={ev.id} style={{ display: 'block' }}>
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                          >
                            <span style={{ fontWeight: 650, textTransform: 'capitalize' }}>
                              {label(ev.type)}
                            </span>
                            <span className="vb2-muted">{fmtDate(ev.createdAt)}</span>
                          </div>
                          <div className="vb2-muted" style={{ marginTop: 3 }}>
                            by {ev.actor}
                          </div>
                          {ev.payload && Object.keys(ev.payload).length > 0 && (
                            <div
                              className="vb2-muted"
                              style={{
                                marginTop: 3,
                                fontFamily: 'monospace',
                                fontSize: 11.5,
                                wordBreak: 'break-all',
                              }}
                            >
                              {JSON.stringify(ev.payload)}
                            </div>
                          )}
                        </div>
                      ))}
                      {(detail.events || []).length === 0 && (
                        <div className="vb2-item-row">
                          <span className="vb2-muted">No events yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}

      {modal === 'create' && (
        <CreateContractModal
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
          notify={notify}
        />
      )}
      {modal === 'sign' && detail && (
        <FieldModal
          title={'Sign contract — ' + detail.legalEntity}
          fields={[{ key: 'documentUrl', label: 'Signed document URL (optional)', type: 'text' }]}
          confirmLabel="Mark as signed"
          onSubmit={(v) => act('sign', v)}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === 'activate' && detail && (
        <ConfirmModal
          title={'Activate contract — ' + detail.legalEntity}
          body="The contract becomes the pricing source for this tenant's invoices immediately."
          confirmLabel="Activate"
          onConfirm={() => act('activate', {})}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'amend' && detail && (
        <FieldModal
          title={'Amend contract — ' + detail.legalEntity}
          fields={[
            { key: 'netFee', label: 'New net fee (ZAR)', type: 'number', def: detail.netFee },
            {
              key: 'discountPct',
              label: 'New discount %',
              type: 'number',
              def: detail.discountPct,
            },
            {
              key: 'endDate',
              label: 'New end date',
              type: 'date',
              def: detail.endDate ? String(detail.endDate).slice(0, 10) : '',
            },
            { key: 'reason', label: 'Reason (audit trail)', type: 'textarea', required: true },
          ]}
          confirmLabel="Save amendment"
          onSubmit={(v) =>
            act('amend', { ...v, netFee: Number(v.netFee), discountPct: Number(v.discountPct) })
          }
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === 'renew' && detail && (
        <FieldModal
          title={'Renew contract — ' + detail.legalEntity}
          fields={[
            { key: 'newEndDate', label: 'New end date', type: 'date', required: true },
            {
              key: 'netFee',
              label: 'Fee for the new term (optional — defaults to the renewal fee)',
              type: 'number',
              def: detail.renewalFee ?? detail.netFee,
            },
          ]}
          confirmLabel="Renew"
          onSubmit={(v) =>
            act('renew', {
              newEndDate: v.newEndDate,
              netFee: v.netFee ? Number(v.netFee) : undefined,
            })
          }
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === 'cancel' && detail && (
        <FieldModal
          title={'Cancel contract — ' + detail.legalEntity}
          fields={[
            {
              key: 'reason',
              label: 'Cancellation reason (required)',
              type: 'textarea',
              required: true,
            },
          ]}
          confirmLabel="Cancel contract"
          danger
          onSubmit={(v) => act('cancel', v)}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === 'approve-discount' && detail && (
        <FieldModal
          title={'Approve discount — ' + detail.legalEntity}
          fields={[{ key: 'approver', label: 'Approver name/email', type: 'text', required: true }]}
          confirmLabel="Approve"
          onSubmit={(v) => act('approve-discount', v)}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}

      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}

function CreateContractModal({ onClose, onDone, notify }) {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    tenantId: '',
    legalEntity: '',
    listFee: '',
    netFee: '',
    discountPct: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    renewalFee: '',
    autoRenew: false,
    dataUseConsent: true,
    renewalNoticeDays: 30,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .listTenants()
      .then((t) => setTenants(Array.isArray(t) ? t : t?.data || []))
      .catch(() => setTenants([]));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const computedDiscount =
    Number(form.listFee) > 0
      ? Math.round((1 - Number(form.netFee || 0) / Number(form.listFee)) * 10000) / 100
      : 0;

  const submit = async () => {
    if (!form.tenantId) return notify('Pick a tenant', true);
    if (!form.legalEntity.trim()) return notify('Legal entity is required', true);
    if (!Number(form.listFee) || !Number(form.netFee))
      return notify('Enter list and net fees', true);
    setBusy(true);
    try {
      await api.createContract({
        tenantId: form.tenantId,
        legalEntity: form.legalEntity.trim(),
        listFee: Number(form.listFee),
        netFee: Number(form.netFee),
        discountPct: computedDiscount,
        renewalFee: form.renewalFee ? Number(form.renewalFee) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        autoRenew: form.autoRenew,
        dataUseConsent: form.dataUseConsent,
        renewalNoticeDays: Number(form.renewalNoticeDays) || 30,
        modules: [],
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
        <div className="vb2-modal-title">New contract</div>
        <div className="vb2-field">
          <label>Tenant</label>
          <select
            className="vb2-select"
            value={form.tenantId}
            onChange={(e) => set('tenantId', e.target.value)}
          >
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="vb2-field">
          <label>Legal entity</label>
          <input
            className="vb2-input"
            value={form.legalEntity}
            onChange={(e) => set('legalEntity', e.target.value)}
            placeholder="Registered hotel company name"
          />
        </div>
        <div className="vb2-grid2">
          <div className="vb2-field">
            <label>List fee / month (ZAR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="vb2-input"
              value={form.listFee}
              onChange={(e) => set('listFee', e.target.value)}
            />
          </div>
          <div className="vb2-field">
            <label>Initial fee — first term (ZAR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="vb2-input"
              value={form.netFee}
              onChange={(e) => set('netFee', e.target.value)}
            />
          </div>
        </div>
        <div className="vb2-field">
          <label>Renewal fee — from term 2 (optional, defaults to list fee)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="vb2-input"
            value={form.renewalFee}
            onChange={(e) => set('renewalFee', e.target.value)}
            placeholder={form.listFee || 'same as list fee'}
          />
        </div>
        <div className="vb2-grid2">
          <div className="vb2-field">
            <label>Discount (auto — initial vs list)</label>
            <div style={{ height: 38, display: 'flex', alignItems: 'center', fontWeight: 650 }}>
              {computedDiscount}%
            </div>
          </div>
          <div className="vb2-field">
            <label>Renewal notice (days)</label>
            <input
              type="number"
              min="0"
              className="vb2-input"
              value={form.renewalNoticeDays}
              onChange={(e) => set('renewalNoticeDays', e.target.value)}
            />
          </div>
        </div>
        <div className="vb2-grid2">
          <div className="vb2-field">
            <label>Start date</label>
            <input
              type="date"
              className="vb2-input"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>
          <div className="vb2-field">
            <label>End date</label>
            <input
              type="date"
              className="vb2-input"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={form.autoRenew}
            onChange={(e) => set('autoRenew', e.target.checked)}
          />
          Auto-renew at end of term
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={form.dataUseConsent}
            onChange={(e) => set('dataUseConsent', e.target.checked)}
          />
          Tenant consents to de-identified aggregate benchmarks (data-use clause)
        </label>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldModal({ title, fields, confirmLabel, danger, onSubmit, onClose, notify }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.def ?? '']))
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !String(vals[f.key] ?? '').trim())
        return notify(f.label + ' is required', true);
    }
    setBusy(true);
    try {
      await onSubmit(vals);
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };

  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">{title}</div>
        {fields.map((f) => (
          <div className="vb2-field" key={f.key}>
            <label>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                className="vb2-textarea"
                value={vals[f.key]}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              />
            ) : (
              <input
                type={f.type || 'text'}
                className="vb2-input"
                value={vals[f.key]}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className={'vb2-btn' + (danger ? ' danger' : ' primary')}
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--muted-foreground, #6b7280)' }}>{body}</div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className="vb2-btn primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
