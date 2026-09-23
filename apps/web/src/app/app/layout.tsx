/* apps/web/src/app/app/layout.tsx */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';

export default function AppLayout() {
  const [collapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} />
      <div className="app-layout__main">
        <Topbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
