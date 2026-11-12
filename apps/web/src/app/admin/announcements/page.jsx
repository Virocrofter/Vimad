import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/api/announcements';
import { KpiStrip } from '../billing/kpi';
import '../billing/billing-pages.css';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const badge = (s) =>
  ({ published: 'ok', draft: 'muted', scheduled: 'info', archived: 'muted' })[s] || 'muted';

export default function AnnouncementsPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
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
      const data = await api.getAnnouncements();
      const list = Array.isArray(data)
        ? data
        : data?.announcements || data?.data || data?.items || [];
      setRows(list);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = rows || [];
    if (tab !== 'all') list = list.filter((r) => (r.status || 'draft') === tab);
    if (debouncedQ) {
      const s = debouncedQ.toLowerCase();
      list = list.filter(
        (r) => (r.title || '').toLowerCase().includes(s) || (r.body || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [rows, tab, debouncedQ]);

  const kpis = useMemo(() => {
    const list = rows || [];
    const cnt = (s) => list.filter((r) => (r.status || 'draft') === s).length;
    return [
      { l: 'Total', v: list.length },
      { l: 'Published', v: cnt('published') },
      { l: 'Drafts', v: cnt('draft') },
      { l: 'Scheduled', v: cnt('scheduled') },
    ];
  }, [rows]);

  const act = async (row, fn, msg) => {
    try {
      await fn(row.id ?? row);
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
          {['all', 'published', 'draft', 'scheduled'].map((t) => (
            <button
              key={t}
              className={'vb2-tab' + (tab === t ? ' active' : '')}
              onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="vb2-search"
          placeholder="Search title, body…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        <button type="button" className="vb2-btn primary" onClick={() => setModal('create')}>
          New announcement
        </button>
      </div>

      <div className="vb2-table-card">
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load announcements</div>
            <div>{error}</div>
          </div>
        )}
        {!error &&
          rows === null &&
          [1, 2, 3].map((n) => (
            <div className="vb2-skel" key={n}>
              <div className="vb2-skel-bar" style={{ width: 40 + n * 18 + '%' }} />
            </div>
          ))}
        {!error && rows !== null && filtered.length === 0 && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Nothing here</div>
            <div>
              {rows.length === 0
                ? 'Create your first platform announcement.'
                : 'No announcements match this filter.'}
            </div>
          </div>
        )}
        {!error && rows !== null && filtered.length > 0 && (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Publish</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ cursor: 'default' }}>
                    <td className="vb2-num">{r.title}</td>
                    <td className="vb2-muted">{r.audience || 'all'}</td>
                    <td>
                      <span className={'vb2-badge ' + badge(r.status)}>{r.status || 'draft'}</span>
                    </td>
                    <td className="vb2-muted">{fmtDate(r.publishAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {r.status !== 'published' && (
                          <button
                            className="vb2-btn small"
                            onClick={() => act(r, api.publishAnnouncement, 'Published')}
                          >
                            Publish
                          </button>
                        )}
                        {r.status !== 'archived' && (
                          <button
                            className="vb2-btn small"
                            onClick={() => act(r, api.archiveAnnouncement, 'Archived')}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          className="vb2-btn small danger"
                          onClick={() => {
                            if (window.confirm('Delete this announcement?'))
                              act(r, api.deleteAnnouncement, 'Deleted');
                          }}
                        >
                          Delete
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

      {modal === 'create' && (
        <CreateAnnouncementModal
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            notify('Announcement created');
          }}
          notify={notify}
        />
      )}
      {toast && <div className={'vb2-toast' + (toast.isErr ? ' err' : '')}>{toast.msg}</div>}
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onDone, notify }) {
  const [form, setForm] = useState({ title: '', body: '', audience: 'all_operators' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return notify('Title and body are required', true);
    setBusy(true);
    try {
      await api.createAnnouncement({ ...form, publishAt: new Date().toISOString() });
      onDone();
    } catch (e) {
      notify(e.message, true);
      setBusy(false);
    }
  };
  return (
    <div className="vb2-modal-backdrop" onClick={onClose}>
      <div className="vb2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vb2-modal-title">New announcement</div>
        <div className="vb2-field">
          <label>Title</label>
          <input
            className="vb2-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="vb2-field">
          <label>Body</label>
          <textarea
            className="vb2-textarea"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>
        <div className="vb2-field">
          <label>Audience</label>
          <select
            className="vb2-select"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
          >
            <option value="all_operators">All operators</option>
            <option value="all_tenants">All tenants</option>
            <option value="admins">Admins only</option>
          </select>
        </div>
        <div className="vb2-modal-foot">
          <button type="button" className="vb2-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="vb2-btn primary" disabled={busy} onClick={submit}>
            {busy ? 'Saving…' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
