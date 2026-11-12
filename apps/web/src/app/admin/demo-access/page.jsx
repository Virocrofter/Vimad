import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  Sparkles,
  Ban,
  CalendarPlus,
  MailPlus,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getDemoStats,
  listDemoSessions,
  getDemoSession,
  approveDemo,
  rejectDemo,
  inviteDemo,
  extendDemo,
  convertDemo,
  revokeDemo,
  resetDemo,
} from '@/api/demo-access';
import {
  Kpi,
  TempBadge,
  StatusChip,
  Drawer,
  ApproveModal,
  InviteModal,
  ExtendModal,
  RevokeModal,
  ApproveResultModal,
  CopyButton,
} from './components';
import './demo-access.css';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'revoked', label: 'Revoked' },
  { key: 'converted', label: 'Converted' },
  { key: 'all', label: 'All' },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null);

export default function DemoAccessPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerId, setDrawerId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null); // approve | extend | revoke
  const [inviteResult, setInviteResult] = useState(null);
  const [approveResult, setApproveResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        getDemoStats(),
        listDemoSessions({ status: tab === 'all' ? '' : tab, search }),
      ]);
      setStats(s);
      setRows(l?.data ?? []);
    } catch (e) {
      toast({
        title: 'Failed to load demo access',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tab, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!drawerId) return;
    getDemoSession(drawerId)
      .then(setDetail)
      .catch((e) =>
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
      );
  }, [drawerId]);

  const act = async (fn, okMsg, refreshDetail) => {
    setBusy(true);
    try {
      const r = await fn();
      toast({ title: okMsg });
      if (refreshDetail && drawerId) getDemoSession(drawerId).then(setDetail);
      load();
      return r;
    } catch (e) {
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openModal = (kind, row) => {
    setTarget(row);
    setModal(kind);
  };
  const closeModal = () => {
    setModal(null);
    setTarget(null);
  };

  return (
    <div className="demo-wrap">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="#8b5cf6" /> Demo Access
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
            Requests from the marketing page, living-hotel sandboxes, magic-link invites, expiry and
            conversion — one pipeline from interest to contract.
          </p>
        </div>
        <button className="demo-btn" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="demo-kpis">
        <Kpi
          cls="k-pending"
          label="Pending requests"
          value={stats?.pending ?? '—'}
          sub="awaiting your approval"
        />
        <Kpi
          cls="k-active"
          label="Active demos"
          value={stats?.active ?? '—'}
          sub={`${stats?.expiring ?? 0} expiring in 7 days`}
        />
        <Kpi
          cls="k-expiring"
          label="Expiring ≤ 7d"
          value={stats?.expiring ?? '—'}
          sub="extend or convert"
        />
        <Kpi
          cls="k-never"
          label="Never activated"
          value={stats?.neverActivated ?? '—'}
          sub="invited but silent — follow up"
        />
      </div>

      <div className="search-row">
        <div className="demo-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`demo-tab ${tab === t.key ? 'on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Search size={14} style={{ color: 'var(--text-muted, #94a3b8)' }} />
        <input
          placeholder="Search email, company, hotel…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>
          No sessions in this view. New requests from the marketing demo form land in{' '}
          <strong>Pending</strong>.
        </p>
      ) : (
        <table className="demo-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Hotel</th>
              <th>Status</th>
              <th>Engagement</th>
              <th>Expires</th>
              <th>Activity</th>
              <th style={{ width: 260 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDrawerId(r.id)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.requesterEmail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
                    {r.company ?? '—'}
                    {r.roomCount ? ` · ${r.roomCount} rooms` : ''}
                  </div>
                </td>
                <td>{r.hotelName ?? r.tenant?.name ?? '—'}</td>
                <td>
                  <StatusChip status={r.computedStatus} />
                  {r.followUpDue ? <span className="followup">FOLLOW UP</span> : null}
                </td>
                <td>
                  <TempBadge temp={r.temp} />
                </td>
                <td>
                  {r.expiresAt ? (
                    <>
                      {fmtDate(r.expiresAt)}
                      {r.computedStatus === 'active' &&
                      daysLeft(r.expiresAt) !== null &&
                      daysLeft(r.expiresAt) <= 7 ? (
                        <span style={{ color: '#b45309', fontSize: 11, display: 'block' }}>
                          {daysLeft(r.expiresAt)}d left
                        </span>
                      ) : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{r.activityCount ?? 0}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="demo-actions">
                    {r.computedStatus === 'pending' && (
                      <>
                        <button
                          className="demo-btn primary"
                          disabled={busy}
                          onClick={() => openModal('approve', r)}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          className="demo-btn"
                          disabled={busy}
                          onClick={() => act(() => rejectDemo(r.id, {}), 'Rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.computedStatus === 'active' && (
                      <>
                        <button
                          className="demo-btn"
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              const res = await inviteDemo(r.id);
                              setInviteResult({ ...res, email: r.requesterEmail });
                            }, 'Invite created')
                          }
                        >
                          <MailPlus size={13} /> Invite
                        </button>
                        <button
                          className="demo-btn"
                          disabled={busy}
                          onClick={() => openModal('extend', r)}
                        >
                          <CalendarPlus size={13} /> Extend
                        </button>
                        <button
                          className="demo-btn"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => convertDemo(r.id),
                              'Converted to trial — open Contracts to draft'
                            )
                          }
                        >
                          <ArrowRightLeft size={13} /> Convert
                        </button>
                        <button
                          className="demo-btn"
                          disabled={busy}
                          onClick={() => act(() => resetDemo(r.id), 'Demo reset to pristine hotel')}
                        >
                          <RotateCcw size={13} /> Reset
                        </button>
                        <button
                          className="demo-btn danger"
                          disabled={busy}
                          onClick={() => openModal('revoke', r)}
                        >
                          <Ban size={13} /> Revoke
                        </button>
                      </>
                    )}
                    {['expired', 'revoked'].includes(r.computedStatus) && (
                      <button
                        className="demo-btn"
                        disabled={busy}
                        onClick={() => openModal('extend', r)}
                      >
                        <CalendarPlus size={13} /> Re-activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Drawer
        open={!!drawerId}
        onClose={() => {
          setDrawerId(null);
          setDetail(null);
        }}
        title={
          detail
            ? `${detail.requesterEmail} — ${detail.tenant?.name ?? detail.hotelName ?? 'not provisioned'}`
            : 'Session'
        }
      >
        {detail && (
          <div style={{ fontSize: 13 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px 16px',
                marginBottom: 12,
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Status</span>
                <br />
                <StatusChip status={detail.computedStatus} />
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Engagement</span>
                <br />
                <TempBadge temp={detail.temp} />
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Company</span>
                <br />
                {detail.company ?? '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Current PMS</span>
                <br />
                {detail.currentPms ?? '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Requested slot</span>
                <br />
                {detail.preferredSlot ?? '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Room count</span>
                <br />
                {detail.roomCount ?? '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Activated</span>
                <br />
                {detail.activatedAt ? new Date(detail.activatedAt).toLocaleString() : '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Expires</span>
                <br />
                {detail.expiresAt ? new Date(detail.expiresAt).toLocaleString() : '—'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Tenant</span>
                <br />
                {detail.tenant ? (
                  <>
                    {detail.tenant.name} <code>{detail.tenant.slug}</code>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)' }}>First login</span>
                <br />
                {detail.firstLoginAt ? new Date(detail.firstLoginAt).toLocaleString() : 'never'}
              </div>
            </div>
            {detail.notes && (
              <p
                style={{
                  background: 'var(--surface-elevated, #f8fafc)',
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {detail.notes}
              </p>
            )}

            <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Session timeline</h3>
            <div className="demo-timeline">
              {detail.events?.length ? (
                detail.events.map((e) => (
                  <div className="demo-tl-item" key={e.id}>
                    <strong>{e.action}</strong>
                    {e.detail ? ` — ${e.detail}` : ''}
                    <div className="t">
                      {new Date(e.createdAt).toLocaleString()} · {e.actor ?? 'system'}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 12 }}>No events yet.</p>
              )}
            </div>

            <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>What they touched (audit trail)</h3>
            <div className="demo-timeline">
              {detail.auditTrail?.length ? (
                detail.auditTrail.map((a, i) => (
                  <div className="demo-tl-item" key={i}>
                    <strong>{a.action}</strong>{' '}
                    <span style={{ color: 'var(--text-muted, #94a3b8)' }}>on {a.entity}</span>
                    <div className="t">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 12 }}>
                  No in-product activity recorded yet.
                </p>
              )}
            </div>

            {detail.invites?.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>Invites</h3>
                {detail.invites.map((inv, i) => (
                  <p key={i} style={{ fontSize: 12 }}>
                    <code>{inv.tokenPrefix}…</code> — {inv.usedAt ? 'used' : 'unused'} · expires{' '}
                    {fmtDate(inv.expiresAt)}
                  </p>
                ))}
              </>
            )}
          </div>
        )}
      </Drawer>

      {modal === 'approve' && (
        <ApproveModal
          busy={busy}
          session={target}
          onClose={closeModal}
          onSubmit={async (body) => {
            const r = await act(
              () => approveDemo(target.id, body),
              'Demo approved and provisioned'
            );
            if (r) {
              setApproveResult(r);
              closeModal();
            }
          }}
        />
      )}
      {modal === 'extend' && (
        <ExtendModal
          busy={busy}
          session={target}
          onClose={closeModal}
          onSubmit={async (body) => {
            await act(() => extendDemo(target.id, body), 'Extended');
            closeModal();
          }}
        />
      )}
      {modal === 'revoke' && (
        <RevokeModal
          busy={busy}
          session={target}
          onClose={closeModal}
          onSubmit={async (body) => {
            await act(() => revokeDemo(target.id, body), 'Revoked');
            closeModal();
          }}
        />
      )}
      {inviteResult && (
        <InviteModal
          result={inviteResult}
          email={inviteResult.email}
          onClose={() => setInviteResult(null)}
        />
      )}
      {approveResult && (
        <ApproveResultModal result={approveResult} onClose={() => setApproveResult(null)} />
      )}
    </div>
  );
}
