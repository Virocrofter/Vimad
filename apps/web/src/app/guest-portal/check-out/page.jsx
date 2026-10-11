/* src/app/guest-portal/check-out/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Receipt,
  KeyRound,
  Clock,
  Calendar,
  ChevronRight,
  Home,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  useStayDetails,
  useServiceRequest,
  getGuestToken,
} from '../../../hooks/useGuestPortalData';
import { formatDate } from '../../../lib/guest-utils';

/**
 * v1 check-out: there is no guest-facing check-out POST — check-out is
 * completed by the front desk. This page lets the guest review their stay,
 * request check-out / late check-out (real service requests), and see what
 * happens next. Folio/receipt views live under Billing (flag-gated until the
 * guest folio endpoint exists).
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, refetch } = useStayDetails();
  const serviceRequest = useServiceRequest();

  const [requested, setRequested] = useState(null); // 'checkout' | 'late'
  const [requestError, setRequestError] = useState(null);

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
        <p className="text-sm text-text-muted">Loading your stay…</p>
      </div>
    );
  }

  if (isError || !stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn’t load your stay details.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const nights = Math.max(
    1,
    Math.round(
      (new Date(stay.departureDate).getTime() - new Date(stay.arrivalDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const sendRequest = async (kind) => {
    setRequestError(null);
    try {
      await serviceRequest.mutateAsync({
        type: 'concierge',
        message:
          kind === 'late'
            ? 'Guest requests a late check-out, subject to availability.'
            : 'Guest is ready to check out. Please confirm final bill and check-out.',
      });
      setRequested(kind);
    } catch (err) {
      setRequestError(err?.message ?? 'Request failed. Please contact the front desk.');
    }
  };

  /* ─── Request sent ─── */
  if (requested) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div className="text-center py-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 mb-4">
            <CheckCircle2 className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {requested === 'late' ? 'Late Check-Out Requested' : 'Check-Out Requested'}
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            {requested === 'late'
              ? 'The front desk will confirm whether a late check-out is available for your room.'
              : 'The front desk has been notified and will finalize your check-out. You can leave your key card in the room.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 max-w-md mx-auto">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Stay Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Guest</span>
              <span className="text-text-primary font-medium">{stay.guestName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Room</span>
              <span className="text-text-primary font-medium">{stay.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Dates</span>
              <span className="text-text-primary font-medium">
                {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Nights</span>
              <span className="text-text-primary font-medium">{nights}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 max-w-md mx-auto flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-text-muted shrink-0" />
          <p className="text-xs text-text-secondary">
            Your digital key stops working at the end of your stay ({formatDate(stay.departureDate)}
            ).
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-md mx-auto">
          <Button onClick={() => navigate('/guest-portal')}>
            <Home className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/guest-portal/messages')}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message Front Desk
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Review & request ─── */
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Check-Out</h1>
          <p className="text-xs text-text-muted">
            Room {stay.roomNumber} · Departure {formatDate(stay.departureDate)}
          </p>
        </div>
      </div>

      {/* Stay Summary */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Your Stay</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Guest</span>
            <span className="text-text-primary font-medium">{stay.guestName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Room</span>
            <span className="text-text-primary font-medium">{stay.roomNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Dates</span>
            <span className="text-text-primary font-medium">
              {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Nights</span>
            <span className="text-text-primary font-medium">{nights}</span>
          </div>
        </div>
      </div>

      {/* Bill */}
      <button
        onClick={() => navigate('/guest-portal/billing')}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-surface p-4 hover:shadow-md hover:border-secondary/30 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <Receipt className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Review Your Bill</p>
            <p className="text-xs text-text-muted">Check charges before you leave</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted" />
      </button>

      {/* What happens */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">How check-out works</h2>
        <div className="space-y-3">
          {[
            { icon: Clock, text: `Standard check-out is on ${formatDate(stay.departureDate)}.` },
            {
              icon: KeyRound,
              text: 'Leave your key card in the room — your digital key deactivates automatically.',
            },
            { icon: Receipt, text: 'Your final receipt is prepared by the front desk.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                <item.icon className="h-4 w-4 text-secondary" />
              </div>
              <p className="text-xs text-text-secondary mt-1.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {requestError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{requestError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          onClick={() => sendRequest('checkout')}
          disabled={serviceRequest.isPending}
        >
          {serviceRequest.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Request Check-Out
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => sendRequest('late')}
          disabled={serviceRequest.isPending}
        >
          <Calendar className="mr-2 h-4 w-4" /> Request Late Check-Out
        </Button>
        <p className="text-center text-[10px] text-text-muted">
          Check-out is confirmed by the front desk. You'll see it reflected on your dashboard.
        </p>
      </div>
    </div>
  );
}
