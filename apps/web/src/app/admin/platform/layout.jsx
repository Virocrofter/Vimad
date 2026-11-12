import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../billing/billing-shell.css';

const BASE = '/admin/platform';

const TITLES = {
  announcements: ['Announcements', 'Platform-wide operator and tenant announcements'],
  audit: ['Audit Log', 'Platform audit trail - every administrative action'],
  backups: ['Backups & DR', 'Backup runs, restore tests and disaster recovery'],
  health: ['System Health', 'Service status, incidents and uptime'],
  profiler: ['Profiler', 'Slow queries and performance hotspots'],
  shadow: ['Shadow Mode', 'Shadow sessions and dual-write monitoring'],
};

export default function PlatformLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname.replace(/\/+$/, '');
  const isNested = path !== BASE;
  const childKey = isNested ? path.slice(BASE.length + 1).split('/')[0] : null;
  const [title, subtitle] = TITLES[childKey] || ['Platform', ''];

  useEffect(() => {
    if (!isNested) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isNested]);

  useEffect(() => {
    if (!isNested) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') navigate(BASE);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNested, navigate]);

  if (!isNested) return <Outlet />;

  return (
    <div className="vb-drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <header className="vb-drawer-header">
        <button type="button" className="vb-back-btn" onClick={() => navigate(BASE)}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="vb-title-block">
          <span className="vb-title">{title}</span>
          {subtitle ? <span className="vb-subtitle">{subtitle}</span> : null}
        </div>
        <span className="vb-crumbs">
          Platform&nbsp;/&nbsp;<b>{title}</b>
        </span>
      </header>
      <main className="vb-drawer-body">
        <Outlet />
      </main>
    </div>
  );
}
