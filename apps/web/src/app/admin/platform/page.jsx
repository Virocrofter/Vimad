import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from './api';
import { KpiStrip } from '../billing/kpi';
import '../billing/billing-shell.css';
import '../billing/billing-pages.css';

const SECTIONS = [
  {
    key: 'announcements',
    title: 'Announcements',
    desc: 'Broadcast platform news to operators and tenants - publish, schedule, target.',
  },
  {
    key: 'audit',
    title: 'Audit Log',
    desc: 'Every administrative action with actor, target and before/after - searchable and exportable.',
  },
  {
    key: 'backups',
    title: 'Backups & DR',
    desc: 'Backup runs across destinations, restore-test evidence, retention and DR drills.',
  },
  {
    key: 'health',
    title: 'System Health',
    desc: 'Service status, active incidents, uptime and degraded-service alerts.',
  },
  {
    key: 'profiler',
    title: 'Profiler',
    desc: 'Slow queries and endpoint hotspots before tenants feel them.',
  },
  {
    key: 'shadow',
    title: 'Shadow Mode',
    desc: 'Shadow sessions, dual-write comparisons and safe rollout verification.',
  },
];

export default function PlatformHome() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    Promise.all([api.getKpis().catch(() => null), api.getHealth().catch(() => null)]).then(
      ([k, h]) => {
        const kd = k && k.data ? k.data : {};
        const hv = h && h.data ? h.data : {};
        setKpis([
          { l: 'Tenants', v: kd.totalTenants?.value ?? '—' },
          { l: 'MRR', v: kd.mrr ? 'R ' + Number(kd.mrr.value).toLocaleString('en-ZA') : '—' },
          { l: 'System status', v: hv.status ? String(hv.status).toUpperCase() : '—' },
          { l: 'Active users', v: kd.activeUsers?.value ?? '—' },
        ]);
      }
    );
  }, []);

  return (
    <div className="vb2-wrap">
      {kpis ? (
        <KpiStrip items={kpis} />
      ) : (
        <div className="vb2-skel">
          <div className="vb2-skel-bar" style={{ width: '60%' }} />
        </div>
      )}

      <div className="vb2-section">Modules</div>
      <div className="vb-card-grid">
        {SECTIONS.map((s) => (
          <button type="button" key={s.key} className="vb-nav-card" onClick={() => navigate(s.key)}>
            <span className="vb-nav-text">
              <span className="vb-nav-title">
                {s.title}
                <svg
                  className="vb-nav-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
              <span className="vb-nav-desc">{s.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
