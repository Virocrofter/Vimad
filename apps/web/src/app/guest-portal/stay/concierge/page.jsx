/* apps/web/src/app/guest-portal/stay/concierge/page.jsx
 * Guest concierge — requests land directly on the staff concierge board
 * (source: "guest"), so the front desk sees them without any relay.
 * Auth: scoped guest-portal token, read via the portal's own helper.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlarmClock, UtensilsCrossed, Ticket, Gift, CheckCircle2, Clock } from 'lucide-react';
import { getGuestToken } from '../../../../hooks/guestPortalApi';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');

function getPortalToken() {
  // Primary: the portal's canonical key ('gp_token'). Fallback: the legacy
  // 'guest_portal_token' key for tokens written before the keys were aligned.
  return getGuestToken() ?? sessionStorage.getItem('guest_portal_token') ?? '';
}

async function conciergeReq(path, init = {}) {
  const res = await fetch(`${API_BASE}/v1/concierge/guest${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getPortalToken() ? { Authorization: `Bearer ${getPortalToken()}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  return body.data;
}

const REQUEST_TYPES = [
  { value: 'wake_up_call', label: 'Wake-up call', icon: AlarmClock },
  { value: 'restaurant_booking', label: 'Restaurant booking', icon: UtensilsCrossed },
  { value: 'activity_booking', label: 'Activity booking', icon: Ticket },
  { value: 'special_request', label: 'Special request', icon: Gift },
];

const STATUS_LABEL = {
  open: { text: 'Received', cls: 'bg-info/10 text-info' },
  in_progress: { text: 'In progress', cls: 'bg-primary/10 text-primary' },
  done: { text: 'Done', cls: 'bg-success/10 text-success' },
  cancelled: { text: 'Cancelled', cls: 'bg-danger/10 text-danger' },
};

export default function GuestConciergePage() {
  const [form, setForm] = useState({ type: 'wake_up_call', title: '', description: '', when: '' });
  const [mine, setMine] = useState([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!getPortalToken()) return;
    try {
      setMine(await conciergeReq('/mine'));
    } catch {
      /* list failing shouldn't block the form */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setNotice('');
    try {
      await conciergeReq('/request', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          scheduledAt: form.when ? new Date(form.when).toISOString() : undefined,
        }),
      });
      setNotice('Request sent — the front desk has it on their concierge board.');
      setForm({ type: 'wake_up_call', title: '', description: '', when: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSending(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary';

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Concierge</h1>
        <p className="text-sm text-text-muted">
          Wake-up calls, bookings and requests go straight to the front desk board.
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/10 px-4 py-2 text-sm text-success">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-2 gap-2">
          {REQUEST_TYPES.map((t) => {
            const Icon = t.icon;
            const active = form.type === t.value;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <input
          required
          placeholder={
            form.type === 'wake_up_call' ? 'e.g. Wake me at 6:30' : 'What would you like?'
          }
          value={form.title}
          onChange={set('title')}
          className={inputCls}
        />

        {form.type === 'wake_up_call' && (
          <input
            type="datetime-local"
            value={form.when}
            onChange={set('when')}
            className={inputCls}
          />
        )}

        <textarea
          placeholder="Details (optional)"
          value={form.description}
          onChange={set('description')}
          rows={2}
          className={inputCls}
        />

        <button
          disabled={sending}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
        >
          {sending ? 'Sending…' : 'Send request'}
        </button>
      </form>

      {mine.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">My requests</h2>
          {mine.map((r) => {
            const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.open;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{r.title}</p>
                  {r.scheduledAt && (
                    <p className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock size={10} /> {new Date(r.scheduledAt).toLocaleString('en-ZA')}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>
                  {st.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
