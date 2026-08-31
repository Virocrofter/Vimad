import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Command Center';
    if (path.includes('reservations')) return 'Reservations';
    if (path.includes('front-desk')) return 'Front Desk';
    if (path.includes('room-plan')) return 'Room Plan'; 
    if (path.includes('billing')) return 'Billing';
    if (path.includes('reports')) return 'Reports';
    if (path.includes('guests')) return 'Guests';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('onboarding')) return 'Property Setup';
    return 'Unified PMS';
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper handles mobile slide */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={getTitle()}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}