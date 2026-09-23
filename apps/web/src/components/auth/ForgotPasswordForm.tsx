/* apps/web/src/components/auth/ForgotPasswordForm.tsx */
import { useState, type FormEvent } from 'react';
import { apiPost, ApiError } from '../../api/client';

interface ForgotPasswordData {
  email: string;
  tenantSlug: string;
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data: ForgotPasswordData = { email, tenantSlug };
      await apiPost('/auth/forgot-password', data);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="auth-form__success">
        <h2>Check your email</h2>
        <p>If an account exists for {email}, a password reset link has been sent.</p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Reset your password</h2>
      <p>Enter your email and tenant slug to receive a reset link.</p>

      {error && <div className="auth-form__error">{error}</div>}

      <label htmlFor="tenantSlug">
        Tenant Slug
        <input
          id="tenantSlug"
          type="text"
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value)}
          placeholder="your-hotel"
          required
        />
      </label>

      <label htmlFor="email">
        Email
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
