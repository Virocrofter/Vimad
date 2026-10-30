/* src/app/guest-portal/keys/page.jsx — G4: key hub with big CTA to the card */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, ChevronRight, Wifi, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { getGuestToken } from '../../../hooks/guestPortalApi';
import { useStayDetails } from '../../../hooks/useGuestPortalData';

export default function KeysPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading } = useStayDetails();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading || !stay) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Keys</h1>
      </div>

      <div
        className="rounded-3xl p-[1.5px]"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(139,92,246,0.5), rgba(255,255,255,0.2))',
        }}
      >
        <div
          className="rounded-3xl px-6 py-8"
          style={{ background: 'linear-gradient(150deg, #312e81, #4f46e5 55%, #1e1b4b)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-200/80">
                Room {stay.roomNumber}
              </p>
              <p className="text-2xl font-bold text-white mt-1">{stay.propertyName}</p>
              <p className="text-xs text-indigo-200/80 mt-1">
                {stay.checkedIn ? 'Your key is live' : 'Key activates at check-in'}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
              <Wifi className="h-6 w-6 text-white" style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full h-12 text-base"
        onClick={() => navigate('/guest-portal/check-in/digital-key')}
      >
        <KeyRound className="mr-2 h-5 w-5" /> Open digital key
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs text-text-muted">
        <p className="text-sm font-medium text-text-primary">How it works</p>
        <p>· Tap the card to reveal your entry code.</p>
        <p>· Hold your phone near the door reader — no app needed.</p>
        <p>· The key deactivates automatically at check-out.</p>
      </div>
    </div>
  );
}
