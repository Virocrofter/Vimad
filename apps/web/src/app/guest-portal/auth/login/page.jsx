/* src/app/guest-portal/auth/login/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGuestStore } from '../../store';
import { guestProfile, guestStays } from '../../data';
import { setGuestToken } from '../../../../hooks/guestPortalApi';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');

export default function GuestLoginPage() {
  const navigate = useNavigate();
  const login = useGuestStore((s) => s.login);
  const setCurrentStay = useGuestStore((s) => s.setCurrentStay);

  const [bookingRef, setBookingRef] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (isLoading) return;
    if (!bookingRef.trim() || !lastName.trim()) {
      setError('Please enter your booking reference and last name.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // 1. Look up the reservation
      const lookupRes = await fetch(`${API_BASE}/v1/guest-portal/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNumber: bookingRef.trim(),
          lastName: lastName.trim(),
        }),
      });
      const lookupBody = await lookupRes.json().catch(() => ({}));
      if (!lookupRes.ok || !lookupBody?.data?.found) {
        setError(
          lookupBody?.error?.message ?? 'Reservation not found — check the reference and last name.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Verify identity → scoped portal token
      const verifyRes = await fetch(`${API_BASE}/v1/guest-portal/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNumber: bookingRef.trim(),
          lastName: lastName.trim(),
        }),
      });
      const verifyBody = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyBody?.data?.token) {
        setError(verifyBody?.error?.message ?? 'Verification failed — contact the front desk.');
        setIsLoading(false);
        return;
      }

      // 3. Store the token via the portal's own helper — single source of
      //    truth for the storage key (guestPortalApi.TOKEN_KEY). The guard
      //    (GuestAuthGuard) and every portal page read the same key.
      setGuestToken(verifyBody.data.token);
      login(guestProfile);
      setCurrentStay(guestStays[0]);
      navigate('/guest-portal');
    } catch {
      setError('Could not reach the server — try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    'h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-text-primary">Welcome Back</h1>
        <p className="mt-1 text-sm text-text-secondary">Access your stay details and services</p>
      </div>

      {/* Method hint */}
      <div className="flex rounded-lg border border-border bg-surface p-1">
        <div
          className={cn(
            'flex-1 rounded-md py-2 text-center text-xs font-medium bg-secondary text-white'
          )}
        >
          Booking Reference
        </div>
      </div>

      {/* Form — submit via button onClick, not form onSubmit, so the UI-kit
          Button's type handling can't swallow it */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Booking Reference
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              placeholder="e.g. DEMO-4101"
              className={cn(inputCls, 'pl-10')}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
            placeholder="As it appears on your reservation"
            className={inputCls}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="button" className="w-full" disabled={isLoading} onClick={handleLogin}>
          {isLoading ? 'Signing in...' : 'Sign In'}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Demo hint + help */}
      <div className="space-y-2 text-center">
        <p className="text-[11px] text-text-muted">
          Demo: <code className="rounded bg-surface-elevated px-1">DEMO-4101</code> +{' '}
          <code className="rounded bg-surface-elevated px-1">Smith</code>
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-text-muted">
          <HelpCircle className="h-3 w-3" />
          <span>
            Need help?{' '}
            <a href="/guest-portal/support/contact" className="text-secondary hover:underline">
              Contact us
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
