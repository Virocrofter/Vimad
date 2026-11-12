// Pinned platform-status banner for the staff app. Silent when everything is
// operational; shows an amber/red bar (tenant-scoped via the auth store) when
// an incident affects this hotel — links to /app/support/status for detail.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { apiGet } from '../api/client';
import { useAuthStore } from '../stores/authStores';

export function StatusBanner() {
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const [state, setState] = useState<{ overall: string; title: string | null } | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      apiGet<any>('/v1/public/status', tenantId ? { tenantId } : undefined)
        .then((r: any) => {
          if (!live) return;
          const d = r?.data ?? r;
          const open = d?.activeIncidents ?? [];
          setState({
            overall: d?.overall ?? 'operational',
            title: open.length ? open[0].title : null,
          });
        })
        .catch(() => live && setState({ overall: 'operational', title: null }));
    load();
    const t = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [tenantId]);

  if (!state || state.overall === 'operational') return null;
  const critical = state.overall === 'critical';

  return (
    <Link
      to="/app/support/status"
      className={
        critical
          ? 'flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/15'
          : 'flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/15'
      }
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="truncate">
        Platform {critical ? 'outage' : 'degradation'} in progress
        {state.title ? ` — ${state.title}` : ''}. Click for details.
      </span>
    </Link>
  );
}
