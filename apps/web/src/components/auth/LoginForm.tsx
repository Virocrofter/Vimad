/* apps/web/src/components/auth/LoginForm.tsx */
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading } = useAuth();

  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') ?? '/app/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const result = await login(tenantSlug, email, password);

    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error ?? 'Login failed');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white dark:bg-gray-800 p-8 rounded-lg shadow"
    >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sign In</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Hotel/Organization Slug
        </label>
        <Input
          type="text"
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value)}
          placeholder="your-hotel"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="flex justify-between text-sm">
        <a href="/auth/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </a>
        <a href="/auth/register" className="text-primary hover:underline">
          Create account
        </a>
      </div>
    </form>
  );
}
