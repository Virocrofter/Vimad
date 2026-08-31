/* src/app/guest-portal/auth/verify/page.jsx */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Smartphone, Mail, ArrowRight, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

export default function GuestVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || 'email'; // 'email' | 'sms'
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Start resend timer
  useState(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  });

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    // Simulate API verification
    await new Promise((r) => setTimeout(r, 1500));
    
    if (code === '000000') {
      setError('Invalid verification code. Please try again.');
      setIsVerifying(false);
      return;
    }

    setIsVerified(true);
    setIsVerifying(false);
    
    // Redirect after success
    setTimeout(() => {
      navigate('/guest-portal');
    }, 2000);
  };

  const handleResend = () => {
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    // Reset timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isVerified) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Verification Successful</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your account has been verified. Redirecting to your dashboard...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mb-4">
          {method === 'sms' ? (
            <Smartphone className="h-8 w-8 text-secondary" />
          ) : (
            <Mail className="h-8 w-8 text-secondary" />
          )}
        </div>
        <h1 className="text-xl font-bold text-text-primary">Verify Your Account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          We've sent a 6-digit code to your {method === 'sms' ? 'phone' : 'email'}
        </p>
        <p className="mt-0.5 text-xs text-text-muted font-mono">
          {method === 'sms' ? '+1 (555) •••• 0101' : 'john.smith@email.com'}
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                'h-12 w-12 rounded-xl border bg-surface text-center text-xl font-bold text-text-primary transition-all',
                error
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20'
              )}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-danger">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={isVerifying || otp.join('').length !== 6}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Resend */}
      <div className="text-center space-y-3">
        <p className="text-xs text-text-muted">
          Didn't receive the code?{' '}
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-secondary hover:underline font-medium inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Resend
            </button>
          ) : (
            <span className="text-text-muted">Resend in {resendTimer}s</span>
          )}
        </p>
        <button
          onClick={() => navigate('/guest-portal/auth/login')}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Sign In
        </button>
      </div>

      {/* Security Note */}
      <div className="rounded-lg border border-border bg-surface p-3 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          For your security, this verification link expires in 10 minutes. Never share your code with anyone.
        </p>
      </div>
    </div>
  );
}
