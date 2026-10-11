/* src/app/guest-portal/stay/page.jsx */
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  UtensilsCrossed,
  Sparkles,
  Wrench,
  ConciergeBell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Package,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useStayDetails, getGuestToken } from '../../../hooks/useGuestPortalData';
import { formatDate } from '../../../lib/guest-utils';

export default function StayPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, refetch } = useStayDetails();

  const quickServices = [
    {
      id: 'room-service',
      label: 'Room Service',
      description: 'Browse menu & order',
      icon: UtensilsCrossed,
      href: '/guest-portal/stay/room-service',
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      description: 'Request service',
      icon: Sparkles,
      href: '/guest-portal/stay/housekeeping',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      id: 'concierge',
      label: 'Concierge',
      description: 'Local recommendations',
      icon: ConciergeBell,
      href: '/guest-portal/stay/concierge',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      id: 'issues',
      label: 'Report Issue',
      description: 'Maintenance requests',
      icon: Wrench,
      href: '/guest-portal/stay/issues',
      color: 'bg-red-500/10 text-red-500',
    },
  ];

  if (!hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Please verify your reservation first</p>
        <button
          onClick={() => navigate('/guest-portal/auth/login')}
          className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
        >
          Verify Reservation
        </button>
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
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-elevated"
        >
          Retry
        </button>
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">In-Stay Services</h1>
        <p className="text-sm text-text-secondary mt-1">
          Room {stay.roomNumber} · {stay.guestName}
        </p>
      </div>

      {/* Stay Status Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-3',
          stay.checkedIn ? 'border-accent/20 bg-accent/5' : 'border-info/20 bg-info/5'
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            stay.checkedIn ? 'bg-accent/10' : 'bg-info/10'
          )}
        >
          {stay.checkedIn ? (
            <CheckCircle2 className="h-5 w-5 text-accent" />
          ) : (
            <Calendar className="h-5 w-5 text-info" />
          )}
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', stay.checkedIn ? 'text-accent' : 'text-info')}>
            {stay.checkedIn ? 'Checked In' : 'Upcoming Stay'}
          </p>
          <p className="text-xs text-text-secondary">
            {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)} · {nights} night
            {nights !== 1 ? 's' : ''}
          </p>
        </div>
        {stay.checkedIn ? (
          <button
            onClick={() => navigate('/guest-portal/keys')}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" /> Digital Key
          </button>
        ) : (
          <button
            onClick={() => navigate('/guest-portal/check-in')}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-white hover:bg-secondary/90 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Pre-Check-In
          </button>
        )}
      </div>

      {/* Quick Services Grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Services</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickServices.map((service) => (
            <button
              key={service.id}
              onClick={() => navigate(service.href)}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 active:scale-95 text-left"
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  service.color
                )}
              >
                <service.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">{service.label}</p>
                <p className="text-[10px] text-text-muted">{service.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Orders & Requests */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Active Orders */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary" /> Active Orders
            </h3>
          </div>
          <div className="px-4 py-8 text-center">
            <UtensilsCrossed className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No active orders</p>
            <button
              onClick={() => navigate('/guest-portal/stay/room-service')}
              className="mt-2 text-xs text-secondary hover:underline"
            >
              Browse Menu
            </button>
          </div>
        </div>

        {/* Active Requests */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Wrench className="h-4 w-4 text-secondary" /> My Requests
            </h3>
          </div>
          <div className="px-4 py-8 text-center">
            <Wrench className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No active requests</p>
            <button
              onClick={() => navigate('/guest-portal/stay/housekeeping')}
              className="mt-2 text-xs text-secondary hover:underline"
            >
              Request Service
            </button>
          </div>
        </div>
      </div>

      {/* Need Help */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Need Help?</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/guest-portal/messages')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Chat with Front Desk</p>
                <p className="text-xs text-text-muted">Typically responds in 5 minutes</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/guest-portal/support')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Support Center</p>
                <p className="text-xs text-text-muted">FAQs, tickets, and contact</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Check-out reminder */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-text-muted shrink-0" />
        <p className="text-xs text-text-secondary">
          Check-out is on <strong>{formatDate(stay.departureDate)}</strong>. You can review your
          bill and check out from the Billing section.
        </p>
      </div>
    </div>
  );
}
