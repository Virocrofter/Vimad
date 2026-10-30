/* src/app/guest-portal/check-in/digital-key/page.jsx — G4: the key card */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Fingerprint, RefreshCw, Wifi } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestPortalApi, getGuestToken } from '../../../../hooks/guestPortalApi';
import { useStayDetails } from '../../../../hooks/useGuestPortalData';

function formatWindow(from, to) {
  const f = new Date(from);
  const t = new Date(to);
  const sameDay = f.toDateString() === t.toDateString();
  const opts = { day: 'numeric', month: 'short' };
  return sameDay
    ? `${f.toLocaleDateString('en-GB', opts)} · ${f.getHours()}:00–${t.getHours()}:00`
    : `${f.toLocaleDateString('en-GB', opts)} → ${t.toLocaleDateString('en-GB', opts)}`;
}

export default function DigitalKeyPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();

  const [key, setKey] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const load = () => {
    const token = getGuestToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    guestPortalApi
      .digitalKey(token)
      .then(setKey)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hasToken) {
      navigate('/guest-portal/auth/login', { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  if (!hasToken) return null;

  if (loading && !key) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Preparing your key…</p>
      </div>
    );
  }

  if (error || !key) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">
          {error ??
            'Your key is not ready yet — check in first at the front desk or complete online check-in.'}
        </p>
        <Button variant="outline" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const active = new Date() >= new Date(key.activeFrom) && new Date() <= new Date(key.activeUntil);
  const codeGroups = key.keyCode.match(/.{1,4}/g) ?? [key.keyCode];

  return (
    <div className="min-h-full pb-20">
      {/* ambient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -10%, rgba(79,70,229,0.35), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(67,56,202,0.28), transparent 60%)',
        }}
      />

      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <button
          onClick={load}
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-text-primary" />
        </button>
      </div>

      <div className="px-6 pt-10 flex flex-col items-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted mb-1">Digital Key</p>
        <h1 className="text-lg font-semibold text-text-primary">
          {stay?.propertyName ?? 'Your hotel'}
        </h1>
      </div>

      {/* ── the card ── */}
      <div className="px-6 mt-8" style={{ perspective: '1200px' }}>
        <div
          className="relative mx-auto max-w-sm rounded-3xl p-[1.5px] transition-transform duration-500 hover:[transform:rotateX(4deg)_rotateY(-4deg)]"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.06) 30%, rgba(139,92,246,0.55) 70%, rgba(255,255,255,0.35))',
            boxShadow: '0 30px 60px -20px rgba(79,70,229,0.55), 0 10px 30px -10px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-8"
            style={{
              background:
                'linear-gradient(150deg, #312e81 0%, #4f46e5 45%, #4338ca 70%, #1e1b4b 100%)',
            }}
          >
            {/* shimmer sweep */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 45%, transparent 60%)',
                backgroundSize: '250% 100%',
                animation: 'keyShimmer 4.5s ease-in-out infinite',
              }}
            />
            {/* grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            <div className="relative">
              {/* top row: chip + NFC */}
              <div className="flex items-start justify-between">
                <div
                  className="rounded-md px-2 py-1.5"
                  style={{ background: 'linear-gradient(135deg,#fbbf24,#d97706)' }}
                >
                  <div className="h-3 w-5 rounded-[2px] border border-amber-950/40 bg-amber-300/70" />
                </div>

                {/* NFC radiating arcs */}
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span
                    className="absolute h-12 w-12 rounded-full border border-white/25"
                    style={{ animation: 'nfcPulse 2.4s ease-out infinite' }}
                  />
                  <span
                    className="absolute h-12 w-12 rounded-full border border-white/25"
                    style={{ animation: 'nfcPulse 2.4s ease-out infinite 0.8s' }}
                  />
                  <span
                    className="absolute h-12 w-12 rounded-full border border-white/25"
                    style={{ animation: 'nfcPulse 2.4s ease-out infinite 1.6s' }}
                  />
                  <Wifi className="h-5 w-5 text-white/90" style={{ transform: 'rotate(90deg)' }} />
                </div>
              </div>

              {/* room */}
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-200/80">Room</p>
                <p className="text-5xl font-bold text-white tracking-wide drop-shadow">
                  {stay?.roomNumber ?? '—'}
                </p>
              </div>

              {/* key code */}
              <button
                onClick={() => setRevealed((r) => !r)}
                className="mt-6 w-full text-left group"
                title={revealed ? 'Hide code' : 'Tap to reveal'}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-200/80 mb-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3" /> {revealed ? 'Tap to hide' : 'Tap to reveal'}
                </p>
                <p
                  className={cn(
                    'font-mono text-2xl tracking-[0.35em] text-white transition-all duration-300 select-none',
                    !revealed && 'blur-md group-active:blur-sm'
                  )}
                >
                  {codeGroups.join(' ')}
                </p>
              </button>

              {/* validity */}
              <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-200/70">Valid</p>
                  <p className="text-xs text-white/90 font-mono">
                    {formatWindow(key.activeFrom, key.activeUntil)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                    active
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30'
                      : 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      active ? 'bg-emerald-300' : 'bg-amber-300',
                      active && 'animate-pulse'
                    )}
                  />
                  {active ? 'ACTIVE' : 'SCHEDULED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-text-muted px-10">
        Hold your phone near the door reader. This key works offline within the valid window.
      </p>

      <style>{`
        @keyframes keyShimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
        @keyframes nfcPulse { 0% { transform: scale(0.55); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
}
