/* src/app/guest-portal/layout.jsx */
import { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import {
  Home, Calendar, KeyRound, UtensilsCrossed, CreditCard,
  Crown, MessageSquare, User, Menu, X, ChevronRight,
  Bell, LogOut, HelpCircle, Settings, Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuestStore } from './store';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/guest-portal' },
  { id: 'booking', label: 'My Bookings', icon: Calendar, href: '/guest-portal/booking' },
  { id: 'keys', label: 'Digital Key', icon: KeyRound, href: '/guest-portal/keys' },
  { id: 'stay', label: 'In-Stay', icon: UtensilsCrossed, href: '/guest-portal/stay' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '/guest-portal/billing' },
  { id: 'loyalty', label: 'Loyalty', icon: Crown, href: '/guest-portal/loyalty' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/guest-portal/messages' },
  { id: 'profile', label: 'Profile', icon: User, href: '/guest-portal/profile' },
];

const bottomNavItems = [
  { label: 'Help', icon: HelpCircle, href: '/guest-portal/support' },
  { label: 'Settings', icon: Settings, href: '/guest-portal/profile/preferences' },
];

export default function GuestPortalLayout() {
  const location = useLocation();
  const { guest, logout, notifications, sidebarOpen, toggleSidebar } = useGuestStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-surface transition-all duration-300 lg:flex',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <span className="text-sm font-bold text-white">V</span>
          </div>
          {sidebarOpen && (
            <span className="ml-3 text-sm font-bold text-text-primary">Vimad Guest</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {isActive && sidebarOpen && <ChevronRight className="ml-auto h-4 w-4" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-2 space-y-1">
          {bottomNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors',
                !sidebarOpen && 'justify-center'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 transition-colors',
              !sidebarOpen && 'justify-center'
            )}
            title={!sidebarOpen ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm hover:text-text-primary"
        >
          {sidebarOpen ? <X className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-secondary' : 'text-text-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-14">{item.label}</span>
              </a>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-text-muted"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-16 left-4 right-4 rounded-xl border border-border bg-surface shadow-2xl p-4">
            <div className="space-y-1">
              {navItems.slice(5).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              ))}
              <div className="border-t border-border my-2" />
              {bottomNavItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/5"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        'flex-1 transition-all duration-300',
        'lg:ml-16',
        sidebarOpen && 'lg:ml-64',
        'pb-20 lg:pb-0'
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-sm font-semibold text-text-primary lg:hidden">Vimad Guest</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <a
                href="/guest-portal/messages/notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </a>

              {/* User */}
              <a
                href="/guest-portal/profile"
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                  {guest?.firstName?.[0]}{guest?.lastName?.[0]}
                </div>
                <span className="hidden text-sm font-medium text-text-primary sm:block">
                  {guest?.firstName}
                </span>
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
