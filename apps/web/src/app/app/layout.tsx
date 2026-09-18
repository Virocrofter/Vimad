/* apps/web/src/app/app/layout.tsx */
import { Outlet } from 'react-router-dom';
import { GuestAuthGuard } from '../../components/router/GuestAuthGuard';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AppLayout() {
  return (
    <GuestAuthGuard requireAuth={true}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </GuestAuthGuard>
  );
}
