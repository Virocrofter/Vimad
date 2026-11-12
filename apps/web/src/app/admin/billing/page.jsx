import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSummary } from './api';

const fmtZAR = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '\u2014'
    : `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ICONS = {
  invoices: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  ),
  'credit-notes': (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  ),
  dunning: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  revenue: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  subscriptions: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L17 8" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L7 16" />
      <path d="M7 22v-6h6" />
    </svg>
  ),
  finances: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  contracts: (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
};

const SECTIONS = [
  {
    key: 'invoices',
    title: 'Invoices',
    desc: 'Create, send and reconcile platform invoices. Track payments, overdue balances and credit application.',
  },
  {
    key: 'contracts',
    title: 'Contracts',
    desc: 'Tenant contracts \u2014 terms, discounts with approval, renewal alerts and full amendment audit trail.',
  },
  {
    key: 'dunning',
    title: 'Dunning',
    desc: 'Automated reminder schedules for overdue invoices, escalation levels and payment recovery tracking.',
  },
  {
    key: 'revenue',
    title: 'Revenue',
    desc: 'MRR, ARR, expansion, contraction and churn \u2014 revenue movement with period-over-period deltas.',
  },
  {
    key: 'finances',
    title: 'Finances',
    desc: 'Payouts, processing fees, cost to serve per tenant and gross margin view.',
  },
  {
    key: 'credit-notes',
    title: 'Credit Notes',
    desc: 'Issue credit notes against paid or open invoices with full audit trail and VAT handling.',
  },
];

export default function BillingHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    getSummary()
      .then((j) => {
        if (j) setSummary(j);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const kpis = [
    { label: 'MRR', value: fmtZAR(summary?.mrr), delta: summary?.mrrDeltaPct },
    { label: 'ARR', value: fmtZAR(summary?.arr) },
    { label: 'Active tenants', value: summary?.activeTenants ?? '\u2014' },
    {
      label: 'Overdue',
      value: fmtZAR(summary?.overdueAmount),
      delta: summary?.overdueDeltaPct,
      invert: true,
    },
    {
      label: 'Collection rate',
      value:
        summary?.collectionRatePct != null
          ? `${Number(summary.collectionRatePct).toFixed(1)}%`
          : '\u2014',
    },
  ];

  return (
    <div className="vb-home">
      <div className="vb-home-head">
        <div>
          <div className="vb-home-title">Billing</div>
          <div className="vb-home-sub">
            Platform revenue, invoices, subscriptions and collections — one workspace.
          </div>
        </div>
        <div className="vb-quick-row">
          <button type="button" className="vb-quick-btn" onClick={() => navigate('invoices')}>
            Create invoice
          </button>
          <button
            type="button"
            className="vb-quick-btn primary"
            onClick={() => navigate('contracts')}
          >
            Manage contracts
          </button>
        </div>
      </div>

      <div className="vb-kpi-row">
        {kpis.map((k) => (
          <div className="vb-kpi" key={k.label}>
            <span className="vb-kpi-label">{k.label}</span>
            <span className="vb-kpi-value">{k.value}</span>
            {k.delta != null && (
              <span
                className={`vb-kpi-delta ${k.invert ? (k.delta > 0 ? 'down' : 'up') : k.delta >= 0 ? 'up' : 'down'}`}
              >
                {k.delta >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(Number(k.delta)).toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>

      <span className="vb-section-title">Modules</span>

      <div className="vb-card-grid">
        {SECTIONS.map((s) => (
          <button type="button" key={s.key} className="vb-nav-card" onClick={() => navigate(s.key)}>
            <span className="vb-nav-icon">{ICONS[s.key]}</span>
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
