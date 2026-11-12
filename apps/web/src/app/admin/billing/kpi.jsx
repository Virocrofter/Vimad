import React from 'react';

const I = {
  trend: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  wallet: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
};

const TONES = [
  { color: '#6366f1', bg: 'rgba(99,102,241,0.13)', icon: I.trend },
  { color: '#10b981', bg: 'rgba(16,185,129,0.13)', icon: I.wallet },
  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.13)', icon: I.users },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', icon: I.alert },
  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.13)', icon: I.activity },
  { color: '#f43f5e', bg: 'rgba(244,63,94,0.13)', icon: I.percent },
];

export function KpiStrip({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="vb2-kpi-strip">
      {items.map((k, i) => {
        const tone =
          k.toneIndex != null ? TONES[k.toneIndex % TONES.length] : TONES[i % TONES.length];
        return (
          <div className="vb2-kpi2" key={k.label || k.l || i}>
            <span className="vb2-kpi2-icon" style={{ color: tone.color, background: tone.bg }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tone.icon}
              </svg>
            </span>
            <span className="vb2-kpi2-body">
              <span className="vb2-kpi2-label">{k.label || k.l}</span>
              <span className="vb2-kpi2-value">{k.value != null ? k.value : (k.v ?? '—')}</span>
              {k.sub ? (
                <span className="vb2-muted" style={{ fontSize: 12 }}>
                  {k.sub}
                </span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
