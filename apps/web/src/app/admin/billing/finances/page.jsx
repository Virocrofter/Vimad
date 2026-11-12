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

const C = { primary: '#6366f1', fee: '#f59e0b', muted: '#8b93a7', grid: 'rgba(148,163,184,0.14)' };

export default function FinancesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api
      .getFinances()
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
    const k = data?.kpis;
    return [
      { l: 'Collected (30d)', v: k ? fmt(k.collected) : '—' },
      {
        l: 'Processing fees',
        v: k ? fmt(k.fees) : '—',
        sub: k && k.collected > 0 ? ((k.fees / k.collected) * 100).toFixed(2) + '% of volume' : '',
      },
      { l: 'Net payouts', v: k ? fmt(k.net) : '—' },
      { l: 'Gross margin', v: k && k.marginPct != null ? k.marginPct.toFixed(1) + '%' : '—' },
    ];
  }, [data]);

  return (
    <div className="vb2-wrap">
      <KpiStrip items={kpis} />

      <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div className="vb2-section" style={{ margin: 0 }}>
            Payment volume — last 30 days
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: C.muted,
              marginLeft: 'auto',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: C.primary }} />{' '}
            volume
            <span
              style={{ width: 10, height: 10, borderRadius: 3, background: C.fee, marginLeft: 8 }}
            />{' '}
            fees
          </span>
        </div>
        {error && (
          <div className="vb2-empty">
            <div className="vb2-empty-title">Could not load finances</div>
            <div>{error}</div>
          </div>
        )}
        {!error && !data && (
          <div className="vb2-skel">
            <div className="vb2-skel-bar" style={{ width: '82%' }} />
          </div>
        )}
        {!error && data && <VolumeChart volume={data.volume || []} />}
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
            Processing fees by channel
          </div>
          {!data ? (
            <div className="vb2-skel">
              <div className="vb2-skel-bar" style={{ width: '60%' }} />
            </div>
          ) : (data.channels || []).length === 0 ? (
            <div className="vb2-muted">No payment volume in the last 30 days.</div>
          ) : (
            (data.channels || []).map((c) => (
              <div key={c.channel} style={{ marginBottom: 13 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{c.channel}</span>
                  <span style={{ fontWeight: 650 }}>
                    {fmt(c.fee)} <span className="vb2-muted">on {fmt(c.amount)}</span>
                  </span>
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
                      width: pct(c.fee, maxFee(data.channels)) + '%',
                      borderRadius: 999,
                      background: C.fee,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
          <div className="vb2-section" style={{ marginBottom: 14 }}>
            Usage costs (metered)
          </div>
          {!data ? (
            <div className="vb2-skel">
              <div className="vb2-skel-bar" style={{ width: '60%' }} />
            </div>
          ) : (data.usage || []).length === 0 ? (
            <div className="vb2-muted">
              No metered usage recorded yet (SMS / email / exports appear here).
            </div>
          ) : (
            <div className="vb2-table-scroll">
              <table className="vb2-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.usage || []).map((u) => (
                    <tr key={u.metric} style={{ cursor: 'default' }}>
                      <td style={{ textTransform: 'capitalize' }}>{u.metric}</td>
                      <td className="vb2-right">{u.quantity}</td>
                      <td className="vb2-right">{fmt(u.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="vb2-table-card" style={{ padding: '20px 22px' }}>
        <div className="vb2-section" style={{ marginBottom: 12 }}>
          Per-tenant margin — monthly revenue vs attributed processing fees
        </div>
        {!data ? (
          <div className="vb2-skel">
            <div className="vb2-skel-bar" style={{ width: '70%' }} />
          </div>
        ) : (data.margins || []).length === 0 ? (
          <div className="vb2-muted">No paying tenants yet.</div>
        ) : (
          <div className="vb2-table-scroll">
            <table className="vb2-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th style={{ textAlign: 'right' }}>Monthly revenue</th>
                  <th style={{ textAlign: 'right' }}>Costs (30d)</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {(data.margins || []).map((m) => (
                  <tr key={m.id} style={{ cursor: 'default' }}>
                    <td className="vb2-num">{m.name}</td>
                    <td className="vb2-right">{fmt(m.revenue)}</td>
                    <td className="vb2-right">{fmt(m.costs)}</td>
                    <td className="vb2-right">
                      {m.marginPct != null ? (
                        <span
                          className={
                            'vb2-badge ' +
                            (m.marginPct >= 70 ? 'ok' : m.marginPct >= 40 ? 'warn' : 'danger')
                          }
                        >
                          {m.marginPct.toFixed(1)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function maxFee(channels) {
  return Math.max(...(channels || []).map((c) => Number(c.fee) || 0), 1);
}

function pct(v, max) {
  const n = Number(v) || 0;
  if (n <= 0) return 2;
  return Math.max(4, Math.min(100, (n / max) * 100));
}

function VolumeChart({ volume }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || volume.length === 0) return undefined;
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
        padR = 14,
        padT = 14,
        padB = 30;
      const iw = W - padL - padR,
        ih = H - padT - padB;
      const max = Math.max(...volume.map((v) => Number(v.amount) || 0), 1) * 1.15;
      const n = volume.length;
      const slot = iw / n;
      const barW = Math.min(22, slot - 6);
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
        ctx.fillText(fmtCompact(gv), padL - 8, gy);
      }
      volume.forEach((v, i) => {
        const cx = padL + slot * i + slot / 2;
        const h = ((Number(v.amount) || 0) / max) * ih;
        const grad = ctx.createLinearGradient(0, padT + ih - h, 0, padT + ih);
        grad.addColorStop(0, 'rgba(99,102,241,0.85)');
        grad.addColorStop(1, 'rgba(99,102,241,0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(cx - barW / 2, padT + ih - h, barW, h, 3);
        ctx.fill();
        if (i % Math.ceil(n / 12) === 0) {
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(v.label, cx, padT + ih + 8);
        }
      });
      // fee line overlay
      ctx.beginPath();
      volume.forEach((v, i) => {
        const cx = padL + slot * i + slot / 2;
        const fy = padT + ih - ((Number(v.fee) || 0) / max) * ih;
        if (i === 0) ctx.moveTo(cx, fy);
        else ctx.lineTo(cx, fy);
      });
      ctx.strokeStyle = C.fee;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [volume]);
  return <canvas ref={ref} style={{ width: '100%', height: 280, display: 'block' }} />;
}
