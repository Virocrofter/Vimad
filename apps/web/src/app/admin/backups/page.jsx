/* src/app/admin/backups/page.jsx */
import { useState, useMemo } from 'react';
import {
  Database,
  Calendar,
  HardDrive,
  Cloud,
  Server,
  Shield,
  Zap,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Wifi,
  WifiOff,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Settings,
  Trash2,
  Edit3,
  Eye,
  MoreHorizontal,
  Pause,
  RotateCcw,
  Check,
  X,
  Copy,
  Terminal,
  Gauge,
  Target,
  Crosshair,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  backupSchedules,
  restorePoints,
  replicationConfigs,
  testRestoreRuns,
  rtoRpoHistory,
  storageUsage,
  backupTypeMeta,
  scheduleStatusMeta,
  restorePointStatusMeta,
  replicationStatusMeta,
  testStatusMeta,
  frequencyMeta,
  formatBytes,
  formatDuration,
  parseDuration,
  timeAgo,
} from './data';
import {
  BackupTypeBadge,
  ScheduleStatusBadge,
  RestorePointStatusBadge,
  ReplicationStatusBadge,
  TestStatusBadge,
  BackupStatCard,
  BackupProgressBar,
  ReplicationLagIndicator,
  RtoRpoGauge,
  HealthCheckDot,
  TestResultRow,
  LogEntry,
  StorageTierBadge,
  RegionBadge,
  CopyableId,
  TimelineItem,
  IssueAlert,
} from './components';
import ScheduleModal from './ScheduleModal';
import RestoreModal from './RestoreModal';
import TestRestoreModal from './TestRestoreModal';

/* ─── Main Backups Page ─── */
export default function BackupsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  /* ── Schedules State ── */
  const [schedules, setSchedules] = useState(backupSchedules);
  const [schQuery, setSchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showSchModal, setShowSchModal] = useState(false);

  /* ── Restore Points State ── */
  const [restorePts, setRestorePts] = useState(restorePoints);
  const [rpQuery, setRpQuery] = useState('');
  const [rpStatusFilter, setRpStatusFilter] = useState('all');
  const [selectedRestorePoint, setSelectedRestorePoint] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  /* ── Replication State ── */
  const [replications, setReplications] = useState(replicationConfigs);
  const [repQuery, setRepQuery] = useState('');

  /* ── Test Runs State ── */
  const [testRuns, setTestRuns] = useState(testRestoreRuns);
  const [testQuery, setTestQuery] = useState('');
  const [testStatusFilter, setTestStatusFilter] = useState('all');
  const [selectedTestRun, setSelectedTestRun] = useState(null);
  const [selectedTestRestorePoint, setSelectedTestRestorePoint] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTestDetailModal, setShowTestDetailModal] = useState(false);

  /* ─── Computed: Filtered Schedules ─── */
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesQuery =
        !schQuery ||
        s.name.toLowerCase().includes(schQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(schQuery.toLowerCase()) ||
        s.target.toLowerCase().includes(schQuery.toLowerCase());
      return matchesQuery;
    });
  }, [schedules, schQuery]);

  /* ─── Computed: Filtered Restore Points ─── */
  const filteredRestorePoints = useMemo(() => {
    return restorePts
      .filter((rp) => {
        const matchesQuery =
          !rpQuery ||
          rp.id.toLowerCase().includes(rpQuery.toLowerCase()) ||
          rp.scheduleName.toLowerCase().includes(rpQuery.toLowerCase());
        const matchesStatus = rpStatusFilter === 'all' || rp.status === rpStatusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [restorePts, rpQuery, rpStatusFilter]);

  /* ─── Computed: Filtered Replication ─── */
  const filteredReplications = useMemo(() => {
    return replications.filter((r) => {
      const matchesQuery =
        !repQuery ||
        r.name.toLowerCase().includes(repQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(repQuery.toLowerCase());
      return matchesQuery;
    });
  }, [replications, repQuery]);

  /* ─── Computed: Filtered Test Runs ─── */
  const filteredTestRuns = useMemo(() => {
    return testRuns
      .filter((t) => {
        const matchesQuery =
          !testQuery ||
          t.id.toLowerCase().includes(testQuery.toLowerCase()) ||
          t.restorePointName.toLowerCase().includes(testQuery.toLowerCase());
        const matchesStatus = testStatusFilter === 'all' || t.status === testStatusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  }, [testRuns, testQuery, testStatusFilter]);

  /* ─── Stats ─── */
  const stats = useMemo(
    () => ({
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter((s) => s.enabled).length,
      failedSchedules: schedules.filter((s) => s.status === 'failed').length,
      totalRestorePoints: restorePts.length,
      availableRestorePoints: restorePts.filter((rp) => rp.status === 'available').length,
      totalStorage: storageUsage.totalUsed,
      allocatedStorage: storageUsage.totalAllocated,
      replicationHealthy: replications.filter((r) => r.status === 'active').length,
      replicationWarning: replications.filter((r) => r.status === 'paused').length,
      testSuccess: testRuns.filter((t) => t.status === 'success').length,
      testFailed: testRuns.filter((t) => t.status === 'failed').length,
      testWarning: testRuns.filter((t) => t.status === 'warning').length,
      avgRto:
        testRuns.filter((t) => t.rtoAchieved && t.status !== 'failed').length > 0
          ? (
              testRuns
                .filter((t) => t.rtoAchieved && t.status !== 'failed')
                .reduce((s, t) => s + parseDuration(t.rtoAchieved), 0) /
              testRuns.filter((t) => t.rtoAchieved && t.status !== 'failed').length /
              60
            ).toFixed(1)
          : 0,
    }),
    [schedules, restorePts, replications, testRuns]
  );

  /* ─── Handlers ─── */
  const handleSaveSchedule = (payload) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === payload.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });
    setSelectedSchedule(null);
  };

  const handleDeleteSchedule = (id) => {
    if (confirm('Delete this backup schedule?')) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleToggleSchedule = (id) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled, status: s.enabled ? 'disabled' : 'success' } : s
      )
    );
  };

  const handleRestore = (restorePointId, targetId) => {
    console.log('Restoring', restorePointId, 'to', targetId);
    // In production: trigger restore API
  };

  const handleStartTest = (restorePointId, envId) => {
    const newTest = {
      id: `TR-${Date.now().toString(36).toUpperCase()}`,
      restorePointId,
      restorePointName:
        restorePts.find((rp) => rp.id === restorePointId)?.scheduleName || 'Unknown',
      type: 'manual',
      status: 'running',
      startedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      completedAt: null,
      duration: null,
      targetEnvironment: envId,
      databaseValidated: false,
      dataIntegrity: 'not_started',
      rowCountMatch: false,
      indexRebuild: 'not_started',
      appSmokeTest: 'not_started',
      rtoAchieved: null,
      rtoTarget: '30 minutes',
      rpoAchieved: null,
      rpoTarget: '4 hours',
      issues: [],
      logs: [
        {
          time: new Date().toTimeString().slice(0, 8),
          level: 'info',
          message: 'Test restore initiated (manual)',
        },
      ],
    };
    setTestRuns((prev) => [newTest, ...prev]);
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Calendar,
      badge: stats.failedSchedules > 0 ? stats.failedSchedules : undefined,
    },
    { id: 'restore', label: 'Restore Points', icon: Database },
    {
      id: 'replication',
      label: 'Replication',
      icon: Globe,
      badge: stats.replicationWarning > 0 ? stats.replicationWarning : undefined,
    },
    {
      id: 'tests',
      label: 'Test Runs',
      icon: Play,
      badge: stats.testFailed > 0 ? stats.testFailed : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Backup & Disaster Recovery</h1>
          <p className="text-sm text-text-secondary">
            Automated backups, cross-region replication, and restore validation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export Report
          </Button>
          {activeTab === 'schedules' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedSchedule(null);
                setShowSchModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New Schedule
            </Button>
          )}
          {activeTab === 'tests' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedTestRun(null);
                setSelectedTestRestorePoint(null);
                setShowTestModal(true);
              }}
            >
              <Play className="mr-1.5 h-4 w-4" /> Run Test
            </Button>
          )}
        </div>
      </div>

      {/* Global Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BackupStatCard
          label="Active Schedules"
          value={`${stats.activeSchedules}/${stats.totalSchedules}`}
          icon={Calendar}
          color="text-accent"
          subtext="Backup jobs running"
        />
        <BackupStatCard
          label="Restore Points"
          value={stats.totalRestorePoints}
          icon={Database}
          color="text-secondary"
          subtext={`${stats.availableRestorePoints} available`}
        />
        <BackupStatCard
          label="Storage Used"
          value={stats.totalStorage}
          icon={HardDrive}
          color="text-info"
          subtext={`of ${stats.allocatedStorage} allocated`}
        />
        <BackupStatCard
          label="Avg RTO"
          value={`${stats.avgRto}m`}
          icon={Gauge}
          color="text-purple-500"
          subtext="Recovery time objective"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════
          OVERVIEW TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* RTO/RPO Gauges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RtoRpoGauge actual={parseFloat(stats.avgRto)} target={30} label="Avg RTO" unit="min" />
            <RtoRpoGauge actual={2} target={4} label="Avg RPO" unit="h" />
            <RtoRpoGauge actual={45} target={60} label="US-West Lag" unit="s" />
            <RtoRpoGauge actual={60} target={60} label="EU-West Lag" unit="min" />
          </div>

          {/* Storage Breakdown */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-secondary" /> Storage Breakdown
            </h3>
            <div className="space-y-4">
              {storageUsage.breakdown.map((item) => (
                <div key={item.storage} className="flex items-center gap-4">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-text-primary">{item.storage}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RegionBadge region={item.region} />
                      <StorageTierBadge tier={item.tier} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <BackupProgressBar
                      used={item.used}
                      total={item.allocated}
                      label={`${item.used} ${item.unit}`}
                      unit={`${item.unit}`}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-xs font-mono text-text-primary">
                      {item.used} / {item.allocated} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>
                Monthly growth:{' '}
                <span className="font-mono text-text-primary">{storageUsage.monthlyGrowth}</span>
              </span>
              <span>
                Monthly cost:{' '}
                <span className="font-mono text-text-primary">${storageUsage.costMonth}/mo</span>
              </span>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" /> Recent Activity
              </h3>
              <div className="space-y-0">
                {restorePts.slice(0, 5).map((rp, idx) => (
                  <TimelineItem
                    key={rp.id}
                    icon={rp.type === 'snapshot' ? Zap : Database}
                    iconColor={
                      rp.status === 'available'
                        ? 'text-accent'
                        : rp.status === 'expiring'
                          ? 'text-warning'
                          : 'text-info'
                    }
                    iconBg={
                      rp.status === 'available'
                        ? 'bg-accent/10'
                        : rp.status === 'expiring'
                          ? 'bg-warning/10'
                          : 'bg-info/10'
                    }
                    title={rp.scheduleName}
                    subtitle={`${rp.type} · ${rp.size} · ${rp.region}`}
                    time={timeAgo(rp.createdAt)}
                    status={<RestorePointStatusBadge status={rp.status} />}
                  />
                ))}
              </div>
            </div>

            {/* RTO/RPO History Chart */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" /> RTO/RPO History (Last 5 Tests)
              </h3>
              <div className="space-y-3">
                {rtoRpoHistory.map((entry) => (
                  <div key={entry.date} className="flex items-center gap-3">
                    <div className="w-24 shrink-0">
                      <p className="text-xs text-text-secondary">{entry.date}</p>
                      <TestStatusBadge status={entry.status} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-text-muted">RTO</span>
                          <span className="font-mono text-text-primary">
                            {entry.rtoActual ? `${entry.rtoActual}m` : '—'} / {entry.rtoTarget}m
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              entry.rtoActual && entry.rtoActual <= entry.rtoTarget
                                ? 'bg-accent'
                                : 'bg-danger'
                            )}
                            style={{
                              width: `${entry.rtoActual ? Math.min(100, (entry.rtoActual / entry.rtoTarget) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-text-muted">RPO</span>
                          <span className="font-mono text-text-primary">
                            {entry.rpoActual ? `${entry.rpoActual}h` : '—'} / {entry.rpoTarget}h
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              entry.rpoActual && entry.rpoActual <= entry.rpoTarget
                                ? 'bg-accent'
                                : 'bg-danger'
                            )}
                            style={{
                              width: `${entry.rpoActual ? Math.min(100, (entry.rpoActual / entry.rpoTarget) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" /> Backup Health
              </h3>
              <div className="space-y-2">
                {schedules.slice(0, 4).map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HealthCheckDot
                        status={
                          sch.status === 'success'
                            ? 'healthy'
                            : sch.status === 'warning'
                              ? 'warning'
                              : 'failed'
                        }
                      />
                      <span className="text-xs text-text-secondary">{sch.name}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{timeAgo(sch.lastRun)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-secondary" /> Replication Health
              </h3>
              <div className="space-y-2">
                {replications.map((rep) => (
                  <div key={rep.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HealthCheckDot
                        status={
                          rep.status === 'active' && rep.lagSeconds < 300
                            ? 'healthy'
                            : rep.status === 'active'
                              ? 'warning'
                              : 'failed'
                        }
                      />
                      <span className="text-xs text-text-secondary">{rep.name}</span>
                    </div>
                    <ReplicationLagIndicator
                      lagSeconds={rep.lagSeconds}
                      targetSeconds={rep.syncMode === 'continuous' ? 3600 : 86400}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Play className="h-4 w-4 text-purple-500" /> Latest Test Results
              </h3>
              <div className="space-y-2">
                {testRuns.slice(0, 4).map((test) => (
                  <div key={test.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HealthCheckDot
                        status={
                          test.status === 'success'
                            ? 'healthy'
                            : test.status === 'warning'
                              ? 'warning'
                              : 'failed'
                        }
                      />
                      <span className="text-xs text-text-secondary truncate max-w-32">
                        {test.restorePointName}
                      </span>
                    </div>
                    <TestStatusBadge status={test.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          SCHEDULES TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {/* Schedule Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BackupStatCard
              label="Total"
              value={stats.totalSchedules}
              icon={Calendar}
              color="text-text-primary"
              subtext="Configured schedules"
            />
            <BackupStatCard
              label="Active"
              value={stats.activeSchedules}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Running normally"
            />
            <BackupStatCard
              label="Disabled"
              value={schedules.filter((s) => !s.enabled).length}
              icon={Pause}
              color="text-text-muted"
              subtext="Manually paused"
            />
            <BackupStatCard
              label="Failed"
              value={stats.failedSchedules}
              icon={XCircle}
              color="text-danger"
              subtext="Need attention"
            />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search schedules..."
              value={schQuery}
              onChange={(e) => setSchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Schedules Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        schedule.status === 'success'
                          ? 'bg-accent/10'
                          : schedule.status === 'warning'
                            ? 'bg-warning/10'
                            : schedule.status === 'failed'
                              ? 'bg-danger/10'
                              : 'bg-neutral/10'
                      )}
                    >
                      <Database
                        className={cn(
                          'h-5 w-5',
                          schedule.status === 'success'
                            ? 'text-accent'
                            : schedule.status === 'warning'
                              ? 'text-warning'
                              : schedule.status === 'failed'
                                ? 'text-danger'
                                : 'text-text-muted'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{schedule.name}</h3>
                      <p className="text-[10px] text-text-muted font-mono">{schedule.id}</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <BackupTypeBadge type={schedule.type} />
                        <ScheduleStatusBadge status={schedule.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowSchModal(true);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-md',
                        schedule.enabled
                          ? 'text-accent hover:bg-accent/10'
                          : 'text-text-muted hover:bg-surface-elevated'
                      )}
                      title={schedule.enabled ? 'Disable' : 'Enable'}
                    >
                      {schedule.enabled ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-text-muted">Target</p>
                    <p className="text-text-primary font-medium">{schedule.target}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Frequency</p>
                    <p className="text-text-primary font-medium">
                      {frequencyMeta[schedule.frequency] || schedule.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted">Storage</p>
                    <p className="text-text-primary font-medium">{schedule.storage}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Retention</p>
                    <p className="text-text-primary font-medium">{schedule.retentionDays} days</p>
                  </div>
                </div>

                {schedule.databases.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-text-muted mb-1">Databases</p>
                    <div className="flex flex-wrap gap-1">
                      {schedule.databases.map((db) => (
                        <span
                          key={db}
                          className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary font-mono"
                        >
                          {db}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Last: {schedule.lastRun ? timeAgo(schedule.lastRun) : 'Never'}</span>
                  <span>Next: {schedule.nextRun ? timeAgo(schedule.nextRun) : '—'}</span>
                  <span>
                    Avg: {schedule.sizeAvg} · {schedule.durationAvg}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No schedules found.</p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedSchedule(null);
                  setShowSchModal(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Create Schedule
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════
          RESTORE POINTS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'restore' && (
        <div className="space-y-6">
          {/* Restore Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BackupStatCard
              label="Total"
              value={stats.totalRestorePoints}
              icon={Database}
              color="text-text-primary"
              subtext="All restore points"
            />
            <BackupStatCard
              label="Available"
              value={stats.availableRestorePoints}
              icon={CheckCircle2}
              color="text-accent"
              subtext="Ready to restore"
            />
            <BackupStatCard
              label="Expiring"
              value={restorePts.filter((rp) => rp.status === 'expiring').length}
              icon={Clock}
              color="text-warning"
              subtext="Within 7 days"
            />
            <BackupStatCard
              label="Archived"
              value={restorePts.filter((rp) => rp.status === 'archived').length}
              icon={Layers}
              color="text-info"
              subtext="In cold storage"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search restore points..."
                value={rpQuery}
                onChange={(e) => setRpQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={rpStatusFilter}
              onChange={(e) => setRpStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="expiring">Expiring Soon</option>
              <option value="archived">Archived</option>
              <option value="restoring">Restoring</option>
            </select>
          </div>

          {/* Results */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredRestorePoints.length}</span> of{' '}
            {restorePts.length} restore points
          </p>

          {/* Restore Points Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Restore Point
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Retention
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRestorePoints.map((rp) => (
                    <tr key={rp.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CopyableId id={rp.id} />
                          {rp.tags.includes('replicated') && (
                            <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] text-secondary font-medium">
                              REPLICA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{rp.scheduleName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <BackupTypeBadge type={rp.type} />
                      </td>
                      <td className="px-4 py-3">
                        <RestorePointStatusBadge status={rp.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {rp.size}
                      </td>
                      <td className="px-4 py-3">
                        <RegionBadge region={rp.region} />
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {timeAgo(rp.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{rp.retentionUntil}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedRestorePoint(rp);
                              setShowRestoreModal(true);
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTestRestorePoint(rp);
                              setSelectedTestRun(null);
                              setShowTestModal(true);
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
                          >
                            <Play className="h-3.5 w-3.5" /> Test
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          REPLICATION TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'replication' && (
        <div className="space-y-6">
          {/* Replication Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BackupStatCard
              label="Active"
              value={stats.replicationHealthy}
              icon={Wifi}
              color="text-accent"
              subtext="Replicating now"
            />
            <BackupStatCard
              label="Paused"
              value={stats.replicationWarning}
              icon={WifiOff}
              color="text-warning"
              subtext="Needs attention"
            />
            <BackupStatCard
              label="Total Objects"
              value="2,847"
              icon={Layers}
              color="text-secondary"
              subtext="Across all regions"
            />
            <BackupStatCard
              label="Monthly Cost"
              value="$980"
              icon={DollarSign}
              color="text-info"
              subtext="Cross-region transfer"
            />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search replication configs..."
              value={repQuery}
              onChange={(e) => setRepQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Replication Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredReplications.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{rep.name}</h3>
                    <p className="text-[10px] text-text-muted font-mono">{rep.id}</p>
                  </div>
                  <ReplicationStatusBadge status={rep.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-text-muted">Source</p>
                    <p className="text-text-primary font-medium">{rep.sourceRegion}</p>
                    <p className="text-[10px] text-text-muted font-mono">{rep.sourceBucket}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Target</p>
                    <p className="text-text-primary font-medium">{rep.targetRegion}</p>
                    <p className="text-[10px] text-text-muted font-mono">{rep.targetBucket}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Sync Mode</p>
                    <p className="text-text-primary font-medium capitalize">{rep.syncMode}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Objects</p>
                    <p className="text-text-primary font-medium">
                      {rep.objectsReplicated.toLocaleString()} / {rep.objectsTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Lag */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                    <span>Replication Lag</span>
                    <span>Target: {rep.rpoTarget}</span>
                  </div>
                  <ReplicationLagIndicator
                    lagSeconds={rep.lagSeconds}
                    targetSeconds={rep.syncMode === 'continuous' ? 3600 : 86400}
                  />
                </div>

                {/* RPO/RTO */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-[10px] text-text-muted">RPO Actual</p>
                    <p
                      className={cn(
                        'text-xs font-mono font-bold',
                        parseDuration(rep.rpoActual) <= parseDuration(rep.rpoTarget)
                          ? 'text-accent'
                          : 'text-warning'
                      )}
                    >
                      {rep.rpoActual}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2">
                    <p className="text-[10px] text-text-muted">RTO Target</p>
                    <p className="text-xs font-mono font-bold text-text-primary">{rep.rtoTarget}</p>
                  </div>
                </div>

                {/* Health Checks */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-text-muted mb-1.5">Health Checks</p>
                  <div className="flex gap-3">
                    {rep.healthChecks.map((hc) => (
                      <div key={hc.type} className="flex items-center gap-1.5">
                        <HealthCheckDot status={hc.status} />
                        <span className="text-[10px] text-text-secondary capitalize">
                          {hc.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Last sync: {timeAgo(rep.lastSync)}</span>
                  <span>Cost: ${rep.costMonth}/mo</span>
                  <span>
                    {rep.encryptionTransit} / {rep.encryptionAtRest}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          TEST RUNS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {/* Test Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BackupStatCard
              label="Passed"
              value={stats.testSuccess}
              icon={CheckCircle2}
              color="text-accent"
              subtext="All checks green"
            />
            <BackupStatCard
              label="Warnings"
              value={stats.testWarning}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Minor issues"
            />
            <BackupStatCard
              label="Failed"
              value={stats.testFailed}
              icon={XCircle}
              color="text-danger"
              subtext="Restore blocked"
            />
            <BackupStatCard
              label="Success Rate"
              value={`${Math.round((stats.testSuccess / testRuns.length) * 100)}%`}
              icon={TrendingUp}
              color="text-purple-500"
              subtext="Last 5 tests"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search test runs..."
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={testStatusFilter}
              onChange={(e) => setTestStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="success">Passed</option>
              <option value="warning">Warning</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* Results */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredTestRuns.length}</span>{' '}
            of {testRuns.length} test runs
          </p>

          {/* Test Runs Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredTestRuns.map((test) => (
              <div
                key={test.id}
                className={cn(
                  'rounded-xl border bg-surface p-5 transition-all hover:shadow-md cursor-pointer',
                  test.status === 'success'
                    ? 'border-accent/20'
                    : test.status === 'warning'
                      ? 'border-warning/20'
                      : test.status === 'failed'
                        ? 'border-danger/20'
                        : 'border-secondary/20'
                )}
                onClick={() => {
                  setSelectedTestRun(test);
                  setShowTestDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        test.status === 'success'
                          ? 'bg-accent/10'
                          : test.status === 'warning'
                            ? 'bg-warning/10'
                            : test.status === 'failed'
                              ? 'bg-danger/10'
                              : 'bg-secondary/10'
                      )}
                    >
                      {test.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      ) : test.status === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : test.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-danger" />
                      ) : (
                        <Activity className="h-5 w-5 text-secondary animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {test.restorePointName}
                      </h3>
                      <p className="text-[10px] text-text-muted font-mono">
                        {test.id} · {test.type}
                      </p>
                      <div className="mt-1">
                        <TestStatusBadge status={test.status} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono text-text-primary">
                      {test.duration || '—'}
                    </p>
                    <p className="text-[10px] text-text-muted">Duration</p>
                  </div>
                </div>

                {/* Test Results Summary */}
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[
                    {
                      label: 'DB Valid',
                      status: test.databaseValidated
                        ? 'passed'
                        : test.status === 'failed'
                          ? 'failed'
                          : 'not_started',
                    },
                    { label: 'Integrity', status: test.dataIntegrity },
                    {
                      label: 'Row Count',
                      status: test.rowCountMatch
                        ? 'passed'
                        : test.status === 'failed'
                          ? 'failed'
                          : 'not_started',
                    },
                    { label: 'Indexes', status: test.indexRebuild },
                    { label: 'Smoke Test', status: test.appSmokeTest },
                  ].map((check) => (
                    <div
                      key={check.label}
                      className="rounded-lg border border-border bg-background p-2 text-center"
                    >
                      <div className="flex justify-center mb-1">
                        {check.status === 'passed' ? (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        ) : check.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-danger" />
                        ) : check.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <Minus className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted">{check.label}</p>
                    </div>
                  ))}
                </div>

                {/* RTO/RPO */}
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-text-muted">RTO:</span>
                    <span
                      className={cn(
                        'font-mono font-medium',
                        test.rtoAchieved &&
                          parseDuration(test.rtoAchieved) <= parseDuration(test.rtoTarget)
                          ? 'text-accent'
                          : test.rtoAchieved
                            ? 'text-danger'
                            : 'text-text-muted'
                      )}
                    >
                      {test.rtoAchieved || '—'} / {test.rtoTarget}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-text-muted">RPO:</span>
                    <span className="font-mono font-medium text-accent">
                      {test.rpoAchieved || '—'} / {test.rpoTarget}
                    </span>
                  </div>
                  <div className="ml-auto text-text-muted">{test.startedAt}</div>
                </div>

                {/* Issues */}
                {test.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {test.issues.map((issue, i) => (
                      <IssueAlert
                        key={i}
                        severity={issue.severity}
                        message={issue.message}
                        component={issue.component}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTestRuns.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Play className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No test runs found.</p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedTestRun(null);
                  setSelectedTestRestorePoint(null);
                  setShowTestModal(true);
                }}
              >
                <Play className="mr-1.5 h-4 w-4" /> Run First Test
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════
          MODALS
          ═════════════════════════════════════════ */}
      {showSchModal && (
        <ScheduleModal
          schedule={selectedSchedule}
          onClose={() => {
            setShowSchModal(false);
            setSelectedSchedule(null);
          }}
          onSave={handleSaveSchedule}
        />
      )}

      {showRestoreModal && (
        <RestoreModal
          restorePoint={selectedRestorePoint}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedRestorePoint(null);
          }}
          onRestore={handleRestore}
        />
      )}

      {showTestModal && (
        <TestRestoreModal
          testRun={selectedTestRun}
          restorePoint={selectedTestRestorePoint}
          onClose={() => {
            setShowTestModal(false);
            setSelectedTestRun(null);
            setSelectedTestRestorePoint(null);
          }}
          onStartTest={handleStartTest}
        />
      )}

      {showTestDetailModal && selectedTestRun && (
        <TestRestoreModal
          testRun={selectedTestRun}
          onClose={() => {
            setShowTestDetailModal(false);
            setSelectedTestRun(null);
          }}
        />
      )}
    </div>
  );
}
