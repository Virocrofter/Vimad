/* apps/web/src/app/app/central-reservations/page.jsx — C4 central reservations */
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  Search,
  X,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { apiGet } from '../../../api/client';
import {
  getAvailability,
  listCentralReservations,
  createCentralBooking,
  moveCentralReservation,
} from '../../../api/centralReservations';

const DAY = 86400000;
function todayStr(offset = 0) {
  const d = new Date(Date.now() + offset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-ZA') : '—');
const fmtMoney = (v, cur) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: cur || 'ZAR',
    maximumFractionDigits: 0,
  }).format(v || 0);
const STATUS_STYLE = {
  confirmed: 'bg-sky-500/10 text-sky-500',
  checked_in: 'bg-emerald-500/10 text-emerald-500',
  checked_out: 'bg-surface-elevated text-text-secondary',
  cancelled: 'bg-red-500/10 text-red-500',
  no_show: 'bg-amber-500/10 text-amber-500',
};

function BookingModal({ search, target, onClose }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('existing');
  const [guestSearch, setGuestSearch] = useState('');
  const [guestId, setGuestId] = useState('');
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const guestsQuery = useQuery({
    queryKey: ['central-guest-pool'],
    queryFn: async () => {
      const res = await apiGet('/v1/guests', { pageSize: 100 });
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: !!target,
  });
  const guests = guestsQuery.data ?? [];
  const filteredGuests = guests.filter(
    (g) =>
      !guestSearch ||
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestSearch.toLowerCase()) ||
      (g.email ?? '').toLowerCase().includes(guestSearch.toLowerCase())
  );

  const bookingMutation = useMutation({
    mutationFn: () =>
      createCentralBooking({
        propertyId: target.property.id,
        roomTypeId: target.roomType.id,
        arrivalDate: search.from,
        departureDate: search.to,
        adults: search.adults,
        children: search.children,
        notes: notes || undefined,
        ...(mode === 'existing'
          ? { guestId }
          : {
              guest: {
                firstName: newGuest.firstName || 'Guest',
                lastName: newGuest.lastName || '',
                email: newGuest.email || undefined,
                phone: newGuest.phone || undefined,
              },
            }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['central'] });
      setCreated(res);
    },
    onError: (e) => setError(e?.message ?? 'Booking failed'),
  });

  if (!target) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            New booking — {target.property.name} · {target.roomType.name}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        {created ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-text-secondary">
              Booking confirmed at{' '}
              <span className="font-medium text-text-primary">{created.property.name}</span>
            </p>
            <p className="text-lg font-bold tracking-wide text-text-primary">
              {created.confirmationNumber}
            </p>
            <p className="text-xs text-text-muted">
              {fmtDate(created.arrivalDate)} → {fmtDate(created.departureDate)} ·{' '}
              {fmtMoney(created.totalAmount, target.property.currency)}
            </p>
            <div className="flex gap-2">
              <Link
                to={`/app/reservations/${created.id}`}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Open reservation
              </Link>
              <button
                onClick={onClose}
                className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <div className="rounded-md bg-surface-elevated px-3 py-2">
                Check-in <span className="block font-medium text-text-primary">{search.from}</span>
              </div>
              <div className="rounded-md bg-surface-elevated px-3 py-2">
                Check-out <span className="block font-medium text-text-primary">{search.to}</span>
              </div>
              <div className="rounded-md bg-surface-elevated px-3 py-2">
                Guests{' '}
                <span className="block font-medium text-text-primary">
                  {search.adults} adult{search.adults > 1 ? 's' : ''}
                  {search.children ? `, ${search.children} child` : ''}
                </span>
              </div>
              <div className="rounded-md bg-surface-elevated px-3 py-2">
                Rate{' '}
                <span className="block font-medium text-text-primary">
                  {target.roomType.rate != null
                    ? fmtMoney(target.roomType.rate, target.roomType.currency) + ' / night'
                    : '—'}
                </span>
              </div>
            </div>

            <div className="flex rounded-md border border-border p-0.5">
              {[
                { key: 'existing', label: 'Existing guest' },
                { key: 'new', label: 'New guest' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMode(t.key)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${mode === t.key ? 'bg-primary/10 text-primary' : 'text-text-secondary'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {mode === 'existing' ? (
              <div>
                <div className="mb-1.5 flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                  <Search className="h-4 w-4 text-text-muted" />
                  <input
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    placeholder="Search guests…"
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredGuests.slice(0, 30).map((g) => (
                    <label
                      key={g.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-elevated ${guestId === g.id ? 'bg-primary/5' : ''}`}
                    >
                      <input
                        type="radio"
                        name="guest"
                        checked={guestId === g.id}
                        onChange={() => setGuestId(g.id)}
                        className="accent-indigo-500"
                      />
                      <span className="font-medium text-text-primary">
                        {g.firstName} {g.lastName}
                      </span>
                      <span className="truncate text-xs text-text-muted">
                        {g.email ?? g.phone ?? ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newGuest.firstName}
                  onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                  placeholder="First name"
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
                <input
                  value={newGuest.lastName}
                  onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                  placeholder="Last name"
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
                <input
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
                <input
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending || (mode === 'existing' && !guestId)}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {bookingMutation.isPending ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MoveModal({ reservation, onClose }) {
  const queryClient = useQueryClient();
  const from = fmtApiDate(reservation?.arrivalDate);
  const to = fmtApiDate(reservation?.departureDate);
  const [propertyId, setPropertyId] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [error, setError] = useState('');

  const availQuery = useQuery({
    queryKey: ['central', 'availability', from, to],
    queryFn: () => getAvailability(from, to),
    enabled: !!reservation,
  });
  const properties = availQuery.data?.properties ?? [];
  const effectivePropertyId = propertyId || reservation?.property.id || '';
  const selectedProperty = properties.find((p) => p.id === effectivePropertyId);
  const roomTypes = selectedProperty?.roomTypes ?? [];
  const effectiveRoomTypeId = roomTypeId || reservation?.roomType?.id || '';

  const moveMutation = useMutation({
    mutationFn: () =>
      moveCentralReservation(reservation.id, {
        propertyId: effectivePropertyId,
        roomTypeId: effectiveRoomTypeId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['central'] });
      onClose();
    },
    onError: (e) => setError(e?.message ?? 'Move failed'),
  });

  if (!reservation) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Move {reservation.confirmationNumber}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-xs text-text-muted">
            Currently at{' '}
            <span className="font-medium text-text-primary">{reservation.property.name}</span> ·{' '}
            {fmtDate(reservation.arrivalDate)} → {fmtDate(reservation.departureDate)}. Folio,
            payments and history follow automatically.
          </p>
          <select
            value={effectivePropertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setRoomTypeId('');
            }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={effectiveRoomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Any room type</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} — {rt.available ? `${rt.minRemaining} left` : 'full'}{' '}
                {rt.rate != null ? `· ${fmtMoney(rt.rate, rt.currency)}` : ''}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={() => moveMutation.mutate()}
            disabled={moveMutation.isPending || availQuery.isLoading}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {moveMutation.isPending ? 'Moving…' : 'Move reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtApiDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function CentralReservationsPage() {
  const [from, setFrom] = useState(todayStr(1));
  const [to, setTo] = useState(todayStr(3));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searched, setSearched] = useState({
    from: todayStr(1),
    to: todayStr(3),
    adults: 2,
    children: 0,
  });
  const [bookingTarget, setBookingTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);

  const availQuery = useQuery({
    queryKey: ['central', 'availability', searched.from, searched.to],
    queryFn: () => getAvailability(searched.from, searched.to),
  });
  const listQuery = useQuery({
    queryKey: ['central', 'list'],
    queryFn: listCentralReservations,
    refetchInterval: 30_000,
  });
  const availability = availQuery.data;
  const reservations = listQuery.data ?? [];
  const searchable = useMemo(() => new Date(to) > new Date(from), [from, to]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Central Reservations</h1>
        <p className="text-sm text-text-muted">
          Book any property from any desk — availability, rates and moves across the whole group.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <CalendarRange className="h-4 w-4" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
          />
          <span>→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
          />
        </div>
        <label className="text-xs text-text-muted">
          Adults
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="ml-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-text-muted">
          Children
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="ml-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setSearched({ from, to, adults, children })}
          disabled={!searchable}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          <Search className="h-4 w-4" /> Check availability
        </button>
      </div>

      {availQuery.isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-surface-elevated" />
      ) : availQuery.isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
          Availability search failed: {availQuery.error?.message}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {availability.properties.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-semibold text-text-primary">{p.name}</span>
                  <span className="text-xs text-text-muted">
                    {p.code}
                    {p.city ? ` · ${p.city}` : ''}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted">
                  {p.roomTypes.filter((rt) => rt.available).length}/{p.roomTypes.length} types open
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {p.roomTypes.map((rt) => (
                  <div key={rt.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{rt.name}</div>
                      <div className="text-[11px] text-text-muted">
                        {rt.available
                          ? `${rt.minRemaining} of ${rt.sellable} available`
                          : 'Sold out'}
                        {rt.rate != null && ` · ${fmtMoney(rt.rate, rt.currency)} / night`}
                      </div>
                    </div>
                    <button
                      onClick={() => setBookingTarget({ property: p, roomType: rt })}
                      disabled={!rt.available}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" /> Book
                    </button>
                  </div>
                ))}
                {p.roomTypes.length === 0 && (
                  <div className="px-4 py-3 text-xs text-text-muted">No room types configured.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent reservations — all properties
          </h3>
        </div>
        {listQuery.isLoading ? (
          <div className="h-32 animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-2">Confirmation</th>
                  <th className="pr-3">Property</th>
                  <th className="pr-3">Guest</th>
                  <th className="pr-3">Room type</th>
                  <th className="pr-3">Arrival</th>
                  <th className="pr-3">Departure</th>
                  <th className="pr-3">Status</th>
                  <th className="pr-3 text-right">Total</th>
                  <th className="px-4" />
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="px-4 py-2">
                      <Link
                        to={`/app/reservations/${r.id}`}
                        className="text-primary hover:underline"
                      >
                        {r.confirmationNumber}
                      </Link>
                    </td>
                    <td className="pr-3 text-text-secondary">{r.property.name}</td>
                    <td className="pr-3 text-text-secondary">
                      {r.guest.firstName} {r.guest.lastName}
                    </td>
                    <td className="pr-3 text-text-secondary">{r.roomType?.name ?? '—'}</td>
                    <td className="pr-3 text-text-secondary">{fmtDate(r.arrivalDate)}</td>
                    <td className="pr-3 text-text-secondary">{fmtDate(r.departureDate)}</td>
                    <td className="pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[r.status] ?? 'bg-surface-elevated text-text-secondary'}`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="pr-3 text-right text-text-primary">{fmtMoney(r.totalAmount)}</td>
                    <td className="px-4 text-right">
                      {['confirmed', 'checked_in'].includes(r.status) && (
                        <button
                          onClick={() => setMoveTarget(r)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:bg-surface-elevated"
                        >
                          <ArrowLeftRight className="h-3 w-3" /> Move
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-xs text-text-muted">
                      No reservations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookingModal
        search={searched}
        target={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />
      <MoveModal reservation={moveTarget} onClose={() => setMoveTarget(null)} />
    </div>
  );
}
