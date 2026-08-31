import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-gradient flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-semibold text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-white">
              U
            </div>
            Unified PMS
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-8 shadow-lg">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-sm text-text-muted">
          © 2026 Unified PMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
