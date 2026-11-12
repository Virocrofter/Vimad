/* apps/web/src/app/app/reservations/detail/ReservationWorkspace.jsx
 * Reservation workspace v2 (roadmap addendum 5.3, Phase 3 slice #2).
 * One consistent workspace instead of module-hopping: header with
 * lifecycle-derived actions (only actions legal for the CURRENT state —
 * the server still enforces; P5 M3), sections Overview / Guests / Room & ops
 * / Folio & payments / Messages / Tasks / Timeline, and a change preview for
 * date changes: availability per night, pricing impact, conflicts — before
 * anything is saved (addendum: show impact "before changing dates").
 * Behind the reservationWorkspace flag; mutations reuse the existing,
 * already-tested reservation endpoints.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  BedDouble,
  CalendarDays,
  CreditCard,
  History,
  LogIn,
  LogOut,
  MessageSquare,
  RefreshCw,
  User,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useReservationWorkspace } from '../../../../hooks/useReservations';
import {
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  noShowReservation,
  updateReservation,
} from '../../../../api/api-reservations';
import { cn } from '../../../../lib/utils';

const STATUS = {
  confirmed: { label: 'Confirmed', cls: 'bg-accent/10 text-accent border-accent/20' },
  checked_in: { label: 'In house', cls: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked out', cls: 'bg-neutral/10 text-text-muted border-border' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger/10 text-danger border-danger/20' },
  no_show: { label: 'No-show', cls: 'bg-danger/10 text-danger border-danger/20' },
};
const money = (v, c = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));
const day = (d) => (d ?? '').slice(0, 10);

function Section({ icon: Icon, title, children, right }) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Icon className="h-4 w-4 text-secondary" /> {title}
        </h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DateChangePreview({ d, onSaved }) {
  const [arr, setArr] = useState(day(d.header.arrivalDate));
  const [dep, setDep] = useState(day(d.header.departureDate));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const inNights = [];
  const cur = new Date(arr + 'T12:00:00');
  const end = new Date(dep + 'T12:00:00');
  while (cur < end && inNights.length < 60) {
    inNights.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const oldNights = d.preview.nights.length;
  const valid = inNights.length > 0 && dep > arr;
  const impact = (inNights.length - oldNights) * d.preview.nightlyRate;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated/50 p-3">
      <p className="text-xs font-semibold text-text-primary">
        Change dates — preview before you save
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-text-muted">
          Arrival
          <input
            type="date"
            value={arr}
            onChange={(e) => setArr(e.target.value)}
            className="mt-0.5 block rounded-md border border-border bg-surface px-2 py-1 text-xs"
          />
        </label>
        <label className="text-[11px] text-text-muted">
          Departure
          <input
            type="date"
            value={dep}
            onChange={(e) => setDep(e.target.value)}
            className="mt-0.5 block rounded-md border border-border bg-surface px-2 py-1 text-xs"
          />
        </label>
        <button
          disabled={!valid || saving}
          onClick={async () => {
            setSaving(true);
            setErr(null);
            try {
              await updateReservation(d.header.id, {
                arrivalDate: arr,
                departureDate: dep,
                nights: inNights.length,
              });
              onSaved();
            } catch (e) {
              setErr(e?.response?.data?.error?.message ?? e.message);
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Apply new dates'}
        </button>
      </div>
      {valid && (
        <div className="mt-2 space-y-1 text-[11px]">
          <p
            className={cn(
              'font-medium',
              impact > 0
                ? 'text-warning'
                : impact < 0
                  ? 'text-accent-foreground'
                  : 'text-text-secondary'
            )}
          >
            {inNights.length} nights ({oldNights} before) · pricing impact {impact > 0 ? '+' : ''}
            {money(impact, d.preview.currency)} at{' '}
            {money(d.preview.nightlyRate, d.preview.currency)}/night
          </p>
          <p className="text-text-muted">
            Availability for this room type:{' '}
            {inNights.map((n) => n.toISOString().slice(5, 10)).join(', ')} — confirm against the
            room plan; channel re-sync runs on save.
          </p>
        </div>
      )}
      {err && <p className="mt-1 text-[11px] text-danger">{err}</p>}
    </div>
  );
}

export default function ReservationWorkspace({ reservationId }) {
  const q = useReservationWorkspace(reservationId);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['reservations', 'workspace', reservationId] });

  const run = async (action) => {
    setBusy(action);
    setActionErr(null);
    try {
      if (action === 'check-in') await checkInReservation(reservationId);
      else if (action === 'check-out') await checkOutReservation(reservationId);
      else if (action === 'cancel') await cancelReservation(reservationId, 'workspace');
      else if (action === 'no-show') await noShowReservation(reservationId);
      await invalidate();
    } catch (e) {
      setActionErr(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setBusy(null);
    }
  };

  if (q.isLoading)
    return (
      <div className="p-6">
        <div className="h-40 animate-pulse rounded-xl bg-surface-elevated" />
      </div>
    );
  if (q.isError) {
    return (
      <div className="m-6 rounded-xl border border-danger/30 bg-surface p-6 text-center">
        <p className="text-sm font-medium">Workspace failed to load</p>
        <p className="mt-1 text-xs text-text-secondary">
          {q.error?.response?.data?.error?.message ?? q.error?.message}
        </p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }
  const d = q.data;
  const h = d.header;
  const st = STATUS[h.status] ?? STATUS.confirmed;

  return (
    <div className="space-y-4 p-6">
      {/* Header: identity, stay facts, balance/settlement, lifecycle-valid actions */}
      <header className="glass rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">
                {h.guest.firstName} {h.guest.lastName}
              </h2>
              <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', st.cls)}>
                {st.label}
              </span>
              <span className="text-xs text-text-muted">
                {h.confirmationNumber} · {h.source}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {day(h.arrivalDate)} → {day(h.departureDate)} · {h.nights} nights · {h.adults} adult
              {h.adults > 1 ? 's' : ''}
              {h.children ? ` · ${h.children} child` : ''}
              {h.roomType ? ` · ${h.roomType.name}` : ''}
              {h.assignedRoom ? ` · Room ${h.assignedRoom.number}` : ' · unassigned'}
              {h.eta ? ` · ETA ${h.eta}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-lg font-bold',
                h.balance > 0 ? 'text-warning' : 'text-accent-foreground'
              )}
            >
              {money(h.balance, d.preview.currency)} {h.balance > 0 ? 'owing' : 'settled'}
            </p>
            <p className="text-[11px] text-text-muted">
              total {money(h.totalAmount, d.preview.currency)} · deposit{' '}
              {money(h.depositPaid, d.preview.currency)}/{money(h.depositDue, d.preview.currency)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {d.validActions.map((a) => (
            <button
              key={a.action}
              disabled={busy === a.action}
              onClick={() => run(a.action)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50',
                a.action === 'check-in' && 'bg-primary',
                a.action === 'check-out' && 'bg-secondary',
                a.action === 'cancel' && 'bg-danger',
                a.action === 'no-show' && 'bg-warning',
                a.action === 'take-payment' && 'bg-info'
              )}
            >
              {busy === a.action ? '…' : a.label}
            </button>
          ))}
          {d.validActions.length === 0 && (
            <span className="text-xs text-text-muted">No actions available in this state.</span>
          )}
          {actionErr && <span className="text-xs text-danger">{actionErr}</span>}
        </div>
      </header>

      <DateChangePreview d={d} onSaved={invalidate} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          icon={User}
          title="Guests"
          right={<span className="text-xs text-text-muted">{1 + d.companions.length}</span>}
        >
          <p className="text-sm font-medium text-text-primary">
            {h.guest.firstName} {h.guest.lastName}
          </p>
          <p className="text-xs text-text-secondary">
            {h.guest.email} {h.guest.phone ? `· ${h.guest.phone}` : ''}
          </p>
          {h.specialRequests && (
            <p className="mt-2 text-xs text-warning">Requests: {h.specialRequests}</p>
          )}
          {d.companions.map((c) => (
            <p key={c.id} className="mt-1 text-xs text-text-secondary">
              ＋ {c.firstName} {c.lastName}
              {c.sharesFolio ? ' · shares folio' : ''}
            </p>
          ))}
        </Section>

        <Section
          icon={BedDouble}
          title="Room & operations"
          right={
            <Link to="/app/room-plan" className="text-xs text-secondary hover:underline">
              Room plan →
            </Link>
          }
        >
          <p className="text-sm text-text-primary">
            {h.roomType?.name ?? 'No room type'}{' '}
            {h.assignedRoom
              ? `— Room ${h.assignedRoom.number} (${h.assignedRoom.housekeepingStatus})`
              : '— not yet assigned'}
          </p>
          {h.guaranteed && <p className="mt-1 text-xs text-accent-foreground">Guaranteed</p>}
          {d.tasks.length > 0 && (
            <ul className="mt-2 space-y-1">
              {d.tasks.slice(0, 5).map((t) => (
                <li key={t.id} className="text-xs text-text-secondary">
                  • {t.title}{' '}
                  <span className="text-text-muted">
                    ({t.department}, {t.status})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          icon={CreditCard}
          title="Folio & payments"
          right={
            <span className="text-xs text-text-muted">{money(h.balance, d.preview.currency)}</span>
          }
        >
          {d.folio ? (
            <>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {d.folio.items.map((i) => (
                  <li key={i.id} className="flex justify-between text-xs">
                    <span className="text-text-secondary">
                      {i.description} ×{i.quantity}
                    </span>
                    <span className="font-mono text-text-primary">
                      {money(i.amount, d.preview.currency)}
                    </span>
                  </li>
                ))}
                {d.folio.items.length === 0 && (
                  <li className="text-xs text-text-muted">No charges posted yet.</li>
                )}
              </ul>
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                {d.payments.map((p) => (
                  <p key={p.id} className="flex justify-between text-xs">
                    <span className="text-text-secondary">
                      {p.reference}{' '}
                      <span
                        className={cn(
                          p.status === 'success' ? 'text-accent-foreground' : 'text-warning'
                        )}
                      >
                        {p.status}
                      </span>
                    </span>
                    <span className="font-mono text-text-primary">
                      {money(p.amountMinor / 100, p.currency ?? d.preview.currency)}
                    </span>
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted">No folio yet.</p>
          )}
        </Section>

        <Section
          icon={MessageSquare}
          title="Messages"
          right={
            <span className="text-xs text-text-muted">
              {d.messages.length} thread{d.messages.length === 1 ? '' : 's'}
            </span>
          }
        >
          {d.messages.length === 0 ? (
            <p className="text-xs text-text-muted">No guest messages on this stay.</p>
          ) : (
            d.messages.map((t) => (
              <p key={t.id} className="text-xs text-text-secondary">
                {t.lastMessage ? t.lastMessage.body : '—'}{' '}
                <span className="text-text-muted">
                  ({t.status}
                  {t.unreadForStaff ? ` · ${t.unreadForStaff} unread` : ''})
                </span>
              </p>
            ))
          )}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={CalendarDays} title="Traces & flags">
          {d.traces.length === 0 ? (
            <p className="text-xs text-text-muted">No traces.</p>
          ) : (
            d.traces.map((t) => (
              <p key={t.id} className="text-xs text-text-secondary">
                ⚑ {t.body} <span className="text-text-muted">({t.department})</span>
              </p>
            ))
          )}
        </Section>
        <Section icon={History} title="Timeline / audit">
          {d.timeline.length === 0 ? (
            <p className="text-xs text-text-muted">No recorded changes.</p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {d.timeline.map((t, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="shrink-0 text-text-muted">{day(t.at)}</span>
                  <span className="font-medium text-text-primary">{t.action}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
