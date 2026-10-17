/* apps/web/src/components/router/GuestAuthGuard.tsx */
import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getGuestToken } from '../../hooks/guestPortalApi';

interface GuestAuthGuardProps {
  children?: ReactNode;
}

/**
 * Guards guest-portal routes. Guests authenticate via a portal token
 * (stored in sessionStorage after /guest-portal/auth/verify).
 * Redirects to the guest login page when no valid token exists.
 *
 * Reads through guestPortalApi.getGuestToken() — the single source of
 * truth for the token key ('gp_token'). Previously this guard read a
 * different hardcoded key than the rest of the portal, so a valid login
 * passed the guard but the dashboard's own check bounced the guest.
 */
export default function GuestAuthGuard({ children }: GuestAuthGuardProps) {
  const portalToken = getGuestToken();

  if (!portalToken) {
    return <Navigate to="/guest-portal/auth/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
