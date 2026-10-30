/* src/app/guest-portal/booking/page.jsx */
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  KeyRound,
  ConciergeBell,
  Loader2,
  XCircle,
  PencilLine,
  CalendarX,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { useStayDetails, getGuestToken } from '../../../hooks/useGuestPortalData';
import { formatDate, formatDateRange, stayStatusMeta } from '../../../lib/guest-utils';
import { SectionHeader } from '../components';

/**
 * My Reservations — v1 shows the verified reservation (one stay per guest
 * token; the guest-portal API is token-scoped to a single reservation).
 * A multi-stay history view needs a guest account system — post-v1.
 */
export default function GuestBookingPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, error, refetch } = useStayDetails();

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
    const expired = error?.status === 401 || error?.status === 403;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">
          {expired
            ? 'Your session has expired. Please verify your reservation again.'
            : 'We couldn’t load your reservation.'}
        </p>
        <div className="mt-4 flex gap-2">
          {expired ? (
            <Button onClick={() => navigate('/guest-portal/auth/login')}>Verify again</Button>
          ) : (
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  const statusKey = stay.checkedIn ? 'checked_in' : 'confirmed';
  const meta = stayStatusMeta[statusKey] ?? stayStatusMeta.confirmed;
  const nights = Math.max(
    1,
    Math.round(
      (new Date(stay.departureDate).getTime() - new Date(stay.arrivalDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const actions = [
    !stay.checkedIn && {
      icon: CheckCircle2,
      label: 'Pre-Check-In',
      description: 'Save time on arrival',
      color: 'bg-accent/10 text-accent',
      onClick: () => navigate('/guest-portal/check-in'),
    },
    stay.checkedIn && {
      icon: KeyRound,
      label: 'Digital Key',
      description: stay.digitalKeyReady ? 'Ready to use' : 'Activates on arrival',
      color: 'bg-secondary/10 text-secondary',
      onClick: () => navigate('/guest-portal/keys'),
    },
    {
      icon: ConciergeBell,
      label: 'In-Stay Services',
      description: 'Housekeeping, dining, concierge',
      color: 'bg-purple-500/10 text-purple-500',
      onClick: () => navigate('/guest-portal/stay'),
    },
    {
      icon: Receipt,
      label: 'Billing & Folio',
      description: 'Charges and receipts',
      color: 'bg-info/10 text-info',
      onClick: () => navigate('/guest-portal/billing'),
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <SectionHeader title="My Reservation" subtitle="Your verified booking and stay actions" />

      {/* Reservation Card */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-text-primary">{stay.guestName}</p>
              <p className="text-sm text-text-secondary mt-0.5">Room {stay.roomNumber}</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                meta.bg,
                meta.color,
                meta.border
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
              {meta.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-text-muted" />
              {formatDateRange(stay.arrivalDate, stay.departureDate)}
            </span>
            <span className="text-text-muted">
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border divide-y divide-border">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-elevated transition-colors"
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  action.color.split(' ')[0]
                )}
              >
                <action.icon className={cn('h-4 w-4', action.color.split(' ')[1])} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{action.label}</p>
                <p className="text-xs text-text-muted">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </button>
          ))}
        </div>
      </div>

      {/* Modify / Cancel — self-service with live policy quote */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-text-primary">Need to change your plans?</p>
          <p className="text-xs text-text-muted mt-0.5">
            Modify your dates or guests, or cancel — the cancellation policy is quoted before you
            confirm anything.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <button
            onClick={() => navigate('/guest-portal/booking/modify')}
            className="flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-elevated transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
              <PencilLine className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Modify booking</p>
              <p className="text-[11px] text-text-muted">Dates &amp; guests</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/guest-portal/booking/cancel')}
            className="flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-elevated transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <CalendarX className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Cancel booking</p>
              <p className="text-[11px] text-text-muted">See fee first</p>
            </div>
          </button>
        </div>
      </div>

      {/* Past stays note */}
      <p className="text-center text-[10px] text-text-muted pb-4">
        Viewing past stays across visits requires a guest account — coming in a future update.
      </p>
    </div>
  );
}
