import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/api/shadow';
import { KpiStrip } from '../billing/kpi';
import '../billing/billing-pages.css';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-ZA', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const unwrap = (d, keys) => {
  if (Array.isArray(d)) return d;
  for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
  return d?.data ? unwrap(d.data, keys) : [];
};
const badge = (s) =>
  ({
    active: 'ok',
    pending: 'warn',
    approved: 'ok',
    rejected: 'danger',
    ended: 'muted',
    terminated: 'danger',
  })[s] || 'muted';

const TABS = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'config', label: 'Config' },
  { key: 'audit', label: 'Audit' },
];

export default function ShadowPage() {
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [config, setConfig] = useState(null);
  const [audit, setAudit] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((msg, isErr) => {
    clearTimeout(timer.current);
    setToast({ msg, isErr });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dash, sess, appr, cfg, aud, ten] = await Promise.all([
        api.getShadowDashboard().catch(() => null),
        api.getActiveSessions().catch(() => null),
        api.getPendingApprovals().catch(() => []),
        api.getShadowConfig().catch(() => null),
        api.getAuditLogs({ limit: 100 }).catch(() => []),
        api.getShadowTenants().catch(() => []),
      ]);
      setSessions(unwrap(sess, ['sessions', 'activeSessions']));
      setApprovals(unwrap(appr, ['approvals', 'pending']));
      setConfig(cfg && cfg.data ? cfg.data : cfg);
      setAudit(unwrap(aud, ['logs', 'audit', 'entries']));
      setTenants(unwrap(ten, ['tenants']));
    } catch (e) {
      setError(e.message);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(
    () => [
      { l: 'Active sessions', v: sessions ? sessions.length : '—' },
      { l: 'Pending approvals', v: approvals.length },
      { l: 'Shadow tenants', v: tenants.length },
      { l: 'Audit entries', v: audit.length },
    ],
    [sessions, approvals, tenants, audit]
  );

  const act = async (fn, msg) => {
    try {
      await fn();
      await load();
      notify(msg);
    } catch (e) {
      notify(e.message, true);
    }
  };

  return (
    <div className="vb2-wrap">
      <KpiStrip items={kpis} />
      <div className="vb2-toolbar">
        <div className="vb2-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={'vb2-tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {tab === 'sessions' && (
          <button type="button" className="vb2-btn primary" onClick={() => setModal('start')}>
            Start shadow session
          </button>
        )}
      </div>

      {error && (
        <div className="vb2-table-card">
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load shadow data</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {!error && tab === 'sessions' && (
        <div className="vb2-table-card">
          {sessions === null ? (
            [1, 2, 3].map((n) => (
              <div className="vb2-skel" key={n}>
                <div className="vb2-skel-bar" style={{ width: 40 + n * 18 + '%' }} />
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="vb2-empty">
              <div className="vb2-empty-title">No active shadow sessions</div>
              <div>Start one to mirror a tenant's traffic safely.</div>
            </div>
          ) : (
            <div className="vb2-table-scroll">
              <table className="vb2-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Started by</th>
                    <th>Started</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} style={{ cursor: 'default' }}>
                      <td className="vb2-num">
                        {s.tenantName || s.tenant?.name || s.tenantId?.slice(0, 8)}
                      </td>
                      <td className="vb2-muted">{s.startedBy || s.operator || '—'}</td>
                      <td className="vb2-muted">{fmtDate(s.startedAt)}</td>
                      <td>
                        <span className={'vb2-badge ' + badge(s.status)}>
                          {s.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="vb2-btn small"
                            onClick={() => act(() => api.endShadowSession(s.id), 'Session ended')}
                          >
                            End
                          </button>
                          <button
                            className="vb2-btn small danger"
                            onClick={() =>
                              act(() => api.terminateShadowSession(s.id), 'Session terminated')
                            }
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!error && tab === 'approvals' && (
        <div className="vb2-table-card">
          {approvals.length === 0 ? (
            <div className="vb2-empty">
              <div className="vb2-empty-title">No pending approvals</div>
              <div>Shadow access requests awaiting your decision appear here.</div>
            </div>
          ) : (
            <div className="vb2-table-scroll">
              <table className="vb2-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Tenant</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a.id} style={{ cursor: 'default' }}>
                      <td className="vb2-num">{a.requester || a.requestedBy || '—'}</td>
                      <td className="vb2-muted">
                        {a.tenantName || a.tenant?.name || a.tenantId?.slice(0, 8)}
                      </td>
                      <td
                        className="vb2-muted"
                        style={{
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.reason || '—'}
                      </td>
                      <td className="vb2-muted">{fmtDate(a.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="vb2-btn small primary"
                            onClick={() => act(() => api.approveRequest(a.id), 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="vb2-btn small danger"
                            onClick={() => act(() => api.rejectRequest(a.id), 'Rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!error && tab === 'config' && (
        <div className="vb2-table-card" style={{ padding: '18px 20px' }}>
          {!config ? (
            <div className="vb2-skel">
              <div className="vb2-skel-bar" style={{ width: '60%' }} />
            </div>
          ) : (
            <>
              <dl className="vb2-kv">
                {Object.entries(config)
                  .filter(
                    ([, v]) => ['string', 'number', 'boolean'].includes(typeof v) || v == null
                  )
                  .map(([k, v]) => (
                    <FragmentRow key={k} k={k} v={String(v)} />
                  ))}
              </dl>
              <div style={{ marginTop: 12 }}>
                <button className="vb2-btn" onClick={() => setModal('config')}>
                  Edit config
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!error && tab === 'audit' && (
        <div className="vb2-table-card">
          {audit.length === 0 ? (
            <div className="vb2-empty">
              <div className="vb2-empty-title">No shadow audit entries</div>
            </div>
          ) : (
            <div className="vb2-table-scroll">
              <table className="vb2-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.slice(0, 200).map((a, i) => (
                    <tr key={a.id || i} style={{ cursor: 'default' }}>
                      <td className="vb2-muted" style={{ whiteSpace: 'nowrap' }}>
                        {fmtDate(a.createdAt || a.timestamp)}
                      </td>
                      <td className="vb2-num">{a.actor || a.operator || '—'}</td>
                      <td>{a.action}</td>
                      <td
                        className="vb2-muted"
                        style={{
                          maxWidth: 420,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.detail || JSON.stringify(a.metadata || '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal === 'start' && (
        <StartSessionModal
          tenants={tenants}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            notify('Shadow session started');
          }}
          notify={notify}
        />
      )}
      {modal === 'config' && config && (
        <ConfigModal
          config={config}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            notify('Config updated');
          }}
          notify={notify}
        />
      )}
      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}

function FragmentRow({ k, v }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v ?? '—'}</dd>
    </>
  );
}

function StartSessionModal({ tenants, onClose, onDone, notify }) {
  const [tenantId, setTenantId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!tenantId) return notify('Pick a tenant', true);
    setBusy(true);
    try {
      await api.startShadowSession({ tenantId, reason: reason.trim() || undefined });
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };
  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Start shadow session</div>
        <div className="vb2-field">
          <label>Tenant</label>
          <select
            className="vb2-select"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.slug}
              </option>
            ))}
          </select>
        </div>
        <div className="vb2-field">
          <label>Reason (audit trail)</label>
          <textarea
            className="vb2-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verifying chain-loyalty rollout on production traffic"
          />
        </div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Starting…' : 'Start session'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigModal({ config, onClose, onDone, notify }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(
      Object.entries(config).filter(
        ([, v]) => ['string', 'number', 'boolean'].includes(typeof v) || v == null
      )
    )
  );
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.updateShadowConfig(vals);
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };
  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">Shadow config</div>
        {Object.entries(vals).map(([k, v]) => (
          <div className="vb2-field" key={k}>
            <label>{k}</label>
            {typeof v === 'boolean' ? (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  height: 38,
                }}
              >
                <input
                  type="checkbox"
                  checked={v}
                  onChange={(e) => setVals({ ...vals, [k]: e.target.checked })}
                />{' '}
                enabled
              </label>
            ) : (
              <input
                className="vb2-input"
                value={v ?? ''}
                onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
              />
            )}
          </div>
        ))}
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Saving…' : 'Save config'}
          </button>
        </div>
      </div>
    </div>
  );
}
