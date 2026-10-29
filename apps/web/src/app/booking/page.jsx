/* apps/web/src/app/booking/page.jsx
 * A4 — public booking engine. /book/:code
 * Steps: dates → rooms → guest details → success (+ Paystack deposit link).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Moon,
  Users,
} from 'lucide-react';
import { publicBookingApi } from '../../api/public';

const fmtDay = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const fmtMoney = (n) =>
  `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toISO = (d) => d.toISOString().slice(0, 10);

export default function BookingPage() {
  const { code } = useParams();

  const today = useMemo(() => toISO(new Date()), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISO(d);
  }, []);

  const [property, setProperty] = useState(null);
  const [step, setStep] = useState('dates'); // dates | rooms | details | success
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    publicBookingApi
      .property(code)
      .then(setProperty)
      .catch((e) => setError(e.message));
  }, [code]);

  const search = async () => {
    setError(null);
    setLoading(true);
    setResults(null);
    setSelected(null);
    try {
      const data = await publicBookingApi.availability(code, {
        checkIn,
        checkOut,
        adults,
        children,
      });
      setResults(data);
      setStep('rooms');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [idemKey] = useState(() =>
    crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()
  );

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await publicBookingApi.book(
        code,
        {
          checkIn,
          checkOut,
          adults,
          children,
          roomTypeId: selected.roomTypeId,
          guest: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
          notes: form.notes || undefined,
          website: honeypot || undefined,
        },
        idemKey
      );
      setBooking(data);
      setStep('success');
    } catch (e) {
      setError(e.message);
      if (/sold out/i.test(e.message)) {
        setStep('rooms');
        setResults(null);
        setSelected(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nights = useMemo(
    () => Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000),
    [checkIn, checkOut]
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* ─── Header ─── */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            vimad
          </Link>
          {property && (
            <div className="text-right">
              <div className="text-sm font-semibold">{property.name}</div>
              <div className="text-xs text-text-muted">Official booking page</div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ═══ STEP: dates ═══ */}
        {step === 'dates' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Book your stay</h1>
              <p className="mt-2 text-text-secondary">
                Best rate guaranteed — booked directly with the property.
              </p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase text-text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Check-in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase text-text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Check-out
                </span>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase text-text-muted">
                  <Users className="h-3.5 w-3.5" /> Adults
                </span>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase text-text-muted">
                  <Users className="h-3.5 w-3.5" /> Children
                </span>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={search}
              disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-secondary px-8 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Check availability
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ═══ STEP: rooms ═══ */}
        {step === 'rooms' && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('dates')}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> Change dates
            </button>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <Calendar className="h-4 w-4 text-text-muted" />
              {fmtDay(checkIn)} → {fmtDay(checkOut)}
              <span className="text-text-muted">·</span>
              <Moon className="h-4 w-4 text-text-muted" /> {nights} night{nights === 1 ? '' : 's'}
              <span className="text-text-muted">·</span>
              <Users className="h-4 w-4 text-text-muted" /> {adults} adult{adults === 1 ? '' : 's'}
              {children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}
            </div>

            {loading && (
              <div className="py-16 text-center text-text-muted">Checking availability…</div>
            )}

            {!loading && results && results.roomTypes.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-10 text-center">
                <BedDouble className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-3 font-medium">No rooms fit your party for these dates</p>
                <p className="mt-1 text-sm text-text-muted">
                  Try fewer guests or different dates — availability updates in real time.
                </p>
              </div>
            )}

            {!loading &&
              results &&
              results.roomTypes.map((rt) => (
                <div
                  key={rt.roomTypeId}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{rt.name}</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Sleeps {rt.baseOccupancy}–{rt.maxOccupancy}
                      <span className="mx-1.5 text-border">·</span>
                      {rt.availableRooms} room{rt.availableRooms === 1 ? '' : 's'} left at this
                      price
                    </p>
                    <p className="mt-3">
                      <span className="text-2xl font-bold">{fmtMoney(rt.ratePerNight)}</span>
                      <span className="text-sm text-text-muted"> / night</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="mb-3 text-sm text-text-muted">
                      {fmtMoney(rt.total)} for {rt.nights} night{rt.nights === 1 ? '' : 's'}
                    </div>
                    <button
                      onClick={() => {
                        setSelected(rt);
                        setStep('details');
                      }}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold text-white"
                    >
                      Book this room <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ═══ STEP: details ═══ */}
        {step === 'details' && selected && (
          <div className="space-y-6">
            <button
              onClick={() => setStep('rooms')}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> Back to rooms
            </button>
            <div>
              <h2 className="text-2xl font-bold">{selected.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {fmtDay(checkIn)} → {fmtDay(checkOut)} · {nights} night{nights === 1 ? '' : 's'} ·{' '}
                Sleeps {selected.baseOccupancy}–{selected.maxOccupancy}
              </p>
            </div>

            {/* Nightly rate breakdown */}
            {selected.nightly && (
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="mb-3 text-xs font-semibold uppercase text-text-muted">
                  Nightly breakdown
                </h3>
                <div className="space-y-1.5">
                  {selected.nightly.map((n) => (
                    <div key={n.date} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{fmtDay(n.date)}</span>
                      <span className="font-medium">{fmtMoney(n.rate)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                    <span>
                      Total for {nights} night{nights === 1 ? '' : 's'}
                    </span>
                    <span>{fmtMoney(selected.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
              {[
                ['First name', 'firstName'],
                ['Last name', 'lastName'],
                ['Email (confirmation goes here)', 'email'],
                ['Phone (international format, e.g. +27…)', 'phone'],
              ].map(([label, key]) => (
                <label key={key} className="space-y-1.5">
                  <span className="text-xs font-medium uppercase text-text-muted">{label}</span>
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              ))}
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium uppercase text-text-muted">
                  Special requests (optional)
                </span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              {/* honeypot — invisible to humans, bots fill it and get rejected */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                aria-hidden="true"
              />
            </div>

            <button
              onClick={submit}
              disabled={
                submitting || !form.firstName || !form.lastName || !form.email || !form.phone
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-8 text-sm font-semibold text-white transition-opacity disabled:opacity-50 sm:w-auto"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm booking — {fmtMoney(selected.total)}
            </button>
            <p className="text-xs text-text-muted">
              Free cancellation until 48h before check-in (link in your confirmation email). A
              one-night deposit ({fmtMoney(selected.ratePerNight)}) secures the room.
            </p>
          </div>
        )}

        {/* ═══ STEP: success ═══ */}
        {step === 'success' && booking && (
          <div className="space-y-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
            <div>
              <h2 className="text-3xl font-bold">Booking confirmed</h2>
              <p className="mt-2 text-text-secondary">
                A confirmation email is on its way to <strong>{booking.guestEmail}</strong>.
              </p>
            </div>
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Confirmation #</span>
                  <span className="font-mono font-semibold">{booking.confirmationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Property</span>
                  <span>{booking.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Check-in</span>
                  <span>{fmtDay(booking.checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Check-out</span>
                  <span>{fmtDay(booking.checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Room</span>
                  <span>{booking.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total</span>
                  <span className="font-semibold">{booking.totalLabel}</span>
                </div>
              </div>
            </div>
            {booking.deposit?.authorizationUrl && (
              <div className="mx-auto max-w-md rounded-2xl border border-accent/20 bg-accent/5 p-6">
                <p className="text-sm font-medium">Secure your room now</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Pay the {booking.deposit.amountLabel} deposit — the room is held either way, but
                  unpaid bookings may be released 48h before arrival.
                </p>
                <a
                  href={booking.deposit.authorizationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-8 text-sm font-semibold text-white"
                >
                  <CreditCard className="h-4 w-4" /> Pay {booking.deposit.amountLabel} now
                </a>
              </div>
            )}
            <Link to="/" className="block text-sm text-text-muted hover:text-text-primary">
              ← Back to home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
