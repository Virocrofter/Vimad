/* apps/web/src/components/layout/Sidebar.tsx */
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProps {
  collapsed?: boolean;
}

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/app/reservations', label: 'Reservations', icon: '📅' },
  { to: '/app/room-plan', label: 'Room Plan', icon: '🏨' },
  { to: '/app/guests', label: 'Guests', icon: '👥' },
  { to: '/app/housekeeping', label: 'Housekeeping', icon: '🧹' },
  { to: '/app/billing', label: 'Billing', icon: '💳' },
  { to: '/app/reports', label: 'Reports', icon: '📈' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--open' : ''}`}
      >
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
