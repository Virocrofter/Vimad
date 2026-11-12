import React, { useState } from 'react';
import {
  getHealthOverview,
  getHeartbeats,
  getProbes,
  runProbes,
  getIncidents,
  getTenantScores,
  getTenantHealth,
  getJourneys,
  getNightly,
} from '../../../api/health';
import { apiPatch } from '../../../api/client';
import {
  Banner,
  ServiceGrid,
  HeartbeatGrid,
  ProbeCards,
  TenantTable,
  TenantDrilldown,
  JourneyTable,
  NightlyPanel,
  IncidentList,
  HealthBoard,
} from './components';
import './health.css';

const useData = (fn) => {
  const [state, setState] = React.useState({ data: null, error: null, reload: null });
  React.useEffect(() => {
    let live = true;
    const load = () =>
      fn()
        .then((r) => live && setState((s) => ({ ...s, data: r?.data ?? r, error: null })))
        .catch((e) => live && setState((s) => ({ ...s, error: e.message })));
    load();
    const t = setInterval(load, 15000);
    setState((s) => ({ ...s, reload: load }));
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return state;
};

const TABS = [
  'Hotels & Guests',
  'Platform',
  'Cron Heartbeats',
  'Probes',
  'Tenants',
  'Guest Journeys',
  'Nightly Jobs',
  'Incidents',
];

export default function SystemHealthPage() {
  const [tab, setTab] = useState('Hotels & Guests');
  const overview = useData(getHealthOverview);
  const heartbeats = useData(getHeartbeats);
  const probes = useData(getProbes);
  const incidents = useData(getIncidents);
  const tenants = useData(getTenantScores);
  const journeys = useData(getJourneys);
  const nightly = useData(getNightly);
  const [picked, setPicked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [running, setRunning] = useState(false);

  const doRunProbes = async () => {
    setRunning(true);
    try {
      await runProbes();
      await probes.reload();
      await incidents.reload();
    } finally {
      setRunning(false);
    }
  };
  const doPick = async (t) => {
    setPicked(t);
    setDetail(null);
    try {
      const r = await getTenantHealth(t.id);
      setDetail(r?.data ?? r);
    } catch {
      setDetail({ payments: [], emails: [], exceptions: [], audits: [], failedJobs: [] });
    }
  };
  const doResolve = async (id, status, note) => {
    try {
      await apiPatch(`/admin/health/incidents/${id}`, { status, note });
    } catch {}
    await incidents.reload();
  };

  return (
    <div className="hl-root" style={{ padding: '20px 24px' }}>
      {overview.data && <Banner o={overview.data} />}
      {overview.error && (
        <div className="hl-banner critical">
          <div>
            <div className="hl-title">Health API unreachable</div>
            <div className="hl-sub">{overview.error}</div>
          </div>
        </div>
      )}
      <div className="hl-tabs">
        {TABS.map((t) => (
          <button key={t} className={`hl-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Hotels & Guests' && (
        <div>
          <HealthBoard tenants={tenants.data?.tenants} journeys={journeys.data} onPick={doPick} />
          {picked && <TenantDrilldown t={picked} detail={detail} onClose={() => setPicked(null)} />}
        </div>
      )}
      {tab === 'Platform' &&
        (overview.data ? (
          <ServiceGrid services={overview.data.services} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Cron Heartbeats' &&
        (heartbeats.data ? (
          <HeartbeatGrid tiles={heartbeats.data.tiles} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Probes' &&
        (probes.data ? (
          <ProbeCards results={probes.data.results} running={running} onRun={doRunProbes} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Tenants' &&
        (tenants.data ? (
          <div>
            <TenantTable tenants={tenants.data.tenants} onPick={doPick} />
            {picked && (
              <TenantDrilldown t={picked} detail={detail} onClose={() => setPicked(null)} />
            )}
          </div>
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Guest Journeys' &&
        (journeys.data ? (
          <JourneyTable rows={journeys.data} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Nightly Jobs' &&
        (nightly.data ? (
          <NightlyPanel n={nightly.data} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
      {tab === 'Incidents' &&
        (incidents.data ? (
          <IncidentList incidents={incidents.data} onUpdate={doResolve} />
        ) : (
          <div className="hl-empty">loading…</div>
        ))}
    </div>
  );
}
