import React from 'react';
import './health.css';

export const Pill = ({ v }) => (
  <span className={`hl-pill ${String(v).toLowerCase()}`}>{String(v).replace(/_/g, ' ')}</span>
);

export const Banner = ({ o }) => (
  <div className={`hl-banner ${o.status}`}>
    <div className="hl-dot" />
    <div>
      <div className="hl-title">
        System{' '}
        {o.status === 'healthy' ? 'Healthy' : o.status === 'degraded' ? 'Degraded' : 'Critical'}
      </div>
      <div className="hl-sub">
        uptime {o.uptime} · {o.openIncidents} open incident{o.openIncidents === 1 ? '' : 's'} ·{' '}
        {o.openExceptions} open exceptions · refreshed{' '}
        {new Date(o.generatedAt).toLocaleTimeString()}
      </div>
    </div>
  </div>
);

export const ServiceGrid = ({ services }) => (
  <div className="hl-grid">
    {services.map((s) => (
      <div className="hl-card" key={s.name}>
        <h4>
          {s.name}
          <Pill v={s.status} />
        </h4>
        <div className="hl-metric">
          {s.latencyMs ? `${s.latencyMs}ms` : s.status === 'operational' ? '✓' : '—'}
        </div>
        <div className="hl-detail">{s.detail}</div>
      </div>
    ))}
  </div>
);

export const HeartbeatGrid = ({ tiles }) => (
  <div className="hl-grid">
    {tiles.map((t) => (
      <div className="hl-card" key={t.name}>
        <h4>
          {t.name}
          <Pill v={t.status} />
        </h4>
        <div className="hl-metric">
          {t.ageMs === null
            ? '—'
            : t.ageMs < 60000
              ? `${Math.round(t.ageMs / 1000)}s ago`
              : `${Math.round(t.ageMs / 60000)}m ago`}
        </div>
        <div className="hl-detail">
          {t.ranAt ? `last run ${new Date(t.ranAt).toLocaleTimeString()}` : 'never ran'} · expected
          every {t.expectedMs ? `${Math.round(t.expectedMs / 60000)}m` : 'n/a'}
        </div>
        {t.error && <div className="hl-tile-err">{t.error}</div>}
      </div>
    ))}
  </div>
);

export const ProbeCards = ({ results, running, onRun }) => (
  <div>
    <div style={{ marginBottom: 14 }}>
      <button className="hl-btn" onClick={onRun} disabled={running}>
        {running ? 'Running…' : 'Run probes now'}
      </button>
    </div>
    <div className="hl-grid">
      {results.map((r) => (
        <div className="hl-card" key={r.probe}>
          <h4>
            {r.label}
            <Pill v={r.status} />
          </h4>
          <div className="hl-metric">{r.latencyMs}ms</div>
          <div className="hl-detail">{r.error ? `ERROR: ${r.error}` : r.detail || ''}</div>
          <div className="hl-detail">
            {r.ranAt ? `ran ${new Date(r.ranAt).toLocaleTimeString()}` : ''}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TenantTable = ({ tenants, onPick }) => (
  <table className="hl-table">
    <thead>
      <tr>
        <th>Tenant</th>
        <th>Plan</th>
        <th>Score</th>
        <th>Payments 30d</th>
        <th>Emails sent</th>
        <th>Exceptions</th>
        <th>Night audit</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {tenants.map((t) => (
        <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => onPick(t)}>
          <td>
            <strong>{t.name}</strong>
            <div className="hl-kv">{t.slug}</div>
          </td>
          <td>{t.plan}</td>
          <td>
            <span className={`hl-score ${t.band}`}>{t.score}</span>
          </td>
          <td>
            {t.pay_ok} ok / {t.pay_bad} failed
          </td>
          <td>
            {t.email_sent}/{t.email_total}
          </td>
          <td>{t.exceptions_open}</td>
          <td>
            {t.audits_completed}/{t.props}
          </td>
          <td>→</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const TenantDrilldown = ({ t, detail, onClose }) => (
  <div className="hl-card" style={{ marginTop: 14 }}>
    <h4>
      {t.name} — signal provenance{' '}
      <button className="hl-btn hl-ghost" onClick={onClose}>
        close
      </button>
    </h4>
    {!detail ? (
      <div className="hl-empty">loading…</div>
    ) : (
      <div className="hl-grid" style={{ marginTop: 10 }}>
        <div className="hl-card">
          <h4>Payments (30d)</h4>
          {detail.payments.map((p) => (
            <div className="hl-row" key={p.status}>
              <span>{p.status}</span>
              <strong>{p.c}</strong>
            </div>
          ))}
        </div>
        <div className="hl-card">
          <h4>Emails (30d)</h4>
          {detail.emails.map((p) => (
            <div className="hl-row" key={p.status}>
              <span>{p.status}</span>
              <strong>{p.c}</strong>
            </div>
          ))}
        </div>
        <div className="hl-card">
          <h4>Open exceptions</h4>
          {detail.exceptions.length === 0 ? (
            <div className="hl-detail">none</div>
          ) : (
            detail.exceptions.map((e, i) => (
              <div className="hl-row" key={i}>
                <span>{e.title}</span>
                <Pill v={e.severity} />
              </div>
            ))
          )}
        </div>
        <div className="hl-card">
          <h4>Night audits</h4>
          {detail.audits.length === 0 ? (
            <div className="hl-detail">none yet</div>
          ) : (
            detail.audits.map((a, i) => (
              <div className="hl-row" key={i}>
                <span>
                  {a.property} · {String(a.auditDate).slice(0, 10)}
                </span>
                <Pill v={a.status === 'completed' ? 'ok' : 'warn'} />
              </div>
            ))
          )}
        </div>
        <div className="hl-card" style={{ gridColumn: '1 / -1' }}>
          <h4>Failed jobs (24h)</h4>
          {detail.failedJobs.length === 0 ? (
            <div className="hl-detail">none</div>
          ) : (
            detail.failedJobs.map((f, i) => (
              <div className="hl-row" key={i}>
                <span>
                  {f.queue} / {f.jobName}
                </span>
                <span className="hl-kv">{f.failReason}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>
);

export const JourneyTable = ({ rows }) => (
  <table className="hl-table">
    <thead>
      <tr>
        <th>Property</th>
        <th>Check-in success</th>
        <th>Payment-request conversion</th>
        <th>Order fulfilment</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => {
        const ci = r.checkins_started
          ? Math.round((r.checkins_done / r.checkins_started) * 100)
          : null;
        const pr = r.payreq_total ? Math.round((r.payreq_paid / r.payreq_total) * 100) : null;
        const od = r.orders_total ? Math.round((r.orders_delivered / r.orders_total) * 100) : null;
        const bar = (v) =>
          v === null ? (
            <span className="hl-kv">no data</span>
          ) : (
            <div>
              <strong className={`hl-score ${v >= 80 ? 'green' : v >= 50 ? 'amber' : 'red'}`}>
                {v}%
              </strong>
              <div className="hl-bar">
                <span style={{ width: `${v}%` }} />
              </div>
            </div>
          );
        return (
          <tr key={r.propertyId}>
            <td>
              <strong>{r.name}</strong>
            </td>
            <td>{bar(ci)}</td>
            <td>{bar(pr)}</td>
            <td>{bar(od)}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export const NightlyPanel = ({ n }) => (
  <div className="hl-grid">
    <div className="hl-card">
      <h4>Inventory cache</h4>
      <div className="hl-metric">{n.inventoryCache.rows}</div>
      <div className="hl-detail">
        <Pill v={n.inventoryCache.fresh ? 'ok' : 'warn'} />{' '}
        {n.inventoryCache.freshest
          ? `freshest ${new Date(n.inventoryCache.freshest).toLocaleString()}`
          : 'never computed'}
      </div>
    </div>
    <div className="hl-card">
      <h4>Report failures (24h)</h4>
      <div className={`hl-metric ${n.reportFailures24h > 0 ? 'hl-score red' : 'hl-score green'}`}>
        {n.reportFailures24h}
      </div>
    </div>
    <div className="hl-card">
      <h4>Meal-posting failures (24h)</h4>
      <div
        className={`hl-metric ${n.mealPostingFailures24h > 0 ? 'hl-score red' : 'hl-score green'}`}
      >
        {n.mealPostingFailures24h}
      </div>
    </div>
    {n.nightlyLoops.map((l) => (
      <div className="hl-card" key={l.name}>
        <h4>
          {l.name}
          <Pill v={l.error ? 'fail' : 'ok'} />
        </h4>
        <div className="hl-detail">last ran {new Date(l.ranAt).toLocaleString()}</div>
      </div>
    ))}
  </div>
);

export const IncidentList = ({ incidents, onUpdate }) => (
  <div>
    <table className="hl-table">
      <thead>
        <tr>
          <th>Started</th>
          <th>Severity</th>
          <th>Title</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {incidents.map((i) => (
          <tr key={i.id}>
            <td className="hl-kv">{new Date(i.startedAt).toLocaleString()}</td>
            <td>
              <Pill v={i.severity} />
            </td>
            <td>{i.title}</td>
            <td>
              <Pill v={i.status} />
            </td>
            <td>
              {!['resolved', 'closed'].includes(i.status) && (
                <button
                  className="hl-btn hl-ghost"
                  onClick={() => onUpdate(i.id, 'resolved', 'resolved from health console')}
                >
                  resolve
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {incidents.length === 0 && <div className="hl-empty">No incidents on record</div>}
  </div>
);

export const HealthBoard = ({ tenants, journeys, onPick }) => {
  if (!tenants) return <div className="hl-empty">loading…</div>;
  const sorted = [...tenants].sort((a, b) => a.score - b.score);
  const byTenant = {};
  (journeys || []).forEach((j) => {
    (byTenant[j.tenantId] = byTenant[j.tenantId] || []).push(j);
  });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  const mini = (label, v) => (
    <span className="hl-mini">
      {label}{' '}
      <strong
        className={`hl-score ${v === null ? '' : v >= 80 ? 'green' : v >= 50 ? 'amber' : 'red'}`}
      >
        {v === null ? '–' : `${v}%`}
      </strong>
    </span>
  );
  const worstGuest = (p) => {
    const rates = [
      pct(p.checkins_done, p.checkins_started),
      pct(p.payreq_paid, p.payreq_total),
      pct(p.orders_delivered, p.orders_total),
    ].filter((x) => x !== null);
    return rates.length ? Math.min(...rates) : 101;
  };
  return (
    <div>
      {sorted.map((t) => {
        const props = byTenant[t.id] || [];
        const worst = props.length ? Math.min(...props.map(worstGuest)) : 101;
        const flag = t.score < 50 || worst < 50;
        return (
          <div
            key={t.id}
            className={`hl-card hl-board-row ${flag ? 'hl-board-flag' : ''}`}
            style={{ marginBottom: 12 }}
            onClick={() => onPick && onPick(t)}
          >
            <div className="hl-board-head">
              <span className={`hl-score ${t.band}`} style={{ fontSize: 22 }}>
                {t.score}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div className="hl-kv">
                  {t.slug} · {t.plan}
                </div>
              </div>
              <div className="hl-board-stats">
                {mini(
                  'payments',
                  t.pay_total ? Math.round(((t.pay_total - t.pay_bad) / t.pay_total) * 100) : null
                )}
                {mini(
                  'emails',
                  t.email_total ? Math.round((t.email_sent / t.email_total) * 100) : null
                )}
                {mini(
                  'exceptions',
                  t.exceptions_open === 0 ? 100 : Math.max(0, 100 - t.exceptions_open * 10)
                )}
                {mini(
                  'night audit',
                  t.props ? Math.round((t.audits_completed / t.props) * 100) : null
                )}
                {t.failed_jobs_24h > 0 && (
                  <span className="hl-mini" style={{ color: 'var(--bad)' }}>
                    {t.failed_jobs_24h} failed jobs
                  </span>
                )}
              </div>
            </div>
            {props.length > 0 && (
              <div className="hl-board-props">
                {props.map((p) => (
                  <div key={p.propertyId} className="hl-prop-chip">
                    <span className="hl-prop-name">{p.name}</span>
                    {mini('check-in', pct(p.checkins_done, p.checkins_started))}
                    {mini('pay-req', pct(p.payreq_paid, p.payreq_total))}
                    {mini('orders', pct(p.orders_delivered, p.orders_total))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
