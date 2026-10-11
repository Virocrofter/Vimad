/* apps/web/src/app/booking/cancel/page.jsx
 * A4 — public cancellation page (linked from the confirmation email).
 * Confirmation number + email → cancels if >48h before check-in.
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarX, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { publicBookingApi } from '../../../api/public';

export default function CancelBookingPage() {
  const [params] = useSearchParams();
  const [confirmationNumber, setConfirmationNumber] = useState(params.get('c') ?? '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await publicBookingApi.cancel({
        confirmationNumber: confirmationNumber.trim(),
        email: email.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-text-primary">
        <div className="w-full max-w-md space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
          <h1 className="text-3xl font-bold">Booking cancelled</h1>
          <p className="text-text-secondary">
            Confirmation <strong className="font-mono">{confirmationNumber}</strong> has been
            cancelled. A confirmation email is on its way, and any deposit paid will be refunded to
            the original card within 5–7 business days.
          </p>
          <Link to="/" className="block text-sm text-text-muted hover:text-text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-text-primary">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
        <div>
          <CalendarX className="h-10 w-10 text-text-muted" />
          <h1 className="mt-4 text-3xl font-bold">Cancel a booking</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your confirmation number and the email you booked with. Cancellation is free up to
            48 hours before check-in — after that, please contact the property directly.
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase text-text-muted">Confirmation #</span>
            <input
              type="text"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="VMD-XXXXXX-XXX"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase text-text-muted">Booking email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <button
            onClick={submit}
            disabled={loading || !confirmationNumber.trim() || !email.trim()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-danger px-8 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}
