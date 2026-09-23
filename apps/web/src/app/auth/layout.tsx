/* apps/web/src/app/auth/layout.tsx */
import { Outlet } from 'react-router-dom';
import GuestAuthGuard from '../../components/router/GuestAuthGuard';

export default function AuthLayout() {
  return (
    <GuestAuthGuard>
      <Outlet />
    </GuestAuthGuard>
  );
}
