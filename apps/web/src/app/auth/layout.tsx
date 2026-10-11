/* apps/web/src/app/auth/layout.tsx */
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  // Staff auth pages must be public — never wrap in GuestAuthGuard,
  // which redirects to /guest-portal/auth/login.
  return <Outlet />;
}
