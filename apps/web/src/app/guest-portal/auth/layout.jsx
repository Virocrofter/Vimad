/* src/app/guest-portal/auth/layout.jsx */
import { Outlet } from 'react-router-dom';
import { Bed } from 'lucide-react';

export default function GuestAuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
            <Bed className="h-4 w-4 text-secondary" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Vimad Guest Portal</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-text-muted">© 2026 Vimad. Secure, encrypted connection.</p>
      </footer>
    </div>
  );
}
