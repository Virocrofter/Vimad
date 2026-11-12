import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api';
import { KpiStrip } from '../kpi';
import '../billing-pages.css';

const fmt = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : 'R ' +
      Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCompact = (n) => {
  const v = Number(n);
  if (n == null || Number.isNaN(v)) return '—';
  if (Math.abs(v) >= 1000000) return 'R ' + (v / 1000000).toFixed(2) + 'm';
  if (Math.abs(v) >= 1000) return 'R ' + (v / 1000).toFixed(1) + 'k';
  return 'R ' + Math.round(v);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const labelShort = (l) => {
  if (!l) return '';
  if (l.length === 7) return (MONTHS[Number(l.slice(5)) - 1] || l) + " '" + l.slice(2, 4);
  return l;
};

const C = {
  primary: '#6366f1',
  forecast: '#818cf8',
  new: '#22c55e',
  expansion: '#14b8a6',
  contraction: '#f59e0b',
  churn: '#ef4444',
  muted: '#8b93a7',
  grid: 'rgba(148,163,184,0.14)',
};

const GRANS = [
  { key: 'daily', label: 'Daily · 30 days' },
  { key: 'weekly', label: 'Weekly · 12 weeks' },
  { key: 'monthly', label: 'Monthly · 12 months' },
];

export default function RevenuePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [gran, setGran] = useState('monthly');

  useEffect(() => {
    let live = true;
    api
      .getAnalytics()
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);

  const kpis = useMemo(() => {
    if (!data)
      return [
        { l: 'MRR', v: '—' },
        { l: 'ARR', v: '—' },
        { l: 'Pipeline MRR', v: '—' },
        { l: 'Net new (90d)', v: '—' },
      ];
    return [
      { l: 'MRR', v: fmt(data.currentMrr) },
      { l: 'ARR', v: fmt(Number(data.currentMrr || 0) * 12) },
      {
        l: 'Pipeline MRR',
        v: fmt(data.pipeline?.pipelineMrr),
        sub: (data.pipeline?.trialCount ?? 0) + ' trialing',
      },
      {
        l: 'Net new (90d)',
        v:
          (data.movement?.net ?? 0) >= 0
            ? '+' + fmtCompact(data.movement.net)
            : '−' + fmtCompact(Math.abs(data.movement.net)),
      },
    ];
  }, [data]);

  const points = data?.series?.[gran] || [];
  const forecast = gran === 'monthly' ? data?.forecast || [] : [];

  return (
    <div className="vb2-wrap">
      <KpiStrip items={kpis} />

      <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <div className="vb2-section" style={{ margin: 0 }}>
            MRR — actual & forecast
          </div>
          <div className="vb2-tabs" style={{ marginLeft: 'auto' }}>
            {GRANS.map((g) => (
              <button
                key={g.key}
                className={'vb2-tab' + (gran === g.key ? ' active' : '')}
                onClick={() => setGran(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load analytics</div>
            <div>{error}</div>
          </div>
        )}
        {!error && !data && (
          <div className="vb2-skel">
            <div className="vb2-skel-bar" style={{ width: '82%' }} />
          </div>
        )}
        {!error && data && points.length > 0 && (
          <SeriesChart points={points} forecast={forecast} height={320} />
        )}
      </div>

      <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <div className="vb2-section" style={{ margin: 0 }}>
            MRR movement — last 90 days
          </div>
          {data?.movement && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <Legend color={C.new} label={'New ' + sgn(data.movement.newMrr)} />
              <Legend color={C.expansion} label={'Expansion ' + sgn(data.movement.expansionMrr)} />
              <Legend
                color={C.contraction}
                label={'Contraction −' + fmtCompact(data.movement.contractionMrr).slice(1)}
              />
              <Legend
                color={C.churn}
                label={'Churn −' + fmtCompact(data.movement.churnedMrr).slice(1)}
              />
            </div>
          )}
        </div>
        {!data ? (
          <div className="vb2-skel">
            <div className="vb2-skel-bar" style={{ width: '70%' }} />
          </div>
        ) : (
          <MovementBars months={lastMonths(data.monthlyMovement || [], 6)} />
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 14,
        }}
      >
        <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
          <div className="vb2-section" style={{ marginBottom: 14 }}>
            Pipeline
          </div>
          {!data ? (
            <div className="vb2-skel">
              <div className="vb2-skel-bar" style={{ width: '60%' }} />
            </div>
          ) : (
            <>
              <HBar label="Draft contracts" value={data.pipeline?.draftMrr} color={C.primary} />
              <HBar
                label="Pending signature"
                value={data.pipeline?.pendingMrr}
                color={C.forecast}
              />
              <HBar
                label="Trialing (count)"
                value={data.pipeline?.trialCount}
                color="#38bdf8"
                isCount
              />
            </>
          )}
        </div>
        <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
          <div className="vb2-section" style={{ marginBottom: 14 }}>
            MRR mix
          </div>
          {!data ? (
            <div className="vb2-skel">
              <div className="vb2-skel-bar" style={{ width: '60%' }} />
            </div>
          ) : (
            (data.mix || []).map((m) => (
              <HBar
                key={m.name}
                label={m.name}
                value={m.mrr}
                color={m.name === 'Under contract' ? C.new : C.muted}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function sgn(n) {
  const v = Number(n) || 0;
  return (v >= 0 ? '+' : '−') + fmtCompact(Math.abs(v)).slice(1);
}

function lastMonths(list, n) {
  const map = Object.fromEntries(list.map((m) => [m.month, m]));
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    out.push(map[key] || { month: key, new: 0, expansion: 0, contraction: 0, churned: 0 });
  }
  return out;
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function HBar({ label, value, color, isCount }) {
  const v = Number(value) || 0;
  return (
    <div style={{ marginBottom: 13 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 650 }}>{isCount ? v : fmt(v)}</span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: 'rgba(148,163,184,0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: barWidth(value) + '%',
            borderRadius: 999,
            background: color,
            transition: 'width 400ms ease',
          }}
        />
      </div>
    </div>
  );
}

function barWidth(v) {
  const n = Number(v) || 0;
  if (n <= 0) return 2;
  return Math.max(5, Math.min(100, (Math.log10(n + 1) / 5) * 100 + 8));
}

function SeriesChart({ points, forecast, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || points.length === 0) return undefined;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth,
        H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const padL = 56,
        padR = 18,
        padT = 18,
        padB = 30;
      const iw = W - padL - padR,
        ih = H - padT - padB;
      const all = [...points, ...forecast];
      const values = all.map((p) => Number(p.mrr) || 0);
      const max = Math.max(...values, 1) * 1.14;
      const n = all.length;
      const x = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
      const y = (v) => padT + ih - (Math.max(0, v) / max) * ih;

      ctx.font = '10.5px system-ui, sans-serif';
      for (let g = 0; g <= 4; g++) {
        const gv = (max * g) / 4,
          gy = y(gv);
        ctx.strokeStyle = C.grid;
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(W - padR, gy);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmtCompact(gv), padL - 8, gy);
      }

      const actualPts = points.map((p, i) => ({ x: x(i), y: y(p.mrr) }));
      const allPts = all.map((p, i) => ({ x: x(i), y: y(p.mrr) }));
      const trace = (pts, from, to) => {
        ctx.moveTo(pts[from].x, pts[from].y);
        for (let i = from; i < to; i++) {
          const p0 = pts[i - 1] || pts[i],
            p1 = pts[i],
            p2 = pts[i + 1],
            p3 = pts[i + 2] || p2;
          ctx.bezierCurveTo(
            p1.x + (p2.x - p0.x) / 6,
            p1.y + (p2.y - p0.y) / 6,
            p2.x - (p3.x - p1.x) / 6,
            p2.y - (p3.y - p1.y) / 6,
            p2.x,
            p2.y
          );
        }
      };

      if (forecast.length > 0) {
        const s0 = points.length - 1;
        ctx.beginPath();
        trace(allPts, s0, allPts.length - 1);
        ctx.lineTo(allPts[allPts.length - 1].x, padT + ih);
        ctx.lineTo(allPts[s0].x, padT + ih);
        ctx.closePath();
        const fg = ctx.createLinearGradient(0, padT, 0, padT + ih);
        fg.addColorStop(0, 'rgba(129,140,248,0.14)');
        fg.addColorStop(1, 'rgba(129,140,248,0.01)');
        ctx.fillStyle = fg;
        ctx.fill();
      }

      ctx.beginPath();
      trace(actualPts, 0, actualPts.length - 1);
      ctx.lineTo(actualPts[actualPts.length - 1].x, padT + ih);
      ctx.lineTo(actualPts[0].x, padT + ih);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
      grad.addColorStop(0, 'rgba(99,102,241,0.38)');
      grad.addColorStop(1, 'rgba(99,102,241,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      trace(actualPts, 0, actualPts.length - 1);
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      if (forecast.length > 0) {
        ctx.beginPath();
        trace(allPts, points.length - 1, allPts.length - 1);
        ctx.strokeStyle = 'rgba(129,140,248,0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        const dx = x(points.length - 1);
        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(dx, padT);
        ctx.lineTo(dx, padT + ih);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.textBaseline = 'middle';
      all.forEach((p, i) => {
        if (i < points.length) {
          ctx.beginPath();
          ctx.arc(x(i), y(p.mrr), 3, 0, Math.PI * 2);
          ctx.fillStyle = C.primary;
          ctx.fill();
        }
        if (i % Math.ceil(n / 14) === 0) {
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(labelShort(p.label), x(i), padT + ih + 8);
        }
      });

      // end-of-line value labels
      const lastA = allPts[points.length - 1];
      ctx.fillStyle = C.primary;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText(fmtCompact(points[points.length - 1].mrr), lastA.x - 2, lastA.y - 8);
      if (forecast.length > 0) {
        const lastF = allPts[allPts.length - 1];
        ctx.fillStyle = C.forecast;
        ctx.fillText(
          fmtCompact(forecast[forecast.length - 1].mrr),
          Math.min(lastF.x, W - padR + 14),
          lastF.y - 8
        );
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [points, forecast, height]);

  return <canvas ref={ref} style={{ width: '100%', height: height || 300, display: 'block' }} />;
}

function MovementBars({ months }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || months.length === 0) return undefined;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth,
        H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      const padL = 52,
        padR = 10,
        padT = 12,
        padB = 28;
      const iw = W - padL - padR,
        ih = H - padT - padB;
      const keys = [
        ['new', C.new],
        ['expansion', C.expansion],
        ['contraction', C.contraction],
        ['churned', C.churn],
      ];
      const max =
        Math.max(...months.flatMap((m) => keys.map(([k]) => Math.abs(m[k] || 0))), 1) * 1.15;
      const slot = iw / months.length;
      const barW = Math.min(26, (slot - 16) / keys.length);
      ctx.font = '10.5px system-ui, sans-serif';
      for (let g = 0; g <= 3; g++) {
        const gv = (max * g) / 3,
          gy = padT + ih - (gv / max) * ih;
        ctx.strokeStyle = C.grid;
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(W - padR, gy);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmtCompact(gv), padL - 6, gy);
      }
      const zeroY = padT + ih;
      months.forEach((m, mi) => {
        const cx = padL + slot * mi + slot / 2;
        keys.forEach(([k, color], ki) => {
          const v = Math.abs(m[k] || 0);
          if (v <= 0) return;
          const h = (v / max) * ih;
          const bx = cx - (keys.length * barW) / 2 + ki * barW;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(bx, zeroY - h, barW - 3, h, 3);
          ctx.fill();
        });
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(labelShort(m.month), cx, zeroY + 8);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [months]);
  return <canvas ref={ref} style={{ width: '100%', height: 250, display: 'block' }} />;
}
