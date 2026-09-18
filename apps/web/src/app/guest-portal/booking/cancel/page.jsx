import { useState } from 'react';
import { AlertTriangle, Calendar, CreditCard, Info } from 'lucide-react';

export default function CancelBookingPage() {
  const booking = {
    id: 'RSV-1001',
    propertyName: 'Grand Hotel',
    roomType: 'Deluxe King',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    totalAmount: 756,
    cancellationPolicy: 'Free cancellation until 24 hours before check-in',
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Pre-compute expected refund date
  const [expectedByDate] = useState(() =>
    formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString())
  );

  const handleCancel = () => {
    // In real app, call API to cancel
    alert('Booking cancelled. Refund will be processed.');
  };

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
            <span className="font-medium text-text-primary">{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Property</span>
            <span className="font-medium text-text-primary">{booking.propertyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Room Type</span>
            <span className="font-medium text-text-primary">{booking.roomType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Check-in
            </span>
            <span className="font-medium text-text-primary">{formatDate(booking.checkIn)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Check-out
            </span>
            <span className="font-medium text-text-primary">{formatDate(booking.checkOut)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-text-secondary flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Total Paid
            </span>
            <span className="text-lg font-bold text-text-primary">${booking.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-medium text-text-primary">Cancellation Policy</h3>
            <p className="text-sm text-text-secondary mt-1">{booking.cancellationPolicy}</p>
          </div>
        </div>
      </div>

      {/* Refund Info */}
      <div className="rounded-lg border border-border p-6">
        <h3 className="font-medium text-text-primary mb-4">Refund Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Refund Amount</span>
            <span className="font-medium text-accent">${booking.totalAmount} (full refund)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Expected by</span>
            <span className="font-medium text-text-primary">{expectedByDate}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-background-secondary"
        >
          Keep Booking
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 px-6 py-3 bg-danger text-white rounded-lg hover:bg-danger/90"
        >
          Confirm Cancellation
        </button>
      </div>
    </div>
  );
}
