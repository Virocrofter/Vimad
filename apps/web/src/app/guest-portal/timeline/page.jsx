/* src/app/guest-portal/timeline/page.jsx — G4: real guest timeline (C4′b) */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, BedDouble, Star, Ticket } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { getGuestToken } from '../../../hooks/guestPortalApi';
import { useGuestTimeline } from '../../../hooks/useGuestCommerce';
import { formatDate } from '../../../lib/guest-utils';

const kindMeta = {
  stay: { icon: BedDouble, color: 'text-secondary bg-secondary/10' },
  loyalty: { icon: Star, color: 'text-accent bg-accent/10' },
  ticket: { icon: Ticket, color: 'text-warning bg-warning/10' },
};

export default function TimelinePage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useGuestTimeline();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your timeline…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your timeline.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const events = data.events ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Timeline</h1>
          <p className="text-xs text-text-muted">Your journey with us</p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-12">No events yet.</p>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {events.map((e, i) => {
              const meta = kindMeta[e.kind] ?? kindMeta.stay;
              const Icon = meta.icon;
              return (
                <div key={i} className="relative">
                  <div
                    className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full ${meta.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3 ml-2">
                    <p className="text-sm text-text-primary">{e.title}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{formatDate(e.at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
