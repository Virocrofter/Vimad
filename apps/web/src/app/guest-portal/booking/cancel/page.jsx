/* src/app/guest-portal/booking/cancel/page.jsx */
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, XCircle, CheckCircle2, Info,
  Calendar, Clock, CreditCard, ShieldCheck, Loader2, ChevronRight
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestStays, formatCurrency, formatDate, getCancellationPolicy, stayStatusMeta } from '../../data';

export default function GuestBookingCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stayId = searchParams.get('stay');
  
  const stay = guestStays.find(s => s.id === stayId);
  
  const [step, setStep] = useState(1); // 1: review, 2: confirm, 3: done
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const reasons = [
    'Change of plans',
    'Found better rate elsewhere',
    'Emergency / unforeseen circumstances',
    'Travel restrictions',
    'Other',
  ];

  if (!stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Reservation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/guest-portal/booking')}>
          Back to Reservations
        </Button>
      </div>
    );
  }

  const policy = getCancellationPolicy(stay);
  const refundAmount = policy.type === 'free' ? stay.rate.total + stay.rate.taxes + stay.rate.fees :
                      policy.type === 'partial' ? (stay.rate.total * 0.5) + stay.rate.taxes + stay.rate.fees :
                      0;

  const handleCancel = async () => {
    setIsCancelling(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsCancelling(false);
    setStep(3);
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
          <h1 className="text-lg font-semibold text-text-primary">Cancel Reservation</h1>
          <p className="text-xs text-text-muted">{stay.confirmationNumber}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Review', 'Confirm', 'Complete'].map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
              idx + 1 < step ? 'bg-accent text-white' :
              idx + 1 === step ? 'bg-secondary text-white' :
              'bg-border text-text-muted'
            )}>
              {idx + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={cn('text-xs font-medium hidden sm:inline',
              idx + 1 <= step ? 'text-text-primary' : 'text-text-muted'
            )}>{s}</span>
            {idx < 2 && <div className={cn('h-px w-6', idx + 1 < step ? 'bg-accent' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          {/* Reservation Summary */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Reservation Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Property</span>
                <span className="text-text-primary font-medium">{stay.property.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Dates</span>
                <span className="text-text-primary font-medium">{formatDate(stay.dates.arrival)} – {formatDate(stay.dates.departure)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Room</span>
                <span className="text-text-primary font-medium">{stay.room.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Paid</span>
                <span className="text-text-primary font-medium">{formatCurrency(stay.rate.total + stay.rate.taxes + stay.rate.fees)}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className={cn(
            'rounded-xl border p-4',
            policy.type === 'free' ? 'border-accent/20 bg-accent/5' :
            policy.type === 'partial' ? 'border-warning/20 bg-warning/5' :
            'border-danger/20 bg-danger/5'
          )}>
            <div className="flex items-center gap-2 mb-3">
              {policy.type === 'free' ? <CheckCircle2 className="h-5 w-5 text-accent" /> :
               policy.type === 'partial' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
               <XCircle className="h-5 w-5 text-danger" />}
              <h3 className="text-sm font-semibold text-text-primary">Cancellation Policy</h3>
            </div>
            <p className={cn('text-sm font-medium mb-1',
              policy.type === 'free' ? 'text-accent' :
              policy.type === 'partial' ? 'text-warning' :
              'text-danger'
            )}>
              {policy.label}
            </p>
            <p className="text-xs text-text-secondary">{policy.description}</p>
            
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Refund amount</span>
                <span className={cn('font-bold',
                  refundAmount > 0 ? 'text-accent' : 'text-danger'
                )}>
                  {formatCurrency(refundAmount)}
                </span>
              </div>
              {policy.fee > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-text-secondary">Cancellation fee</span>
                  <span className="text-danger font-medium">{formatCurrency(policy.fee)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Why are you cancelling?</h3>
            <div className="space-y-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg border p-3 text-left transition-all',
                    reason === r
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-background hover:bg-surface-elevated'
                  )}
                >
                  <span className={cn('text-sm', reason === r ? 'text-secondary font-medium' : 'text-text-primary')}>
                    {r}
                  </span>
                  {reason === r && <CheckCircle2 className="h-4 w-4 text-secondary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/guest-portal/booking')}>
              Keep Reservation
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              disabled={!reason}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {/* Final Confirmation */}
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-danger" />
              <h3 className="text-sm font-semibold text-danger">Final Confirmation</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </p>
            
            <div className="rounded-lg border border-border bg-background p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Reservation</span>
                <span className="text-text-primary font-medium">{stay.confirmationNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Refund</span>
                <span className={cn('font-bold', refundAmount > 0 ? 'text-accent' : 'text-danger')}>
                  {formatCurrency(refundAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Refund method</span>
                <span className="text-text-primary">Original payment method</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Processing time</span>
                <span className="text-text-primary">5-10 business days</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Go Back
            </Button>
            <Button
              className="flex-1 bg-danger hover:bg-danger/90"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="text-center py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Cancellation Confirmed</h3>
          <p className="text-sm text-text-secondary mb-4">
            Your reservation has been cancelled. A confirmation email has been sent.
          </p>
          
          <div className="rounded-lg border border-border bg-surface p-4 text-left mb-6 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">Refund amount</span>
              <span className="font-bold text-accent">{formatCurrency(refundAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Refund method</span>
              <span className="text-text-primary">Original payment</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border">
              <span className="text-text-secondary">Expected by</span>
              <span className="text-text-primary">{formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString())}</span>
            </div>
          </div>

          <Button onClick={() => navigate('/guest-portal/booking')}>
            Back to Reservations
          </Button>
        </div>
      )}
    </div>
  );
}
