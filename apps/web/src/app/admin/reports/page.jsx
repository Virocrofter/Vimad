'use client';

// apps/web/src/app/admin/reports/page.jsx
import { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Play,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils'; // FIXED: Use @ alias
import { Button } from '@/components/ui/button';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useToast } from '@/hooks/use-toast'; // ADDED: Toast notifications
import {
  getReportDashboard,
  getTemplates,
  getScheduledReports,
  getReportRuns,
  createTemplate,
  buildCustomReport,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReport,
  executeReport,
  exportReport,
} from '@/api/reports';
import { ReportStatCard, ReportScheduleCard, ReportBuilderPreview, EmptyState } from './components';
import ReportBuilderModal from './ReportBuilderModal';
import ScheduleModal from './ScheduleModal';

export default function ReportsPage() {
  const { toast } = useToast(); // ADDED: Toast for user feedback

  /* ─── API data ─── */
  const dashboard = useApiFetch(() => getReportDashboard(), []);
  const templates = useApiFetch(() => getTemplates({ page: 1, pageSize: 50 }), []);
  const scheduled = useApiFetch(() => getScheduledReports({ page: 1, pageSize: 50 }), []);
  const runs = useApiFetch(() => getReportRuns(undefined, { page: 1, pageSize: 10 }), []);

  const loading = dashboard.loading && !dashboard.data;
  const loadError = dashboard.error || templates.error || scheduled.error || runs.error;

  const refetchAll = () => {
    dashboard.refetch();
    templates.refetch();
    scheduled.refetch();
    runs.refetch();
  };

  /* ─── Local UI state ─── */
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedulingReport, setSchedulingReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);

  /* ─── Mutations with Toast Feedback ─── */
  const { mutate: saveReport, loading: savingReport } = useApiMutation(
    (report) =>
      report.id
        ? buildCustomReport({ ...report, id: report.id })
        : createTemplate({
            name: report.name,
            description: report.description,
            category: 'custom',
            type: 'custom',
            config: report,
            fields: (report.widgets || []).map((w) => ({
              name: w.title || w.id,
              type: w.chartType || 'table',
              label: w.title || 'Widget',
              required: false,
            })),
          }),
    {
      onSuccess: () => {
        toast({
          title: 'Report saved',
          description: 'Your report has been saved successfully.',
          variant: 'success',
        });
        setShowBuilder(false);
        setEditingReport(null);
        refetchAll();
      },
      onError: (error) => {
        toast({
          title: 'Failed to save report',
          description: error?.message || 'An error occurred while saving the report.',
          variant: 'destructive',
        });
      },
    }
  );

  const { mutate: saveSchedule } = useApiMutation(
    ({ report, schedule }) =>
      schedule
        ? report._scheduleId
          ? updateScheduledReport(report._scheduleId, {
              frequency: schedule.frequency,
              recipients: schedule.recipients,
              format: schedule.format,
              status: schedule.paused ? 'paused' : 'active',
            })
          : createScheduledReport({
              templateId: report.id,
              name: `${report.name} — ${schedule.frequency}`,
              frequency: schedule.frequency,
              recipients: schedule.recipients,
              format: schedule.format,
              parameters: {},
              nextRunAt: new Date().toISOString(),
              status: schedule.paused ? 'paused' : 'active',
            })
        : report._scheduleId
          ? deleteScheduledReport(report._scheduleId)
          : Promise.resolve(),
    {
      onSuccess: () => {
        toast({
          title: 'Schedule saved',
          description: 'Report schedule has been updated.',
          variant: 'success',
        });
        setShowSchedule(false);
        setSchedulingReport(null);
        refetchAll();
      },
      onError: (error) => {
        toast({
          title: 'Failed to save schedule',
          description: error?.message || 'An error occurred while saving the schedule.',
          variant: 'destructive',
        });
      },
    }
  );

  const { mutate: removeSchedule } = useApiMutation(deleteScheduledReport, {
    onSuccess: () => {
      toast({
        title: 'Schedule deleted',
        description: 'The scheduled report has been removed.',
        variant: 'success',
      });
      refetchAll();
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete schedule',
        description: error?.message || 'An error occurred while deleting the schedule.',
        variant: 'destructive',
      });
    },
  });

  const { mutate: runNow } = useApiMutation(runScheduledReport, {
    onSuccess: () => {
      toast({
        title: 'Report started',
        description: 'The report is now running.',
        variant: 'success',
      });
      refetchAll();
    },
    onError: (error) => {
      toast({
        title: 'Failed to run report',
        description: error?.message || 'An error occurred while starting the report.',
        variant: 'destructive',
      });
    },
  });

  const { mutate: execute, loading: executing } = useApiMutation(
    (templateId) => executeReport(templateId, {}),
    {
      onSuccess: () => {
        toast({
          title: 'Report executed',
          description: 'The report has been executed successfully.',
          variant: 'success',
        });
        runs.refetch();
      },
      onError: (error) => {
        toast({
          title: 'Execution failed',
          description: error?.message || 'An error occurred while executing the report.',
          variant: 'destructive',
        });
      },
    }
  );

  const { mutate: doExport } = useApiMutation((args) => exportReport(args.runId, args.format), {
    onSuccess: (r) => {
      toast({
        title: 'Export ready',
        description: 'Your report export is being downloaded.',
        variant: 'success',
      });
      if (r?.downloadUrl) window.open(r.downloadUrl, '_blank');
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error?.message || 'An error occurred while exporting the report.',
        variant: 'destructive',
      });
    },
  });

  /* ─── Derived data ─── */
  const dash = dashboard.data || {};
  const templateList = templates.data?.data || templates.data?.items || [];
  const runList = runs.data?.data || runs.data?.items || [];

  /* ScheduledReport → ReportScheduleCard shape */
  const schedules = useMemo(
    () =>
      (scheduled.data?.data || scheduled.data?.items || []).map((s) => ({
        id: s.id,
        reportId: s.templateId,
        name: s.name,
        frequency: s.frequency,
        format: s.format,
        recipients: s.recipients || [],
        enabled: s.status === 'active',
        paused: s.status === 'paused',
        nextRun: s.nextRunAt,
        lastRun: s.lastRunAt,
      })),
    [scheduled.data]
  );

  /* ─── Handlers ─── */
  const handleScheduleSave = (schedule) => {
    saveSchedule({ report: schedulingReport, schedule });
  };

  const handlePreview = async (template) => {
    setPreviewReport({
      columns: (template.fields || []).map((f) => ({ key: f.name, label: f.label })),
    });
    try {
      const run = await executeReport(template.id, {});
      setPreviewRows(run?.rows || []);
      toast({
        title: 'Preview loaded',
        description: 'Report preview is now available.',
        variant: 'success',
      });
    } catch (error) {
      setPreviewRows([]);
      toast({
        title: 'Preview failed',
        description: error?.message || 'Failed to load report preview.',
        variant: 'destructive',
      });
    }
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading reports…</p>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (loadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p className="text-sm text-text-secondary">
          {loadError?.message || 'Failed to load reports'}
        </p>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  /* ─── Main Render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
          <p className="text-sm text-text-secondary">
            Build, schedule, and export platform reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingReport(null);
              setShowBuilder(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard
          label="Total Reports"
          value={dash.totalReports ?? templateList.length}
          icon={FileText}
          color="text-secondary"
        />
        <ReportStatCard
          label="Active Schedules"
          value={dash.scheduledActive ?? schedules.filter((s) => s.enabled).length}
          icon={Calendar}
          color="text-accent"
        />
        <ReportStatCard
          label="Runs This Month"
          value={dash.runsThisMonth ?? runList.length}
          icon={Play}
          color="text-info"
        />
        <ReportStatCard
          label="Avg Runtime"
          value={dash.averageRuntime ? `${dash.averageRuntime}s` : '—'}
          icon={Clock}
          color="text-warning"
        />
      </div>

      {/* Templates Section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" /> Report Templates
        </h3>
        {templateList.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No report templates"
            description="Create your first report with the report builder."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingReport(null);
                  setShowBuilder(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Report
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templateList.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-surface p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                    <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      t.type === 'system'
                        ? 'bg-info/10 text-info border-info/20'
                        : 'bg-secondary/10 text-secondary border-secondary/20'
                    )}
                  >
                    {t.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted line-clamp-2">{t.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={executing}
                    onClick={() => execute(t.id)}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" /> Run
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePreview(t)}>
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSchedulingReport({ id: t.id, name: t.name, schedule: null });
                      setShowSchedule(true);
                    }}
                  >
                    <Calendar className="mr-1 h-3.5 w-3.5" /> Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewReport && <ReportBuilderPreview config={previewReport} data={previewRows} />}

      {/* Scheduled Reports Section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-secondary" /> Scheduled Reports
        </h3>
        {schedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No scheduled reports"
            description="Schedule a template to run automatically."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {schedules.map((s) => (
              <ReportScheduleCard
                key={s.id}
                schedule={s}
                onEdit={(sched) => {
                  setSchedulingReport({
                    id: sched.reportId,
                    _scheduleId: sched.id,
                    name: sched.name,
                    schedule: {
                      frequency: sched.frequency,
                      time: sched.time || '08:00',
                      format: sched.format,
                      recipients: sched.recipients,
                      paused: sched.paused,
                    },
                  });
                  setShowSchedule(true);
                }}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this schedule?')) {
                    removeSchedule(id);
                  }
                }}
                onRunNow={(id) => runNow(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Runs Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Play className="h-4 w-4 text-secondary" /> Recent Runs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Run ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Report
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Started
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Rows
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runList.map((r) => (
                <tr key={r.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.id}</td>
                  <td className="px-4 py-3 text-text-primary">{r.reportId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        r.status === 'completed'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : r.status === 'failed'
                            ? 'bg-danger/10 text-danger border-danger/20'
                            : 'bg-info/10 text-info border-info/20'
                      )}
                    >
                      {r.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : r.status === 'failed' ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">
                    {r.rowCount ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'completed' && (
                      <button
                        onClick={() => doExport({ runId: r.id, format: 'pdf' })}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
                        title="Export PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {runList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    <Play className="mx-auto h-10 w-10 mb-3" />
                    <p>No report runs yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showBuilder && (
        <ReportBuilderModal
          report={editingReport}
          onClose={() => {
            setShowBuilder(false);
            setEditingReport(null);
          }}
          onSave={saveReport}
          saving={savingReport}
        />
      )}

      {showSchedule && (
        <ScheduleModal
          report={schedulingReport}
          onClose={() => {
            setShowSchedule(false);
            setSchedulingReport(null);
          }}
          onSave={handleScheduleSave}
        />
      )}
    </div>
  );
}
