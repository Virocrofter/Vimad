// Donut - shared HQ-0 chart primitive (addendum #8). Pure SVG, theme-driven.
const TONE_COLORS = {
  ready: 'var(--primary)',
  clean: 'var(--info)',
  dirty: 'var(--warning)',
  in_progress: 'var(--info)',
  inspected: 'var(--primary)',
  ooo: 'var(--danger)',
  oos: 'var(--danger)',
  neutral: 'var(--neutral)',
};

export default function Donut({ segments, center, size = 112 }) {
  const usable = (segments || []).filter((x) => x.value > 0);
  const total = usable.reduce((a, x) => a + x.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        role="img"
        aria-label={usable.map((x) => x.label + ' ' + x.value).join(', ')}
      >
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="14" />
        {total > 0 &&
          usable.map((x) => {
            const frac = x.value / total;
            const el = (
              <circle
                key={x.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={TONE_COLORS[x.tone] || 'var(--neutral)'}
                strokeWidth="14"
                strokeDasharray={Math.max(0, frac * C - 1.5) + ' ' + C}
                strokeDashoffset={-acc * C}
              >
                <title>{x.label + ': ' + x.value}</title>
              </circle>
            );
            acc += frac;
            return el;
          })}
        <text
          x="60"
          y="57"
          textAnchor="middle"
          fontSize="16"
          fontWeight="600"
          className="fill-[var(--text-primary)]"
        >
          {total}
        </text>
        <text x="60" y="71" textAnchor="middle" fontSize="8.5" className="fill-[var(--text-muted)]">
          {center || ''}
        </text>
      </svg>
      <ul className="space-y-1">
        {usable.map((x) => (
          <li key={x.label} className="hq-text-caption flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: TONE_COLORS[x.tone] || 'var(--neutral)' }}
            />
            <span className="text-text-secondary">{x.label}</span>
            <span className="hq-tnum ml-auto pl-3 text-text-primary">{x.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
