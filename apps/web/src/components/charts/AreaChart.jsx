// AreaChart - shared HQ-0 chart primitive (addendum #8: richness of data,
// not decoration). Pure SVG, zero dependencies, theme-driven via CSS vars.
export default function AreaChart({ series, currency, height = 150 }) {
  if (!series?.length) return null;
  const vals = series.map((x) => x.projectedRoomRevenue ?? 0);
  const max = Math.max(...vals, 1);
  const W = 560;
  const H = height;
  const P = { t: 10, r: 8, b: 20, l: 38 };
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const px = (i) => P.l + (i / (series.length - 1)) * iw;
  const py = (v) => P.t + ih - (v / max) * ih;
  const pts = series.map((x, i) => [px(i), py(vals[i])]);
  const line = pts
    .map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1))
    .join(' ');
  const area =
    line +
    ' L' +
    px(series.length - 1).toFixed(1) +
    ' ' +
    (P.t + ih) +
    ' L' +
    P.l +
    ' ' +
    (P.t + ih) +
    ' Z';
  const cur = currency === 'ZAR' ? 'R' : currency || '';
  const fmtY = (v) => cur + (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(v));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const stepX = Math.max(1, Math.ceil(series.length / 7));

  return (
    <svg
      viewBox={'0 0 ' + W + ' ' + H}
      className="mt-3 w-full"
      role="img"
      aria-label="14-day projected room revenue trend"
    >
      {ticks.map((tv) => (
        <g key={'y' + tv}>
          <line
            x1={P.l}
            x2={W - P.r}
            y1={py(tv)}
            y2={py(tv)}
            stroke="var(--border)"
            strokeDasharray="3 4"
            strokeWidth="0.5"
          />
          <text
            x={P.l - 5}
            y={py(tv) + 3}
            textAnchor="end"
            fontSize="9"
            className="fill-[var(--text-muted)]"
          >
            {fmtY(Math.round(tv))}
          </text>
        </g>
      ))}
      <path d={area} className="fill-[var(--primary)] opacity-10" />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinejoin="round" />
      {series.map((x, i) =>
        i % stepX === 0 || i === series.length - 1 ? (
          <text
            key={x.date}
            x={i === series.length - 1 ? W - 2 : px(i)}
            y={H - 6}
            textAnchor={i === series.length - 1 ? 'end' : 'middle'}
            fontSize="8.5"
            className="fill-[var(--text-muted)]"
          >
            {x.date.slice(5)}
          </text>
        ) : null
      )}
      {series.map((x, i) => (
        <circle key={'d' + x.date} cx={px(i)} cy={py(vals[i])} r="6" fill="transparent">
          <title>{x.date + ': ' + cur + (vals[i] ?? 0).toFixed(2)}</title>
        </circle>
      ))}
    </svg>
  );
}
