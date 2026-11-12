/* apps/web/src/app/admin/backups/page.jsx — Backups & DR (production-grade) */
import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  ShieldCheck,
  HardDrive,
  Activity,
  Clock,
  RefreshCw,
  Plus,
  CalendarClock,
  Siren,
  Building2,
  Settings2,
  Zap,
} from 'lucide-react';
import { getAccessToken } from '../../../stores/authStores';
import * as api from './data.js';
import {
  KpiCard,
  RunsTable,
  ScheduleList,
  RestoreJobsTable,
  DrillsTable,
  CoveragePanel,
  RetentionMatrix,
  TenantsTable,
  fmtBytes,
  fmtAgo,
} from './components.jsx';
import BackupModal from './BackupModal.jsx';
import ScheduleModal from './ScheduleModal.jsx';
import TestRestoreModal from './TestRestoreModal.jsx';
import RestoreModal from './RestoreModal.jsx';
import './backups.css';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'runs', label: 'Backup Runs', icon: Database },
  { key: 'schedules', label: 'Schedules', icon: CalendarClock },
  { key: 'restore', label: 'Restore & DR', icon: Siren },
  { key: 'tenants', label: 'Hotel Exports', icon: Building2 },
];

export default function BackupsDrPage() {
  const [tab, setTab] = useState('overview');
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [retention, setRetention] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [restores, setRestores] = useState([]);
  const [drills, setDrills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [testTarget, setTestTarget] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const notify = (msg, tone = 'ok') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [b, s, c, r, sc, rs, d, t] = await Promise.all([
        api.getBackups(),
        api.getBackupStats(),
        api.getBackupCoverage(),
        api.getBackupRetention(),
        api.getBackupSchedules(),
        api.getRestoreJobs(),
        api.getDrDrills(),
        api.getBackupTenants(),
      ]);
      setBackups(b);
      setStats(s);
      setCoverage(c);
      setRetention(r);
      setSchedules(sc);
      setRestores(rs);
      setDrills(d);
      setTenants(t);
      setError(null);
      const st = await api.getBackupSettings().catch(() => null);
      if (st) setSettings(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  const activeWork =
    backups.some((b) => b.status === 'running') || restores.some((r) => r.status === 'running');
  useEffect(() => {
    if (!activeWork) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [activeWork, load]);

  const guard = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(e.message, 'warn');
    } finally {
      setBusy(false);
      await load();
    }
  };

  const onCreateBackup = (payload) =>
    guard(async () => {
      await api.createBackup(payload);
      setModal(null);
      notify('Backup started — it will appear in Backup Runs.');
    });
  const onDeleteBackup = (b) =>
    guard(async () => {
      if (!window.confirm(`Delete ${b.name || b.kind}? The file is removed permanently.`)) return;
      await api.deleteBackup(b.id);
      notify('Backup deleted.');
    });
  const onDownload = async (b) => {
    try {
      const token = getAccessToken();
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${base}/admin/backups/${b.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (b.name || b.id) + '.dump.gz';
      a.click();
      URL.revokeObjectURL(a.href);
      notify('Downloaded — event written to the platform audit trail.');
    } catch (e) {
      notify(e.message, 'warn');
    }
  };
  const onTest = (b) => {
    setTestTarget(b);
    setTestResult(null);
    setModal('test');
  };
  const onTestSubmit = () =>
    guard(async () => {
      const r = await api.testRestoreBackup(testTarget.id);
      setTestResult(r);
      notify(
        r.passed ? 'Test restore passed all checks.' : 'Test restore found failures.',
        r.passed ? 'ok' : 'warn'
      );
    });
  const onRestore = (b) => {
    setRestoreTarget(b);
    setRestoreResult(null);
    setModal('restore');
  };
  const onRestoreSubmit = (b, opts) =>
    guard(async () => {
      const r = await api.createRestore({ backupId: b.id, ...opts });
      setRestoreResult(r);
      notify(
        r.passed ? 'Restore verified in scratch database.' : 'Restore completed with failures.',
        r.passed ? 'ok' : 'warn'
      );
    });
  const onSaveSchedule = (payload, id) =>
    guard(async () => {
      if (id) await api.updateBackupSchedule(id, payload);
      else await api.createBackupSchedule(payload);
      setModal(null);
      notify('Schedule saved.');
    });
  const onRunSchedule = (s) =>
    guard(async () => {
      await api.runBackupSchedule(s.id);
      notify(`Schedule "${s.name}" started.`);
    });
  const onDeleteSchedule = (s) =>
    guard(async () => {
      if (!window.confirm(`Delete schedule "${s.name}"?`)) return;
      await api.deleteBackupSchedule(s.id);
      notify('Schedule deleted.');
    });
  const onRunDrill = () =>
    guard(async () => {
      await api.runDrDrill();
      notify('DR drill started — scratch restore + integrity checks.');
    });
  const onDetectStale = () =>
    guard(async () => {
      const r = await api.detectStaleBackups();
      notify(
        r.stale
          ? `STALE: last backup ${r.ageMin} min ago (target ${r.targetMin}). Exception raised.`
          : `Fresh: last backup ${r.ageMin} min ago.`,
        r.stale ? 'warn' : 'ok'
      );
    });
  const onExportTenant = (t) =>
    guard(async () => {
      setExportingId(t.id);
      const r = await api.exportTenant(t.id);
      notify(`Exported ${t.name}: ${r.tables} tables → ${r.file}`);
      setExportingId(null);
    });
  const onSaveSettings = () =>
    guard(async () => {
      await api.updateBackupSettings(settings);
      notify('RPO/RTO targets saved.');
    });

  const rpoBreached =
    stats?.rpoActualMinutes != null && stats.rpoActualMinutes > stats.rpoTargetMinutes * 1.5;
  const rtoBreached =
    stats?.rtoActualSeconds != null &&
    settings &&
    stats.rtoActualSeconds > settings.rtoTargetHours * 3600;

  return (
    <div className="bk-root">
      <div className="bk-hero">
        <div>
          <h1>Backups & Disaster Recovery</h1>
          <p>
            Real pg_dump runs, checksums, scratch-verify, DR drills, and per-hotel exports — not
            rumors.
          </p>
        </div>
        <div className="bk-hero-actions">
          <button className="bk-btn bk-btn-ghost" onClick={load} disabled={busy}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            className="bk-btn bk-btn-white"
            onClick={() => {
              setEditingSchedule(null);
              setModal('schedule');
            }}
          >
            <CalendarClock size={14} />
            Schedule
          </button>
          <button className="bk-btn bk-btn-white" onClick={() => setModal('backup')}>
            <Plus size={14} />
            Backup now
          </button>
        </div>
      </div>

      {error && (
        <div className="bk-banner warn" style={{ marginBottom: 16 }}>
          API error: {error}
        </div>
      )}
      {toast && (
        <div
          className={`bk-banner ${toast.tone === 'warn' ? 'warn' : 'ok'}`}
          style={{ marginBottom: 16 }}
        >
          {toast.msg}
        </div>
      )}

      <div className="bk-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`bk-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="bk-kpis">
            <KpiCard
              grad="bk-g-indigo"
              icon={<Database size={22} />}
              label="Total backups"
              value={stats?.totalBackups ?? '—'}
              sub={stats?.running ? `${stats.running} running now` : 'all time'}
            />
            <KpiCard
              grad="bk-g-emerald"
              icon={<HardDrive size={22} />}
              label="Backup storage"
              value={fmtBytes(stats?.storageUsed)}
              sub={`${fmtBytes(stats?.totalSize)} logical`}
            />
            <KpiCard
              grad={rpoBreached ? 'bk-g-rose' : 'bk-g-sky'}
              icon={<Clock size={22} />}
              label="RPO actual"
              value={
                stats?.rpoActualMinutes != null
                  ? stats.rpoActualMinutes < 60
                    ? `${stats.rpoActualMinutes}m`
                    : `${(stats.rpoActualMinutes / 60).toFixed(1)}h`
                  : '—'
              }
              sub={`target ≤ ${Math.round((stats?.rpoTargetMinutes ?? 1440) / 60)}h · last backup ${fmtAgo(stats?.lastBackupAt)}`}
            />
            <KpiCard
              grad={
                stats?.lastVerified?.restoreTestedStatus === 'passed'
                  ? 'bk-g-emerald'
                  : 'bk-g-amber'
              }
              icon={<ShieldCheck size={22} />}
              label="Last verified restore"
              value={stats?.lastVerified ? stats.lastVerified.restoreTestedStatus : 'never'}
              sub={
                stats?.lastVerified
                  ? fmtAgo(stats.lastVerified.restoreTestedAt)
                  : 'run a test restore'
              }
            />
            <KpiCard
              grad={rtoBreached ? 'bk-g-rose' : 'bk-g-slate'}
              icon={<Zap size={22} />}
              label="RTO (last drill)"
              value={
                stats?.rtoActualSeconds != null
                  ? `${Math.floor(stats.rtoActualSeconds / 60)}m`
                  : '—'
              }
              sub={`target ≤ ${settings?.rtoTargetHours ?? 4}h · ${drills.length} drills`}
            />
            <KpiCard
              grad="bk-g-amber"
              icon={<Activity size={22} />}
              label="Success rate (30d)"
              value={stats?.successRate != null ? `${stats.successRate}%` : '—'}
              sub="completed / attempted"
            />
          </div>
          <div className="bk-grid-2">
            <div>
              <div className="bk-panel">
                <h3>
                  <Database size={16} /> Recent runs
                </h3>
                <RunsTable
                  runs={backups.slice(0, 6)}
                  busy={busy}
                  onTest={onTest}
                  onRestore={onRestore}
                  onDelete={onDeleteBackup}
                  onDownload={onDownload}
                />
              </div>
              <div className="bk-panel">
                <h3>
                  <Settings2 size={16} /> Recovery targets
                </h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="bk-field" style={{ margin: 0, flex: 1, minWidth: 150 }}>
                    <label>RPO target (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings?.rpoTargetMinutes ?? 1440}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...(s || { rtoTargetHours: 4 }),
                          rpoTargetMinutes: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="bk-field" style={{ margin: 0, flex: 1, minWidth: 150 }}>
                    <label>RTO target (hours)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings?.rtoTargetHours ?? 4}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...(s || { rpoTargetMinutes: 1440 }),
                          rtoTargetHours: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <button
                    className="bk-btn bk-btn-primary"
                    onClick={onSaveSettings}
                    disabled={busy}
                  >
                    Save targets
                  </button>
                  <button className="bk-btn bk-btn-soft" onClick={onDetectStale} disabled={busy}>
                    <Siren size={14} />
                    Check staleness
                  </button>
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)', marginTop: 10 }}
                >
                  The stale-backup detector runs every 10 minutes server-side and raises a critical
                  exception in the exceptions queue when RPO actual breaches 1.5× target.
                </div>
              </div>
            </div>
            <div>
              <CoveragePanel coverage={coverage} />
              <RetentionMatrix rows={retention} />
            </div>
          </div>
        </>
      )}

      {tab === 'runs' && (
        <div className="bk-panel">
          <h3>
            <Database size={16} /> Backup runs
          </h3>
          <RunsTable
            runs={backups}
            busy={busy}
            onTest={onTest}
            onRestore={onRestore}
            onDelete={onDeleteBackup}
            onDownload={onDownload}
          />
        </div>
      )}

      {tab === 'schedules' && (
        <div className="bk-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>
              <CalendarClock size={16} /> Schedules
            </h3>
            <button
              className="bk-btn bk-btn-primary"
              onClick={() => {
                setEditingSchedule(null);
                setModal('schedule');
              }}
            >
              <Plus size={14} />
              New schedule
            </button>
          </div>
          <ScheduleList
            schedules={schedules}
            onRun={onRunSchedule}
            onDelete={onDeleteSchedule}
            onEdit={(s) => {
              setEditingSchedule(s);
              setModal('schedule');
            }}
          />
        </div>
      )}

      {tab === 'restore' && (
        <div className="bk-grid-2">
          <div>
            <div className="bk-panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>
                  <Siren size={16} /> DR drills — measured RTO
                </h3>
                <button className="bk-btn bk-btn-primary" onClick={onRunDrill} disabled={busy}>
                  <Zap size={14} />
                  Run drill now
                </button>
              </div>
              <DrillsTable drills={drills} targetHours={settings?.rtoTargetHours} />
              <div
                style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)', marginTop: 10 }}
              >
                A drill restores the latest completed backup into a scratch database, runs the full
                integrity suite, and records wall-clock time as your real RTO.
              </div>
            </div>
            <div className="bk-panel">
              <h3>
                <Activity size={16} /> Restore jobs
              </h3>
              <RestoreJobsTable jobs={restores} />
            </div>
          </div>
          <div>
            <div className="bk-panel">
              <h3>
                <ShieldCheck size={16} /> Verification philosophy
              </h3>
              <div
                style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground,#a1a1aa)' }}
              >
                <p>A backup that has never been restored is a rumor, not a backup.</p>
                <p>
                  Every test restore spins up <code>vimad_verify_*</code>, restores with{' '}
                  <code>pg_restore</code>, and compares row counts table-by-table against the live
                  database. Results land in the{' '}
                  <code>restoreTestedAt / restoreTestedStatus / restoreTestedLog</code> columns —
                  the fields your schema always had and nothing ever wrote. Until now.
                </p>
                <p>
                  Production restore stays a deliberate manual operation: verify here, then promote
                  via psql.
                </p>
              </div>
            </div>
            <RetentionMatrix rows={retention} />
          </div>
        </div>
      )}

      {tab === 'tenants' && (
        <div className="bk-panel">
          <h3>
            <Building2 size={16} /> Per-hotel logical exports
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'var(--muted-foreground,#a1a1aa)',
              marginTop: -6,
              marginBottom: 14,
            }}
          >
            One-click JSON export of every table scoped to a hotel — guests, reservations, folios,
            payments — for tenant-level recovery or GDPR data requests. Every export is
            audit-trailed.
          </p>
          <TenantsTable tenants={tenants} onExport={onExportTenant} busyId={exportingId} />
        </div>
      )}

      <BackupModal
        open={modal === 'backup'}
        onClose={() => setModal(null)}
        onSubmit={onCreateBackup}
        busy={busy}
      />
      <ScheduleModal
        open={modal === 'schedule'}
        onClose={() => setModal(null)}
        onSubmit={onSaveSchedule}
        busy={busy}
        editing={editingSchedule}
      />
      <TestRestoreModal
        open={modal === 'test'}
        onClose={() => setModal(null)}
        backup={testTarget}
        result={testResult}
        running={busy}
      />
      <RestoreModal
        open={modal === 'restore'}
        onClose={() => setModal(null)}
        backup={restoreTarget}
        onSubmit={onRestoreSubmit}
        busy={busy}
        result={restoreResult}
      />
    </div>
  );
}
