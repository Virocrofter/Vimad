/* apps/web/src/app/app/concierge/page.jsx — T3 Concierge board
 * Live board of today's concierge work. One tap posts any fulfilment
 * to the guest's folio — the department is a revenue surface.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car,
  Gift,
  AlarmClock,
  UtensilsCrossed,
  Sparkles,
  PartyPopper,
  Plus,
  CheckCircle2,
  Banknote,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { conciergeApi, CONCIERGE_TYPES, TRIP_FLOW, fmtRand } from '../../../api/concierge';

const TYPE_META = {
  transfers: { icon: Car, label: 'Transfers', hint: 'TR1 trip states' },
  specialRequests: { icon: Gift, label: 'Special requests', hint: 'Routed from bookings' },
  wakeUpCalls: { icon: AlarmClock, label: 'Wake-up calls', hint: '' },
  bookings: { icon: UtensilsCrossed, label: 'Restaurant & activities', hint: '' },
  upsells: { icon: Sparkles, label: 'Upsells', hint: 'Transport offers etc.' },
  gestures: { icon: PartyPopper, label: 'Gestures', hint: 'Birthdays / anniversaries' },
};

const STATUS_STYLE = {
  open: 'bg-surface-elevated text-text-secondary',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const TRIP_STYLE = {
  requested: 'bg-surface-elevated text-text-secondary',
  confirmed: 'bg-info/10 text-info',
  assigned: 'bg-primary/10 text-primary',
  en_route: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ConciergePage() {
  const [date, setDate] = useState(todayStr());
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBoard(await conciergeApi.board(date));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id, body) => {
    setBusyId(id);
    try {
      await conciergeApi.update(id, body);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const post = async (item) => {
    setBusyId(item.id);
    try {
      await conciergeApi.postToFolio(item.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const sections = useMemo(() => {
    if (!board) return [];
    return Object.entries(board.sections).map(([key, items]) => ({ key, items }));
  }, [board]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Concierge board</h1>
          <p className="text-sm text-text-muted">
            Transfers, requests, wake-up calls, bookings & upsells — every fulfilment posts to the
            folio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={14} /> New item
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Summary strip */}
      {board && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-text-secondary">
            <strong className="text-text-primary">{board.counts.total}</strong> due{' '}
            {board.date === todayStr() ? 'today' : `on ${board.date}`}
          </span>
          {board.counts.overdue > 0 && (
            <span className="rounded-md border border-danger/20 bg-danger/10 px-3 py-1.5 text-danger">
              <strong>{board.counts.overdue}</strong> overdue
            </span>
          )}
          <span className="rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-success">
            Unposted value <strong>{fmtRand(board.counts.postedValueMinor)}</strong>
          </span>
        </div>
      )}

      {showNew && (
        <NewItemForm
          onCreated={() => {
            setShowNew(false);
            load();
          }}
          onError={setError}
        />
      )}

      {loading && !board ? (
        <p className="text-sm text-text-muted">Loading board…</p>
      ) : (
        <>
          {/* Overdue */}
          {board.overdue.length > 0 && (
            <Section
              title="Overdue"
              items={board.overdue}
              danger
              onPatch={patch}
              onPost={post}
              busyId={busyId}
            />
          )}

          {/* Sections */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {sections.map(({ key, items }) => (
              <Section
                key={key}
                sectionKey={key}
                items={items}
                onPatch={patch}
                onPost={post}
                busyId={busyId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── One section (column) of the board ─── */
function Section({ sectionKey, title: titleProp, items, danger, onPatch, onPost, busyId }) {
  const meta = sectionKey ? TYPE_META[sectionKey] : null;
  const Icon = meta?.icon ?? Sparkles;
  const heading = titleProp ?? meta?.label ?? '';

  return (
    <div
      className={`rounded-xl border bg-surface p-4 ${danger ? 'border-danger/30' : 'border-border'}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className={danger ? 'text-danger' : 'text-primary'} />
        <h2 className="font-semibold text-text-primary">{heading}</h2>
        {meta?.hint && <span className="text-xs text-text-muted">· {meta.hint}</span>}
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs text-text-secondary">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">Nothing on the board.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPatch={onPatch}
              onPost={onPost}
              busy={busyId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── One concierge item ─── */
function ItemCard({ item, onPatch, onPost, busy }) {
  const guest = item.guest ? `${item.guest.firstName} ${item.guest.lastName}` : '—';
  const time = item.scheduledAt
    ? new Date(item.scheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    : null;

  const nextTrip =
    item.tripStatus && TRIP_STYLE[item.tripStatus]
      ? TRIP_FLOW[TRIP_FLOW.indexOf(item.tripStatus) + 1]
      : null;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{item.title}</p>
          <p className="text-xs text-text-muted">
            {guest}
            {item.room?.number ? ` · Room ${item.room.number}` : ''}
            {item.reservation?.confirmationNumber
              ? ` · ${item.reservation.confirmationNumber}`
              : ''}
            {item.flightNumber ? ` · ✈ ${item.flightNumber}` : ''}
            {time ? ` · ${time}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[item.status] ?? STATUS_STYLE.open}`}
        >
          {item.status.replace('_', ' ')}
        </span>
      </div>

      {item.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">{item.description}</p>
      )}

      {/* TR1 trip state chip + advance */}
      {item.type === 'transfer' && item.tripStatus && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${TRIP_STYLE[item.tripStatus] ?? ''}`}
          >
            {item.tripStatus.replace('_', ' ')}
          </span>
          {nextTrip && item.status !== 'done' && (
            <button
              disabled={busy}
              onClick={() => onPatch(item.id, { tripStatus: nextTrip })}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              {nextTrip.replace('_', ' ')} <ChevronRight size={10} />
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {item.postedToFolio ? (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 size={12} /> Posted {fmtRand(item.priceMinor)}
          </span>
        ) : (
          <button
            disabled={busy || item.priceMinor <= 0}
            onClick={() => onPost(item)}
            title={item.priceMinor <= 0 ? 'Set a price first (edit the item)' : 'Post to folio'}
            className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/20 disabled:opacity-40"
          >
            <Banknote size={12} /> Post to folio · {fmtRand(item.priceMinor)}
          </button>
        )}

        {item.status !== 'done' && item.status !== 'cancelled' && (
          <div className="flex gap-1.5">
            {item.status === 'open' && (
              <button
                disabled={busy}
                onClick={() => onPatch(item.id, { status: 'in_progress' })}
                className="rounded-md border border-border px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                Start
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => onPatch(item.id, { status: 'done' })}
              className="inline-flex items-center gap-1 rounded-md border border-success/30 px-2 py-1.5 text-xs text-success hover:opacity-80"
            >
              <CheckCircle2 size={12} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Inline new-item form ─── */
function NewItemForm({ onCreated, onError }) {
  const [form, setForm] = useState({
    propertyId: '',
    type: 'special_request',
    title: '',
    description: '',
    scheduledAt: '',
    price: '',
    flightNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await conciergeApi.create({
        propertyId: form.propertyId,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        flightNumber: form.flightNumber || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        priceMinor: form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        source: 'manual',
      });
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = 'rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary';

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="font-semibold text-text-primary">New concierge item</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select value={form.type} onChange={set('type')} className={inputCls}>
          {CONCIERGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={set('title')}
          className={inputCls}
        />
        <input
          required
          placeholder="Property ID"
          value={form.propertyId}
          onChange={set('propertyId')}
          className={inputCls}
        />
        <input
          placeholder="Scheduled time"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={set('scheduledAt')}
          className={inputCls}
        />
        <input
          placeholder="Price (ZAR)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={set('price')}
          className={inputCls}
        />
        {form.type === 'transfer' && (
          <input
            placeholder="Flight number"
            value={form.flightNumber}
            onChange={set('flightNumber')}
            className={inputCls}
          />
        )}
      </div>
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={set('description')}
        rows={2}
        className={`w-full ${inputCls}`}
      />
      <button
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Create item'}
      </button>
    </form>
  );
}
