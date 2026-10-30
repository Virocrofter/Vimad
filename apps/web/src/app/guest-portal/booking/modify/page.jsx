/* src/app/guest-portal/booking/modify/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  Minus,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  useStayDetails,
  useModifyBooking,
  getGuestToken,
} from '../../../../hooks/useGuestPortalData';
import { formatCurrency, formatDate, formatDateRange } from '../../../../lib/guest-utils';

export default function GuestBookingModifyPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, refetch } = useStayDetails();
  const modifyBooking = useModifyBooking();

  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [guests, setGuests] = useState(2);
  const [initialized, setInitialized] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (stay && !initialized) {
    setArrival(stay.arrivalDate);
    setDeparture(stay.departureDate);
    setGuests(stay.adults + stay.children);
    setInitialized(true);
  }

  if (!hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Please verify your reservation first</p>
        <Button className="mt-4" onClick={() => navigate('/guest-portal/auth/login')}>
          Verify Reservation
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your reservation…</p>
      </div>
    );
  }

  if (isError || !stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn’t load your reservation.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (stay.status !== 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">
          {stay.checkedIn
            ? 'This stay is already checked in — modifications are handled by the front desk.'
            : 'This reservation can no longer be modified online — contact the front desk.'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/guest-portal/booking')}
        >
          Back to Reservation
        </Button>
      </div>
    );
  }

  const nights = Math.max(
    1,
    Math.round((new Date(departure) - new Date(arrival)) / (1000 * 60 * 60 * 24))
  );
  const nightlyRate = stay.nights > 0 ? stay.totalAmount / stay.nights : stay.totalAmount;
  const estimatedTotal = Math.round(nightlyRate * nights * 100) / 100;
  const estimatedDiff = Math.round((estimatedTotal - stay.totalAmount) * 100) / 100;
  const datesChanged = arrival !== stay.arrivalDate || departure !== stay.departureDate;
  const guestsChanged = guests !== stay.adults + stay.children;

  const handleSave = async () => {
    try {
      await modifyBooking.mutateAsync({
        arrivalDate: arrival,
        departureDate: departure,
        adults: guests,
        children: 0,
      });
      setShowConfirm(true);
    } catch {
      /* error surfaces via modifyBooking.isError */
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/booking')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Modify Reservation</h1>
          <p className="text-xs text-text-muted">{stay.confirmationNumber}</p>
        </div>
      </div>

      {/* Current Summary */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">
          Current Reservation
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-text-muted text-xs">Dates</p>
            <p className="text-text-primary font-medium">
              {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-xs">Room</p>
            <p className="text-text-primary font-medium">{stay.roomTypeName ?? 'Standard'}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs">Nights</p>
            <p className="text-text-primary font-medium">{stay.nights}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs">Total</p>
            <p className="text-text-primary font-medium">{formatCurrency(stay.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Modify Dates */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Change Dates</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Check-in</label>
            <input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Check-out</label>
            <input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              min={arrival}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            {nights} night{nights !== 1 ? 's' : ''}
          </span>
          <span className="text-text-primary font-medium">{formatCurrency(estimatedTotal)}</span>
        </div>
      </div>

      {/* Guests */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Guests</h3>
            <p className="text-xs text-text-muted">Total number of guests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface-elevated transition-colors"
            >
              <Minus className="h-4 w-4 text-text-secondary" />
            </button>
            <span className="text-sm font-medium text-text-primary w-6 text-center">{guests}</span>
            <button
              onClick={() => setGuests(Math.min(8, guests + 1))}
              className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-surface-elevated transition-colors"
            >
              <Plus className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Summary */}
      {(datesChanged || guestsChanged) && (
        <div
          className={cn(
            'rounded-xl border p-4',
            estimatedDiff > 0
              ? 'border-warning/30 bg-warning/5'
              : estimatedDiff < 0
                ? 'border-accent/30 bg-accent/5'
                : 'border-border bg-surface'
          )}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">Price Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Original total</span>
              <span className="text-text-primary">{formatCurrency(stay.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">New total ({nights} nights)</span>
              <span className="text-text-primary">{formatCurrency(estimatedTotal)}</span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between font-medium">
              <span
                className={cn(
                  estimatedDiff > 0
                    ? 'text-warning'
                    : estimatedDiff < 0
                      ? 'text-accent'
                      : 'text-text-primary'
                )}
              >
                {estimatedDiff > 0
                  ? 'Additional charge'
                  : estimatedDiff < 0
                    ? 'Refund due'
                    : 'No change'}
              </span>
              <span
                className={cn(
                  estimatedDiff > 0
                    ? 'text-warning'
                    : estimatedDiff < 0
                      ? 'text-accent'
                      : 'text-text-primary'
                )}
              >
                {estimatedDiff !== 0 && formatCurrency(Math.abs(estimatedDiff))}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Estimated at your current nightly rate — the final amount is confirmed by the front
              desk.
            </p>
          </div>
        </div>
      )}

      {/* Policy Note */}
      <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Modifications are subject to availability. Rate changes may apply. You'll receive a
          confirmation once the modification is processed.
        </p>
      </div>

      {modifyBooking.isError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
          {modifyBooking.error?.message ?? 'Could not save changes. Please try again.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/guest-portal/booking')}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={modifyBooking.isPending || (!datesChanged && !guestsChanged)}
        >
          {modifyBooking.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Success Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Modification Saved</h3>
            <p className="text-sm text-text-secondary mb-4">
              Your reservation has been updated
              {modifyBooking.data?.delta
                ? ` — your new total is ${formatCurrency(modifyBooking.data.totalAmount)}.`
                : '.'}
            </p>
            <div className="rounded-lg border border-border bg-surface p-3 text-left mb-4">
              <p className="text-xs text-text-muted">New dates</p>
              <p className="text-sm font-bold text-text-primary">
                {modifyBooking.data
                  ? formatDateRange(
                      modifyBooking.data.arrivalDate,
                      modifyBooking.data.departureDate
                    )
                  : ''}
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/guest-portal/booking')}>
              Back to Reservation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
