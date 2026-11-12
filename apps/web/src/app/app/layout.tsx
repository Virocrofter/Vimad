/* apps/web/src/app/app/layout.tsx */
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { StatusBanner } from '../../components/StatusBanner';
import CommandPalette from '../../components/layout/CommandPalette';

function ShellCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('vimad:open-palette', h);
    return () => window.removeEventListener('vimad:open-palette', h);
  }, []);
  return <CommandPalette open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} />;
}

export default function AppLayout() {
  const [collapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <StatusBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <OfflineBanner />
          <Outlet />
        </main>
        <ShellCommandPalette />
      </div>
    </div>
  );
}
