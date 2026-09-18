import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  CreditCard,
  Settings,
  BarChart3,
  Users,
  Shield,
  LogOut,
  Moon,
  Sun,
  LayoutGrid,
  Tag,
  Package,
  Sparkles,
  Clock,
  Rocket,
  Headphones,
  Wallet,
  Megaphone,
  Heart,
  Globe,
  TrendingUp,
  Zap,
  Star,
  Utensils,
  // New icons for missing routes
  UsersRound,
  KeyRound,
  Car,
  Receipt,
  ClipboardList,
  Building2,
  CalendarCheck,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStores';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  navGroups?: NavGroup[];
  collapsed: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const defaultNavGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
      { icon: CalendarDays, label: 'Reservations', path: '/app/reservations' },
      { icon: BedDouble, label: 'Front Desk', path: '/app/reservations/front-desk' },
      { icon: LayoutGrid, label: 'Room Plan', path: '/app/room-plan' },
      { icon: CreditCard, label: 'Billing', path: '/app/billing' },
      { icon: Receipt, label: 'Billing Dashboard', path: '/app/billing/dashboard' },
      { icon: Megaphone, label: 'Sales & Catering', path: '/app/sales-catering' },
      { icon: CalendarCheck, label: 'BEOs', path: '/app/sales-catering/beos' },
      { icon: Building2, label: 'Clients', path: '/app/sales-catering/clients' },
      { icon: ClipboardList, label: 'Events', path: '/app/sales-catering/events' },
      { icon: UsersRound, label: 'Groups', path: '/app/groups' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Tag, label: 'Rates', path: '/app/rates' },
      { icon: Package, label: 'Inventory', path: '/app/inventory' },
      { icon: Users, label: 'Guests', path: '/app/guests' },
      { icon: Sparkles, label: 'Housekeeping', path: '/app/housekeeping' },
      { icon: Clock, label: 'Night Audit', path: '/app/night-audit' },
      { icon: BarChart3, label: 'Reports', path: '/app/reports' },
      { icon: Rocket, label: 'Onboarding', path: '/app/onboarding' },
      { icon: Heart, label: 'Loyalty', path: '/app/loyalty' },
      { icon: Globe, label: 'Channel Manager', path: '/app/channel-manager' },
      { icon: Wallet, label: 'A/R', path: '/app/ar' },
      { icon: Shield, label: 'VCC', path: '/app/vcc' },
      { icon: Utensils, label: 'Meal Plans', path: '/app/meal-plans' },
      { icon: KeyRound, label: 'Keys', path: '/app/keys' },
      { icon: Car, label: 'Parking', path: '/app/parking' },
      { icon: ClipboardList, label: 'Audit Trail', path: '/app/audit-trail' },
      { icon: UsersRound, label: 'Users & Roles', path: '/app/users' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { icon: TrendingUp, label: 'Analytics', path: '/app/marketing/analytics' },
      { icon: Zap, label: 'Automation', path: '/app/marketing/automation-list' },
      { icon: Star, label: 'Templates', path: '/app/marketing/templates' },
    ],
  },
  {
    label: 'Support',
    items: [
      { icon: Headphones, label: 'Help & Support', path: '/app/support' },
      { icon: Settings, label: 'Settings', path: '/app/settings' },
    ],
  },
];

export function Sidebar({
  navGroups = defaultNavGroups,
  collapsed,
  onCollapseChange,
}: SidebarProps) {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { logout, user } = useAuthStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    navGroups.forEach((_, i) => (initial[i] = true));
    return initial;
  });

  const toggleGroup = (idx: number) => {
    if (collapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-surface transition-all duration-300 lg:static',
        collapsed ? 'w-16' : 'w-64',
        'max-lg:-translate-x-full max-lg:data-[open=true]:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-white font-bold">
          U
        </div>
        {!collapsed && (
          <span className="truncate text-lg font-semibold text-primary">Unified PMS</span>
        )}
        <button
          onClick={() => onCollapseChange?.(!collapsed)}
          className={cn(
            'ml-auto hidden h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-surface-elevated lg:flex',
            collapsed && 'mx-auto ml-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, gIdx) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(gIdx)}
                className="flex w-full items-center px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary"
              >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    !expandedGroups[gIdx] && '-rotate-90'
                  )}
                />
              </button>
            )}
            {(!collapsed ? expandedGroups[gIdx] : true) && (
              <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-2')}>
                {' '}
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-md transition-colors',
                        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                        active
                          ? 'bg-secondary/10 text-secondary'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', active && 'text-secondary')} />
                      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Toggle theme' : undefined}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={logout}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && user && (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-medium text-secondary">
              {user.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
