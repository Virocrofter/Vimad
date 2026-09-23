/* apps/web/src/components/auth/LoginForm.tsx */
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginForm() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const result = await login({ tenantSlug, email, password });

    if (result.success) {
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/app/dashboard', { replace: true });
    } else {
      setLocalError(result.error ?? 'Login failed');
    }
  }

  const displayError = localError ?? error;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign in to Vimad</h2>

      {displayError && <div className="auth-form__error">{displayError}</div>}

      <label htmlFor="tenantSlug">
        Tenant Slug
        <input
          id="tenantSlug"
          type="text"
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value)}
          placeholder="your-hotel"
          required
          autoComplete="organization"
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
          autoComplete="email"
        />
      </label>

      <label htmlFor="password">
        Password
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </label>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
