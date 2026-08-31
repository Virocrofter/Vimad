/* src/app/admin/components/AdminSidebar.jsx */
import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield, Building2, ToggleLeft, Users, BarChart3, Settings,
  Activity, LogOut, ChevronLeft, ChevronRight, LayoutDashboard,
  Megaphone, Database, HardDrive, HeartPulse, Gauge, Eye,
  CreditCard, FileText, RefreshCw, AlertTriangle, DollarSign,
  Landmark, Lock, Globe, CircleDollarSign, UserPlus, Sparkles,
  TicketCheck, MessageSquare, FileBarChart, Download, Plug,
  Flag, ChevronDown, ChevronRightIcon, Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useState } from 'react';

/* ─── Navigation Groups ─── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Tenants', icon: Building2, exact: true },
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/audit', label: 'Audit Log', icon: Activity },
      { to: '/admin/backups', label: 'Backups & DR', icon: Database },
      { to: '/admin/health', label: 'System Health', icon: HeartPulse },
      { to: '/admin/profiler', label: 'Profiler', icon: Gauge },
      { to: '/admin/shadow', label: 'Shadow Mode', icon: Eye },
    ],
  },
  {
    label: 'Billing & Revenue',
    items: [
      { to: '/admin/billing', label: 'Billing Dashboard', icon: CreditCard },
      { to: '/admin/billing/invoices', label: 'Invoices', icon: FileText },
      { to: '/admin/billing/credit-notes', label: 'Credit Notes', icon: DollarSign },
      { to: '/admin/billing/subscriptions', label: 'Subscriptions', icon: RefreshCw },
      { to: '/admin/billing/dunning', label: 'Dunning', icon: AlertTriangle },
      { to: '/admin/billing/revenue', label: 'Revenue', icon: Landmark },
      { to: '/admin/finances', label: 'Finances', icon: CircleDollarSign },
    ],
  },
  {
    label: 'Tenants & Access',
    items: [
      { to: '/admin/rbac', label: 'RBAC & Roles', icon: Lock },
      { to: '/admin/regions', label: 'Regions', icon: Globe },
      { to: '/admin/quotas', label: 'Quotas', icon: CircleDollarSign },
      { to: '/admin/onboarding', label: 'Onboarding', icon: UserPlus },
      { to: '/admin/demo-access', label: 'Demo Access', icon: Sparkles },
      { to: '/admin/users', label: 'Admin Users', icon: Users },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/ticket', label: 'Tickets', icon: TicketCheck },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
      { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
      { to: '/admin/data-export', label: 'Data Export', icon: Download },
      { to: '/admin/integrations', label: 'Integrations', icon: Plug },
      { to: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/admin/security', label: 'Security', icon: Shield },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ─── Nav Item ─── */
function SidebarItem({ to, label, icon: Icon, exact, collapsed }) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={exact}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-danger/10 text-danger'
          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-danger')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

/* ─── Collapsible Group ─── */
function NavGroup({ group, collapsed, hasActiveChild }) {
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  if (collapsed) {
    // When collapsed, show all items flat (no grouping)
    return (
      <div className="space-y-1">
        {group.items.map((item) => (
          <SidebarItem key={item.to} {...item} collapsed={true} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
          hasActiveChild ? 'text-danger' : 'text-text-muted hover:text-text-secondary'
        )}
      >
        <span>{group.label}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-2">
          {group.items.map((item) => (
            <SidebarItem key={item.to} {...item} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-surface transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
          <Shield className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Super Admin</p>
            <p className="text-[10px] text-text-muted">Vimad Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-2 py-4 space-y-3">
        {navGroups.map((group) => {
          const hasActiveChild = group.items.some((item) =>
            item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
          );
          return (
            <NavGroup
              key={group.label}
              group={group}
              collapsed={collapsed}
              hasActiveChild={hasActiveChild}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
        <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-danger/10 hover:text-danger transition-colors">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}