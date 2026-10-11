/* src/app/guest-portal/page.jsx */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStayDetails, getGuestToken } from '../../hooks/useGuestPortalData';
import { formatDate } from '../../lib/guest-utils';

export default function GuestPortalPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, error, refetch } = useStayDetails();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your stay…</p>
      </div>
    );
  }

  if (isError || !stay) {
    const expired = error?.status === 401 || error?.status === 403;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">
          {expired
            ? 'Your session has expired. Please verify your reservation again.'
            : 'We couldn’t load your stay details.'}
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

  const now = new Date();
  const arrival = new Date(stay.arrivalDate);
  const departure = new Date(stay.departureDate);
  const nights = Math.max(
    1,
    Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
  );
  const phase = stay.checkedIn ? 'during' : now < arrival ? 'pre' : 'post';
  const phaseConfig = {
    pre: { label: 'Upcoming Stay', color: 'bg-info/10 text-info' },
    during: { label: 'Current Stay', color: 'bg-accent/10 text-accent' },
    post: { label: 'Past Stay', color: 'bg-background-secondary text-text-secondary' },
  };
  const cfg = phaseConfig[phase];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome{stay.guestName ? `, ${stay.guestName.split(',')[0]}` : ''}!
          </h1>
          <p className="text-text-secondary mt-1">Manage your stay</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Stay Summary */}
      <div className="rounded-lg border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Your Stay</h2>
            <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {stay.guestName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">Room {stay.roomNumber}</p>
            {stay.digitalKeyReady && (
              <p className="text-xs text-accent flex items-center justify-end gap-1 mt-1">
                <KeyRound className="h-3 w-3" /> Digital key ready
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(stay.arrivalDate)} → {formatDate(stay.departureDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {nights} night{nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Request Housekeeping', href: '/guest-portal/stay/housekeeping' },
            { label: 'Order Room Service', href: '/guest-portal/stay/room-service' },
            { label: 'Contact Concierge', href: '/guest-portal/stay/concierge' },
            { label: 'Report Issue', href: '/guest-portal/stay/issues' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-lg border border-border p-4 text-center hover:bg-background-secondary transition-colors"
            >
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
