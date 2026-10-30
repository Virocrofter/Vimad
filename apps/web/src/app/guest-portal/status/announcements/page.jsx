/* src/app/guest-portal/status/announcements/page.jsx — G5: real announcements feed */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import { useAnnouncements } from '../../../../hooks/useGuestComms';
import { formatDate } from '../../../../lib/guest-utils';

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useAnnouncements();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading announcements…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load announcements.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const announcements = data.announcements ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/status')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Announcements</h1>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <Megaphone className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No announcements right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-secondary shrink-0" />
                <p className="text-sm font-semibold text-text-primary flex-1">{a.title}</p>
                <span className="text-[10px] text-text-muted shrink-0">
                  {formatDate(a.publishAt)}
                </span>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
