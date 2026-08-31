/* src/app/guest-portal/auth/register/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

export default function GuestRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    bookingRef: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleVerifyBooking = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setStep(2);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setStep(3);
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              s <= step ? 'bg-secondary' : 'bg-border'
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary">Find Your Reservation</h1>
            <p className="mt-1 text-sm text-text-secondary">We'll verify your booking before creating your account</p>
          </div>
          <form onSubmit={handleVerifyBooking} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Booking Reference</label>
              <input
                type="text"
                value={form.bookingRef}
                onChange={(e) => update('bookingRef', e.target.value)}
                placeholder="e.g. VMD-8X2K9P"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="As on reservation"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Find Reservation <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary">Create Your Account</h1>
            <p className="mt-1 text-sm text-text-secondary">Set up your guest profile</p>
          </div>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Min 8 characters"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Repeat password"
                className="h-10 w-full rounded-md border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account <UserPlus className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Account Created!</h1>
          <p className="text-sm text-text-secondary">
            Your account is ready. We've sent a verification link to {form.email || 'your email'}.
          </p>
          <Button onClick={() => navigate('/guest-portal/auth/login')} className="w-full">
            Go to Sign In <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="text-center">
        <a href="/guest-portal/auth/login" className="text-xs text-secondary hover:underline">
          Already have an account? Sign in
        </a>
      </div>
    </div>
  );
}