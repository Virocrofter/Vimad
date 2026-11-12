import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  Wifi,
  Database,
  Cloud,
  Server,
  Wrench,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getPublicStatus } from '../../../api/health';

const ICONS = {
  'booking-engine': Wifi,
  'payments-webhook': Database,
  'guest-portal': Cloud,
  scheduler: Server,
  core: Activity,
};
const ago = (d) =>
  d ? `${Math.max(0, Math.round((Date.now() - new Date(d)) / 60000))}m ago` : 'n/a';

export default function StatusPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      getPublicStatus()
        .then((r) => live && (setData(r?.data ?? r), setError(null)))
        .catch((e) => live && setError(e.message));
    load();
    const t = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  const overall = data?.overall ?? null;
  const banner = {
    operational: {
      text: 'All Systems Operational',
      cls: 'border-accent/20 bg-accent/5',
      dot: 'bg-accent',
      txt: 'text-accent',
    },
    degraded: {
      text: 'Partial Service Disruption',
      cls: 'border-warning/20 bg-warning/5',
      dot: 'bg-warning',
      txt: 'text-warning',
    },
    critical: {
      text: 'Major Service Outage',
      cls: 'border-red-500/30 bg-red-500/10',
      dot: 'bg-red-500',
      txt: 'text-red-500',
    },
  }[overall] ?? {
    text: 'Loading status…',
    cls: 'border-border bg-surface',
    dot: 'bg-text-muted',
    txt: 'text-text-muted',
  };

  const svcStyle = (s) =>
    s === 'operational'
      ? { pill: 'bg-accent/10 text-accent', Icon: CheckCircle }
      : s === 'degraded'
        ? { pill: 'bg-warning/10 text-warning', Icon: AlertCircle }
        : { pill: 'bg-red-500/10 text-red-500', Icon: XCircle };

  const timeline = (t) => {
    try {
      const x = typeof t === 'string' ? JSON.parse(t || '[]') : (t ?? []);
      return Array.isArray(x) ? x : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Activity className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">System Status</h1>
          <p className="mt-2 text-sm text-text-muted">
            {error
              ? 'Status feed unreachable — retrying'
              : data
                ? `Live · updated ${new Date(data.updatedAt).toLocaleTimeString()}`
                : 'Loading…'}
          </p>
        </div>

        <div
          className={cn(
            'mb-8 flex items-center justify-center gap-3 rounded-xl border p-6',
            banner.cls
          )}
        >
          <div className={cn('h-3 w-3 animate-pulse rounded-full', banner.dot)} />
          <span className={cn('text-lg font-semibold', banner.txt)}>{banner.text}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(data?.services ?? []).map((s) => {
            const st = svcStyle(s.status);
            const Icon = ICONS[s.key] ?? Cloud;
            return (
              <div
                key={s.key}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-muted">
                      {s.detail ?? `checked ${ago(s.checkedAt)}`}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                    st.pill
                  )}
                >
                  <st.Icon className="h-3 w-3" />
                  {s.status}
                </span>
              </div>
            );
          })}
        </div>

        {(data?.maintenance ?? []).length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-text-primary">Scheduled Maintenance</h2>
            <div className="mt-4 space-y-3">
              {data.maintenance.map((m) => (
                <div
                  key={m.publishAt + m.title}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{m.title}</span>
                    <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      {new Date(m.publishAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(data?.activeIncidents ?? []).length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-text-primary">Active Incidents</h2>
            <div className="mt-4 space-y-3">
              {data.activeIncidents.map((i) => (
                <div key={i.id} className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{i.title}</span>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning capitalize">
                      {i.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Started {new Date(i.startedAt).toLocaleString()} · Severity: {i.severity}
                  </p>
                  {timeline(i.timeline).map((e, k) => (
                    <p key={k} className="mt-2 text-sm text-text-secondary">
                      • {new Date(e.at).toLocaleTimeString()} — {e.status}
                      {e.note ? `: ${e.note}` : ''}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-text-primary">Recent Incidents (14 days)</h2>
          <div className="mt-4 space-y-3">
            {(data?.recentIncidents ?? []).map((i) => (
              <div key={i.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{i.title}</span>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent capitalize">
                    {i.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {new Date(i.startedAt).toLocaleDateString()} · Severity: {i.severity}
                  {i.resolvedAt ? ` · resolved ${new Date(i.resolvedAt).toLocaleString()}` : ''}
                </p>
              </div>
            ))}
          </div>
          {data && data.recentIncidents.length === 0 && data.activeIncidents.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              No incidents in the last 14 days.
            </p>
          )}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface p-6 text-center">
          <h3 className="font-semibold text-text-primary">Affected right now?</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Our team is watching the same live feed on this page.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
