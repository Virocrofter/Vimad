/* apps/web/src/components/router/GuestAuthGuard.tsx */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface GuestAuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function GuestAuthGuard({
  children,
  requireAuth = true,
  allowedRoles,
}: GuestAuthGuardProps) {
  const { isAuthenticated, isLoading, initialized, user } = useAuthStore();
  const location = useLocation();

  // Wait for auth initialization
  if (!initialized || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated) {
    const redirectTo = new URLSearchParams(location.search).get('redirect') ?? '/app/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Check role permissions
  if (requireAuth && allowedRoles && user?.role) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/app/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
