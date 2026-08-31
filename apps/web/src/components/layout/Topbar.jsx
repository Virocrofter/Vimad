import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Menu, Bell, Search, ChevronDown, Check, Building2,
  User, Settings, LogOut, X
} from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStores';
import { useNotificationStore } from '../../stores/notificationStore';

export function Topbar({ title, onMenuClick }) {
  const { user, property, availableProperties, switchProperty, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const propRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (propRef.current && !propRef.current.contains(e.target)) setPropOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-6 w-6 text-text-secondary" />
      </button>

      <h1 className="text-lg font-semibold text-text-primary lg:text-xl">{title}</h1>

      {/* Desktop Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search reservations, guests, rooms..."
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-surface-elevated shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                <button onClick={markAllAsRead} className="text-xs text-secondary hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-muted">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface',
                        !n.read && 'bg-secondary/5'
                      )}
                    >
                      <div className={cn(
                        'mt-0.5 h-2 w-2 rounded-full shrink-0',
                        n.type === 'success' && 'bg-accent',
                        n.type === 'warning' && 'bg-warning',
                        n.type === 'danger' && 'bg-danger',
                        n.type === 'info' && 'bg-info',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.read ? 'font-medium text-text-primary' : 'text-text-secondary')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-text-muted truncate">{n.message}</p>
                        <p className="mt-1 text-[10px] text-text-muted">{n.time}</p>
                      </div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-secondary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Property Switcher */}
        {property && (
          <div ref={propRef} className="relative hidden sm:block">
            <button
              onClick={() => setPropOpen(!propOpen)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              <Building2 className="h-4 w-4 text-text-muted" />
              <span className="max-w-[140px] truncate">{property.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </button>
            {propOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-surface-elevated shadow-xl z-50 py-1">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Properties</p>
                {availableProperties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProperty(p.id);
                      setPropOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      p.id === property.id ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-surface'
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="flex-1 text-left truncate">{p.name}</span>
                    {p.id === property.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Avatar */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-medium text-secondary hover:bg-secondary/20"
          >
            {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface-elevated shadow-xl z-50 py-1">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
                <p className="text-xs text-text-muted">{user?.email || 'user@property.com'}</p>
              </div>
              <Link
                to="/app/settings"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-surface"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-16 border-b border-border bg-surface p-3 md:hidden z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button onClick={() => setSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}