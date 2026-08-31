/* src/app/admin/reports/page.jsx */
'use client';

import { useState, useMemo } from 'react';
import {
  FileText, Download, Calendar, CheckCircle2, Clock, AlertTriangle,
  Shield, ShieldCheck, XCircle, ChevronDown, ChevronUp, MoreHorizontal,
  Copy, Check, Eye, Trash2, Edit3, Sparkles, BarChart3, TrendingUp,
  TrendingDown, Users, DollarSign, CreditCard, ArrowUpRight, Filter,
  Search, RefreshCw, Plus, Mail, Send, Printer, FileSpreadsheet,
  FileJson, FileCode, Layers, PieChart, Activity, Target, Zap,
  Globe, Building2, Tag, Hash, Link2, ExternalLink, Lock, Unlock,
  Settings, Bell, History, RotateCcw, Save, X, Loader2, MapPin,
  Server, Database, HardDrive, Cloud, Wifi, WifiOff, ArrowRight,
  ArrowUp, ArrowDown, Minus, Percent, Flag, Ban, Play, Pause,
  LayoutDashboard, LayoutList, LayoutGrid, Table, List, ListFilter,
  ListOrdered, ListChecks, ListTree, ListCollapse, ListStart,
  ListEnd, ListVideo, ListMusic, ListPlus, ListMinus, ListX,
  ListRestart, ListTodo, ListOrderedIcon, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, AlignStartHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignEndVertical, AlignHorizontalDistributeStart,
  AlignHorizontalDistributeCenter, AlignHorizontalDistributeEnd,
  AlignVerticalDistributeStart, AlignVerticalDistributeCenter,
  AlignVerticalDistributeEnd, Space, SpaceIcon, StretchHorizontal,
  StretchVertical, Move, MoveHorizontal, MoveVertical, MoveDiagonal,
  Maximize, Minimize, Maximize2, Minimize2, Expand, Shrink,
  Fullscreen, PanelLeft, PanelRight, PanelTop, PanelBottom,
  PanelLeftClose, PanelRightClose, PanelTopClose, PanelBottomClose,
  PanelLeftOpen, PanelRightOpen, PanelTopOpen, PanelBottomOpen,
  Sidebar, SidebarClose, SidebarOpen, SidebarIcon, LayoutTemplate,
  LayoutPanelLeft, LayoutPanelTop, LayoutGridIcon, Rows3, Columns3,
  Grid2x2, Grid3x3, Grip, GripHorizontal, GripVertical, GripIcon,
  PanelTopDashed, PanelBottomDashed, PanelLeftDashed, PanelRightDashed
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

import {
  complianceRules,
  complianceFrameworks,
  complianceReports,
  regions,
  migrationJobs,
  reportSchedules,
  reportTemplates,
  latencyHistory,
  formatDate,
  formatDateTime,
  timeAgo,
  getFrameworkColor,
  getFrameworkLabel,
  getSeverityMeta,
  getStatusMeta,
  exportFormats,
  scheduleFrequencies,
  complianceStatusMeta,
  getRegionName,
  migrationStatusMeta,
  regionStatusMeta,
  regionTenants,
} from './data';

import {
  LatencySparkline,
  RegionStatCard,
  ComplianceCard,
  MigrationJobCard,
  RegionCard,
  ReportStatCard,
  ReportScheduleCard,
  ReportBuilderPreview,
  EmptyState,
} from './components';

import MigrationModal from '../regions/MigrationModal';
import RegionDetailDrawer from '../regions/RegionDetailDrawer';

/* ═══════════════════════════════════════════
   TABS CONFIG
   ═══════════════════════════════════════════ */
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'migrations', label: 'Migrations', icon: ArrowRight },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
  { id: 'builder', label: 'Report Builder', icon: Sparkles },
];

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals / Drawers
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [editingMigration, setEditingMigration] = useState(null);
  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [builderColumns, setBuilderColumns] = useState([
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'framework', label: 'Framework' },
    { key: 'status', label: 'Status' },
  ]);

  /* ─── Derived Data ─── */
  const filteredReports = useMemo(() => {
    return complianceReports.filter((r) => {
      const matchesSearch = !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFramework = selectedFramework === 'all' || r.framework === selectedFramework;
      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
      return matchesSearch && matchesFramework && matchesStatus;
    });
  }, [searchQuery, selectedFramework, selectedStatus]);

  const filteredRules = useMemo(() => {
    return complianceRules.filter((r) => {
      const matchesSearch = !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFramework = selectedFramework === 'all' || r.framework === selectedFramework;
      return matchesSearch && matchesFramework;
    });
  }, [searchQuery, selectedFramework]);

  const filteredMigrations = useMemo(() => {
    return migrationJobs.filter((j) => {
      const matchesSearch = !searchQuery ||
        j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const filteredSchedules = useMemo(() => {
    return reportSchedules.filter((s) => {
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  /* ─── Handlers ─── */
  const handleViewReport = (report) => {
    console.log('View report:', report.id);
  };

  const handleDownloadReport = (report) => {
    console.log('Download report:', report.id);
  };

  const handleDeleteReport = (id) => {
    console.log('Delete report:', id);
  };

  const handleViewMigration = (job) => {
    console.log('View migration:', job.id);
  };

  const handleRetryMigration = (id) => {
    console.log('Retry migration:', id);
  };

  const handleCancelMigration = (id) => {
    console.log('Cancel migration:', id);
  };

  const handleNewMigration = () => {
    setEditingMigration(null);
    setMigrationModalOpen(true);
  };

  const handleEditMigration = (job) => {
    setEditingMigration(job);
    setMigrationModalOpen(true);
  };

  const handleSaveMigration = (job) => {
    console.log('Save migration:', job);
    setMigrationModalOpen(false);
    setEditingMigration(null);
  };

  const handleViewRegion = (region) => {
    setSelectedRegion(region);
    setRegionDrawerOpen(true);
  };

  const handleEditRegion = (region) => {
    console.log('Edit region:', region.id);
  };

  const handleDeleteRegion = (id) => {
    console.log('Delete region:', id);
  };

  const handleEditSchedule = (schedule) => {
    console.log('Edit schedule:', schedule.id);
  };

  const handleDeleteSchedule = (id) => {
    console.log('Delete schedule:', id);
  };

  const handleRunScheduleNow = (schedule) => {
    console.log('Run schedule now:', schedule.id);
  };

  /* ─── Stats ─── */
  const totalReports = complianceReports.length;
  const completeReports = complianceReports.filter((r) => r.status === 'complete').length;
  const pendingReports = complianceReports.filter((r) => r.status === 'pending' || r.status === 'generating').length;
  const failedReports = complianceReports.filter((r) => r.status === 'failed').length;
  const activeRegions = regions.filter((r) => r.status === 'active').length;
  const totalTenants = regions.reduce((sum, r) => sum + (r.tenantCount || 0), 0);
  const runningMigrations = migrationJobs.filter((j) => j.status === 'running').length;
  const completedMigrations = migrationJobs.filter((j) => j.status === 'completed').length;
  const failedMigrations = migrationJobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Reports & Compliance</h1>
              <p className="mt-1 text-sm text-text-muted">
                Compliance reports, regional operations, and migration management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
              <Button size="sm" onClick={handleNewMigration}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Migration
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-border">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FILTERS BAR
          ═══════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {(activeTab === 'compliance' || activeTab === 'overview') && (
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Frameworks</option>
                {complianceFrameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>{fw.label}</option>
                ))}
              </select>
            )}
            {activeTab === 'compliance' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="complete">Complete</option>
                <option value="pending">Pending</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Last updated: {timeAgo('2026-08-16 12:00:00')}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT
          ═══════════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 pb-12">

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReportStatCard
                label="Total Reports"
                value={totalReports}
                subtext={`${completeReports} complete, ${pendingReports} pending`}
                icon={FileText}
                color="text-secondary"
                trend={12}
              />
              <ReportStatCard
                label="Compliance Score"
                value={`${Math.round((completeReports / totalReports) * 100)}%`}
                subtext={`${failedReports} failed reports`}
                icon={ShieldCheck}
                color="text-emerald-500"
                trend={5}
              />
              <ReportStatCard
                label="Active Regions"
                value={activeRegions}
                subtext={`${totalTenants.toLocaleString()} total tenants`}
                icon={Globe}
                color="text-blue-500"
              />
              <ReportStatCard
                label="Running Migrations"
                value={runningMigrations}
                subtext={`${completedMigrations} completed, ${failedMigrations} failed`}
                icon={ArrowRight}
                color="text-amber-500"
              />
            </div>

            {/* Frameworks */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Compliance Frameworks</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {complianceFrameworks.map((fw) => {
                  const fwReports = complianceReports.filter((r) => r.framework === fw.id);
                  const fwComplete = fwReports.filter((r) => r.status === 'complete').length;
                  return (
                    <div
                      key={fw.id}
                      className="rounded-xl border border-border bg-surface p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setSelectedFramework(fw.id); setActiveTab('compliance'); }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${fw.color}15` }}
                        >
                          <Shield className="h-5 w-5" style={{ color: fw.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary">{fw.label}</h3>
                          <p className="text-xs text-text-muted truncate">{fw.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono" style={{ color: fw.color }}>
                            {fwComplete}/{fwReports.length}
                          </p>
                          <p className="text-[10px] text-text-muted">reports</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${fwReports.length ? (fwComplete / fwReports.length) * 100 : 0}%`,
                            backgroundColor: fw.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-primary">Recent Reports</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('compliance')}>
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredReports.slice(0, 4).map((report) => (
                  <ComplianceCard
                    key={report.id}
                    report={report}
                    onView={handleViewReport}
                    onDownload={handleDownloadReport}
                    onDelete={handleDeleteReport}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── COMPLIANCE TAB ─── */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Rules Table */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Compliance Rules ({filteredRules.length})
              </h2>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Rule</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Framework</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Auto-Fix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRules.map((rule) => {
                        const severity = getSeverityMeta(rule.severity);
                        return (
                          <tr key={rule.id} className="hover:bg-background/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-text-primary">{rule.name}</p>
                              <p className="text-xs text-text-muted">{rule.id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${getFrameworkColor(rule.framework)}15`,
                                  color: getFrameworkColor(rule.framework),
                                }}
                              >
                                {getFrameworkLabel(rule.framework)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', severity.bg, severity.color, severity.border)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full', severity.dot)} />
                                {severity.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary capitalize">{rule.category.replace('_', ' ')}</td>
                            <td className="px-4 py-3">
                              {rule.autoFix ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                                  <Check className="h-3 w-3" /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                                  <X className="h-3 w-3" /> No
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredRules.length === 0 && (
                  <div className="py-8 text-center">
                    <Shield className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-xs text-text-muted">No rules match your filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reports Grid */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Compliance Reports ({filteredReports.length})
              </h2>
              {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredReports.map((report) => (
                    <ComplianceCard
                      key={report.id}
                      report={report}
                      onView={handleViewReport}
                      onDownload={handleDownloadReport}
                      onDelete={handleDeleteReport}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No reports found"
                  description="Try adjusting your search or filter criteria."
                />
              )}
            </div>
          </div>
        )}

        {/* ─── REGIONS TAB ─── */}
        {activeTab === 'regions' && (
          <div className="space-y-6">
            {/* Region Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RegionStatCard
                label="Total Regions"
                value={regions.length}
                subtext={`${activeRegions} active`}
                icon={Globe}
                color="text-secondary"
              />
              <RegionStatCard
                label="Total Tenants"
                value={totalTenants.toLocaleString()}
                subtext="Across all regions"
                icon={Users}
                color="text-blue-500"
                trend={8}
              />
              <RegionStatCard
                label="Avg Latency"
                value={`${Math.round(regions.reduce((s, r) => s + (r.latencyMs || 0), 0) / regions.length)}ms`}
                subtext="Global average"
                icon={Zap}
                color="text-emerald-500"
              />
              <RegionStatCard
                label="Avg Uptime"
                value={`${(regions.reduce((s, r) => s + (r.uptimePct || 0), 0) / regions.length).toFixed(2)}%`}
                subtext="Last 30 days"
                icon={Activity}
                color="text-amber-500"
              />
            </div>

            {/* Latency Chart */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Latency Trends (24h)</h3>
              <div className="flex items-end gap-6">
                {regions.map((region) => (
                  <div key={region.id} className="flex-1">
                    <p className="text-xs text-text-muted mb-2">{region.code}</p>
                    <LatencySparkline
                      data={region.latencyHistory}
                      width={180}
                      height={40}
                      color={region.latencyMs > 100 ? 'text-warning' : 'text-accent'}
                    />
                    <p className={cn('mt-1 text-xs font-mono font-medium', region.latencyMs > 100 ? 'text-warning' : 'text-accent')}>
                      {region.latencyMs}ms
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Region Cards */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Regions ({regions.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {regions.map((region) => (
                  <RegionCard
                    key={region.id}
                    region={region}
                    onView={handleViewRegion}
                    onEdit={handleEditRegion}
                    onDelete={handleDeleteRegion}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── MIGRATIONS TAB ─── */}
        {activeTab === 'migrations' && (
          <div className="space-y-6">
            {/* Migration Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ReportStatCard
                label="Total Jobs"
                value={migrationJobs.length}
                subtext="All time"
                icon={Layers}
                color="text-secondary"
              />
              <ReportStatCard
                label="Completed"
                value={completedMigrations}
                subtext="Successfully finished"
                icon={CheckCircle2}
                color="text-emerald-500"
              />
              <ReportStatCard
                label="Running"
                value={runningMigrations}
                subtext="In progress"
                icon={Loader2}
                color="text-blue-500"
              />
              <ReportStatCard
                label="Failed"
                value={failedMigrations}
                subtext="Need attention"
                icon={XCircle}
                color="text-rose-500"
              />
            </div>

            {/* Migration Jobs */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Migration Jobs ({filteredMigrations.length})
              </h2>
              <Button size="sm" onClick={handleNewMigration}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Migration
              </Button>
            </div>
            {filteredMigrations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredMigrations.map((job) => (
                  <MigrationJobCard
                    key={job.id}
                    job={job}
                    onView={handleViewMigration}
                    onRetry={handleRetryMigration}
                    onCancel={handleCancelMigration}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ArrowRight}
                title="No migrations found"
                description="Start a new cross-region migration to move tenant data."
                action={
                  <Button size="sm" onClick={handleNewMigration}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> New Migration
                  </Button>
                }
              />
            )}
          </div>
        )}

        {/* ─── SCHEDULES TAB ─── */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Report Schedules ({filteredSchedules.length})
              </h2>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Schedule
              </Button>
            </div>
            {filteredSchedules.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredSchedules.map((schedule) => (
                  <ReportScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={handleEditSchedule}
                    onDelete={handleDeleteSchedule}
                    onRunNow={handleRunScheduleNow}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No schedules found"
                description="Create automated report schedules to stay on top of compliance."
                action={
                  <Button size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> New Schedule
                  </Button>
                }
              />
            )}

            {/* Templates */}
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Report Templates</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reportTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-border bg-surface p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                        <FileText className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tpl.name}</p>
                        <p className="text-[10px] text-text-muted uppercase">{tpl.category} · {tpl.format}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── BUILDER TAB ─── */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Builder Form */}
              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Report Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Report Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Q3 Security Audit"
                        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Framework</label>
                      <select className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="">Select framework...</option>
                        {complianceFrameworks.map((fw) => (
                          <option key={fw.id} value={fw.id}>{fw.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Format</label>
                      <select className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {exportFormats.map((fmt) => (
                          <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Period</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <input
                          type="date"
                          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Columns</label>
                      <div className="space-y-1">
                        {builderColumns.map((col, idx) => (
                          <div key={col.key} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={col.label}
                              onChange={(e) => {
                                const next = [...builderColumns];
                                next[idx] = { ...col, label: e.target.value };
                                setBuilderColumns(next);
                              }}
                              className="flex-1 h-8 rounded-md border border-border bg-surface px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <button
                              onClick={() => setBuilderColumns(builderColumns.filter((_, i) => i !== idx))}
                              className="rounded-md p-1 text-text-muted hover:text-rose-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => setBuilderColumns([...builderColumns, { key: `col_${builderColumns.length}`, label: 'New Column' }])}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Column
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Sparkles className="mr-1.5 h-4 w-4" /> Generate Report
                </Button>
              </div>

              {/* Preview */}
              <div className="lg:col-span-2">
                <ReportBuilderPreview
                  config={{ columns: builderColumns }}
                  data={complianceReports}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          MODALS / DRAWERS
          ═══════════════════════════════════════════ */}
      {migrationModalOpen && (
        <MigrationModal
          job={editingMigration}
          onClose={() => { setMigrationModalOpen(false); setEditingMigration(null); }}
          onSave={handleSaveMigration}
          tenants={[
            { id: 'TEN-001', name: 'Acme Corp', plan: 'Enterprise', storageGB: 450, mrr: 2500 },
            { id: 'TEN-002', name: 'Globex Inc', plan: 'Pro', storageGB: 120, mrr: 800 },
            { id: 'TEN-003', name: 'Initech LLC', plan: 'Starter', storageGB: 35, mrr: 200 },
          ]}
        />
      )}

      {regionDrawerOpen && selectedRegion && (
        <RegionDetailDrawer
          region={selectedRegion}
          onClose={() => { setRegionDrawerOpen(false); setSelectedRegion(null); }}
        />
      )}
    </div>
  );
}
