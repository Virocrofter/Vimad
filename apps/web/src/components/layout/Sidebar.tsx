/* apps/web/src/components/layout/Sidebar.tsx */
import { NavLink } from 'react-router-dom';
import { useState, type ComponentType } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ConciergeBell,
  BedDouble,
  Users,
  UsersRound,
  Brush,
  MoonStar,
  ListTodo,
  KeyRound,
  SquareParking,
  Boxes,
  Tag,
  UtensilsCrossed,
  CreditCard,
  HandCoins,
  Mail,
  Landmark,
  WalletCards,
  Megaphone,
  Gem,
  Briefcase,
  HeartHandshake,
  Radio,
  BarChart3,
  ShieldCheck,
  LifeBuoy,
  Settings,
  Sparkles,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from '../theme/themeToggle';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/app/reservations', label: 'Reservations', icon: CalendarDays, end: true },
      { to: '/app/reservations/front-desk', label: 'Front Desk', icon: ConciergeBell },
      { to: '/app/room-plan', label: 'Room Plan', icon: BedDouble },
      { to: '/app/guests', label: 'Guests', icon: Users },
      { to: '/app/groups', label: 'Groups', icon: UsersRound, end: true },
      { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/app/concierge', label: 'Concierge', icon: Sparkles },
    ],
  },
  {
    title: 'Property',
    items: [
      { to: '/app/housekeeping', label: 'Housekeeping', icon: Brush },
      { to: '/app/night-audit', label: 'Night Audit', icon: MoonStar },
      { to: '/app/keys', label: 'Keys', icon: KeyRound, end: true },
      { to: '/app/parking', label: 'Parking', icon: SquareParking, end: true },
      { to: '/app/inventory', label: 'Inventory', icon: Boxes },
      { to: '/app/rates', label: 'Rates', icon: Tag },
      { to: '/app/meal-plans', label: 'Meal Plans', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/app/billing', label: 'Billing', icon: CreditCard, end: true },
      { to: '/app/billing/payment-requests', label: 'Payment Requests', icon: HandCoins },
      { to: '/app/ar', label: 'Accounts Receivable', icon: Landmark },
      { to: '/app/vcc', label: 'Virtual Cards', icon: WalletCards },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/app/marketing', label: 'Marketing', icon: Megaphone, end: true },
      { to: '/app/loyalty', label: 'Loyalty', icon: Gem },
      // [CRM] Guest 360, segments, follow-ups, corporate accounts
      { to: '/app/crm', label: 'CRM', icon: HeartHandshake, end: true },
      { to: '/app/sales-catering', label: 'Sales & Catering', icon: Briefcase, end: true },
      { to: '/app/channel-manager', label: 'Channel Manager', icon: Radio },
    ],
  },
  {
    title: 'Administration',
    items: [
      // [C1] Chains + property dashboard
      { to: '/app/properties', label: 'Properties', icon: Building2 },
      { to: '/app/reports', label: 'Reports', icon: BarChart3 },
      { to: '/app/users', label: 'Users', icon: ShieldCheck },
      { to: '/app/audit-trail', label: 'Audit Trail', icon: ShieldCheck },
      { to: '/app/settings', label: 'Settings', icon: Settings },
      { to: '/app/settings/email', label: 'Email Center', icon: Mail },
    ],
  },
  {
    // [SUPPORT] Last section, separated from ops/admin — this is the
    // "I'm stuck" entry, not a config surface. Keep it at the bottom.
    title: 'Help',
    items: [{ to: '/app/support', label: 'Support', icon: LifeBuoy, end: true }],
  },
];

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        className="fixed left-4 top-4 z-50 rounded-md border border-border bg-surface p-2 text-text-primary lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface
          transition-all duration-200
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start
        `}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          {!collapsed && <span className="text-lg font-bold text-text-primary">Vimad PMS</span>}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                        }`
                      }
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme toggle — pinned to the sidebar footer */}
        <div className="shrink-0 border-t border-border p-3">
          <div className={collapsed ? 'flex justify-center' : 'px-1'}>
            <ThemeToggle showLabel={!collapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
