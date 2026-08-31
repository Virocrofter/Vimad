import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuthStore } from '../../stores/authStores';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

export function LoginForm() {
  const { login, verify2FA, requires2FA, loginStep } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const credForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const twoFAForm = useForm({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  });

  const onCredentials = (data) => {
    login(data.email, data.password);
  };

  const on2FA = (data) => {
    verify2FA(data.code);
  };

  if (requires2FA && loginStep === '2fa') {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
            <ShieldCheck className="h-6 w-6 text-secondary" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-text-primary">Two-Factor Authentication</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        <form onSubmit={twoFAForm.handleSubmit(on2FA)} className="space-y-4">
          <Input
            label="Authentication Code"
            placeholder="000000"
            maxLength={6}
            containerClassName="flex justify-center"
            className="text-center text-2xl tracking-[0.5em] w-48 mx-auto"
            error={twoFAForm.formState.errors.code?.message}
            {...twoFAForm.register('code')}
          />
          <Button type="submit" className="w-full" isLoading={twoFAForm.formState.isSubmitting}>
            Verify
          </Button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your property dashboard</p>
      </div>

      <form onSubmit={credForm.handleSubmit(onCredentials)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@property.com"
          icon={Mail}
          error={credForm.formState.errors.email?.message}
          {...credForm.register('email')}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            error={credForm.formState.errors.password?.message}
            {...credForm.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-text-muted hover:text-text-secondary"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border bg-surface text-secondary focus:ring-ring"
              {...credForm.register('rememberMe')}
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-secondary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={credForm.formState.isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-text-muted">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" className="w-full">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button variant="outline" type="button" className="w-full">
          <svg className="h-4 w-4" viewBox="0 0 21 21">
            <path
              fill="currentColor"
              d="M1 1h9v9H1V1zm1 1v7h7V2H2zm9-1h9v9h-9V1zm1 1v7h7V2h-7zM1 11h9v9H1v-9zm1 1v7h7v-7H2zm9-1h9v9h-9v-9zm1 1v7h7v-7h-7z"
            />
          </svg>
          Microsoft
        </Button>
      </div>

      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-secondary hover:underline">
          Get started
        </Link>
      </p>
    </div>
  );
}
