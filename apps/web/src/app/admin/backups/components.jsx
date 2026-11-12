/* apps/web/src/app/admin/backups/components.jsx */
import {
  Database,
  HardDrive,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  FlaskConical,
  Download,
  RefreshCw,
  CalendarClock,
  Zap,
  Building2,
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

export const fmtBytes = (n) => {
  if (n == null) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = Number(n);
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
};
export const fmtDate = (d) =>
  d
    ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(d)
      )
    : '—';
export const fmtDur = (ms) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};
export const fmtAgo = (d) => {
  if (!d) return 'never';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
};

const GRADS = ['bk-g-indigo', 'bk-g-emerald', 'bk-g-amber', 'bk-g-sky', 'bk-g-rose', 'bk-g-slate'];
export function KpiCard({ label, value, sub, icon, grad }) {
  return (
    <div className={`bk-kpi ${grad || GRADS[0]}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="k-label">{label}</div>
          <div className="k-value">{value}</div>
          {sub && <div className="k-sub">{sub}</div>}
        </div>
        <div style={{ opacity: 0.9 }}>{icon}</div>
      </div>
    </div>
  );
}

export function StatusChip({ status }) {
  const map = {
    completed: ['ok', CheckCircle2],
    passed: ['ok', CheckCircle2],
    active: ['ok', CheckCircle2],
    running: ['info', RefreshCw],
    pending: ['warn', Clock],
    open: ['warn', Clock],
    failed: ['bad', XCircle],
    cancelled: ['neutral', XCircle],
    archived: ['neutral', XCircle],
  };
  const [tone, Icon] = map[status] || ['neutral', Activity];
  return (
    <span className={`bk-chip ${tone}`}>
      <Icon size={11} />
      {status}
    </span>
  );
}

export function RunsTable({ runs, onTest, onRestore, onDelete, onDownload, busy }) {
  if (!runs?.length)
    return (
      <div className="bk-empty">No backups yet — run your first backup from the hero bar.</div>
    );
  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
          <th>Size</th>
          <th>Duration</th>
          <th>Verified</th>
          <th>Started</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => {
          const dur =
            r.startedAt && r.finishedAt ? new Date(r.finishedAt) - new Date(r.startedAt) : null;
          return (
            <tr key={r.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{r.name || r.kind}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground,#a1a1aa)' }}>
                  {r.actor}
                </div>
              </td>
              <td>
                <span className="bk-chip neutral">{r.type || r.kind}</span>
              </td>
              <td>
                <StatusChip status={r.status} />
                {r.status === 'running' && (
                  <div className="bk-progress" style={{ marginTop: 6, width: 90 }}>
                    <div style={{ width: '70%' }} />
                  </div>
                )}
                {r.error && (
                  <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4, maxWidth: 180 }}>
                    {r.error}
                  </div>
                )}
              </td>
              <td>{fmtBytes(r.sizeBytes)}</td>
              <td>{fmtDur(dur)}</td>
              <td>
                {r.restoreTestedStatus ? (
                  <span className={`bk-chip ${r.restoreTestedStatus === 'passed' ? 'ok' : 'bad'}`}>
                    {r.restoreTestedStatus === 'passed' ? (
                      <ShieldCheck size={11} />
                    ) : (
                      <AlertTriangle size={11} />
                    )}
                    {r.restoreTestedStatus === 'passed' ? 'verified' : 'failed'}
                  </span>
                ) : (
                  <span className="bk-chip neutral">never</span>
                )}
              </td>
              <td>{fmtAgo(r.startedAt)}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button
                  className="bk-icon-btn"
                  title="Download (audit-trailed)"
                  disabled={busy || r.status !== 'completed'}
                  onClick={() => onDownload(r)}
                >
                  <Download size={15} />
                </button>
                <button
                  className="bk-icon-btn"
                  title="Test restore (scratch)"
                  disabled={busy || r.status !== 'completed'}
                  onClick={() => onTest(r)}
                >
                  <FlaskConical size={15} />
                </button>
                <button
                  className="bk-icon-btn"
                  title="Restore to scratch"
                  disabled={busy || r.status !== 'completed'}
                  onClick={() => onRestore(r)}
                >
                  <Play size={15} />
                </button>
                <button
                  className="bk-icon-btn danger"
                  title="Delete"
                  disabled={busy}
                  onClick={() => onDelete(r)}
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const FREQS = [
  { label: 'Hourly', cron: '0 * * * *' },
  { label: 'Daily 02:00', cron: '0 2 * * *' },
  { label: 'Weekly (Sun 02:00)', cron: '0 2 * * 0' },
  { label: 'Monthly (1st 02:00)', cron: '0 2 1 * *' },
];
export { FREQS };

export function ScheduleList({ schedules, onRun, onDelete, onEdit }) {
  if (!schedules?.length)
    return <div className="bk-empty">No schedules — automate your backups.</div>;
  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Frequency</th>
          <th>Type</th>
          <th>Retention</th>
          <th>Last run</th>
          <th>Next run</th>
          <th>Status</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {schedules.map((s) => (
          <tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td>
              <code
                style={{
                  fontSize: 12,
                  background: 'var(--muted,#27272a)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                {s.cron}
              </code>
            </td>
            <td>
              <span className="bk-chip neutral">{s.type}</span>
            </td>
            <td>{s.retentionDays}d</td>
            <td>{fmtAgo(s.lastRunAt)}</td>
            <td>{fmtDate(s.nextRunAt)}</td>
            <td>
              <StatusChip status={s.isActive ? 'active' : 'cancelled'} />
            </td>
            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <button className="bk-icon-btn" title="Run now" onClick={() => onRun(s)}>
                <Zap size={15} />
              </button>
              <button className="bk-icon-btn" title="Edit" onClick={() => onEdit(s)}>
                <CalendarClock size={15} />
              </button>
              <button className="bk-icon-btn danger" title="Delete" onClick={() => onDelete(s)}>
                <Trash2 size={15} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RestoreJobsTable({ jobs }) {
  if (!jobs?.length) return <div className="bk-empty">No restore jobs yet.</div>;
  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th>Started</th>
          <th>Target</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id}>
            <td>{fmtDate(j.startedAt)}</td>
            <td>
              <span className="bk-chip info">{j.target}</span>
            </td>
            <td>
              <StatusChip status={j.status} />
            </td>
            <td>{fmtDur(j.durationMs)}</td>
            <td style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)' }}>
              {j.checks
                ? `${j.checks.filter((c) => c.passed).length}/${j.checks.length} checks passed`
                : j.error || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DrillsTable({ drills, targetHours }) {
  if (!drills?.length)
    return <div className="bk-empty">No drills yet — run one to measure your real RTO.</div>;
  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th>Started</th>
          <th>Status</th>
          <th>RTO (actual)</th>
          <th>Target</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {drills.map((d) => {
          const rto =
            d.rtoSeconds != null ? `${Math.floor(d.rtoSeconds / 60)}m ${d.rtoSeconds % 60}s` : '—';
          const breach =
            d.rtoSeconds != null && targetHours != null && d.rtoSeconds > targetHours * 3600;
          return (
            <tr key={d.id}>
              <td>{fmtDate(d.startedAt)}</td>
              <td>
                <StatusChip status={d.status} />
              </td>
              <td style={{ fontWeight: 700, color: breach ? '#fca5a5' : '#6ee7b7' }}>{rto}</td>
              <td>{targetHours ?? '—'}h</td>
              <td style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)' }}>
                {d.checks
                  ? `${d.checks.filter((c) => c.passed).length}/${d.checks.length} checks passed`
                  : d.notes || '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function CoveragePanel({ coverage: cov }) {
  if (!cov) return null;
  const rows = [
    ['Tenants (hotels)', cov.tenants, Building2],
    ['Properties', cov.properties, Building2],
    ['Guests', cov.guests, Users],
    ['Reservations', cov.reservations, CalendarClock],
    ['Folios', cov.folios, FileText],
    ['Payments', cov.payments, CreditCard],
    ['Staff users', cov.users, Users],
  ];
  const max = Math.max(...rows.map(([, n]) => n), 1);
  return (
    <div className="bk-panel">
      <h3>
        <Database size={16} /> What your backups protect
      </h3>
      {rows.map(([lbl, n, Icon]) => (
        <div className="bk-coverage-bar" key={lbl}>
          <span className="lbl">
            <Icon size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
            {lbl}
          </span>
          <div className="bk-progress" style={{ flex: 1 }}>
            <div style={{ width: `${Math.max(4, (n / max) * 100)}%` }} />
          </div>
          <span className="num">{n.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)', marginTop: 8 }}>
        Full backups cover all {cov.coreTables}+ core tables plus every migration added after
        onboarding — nothing is excluded unless you pick specific tables.
      </div>
    </div>
  );
}

export function RetentionMatrix({ rows }) {
  if (!rows) return null;
  return (
    <div className="bk-panel">
      <h3>
        <Clock size={16} /> Retention policy
      </h3>
      <table className="bk-table">
        <thead>
          <tr>
            <th>Tier</th>
            <th>Cadence</th>
            <th>Keep for</th>
            <th>Enforcement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tier}>
              <td style={{ fontWeight: 600 }}>{r.tier}</td>
              <td>{r.cadence}</td>
              <td>{r.keepFor}</td>
              <td style={{ color: 'var(--muted-foreground,#a1a1aa)' }}>{r.enforcement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TenantsTable({ tenants, onExport, busyId }) {
  if (!tenants?.length) return null;
  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th>Hotel / Tenant</th>
          <th>Plan</th>
          <th>Properties</th>
          <th>Guests</th>
          <th>Reservations</th>
          <th>Status</th>
          <th style={{ textAlign: 'right' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {tenants.map((t) => (
          <tr key={t.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground,#a1a1aa)' }}>{t.slug}</div>
            </td>
            <td>
              <span className="bk-chip info">{t.plan}</span>
            </td>
            <td>{t.properties}</td>
            <td>{t.guests.toLocaleString()}</td>
            <td>{t.reservations.toLocaleString()}</td>
            <td>
              <StatusChip status={t.status === 'active' ? 'active' : t.status} />
            </td>
            <td style={{ textAlign: 'right' }}>
              <button
                className="bk-btn bk-btn-soft"
                style={{ padding: '7px 12px' }}
                disabled={busyId === t.id}
                onClick={() => onExport(t)}
              >
                {busyId === t.id ? <RefreshCw size={13} /> : <Download size={13} />} Export
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
