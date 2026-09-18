/* apps/web/src/app/auth/layout.tsx */
import { Outlet } from 'react-router-dom';
import { GuestAuthGuard } from '../../components/router/GuestAuthGuard';

export default function AuthLayout() {
  return (
    <GuestAuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vimad</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Property Management System</p>
          </div>
          <Outlet />
        </div>
      </div>
    </GuestAuthGuard>
  );
}
