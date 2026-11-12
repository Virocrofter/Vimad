import { useLocation } from 'react-router-dom';
/* apps/web/src/components/layout/Topbar.tsx */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Plus, Search, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PropertySwitcher } from './PropertySwitcher';
import { ThemeToggle } from '../theme/themeToggle';
import { useMemo } from 'react';
import { NAV_GROUPS } from '../../lib/navGroups';

export function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
    (user?.email?.[0] ?? 'V').toUpperCase();

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      {/* Title */}
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <HeaderTitle />
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        {/* Live business clock */}
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium tabular-nums text-text-primary">
            {now.toLocaleTimeString('en-ZA', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="text-xs capitalize text-text-muted">
            {now.toLocaleDateString('en-ZA', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="hidden h-8 w-px bg-border md:block" />

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('vimad:open-palette'))}
          className="hidden items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary md:flex"
          aria-label="Search (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
          Search…
          <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('vimad:open-palette'))}
          className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
          aria-label="Quick actions"
          title="Quick actions (⌘K)"
        >
          <Plus className="h-4 w-4" />
        </button>
        <ThemeToggle />

        <PropertySwitcher />

        <div className="h-8 w-px bg-border" />

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-elevated"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-text-primary">
                  {user.firstName ?? ''} {user.lastName ?? ''}
                </span>
                <span className="block text-xs capitalize leading-tight text-text-muted">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {user.firstName ?? ''} {user.lastName ?? ''}
                  </p>
                  <p className="truncate text-xs text-text-muted">{user.email ?? ''}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/app/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderTitle() {
  const { pathname } = useLocation();
  let best = null;
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (pathname === item.to || pathname.startsWith(item.to + '/')) {
        if (!best || item.to.length > best.to.length) best = { ...item, group: g.label };
      }
    }
  }
  return (
    <div>
      {best && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {best.group}
        </p>
      )}
      <h2 className="text-lg font-semibold text-text-primary">{best?.label ?? 'Command Center'}</h2>
    </div>
  );
}
