import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}