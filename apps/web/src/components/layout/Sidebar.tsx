/* apps/web/src/components/layout/Sidebar.tsx
 * Job-based sidebar (roadmap audit §5.1, Phase 3 nav restructure).
 * LINKS ONLY — no routes moved, no files renamed, no pages displaced; every
 * destination already exists in the app (see src/lib/navGroups.js).
 * Rollback: restore Sidebar.tsx.pre-nav-restructure.bak (or git checkout).
 * Permissions note: navigation is discoverability, not a security boundary;
 * server-side authorization and tenant/property scoping are unchanged (§9).
 */
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { NAV_GROUPS } from '../../lib/navGroups';
import { cn } from '../../lib/utils';

const COLLAPSED_KEY = 'nav.groups.collapsed';

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({
    setup: true, // More/Setup starts collapsed; everything else open
    ...loadCollapsed(),
  }));
  const [filter, setFilter] = useState('');

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0 || g.label.toLowerCase().includes(q));
  }, [filter]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-64 flex-col border-r border-border bg-surface"
    >
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="text-base font-bold tracking-tight text-text-primary">Vimad</span>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter pages…"
            aria-label="Filter navigation"
            className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => {
          const hasActive = group.items.some((i) => isActive(i.to));
          const isOpen = filter ? true : !collapsed[group.key];
          const Icon = group.icon;
          return (
            <div key={group.key} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide hover:text-text-primary',
                  hasActive && !isOpen ? 'text-primary' : 'text-text-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1">{group.label}</span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')}
                />
              </button>
              {isOpen && (
                <ul className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          'block rounded-md px-2 py-1.5 pl-8 text-[13px]',
                          isActive(item.to)
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="px-2 py-4 text-xs text-text-muted">No pages match this filter.</p>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
