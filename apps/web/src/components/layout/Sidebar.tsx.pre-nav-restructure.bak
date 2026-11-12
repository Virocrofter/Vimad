/* apps/web/src/components/layout/Sidebar.tsx */
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, type ComponentType } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ConciergeBell,
  BedDouble,
  Users,
  UsersRound,
  ListTodo,
  Sparkles,
  Brush,
  LayoutGrid,
  SlidersHorizontal,
  Activity,
  Smartphone,
  MoonStar,
  KeyRound,
  SquareParking,
  Boxes,
  Tag,
  Calculator,
  UtensilsCrossed,
  CreditCard,
  HandCoins,
  ReceiptText,
  WalletCards,
  Megaphone,
  Gem,
  HeartHandshake,
  Briefcase,
  Radio,
  Building2,
  Network,
  Fingerprint,
  CalendarCheck,
  Landmark,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Rocket,
  Crown,
  Settings,
  Mail,
  LifeBuoy,
  Menu,
  X,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

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
      { to: '/app/housekeeping/space-status', label: 'Space Status', icon: LayoutGrid },
      { to: '/app/housekeeping/rules', label: 'HK Rules', icon: SlidersHorizontal },
      { to: '/app/housekeeping/activity', label: 'HK Activity', icon: Activity },
      { to: '/app/housekeeping/mobile', label: 'HK Mobile', icon: Smartphone },
      { to: '/app/night-audit', label: 'Night Audit', icon: MoonStar },
      { to: '/app/keys', label: 'Keys', icon: KeyRound, end: true },
      { to: '/app/parking', label: 'Parking', icon: SquareParking, end: true },
      { to: '/app/inventory', label: 'Inventory', icon: Boxes },
      { to: '/app/rates', label: 'Rates', icon: Tag },
      { to: '/app/rates/pricing', label: 'Pricing', icon: Calculator },
      { to: '/app/meal-plans', label: 'Meal Plans', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/app/billing', label: 'Billing', icon: CreditCard, end: true },
      { to: '/app/billing/payment-requests', label: 'Payment Requests', icon: HandCoins },
      { to: '/app/ar', label: 'Accounts Receivable', icon: ReceiptText },
      { to: '/app/vcc', label: 'Virtual Cards', icon: WalletCards },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/app/marketing', label: 'Marketing', icon: Megaphone, end: true },
      { to: '/app/loyalty', label: 'Loyalty', icon: Gem },
      { to: '/app/crm', label: 'CRM', icon: HeartHandshake, end: true },
      { to: '/app/sales-catering', label: 'Sales & Catering', icon: Briefcase, end: true },
      { to: '/app/channel-manager', label: 'Channel Manager', icon: Radio },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/app/properties', label: 'Properties', icon: Building2 },
      { to: '/app/chain-dashboard', label: 'Chain Dashboard', icon: Network },
      { to: '/app/guest-identity', label: 'Shared Guests', icon: Fingerprint },
      { to: '/app/central-reservations', label: 'Central Reservations', icon: CalendarCheck },
      { to: '/app/chain-billing', label: 'Chain Billing', icon: Landmark },
      { to: '/app/reports', label: 'Reports', icon: BarChart3 },
      { to: '/app/users', label: 'Users', icon: ShieldCheck },
      { to: '/app/audit-trail', label: 'Audit Trail', icon: ScrollText },
      { to: '/app/onboarding', label: 'Onboarding', icon: Rocket },
      { to: '/app/chain-loyalty', label: 'Chain Loyalty', icon: Crown },
      { to: '/app/settings', label: 'Settings', icon: Settings },
      { to: '/app/settings/email', label: 'Email Center', icon: Mail },
    ],
  },
  {
    title: 'Help',
    items: [
      { to: '/app/support', label: 'Support', icon: LifeBuoy, end: true },
      { to: '/app/comms', label: 'Comms Desk', icon: Mail, end: true },
    ],
  },
];

export default function Sidebar({ collapsed: collapsedProp = false }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('vimad.sidebar.collapsed');
    return saved !== null ? saved === '1' : collapsedProp;
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('vimad.sidebar.sections') ?? '{}');
    } catch {
      return {};
    }
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('vimad.sidebar.collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('vimad.sidebar.sections', JSON.stringify(openSections));
  }, [openSections]);

  const isOpen = (title: string) => openSections[title] ?? true;

  const toggleSection = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !isOpen(title) }));

  const hasActiveRoute = (section: NavSection) =>
    section.items.some((item) => location.pathname.startsWith(item.to));

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
          transition-[width] duration-200
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start
        `}
      >
        {/* Brand row + collapse control */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
          {collapsed ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
              V
            </span>
          ) : (
            <span className="truncate text-lg font-bold text-text-primary">Vimad PMS</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3">
          {collapsed ? (
            /* Collapsed: flat icon rail with hover tooltips */
            <div className="space-y-0.5">
              {NAV_SECTIONS.flatMap((section) => section.items).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center rounded-md p-2 transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                      }`
                    }
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          ) : (
            /* Expanded: departmental accordions */
            NAV_SECTIONS.map((section) => {
              const open = isOpen(section.title) || mobileOpen || hasActiveRoute(section);
              return (
                <div key={section.title}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
                  >
                    <span>{section.title}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="rounded-full bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium leading-none">
                        {section.items.length}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          open ? '' : '-rotate-90'
                        }`}
                      />
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-200 ${
                      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-0.5 space-y-0.5">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              end={item.end}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary'
                                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                                }`
                              }
                            >
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </aside>
    </>
  );
}
