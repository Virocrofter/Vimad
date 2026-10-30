/* src/app/guest-portal/booking/cancel/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, CreditCard, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  useCancelQuote,
  useCancelBooking,
  useStayDetails,
  getGuestToken,
} from '../../../../hooks/useGuestPortalData';
import { formatCurrency, formatDate } from '../../../../lib/guest-utils';

export default function CancelBookingPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();
  const { data: quote, isLoading, isError } = useCancelQuote(hasToken);
  const cancelBooking = useCancelBooking();
  const [confirmed, setConfirmed] = useState(false);

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading cancellation details…</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-danger/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Cancel Booking</h1>
            <p className="text-text-secondary">This reservation can’t be cancelled online</p>
          </div>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-text-secondary">
            {stay?.checkedIn
              ? 'You are already checked in — please contact the front desk to arrange an early departure.'
              : 'This reservation can no longer be cancelled online. Please contact the front desk.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/guest-portal/booking')}>
          Back to Reservation
        </Button>
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync();
      setConfirmed(true);
    } catch {
      /* error surfaces below */
    }
  };

  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Booking Cancelled</h1>
          <p className="text-text-secondary mt-2">
            Reservation {quote.confirmationNumber} has been cancelled.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6 text-left">
          <div className="flex justify-between">
            <span className="text-text-secondary">Refund amount</span>
            <span className="font-medium text-accent">
              {quote.refund > 0 ? formatCurrency(quote.refund) : 'No refund due'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Refunds are processed to the original payment method within 5–10 business days.
          </p>
        </div>
        <Button onClick={() => navigate('/guest-portal')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-danger/10 rounded-full">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cancel Booking</h1>
          <p className="text-text-secondary">Review cancellation details before confirming</p>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Booking Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Confirmation Number</span>
            <span className="font-medium text-text-primary">{quote.confirmationNumber}</span>
          </div>
          {stay?.propertyName && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Property</span>
              <span className="font-medium text-text-primary">{stay.propertyName}</span>
            </div>
          )}
          {stay?.roomTypeName && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Room Type</span>
              <span className="font-medium text-text-primary">{stay.roomTypeName}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-text-secondary flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Check-in
            </span>
            <span className="font-medium text-text-primary">{formatDate(quote.arrivalDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Check-out
            </span>
            <span className="font-medium text-text-primary">{formatDate(quote.departureDate)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-text-secondary flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Total Paid
            </span>
            <span className="text-lg font-bold text-text-primary">
              {formatCurrency(quote.paid)}
            </span>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-medium text-text-primary">{quote.policy.label}</h3>
            <p className="text-sm text-text-secondary mt-1">{quote.policy.description}</p>
          </div>
        </div>
      </div>

      {/* Refund Info */}
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-medium text-text-primary mb-4">Refund Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Cancellation fee</span>
            <span className="font-medium text-text-primary">
              {quote.policy.fee > 0 ? formatCurrency(quote.policy.fee) : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Refund Amount</span>
            <span className="font-medium text-accent">
              {quote.refund > 0 ? `${formatCurrency(quote.refund)}` : 'No refund due'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Expected by</span>
            <span className="font-medium text-text-primary">5–10 business days</span>
          </div>
        </div>
      </div>

      {cancelBooking.isError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger">
          {cancelBooking.error?.message ?? 'Could not cancel. Please try again.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/guest-portal/booking')}
          className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-background-secondary"
        >
          Keep Booking
        </button>
        <button
          onClick={handleCancel}
          disabled={cancelBooking.isPending}
          className="flex-1 px-6 py-3 bg-danger text-white rounded-lg hover:bg-danger/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {cancelBooking.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirm Cancellation
        </button>
      </div>
    </div>
  );
}
