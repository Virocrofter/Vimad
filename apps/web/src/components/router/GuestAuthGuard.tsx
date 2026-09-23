/* apps/web/src/components/router/GuestAuthGuard.tsx */
import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface GuestAuthGuardProps {
  children?: ReactNode;
}

/**
 * Guards guest-portal routes. Guests authenticate via a portal token
 * (stored in sessionStorage after /guest-portal/auth/verify).
 * Redirects to the guest login page when no valid token exists.
 */
export default function GuestAuthGuard({ children }: GuestAuthGuardProps) {
  const portalToken = sessionStorage.getItem('guest_portal_token');

  if (!portalToken) {
    return <Navigate to="/guest-portal/auth/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
