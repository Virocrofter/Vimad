/* src/app/guest-portal/auth/login/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, HelpCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGuestStore } from '../../store';
import { guestProfile, guestStays } from '../../data';

export default function GuestLoginPage() {
  const navigate = useNavigate();
  const login = useGuestStore((s) => s.login);
  const setCurrentStay = useGuestStore((s) => s.setCurrentStay);

  const [method, setMethod] = useState('booking'); // 'booking' | 'email'
  const [bookingRef, setBookingRef] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    // Mock validation
    if (method === 'booking') {
      if (!bookingRef.trim() || !lastName.trim()) {
        setError('Please enter your booking reference and last name.');
        setIsLoading(false);
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        setIsLoading(false);
        return;
      }
    }

    // Mock successful login
    login(guestProfile);
    setCurrentStay(guestStays[0]); // Set first stay as current
    setIsLoading(false);
    navigate('/guest-portal');
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-text-primary">Welcome Back</h1>
        <p className="mt-1 text-sm text-text-secondary">Access your stay details and services</p>
      </div>

      {/* Method Toggle */}
      <div className="flex rounded-lg border border-border bg-surface p-1">
        <button
          onClick={() => setMethod('booking')}
          className={cn(
            'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
            method === 'booking'
              ? 'bg-secondary text-white'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Booking Reference
        </button>
        <button
          onClick={() => setMethod('email')}
          className={cn(
            'flex-1 rounded-md py-2 text-xs font-medium transition-colors',
            method === 'email'
              ? 'bg-secondary text-white'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          Email Sign In
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {method === 'booking' ? (
          <>
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
                  placeholder="e.g. VMD-8X2K9P"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="As it appears on your reservation"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      {/* Help */}
      <div className="space-y-2 text-center">
        <a
          href="/guest-portal/auth/register"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
        >
          Create an account
        </a>
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
