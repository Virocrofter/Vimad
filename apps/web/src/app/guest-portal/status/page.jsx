import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, Clock, Wifi, Database, Cloud } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getPublicStatus } from '../../../api/health';

const ICONS = { 'booking-engine': Wifi, 'payments-webhook': Database, 'guest-portal': Cloud };

export default function GuestStatusPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    const load = () =>
      getPublicStatus()
        .then((r) => live && setData(r?.data ?? r))
        .catch(() => {});
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
      text: 'Everything is running smoothly',
      cls: 'border-accent/20 bg-accent/5',
      dot: 'bg-accent',
      txt: 'text-accent',
    },
    degraded: {
      text: 'Some services are slower than usual',
      cls: 'border-warning/20 bg-warning/5',
      dot: 'bg-warning',
      txt: 'text-warning',
    },
    critical: {
      text: 'We are experiencing an outage',
      cls: 'border-red-500/30 bg-red-500/10',
      dot: 'bg-red-500',
      txt: 'text-red-500',
    },
  }[overall] ?? {
    text: 'Checking status…',
    cls: 'border-border bg-surface',
    dot: 'bg-text-muted',
    txt: 'text-text-muted',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-center text-2xl font-bold text-text-primary">Service Status</h1>
        <p className="mt-1 text-center text-xs text-text-muted">
          {data ? `Live · updated ${new Date(data.updatedAt).toLocaleTimeString()}` : 'Loading…'}
        </p>

        <div
          className={cn(
            'mt-8 flex items-center justify-center gap-3 rounded-xl border p-5',
            banner.cls
          )}
        >
          <div className={cn('h-3 w-3 animate-pulse rounded-full', banner.dot)} />
          <span className={cn('text-base font-semibold', banner.txt)}>{banner.text}</span>
        </div>

        <div className="mt-6 space-y-3">
          {(data?.services ?? [])
            .filter((s) => ['booking-engine', 'payments-webhook', 'guest-portal'].includes(s.key))
            .map((s) => {
              const ok = s.status === 'operational';
              const bad = s.status === 'outage';
              const Icon = ICONS[s.key] ?? Cloud;
              return (
                <div
                  key={s.key}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{s.name}</span>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                      ok
                        ? 'bg-accent/10 text-accent'
                        : bad
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-warning/10 text-warning'
                    )}
                  >
                    {ok ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : bad ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {s.status}
                  </span>
                </div>
              );
            })}
        </div>

        {(data?.activeIncidents ?? []).length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-text-primary">Ongoing issues</h2>
            <div className="mt-3 space-y-3">
              {data.activeIncidents.map((i) => (
                <div key={i.id} className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{i.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Since {new Date(i.startedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center gap-6 text-sm">
          <Link to="/guest-portal" className="text-accent hover:underline">
            Back to portal
          </Link>
          <Link to="/guest-portal/support/contact" className="text-accent hover:underline">
            Contact the hotel
          </Link>
        </div>
      </div>
    </div>
  );
}
