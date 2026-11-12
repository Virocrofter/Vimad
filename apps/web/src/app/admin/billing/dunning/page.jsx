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

const dayDiff = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));

const TABS = [
  { key: 'all', label: 'All overdue' },
  { key: 'new', label: '1–30 days' },
  { key: 'aging', label: '31–60 days' },
  { key: 'late', label: '61–90 days' },
  { key: 'critical', label: '90+ days' },
];

const bucket = (days) =>
  days > 90 ? 'critical' : days > 60 ? 'late' : days > 30 ? 'aging' : 'new';

export default function DunningPage() {
  const [tab, setTab] = useState('all');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
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
      const data = await api.listDunning();
      setEntries(Array.isArray(data) ? data : data.entries || data.invoices || []);
    } catch (e) {
      setError(e.message);
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withDays = useMemo(
    () => (entries || []).map((e) => ({ ...e, __days: dayDiff(e.dueDate || e.invoice?.dueDate) })),
    [entries]
  );

  const visible = tab === 'all' ? withDays : withDays.filter((e) => bucket(e.__days) === tab);

  const kpis = useMemo(() => {
    const list = withDays;
    return [
      { l: 'Overdue invoices', v: list.length },
      {
        l: 'Overdue amount',
        v: fmt(list.reduce((a, e) => a + Number(e.balance ?? e.amount ?? e.totalAmount ?? 0), 0)),
      },
      {
        l: 'Avg days overdue',
        v: list.length ? Math.round(list.reduce((a, e) => a + e.__days, 0) / list.length) : '—',
      },
      { l: 'Escalated', v: list.filter((e) => Number(e.escalationLevel || 0) > 0).length },
    ];
  }, [withDays]);

  const suspend = async (e) => {
    if (!e.tenantId) return notify('No tenant on this entry', true);
    setBusyId(e.id);
    try {
      await api.pauseSubscription(e.tenantId, 'Access suspended from dunning console');
      notify('Tenant access suspended');
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const resume = async (e) => {
    if (!e.tenantId) return notify('No tenant on this entry', true);
    setBusyId(e.id);
    try {
      await api.resumeSubscription(e.tenantId);
      notify('Tenant access resumed');
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const act = async (entry, fn, msg) => {
    setBusyId(entry.id);
    try {
      await fn(entry.id);
      await load();
      notify(msg);
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const tenantOf = (e) => e.tenant?.name || e.tenantName || e.invoice?.tenant?.name || '—';
  const numberOf = (e) => e.number || e.invoice?.number || e.invoiceId?.slice(0, 8) || '—';
  const dueOf = (e) => e.dueDate || e.invoice?.dueDate;

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
        <div style={{ flex: 1 }} />
        <button type="button" className="vb2-btn" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="vb2-table-card">
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load dunning queue</div>
            <div>{error}</div>
            <div className="vb2-muted">Endpoints wire up in Bulk 3.</div>
          </div>
        )}
        {!error &&
          entries === null &&
          [1, 2, 3, 4, 5].map((n) => (
            <div className="vb2-skel" key={n}>
              <div className="vb2-skel-bar" style={{ width: 45 + (n % 3) * 20 + '%' }} />
            </div>
          ))}
        {!error && entries !== null && visible.length === 0 && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Nothing overdue in this bucket</div>
            <div>Overdue invoices enter dunning automatically once the Bulk 3 engine runs.</div>
          </div>
        )}
        {!error && entries !== null && visible.length > 0 && (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Invoice</th>
                  <th>Due date</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Days overdue</th>
                  <th>Reminders</th>
                  <th>Escalation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} style={{ cursor: 'default' }}>
                    <td className="vb2-num">{tenantOf(e)}</td>
                    <td>{numberOf(e)}</td>
                    <td className="vb2-muted">{fmtDate(dueOf(e))}</td>
                    <td className="vb2-right">{fmt(e.balance ?? e.amount ?? e.totalAmount)}</td>
                    <td>
                      <span
                        className={
                          'vb2-badge ' +
                          (e.__days > 60 ? 'danger' : e.__days > 30 ? 'warn' : 'info')
                        }
                      >
                        {e.__days} days
                      </span>
                    </td>
                    <td className="vb2-muted">{e.remindersSent ?? e.reminders ?? 0}</td>
                    <td>
                      {Number(e.escalationLevel || 0) > 0 ? (
                        <span className="vb2-badge danger">Level {e.escalationLevel}</span>
                      ) : (
                        <span className="vb2-badge muted">None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="vb2-btn small"
                          disabled={busyId === e.id}
                          onClick={() => act(e, api.sendReminder, 'Reminder sent')}
                        >
                          {busyId === e.id ? '…' : 'Remind'}
                        </button>
                        <button
                          type="button"
                          className="vb2-btn small"
                          disabled={busyId === e.id}
                          onClick={() =>
                            act(
                              e,
                              (id) => api.resolveDunning(id, 'Resolved from admin console'),
                              'Marked resolved'
                            )
                          }
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className="vb2-btn small"
                          disabled={busyId === e.id}
                          onClick={() => suspend(e)}
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          className="vb2-btn small"
                          disabled={busyId === e.id}
                          onClick={() => resume(e)}
                        >
                          Resume
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

      <div className="vb2-muted">
        Reminder cadence and auto-escalation are enforced server-side (Bulk 3) — buttons here
        trigger or override that flow, every action audited.
      </div>

      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}
