/* src/app/guest-portal/my-stays/page.jsx — 0.5 guest CRM 360 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hotel, Calendar, Star, Award, TrendingUp, Clock, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const API_BASE = import.meta.env?.VITE_API_URL ?? '/api/v1';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
const fmtMoney = (n) => (n ?? 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });

const STATUS_LABEL = {
  confirmed: 'Upcoming',
  checked_in: 'In house',
  checked_out: 'Completed',
};

export default function MyStaysPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('gp_token');
    if (!token) {
      setError('Session expired — please log in again.');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/guest-portal/my-stays/${token}`)
      .then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(e))))
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.error?.message ?? 'Could not load your stays.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-16 text-center text-text-muted">Loading your stays…</p>;
  }
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-secondary">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/guest-portal')}>
          Back to portal
        </Button>
      </div>
    );
  }

  const { guest, upcoming, stays, stats, loyalty } = data;
  const name = `${guest.firstName} ${guest.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Stays</h1>
          <p className="text-sm text-text-secondary">
            {name}
            {guest.vipStatus ? ` · ${guest.vipStatus.toUpperCase()} member` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Hotel, label: 'Stays', value: stats.totalStays },
          { icon: Calendar, label: 'Nights', value: stats.totalNights },
          { icon: TrendingUp, label: 'Lifetime spend', value: fmtMoney(stats.totalSpend) },
          { icon: Award, label: 'Points', value: (guest.loyaltyPoints ?? 0).toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <Icon className="mb-2 h-4 w-4 text-secondary" />
            <p className="text-xl font-bold font-mono text-text-primary">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Clock className="h-4 w-4 text-secondary" /> Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((s) => (
              <StayCard key={s.confirmationNumber} stay={s} highlight />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Hotel className="h-4 w-4 text-secondary" /> Stay history
        </h2>
        {stays.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
            No completed stays yet — your history will appear here after your first visit.
          </p>
        ) : (
          <div className="space-y-3">
            {stays.map((s) => (
              <StayCard key={s.confirmationNumber} stay={s} />
            ))}
          </div>
        )}
      </section>

      {loyalty.recent.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Star className="h-4 w-4 text-secondary" /> Points activity
          </h2>
          <div className="overflow-hidden rounded-lg border border-border">
            {loyalty.recent.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between bg-surface px-4 py-3 text-sm',
                  i > 0 && 'border-t border-border'
                )}
              >
                <div>
                  <p className="text-text-primary">{t.description}</p>
                  <p className="text-xs text-text-muted">
                    {fmtDate(t.createdAt)} · {t.source}
                  </p>
                </div>
                <p
                  className={cn(
                    'font-mono font-semibold',
                    t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StayCard({ stay, highlight }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-surface p-4',
        highlight ? 'border-secondary/40' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-text-primary">{stay.propertyName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(stay.arrivalDate)} → {fmtDate(stay.departureDate)}
            <span className="text-text-muted">
              · {stay.nights} night{stay.nights === 1 ? '' : 's'}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <MapPin className="h-3.5 w-3.5" /> {stay.confirmationNumber} · {stay.guests} guest
            {stay.guests === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              stay.status === 'checked_in'
                ? 'bg-emerald-100 text-emerald-700'
                : stay.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
            )}
          >
            {STATUS_LABEL[stay.status] ?? stay.status}
          </span>
          <p className="mt-2 font-mono text-sm font-semibold text-text-primary">
            {fmtMoney(stay.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
