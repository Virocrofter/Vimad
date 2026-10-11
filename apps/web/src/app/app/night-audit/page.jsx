/* apps/web/src/app/app/night-audit/page.jsx */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Moon,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Calendar,
  BarChart3,
  Settings,
  History,
  FileText,
  Download,
  Printer,
  RefreshCw,
  ChevronRight,
  Building2,
  Mail,
  Bell,
  BedDouble,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  X,
  Check,
  Zap,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { nightAuditApi } from '../../../api/night-audit';
import { useProperties } from '../../../hooks/useProperties';
import { toast } from '../../../hooks/use-toast';

// ─── Helpers ───

const severityConfig = {
  danger: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

const statusConfig = {
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  rolled_back: {
    label: 'Rolled Back',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

const defaultSteps = {
  autoPostRoomCharges: true,
  verifyBalances: true,
  generateReports: true,
  closeDay: true,
  processNoShows: true,
  updateRoomStatuses: true,
  loadRatesForNewDate: true,
};

const stepLabels = {
  autoPostRoomCharges: 'Auto-post Room Charges',
  verifyBalances: 'Verify Folio Balances',
  generateReports: 'Generate Daily Reports',
  closeDay: 'Roll Business Date',
  processNoShows: 'Process No-Shows',
  updateRoomStatuses: 'Update Room Statuses',
  loadRatesForNewDate: 'Load Rates for New Date',
};

// ─── Sub-Components ───

function StatCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {subtext && <p className="text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item }) {
  const config = severityConfig[item.severity] || severityConfig.info;
  const Icon = config.icon;
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${config.bg} ${config.border}`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.detail}</p>
      </div>
      {item.count > 0 && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color} bg-white dark:bg-slate-800 border ${config.border}`}
        >
          {item.count}
        </span>
      )}
    </div>
  );
}

function StepToggle({ label, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

function AuditProgress({ steps, currentStep, results }) {
  return (
    <div className="space-y-2">
      {Object.entries(stepLabels).map(([key, label], idx) => {
        const isDone = results[key] !== undefined;
        const isCurrent = idx === currentStep;
        const isPending = idx > currentStep;
        return (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
              isDone
                ? 'bg-emerald-50 dark:bg-emerald-950/20'
                : isCurrent
                  ? 'bg-blue-50 dark:bg-blue-950/20'
                  : 'bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : isCurrent ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                isDone
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isCurrent
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {label}
            </span>
            {isDone && results[key] && typeof results[key] === 'object' && (
              <span className="ml-auto text-xs text-slate-400">
                {JSON.stringify(results[key]).slice(0, 60)}...
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryTable({ audits, onViewReport, onRollback, rollingBack }) {
  if (!audits.length) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No audit history found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Property</th>
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">Completed</th>
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400">By</th>
            <th className="pb-3 font-medium text-slate-500 dark:text-slate-400 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => {
            const status = statusConfig[audit.status] || statusConfig.in_progress;
            const canRollback =
              audit.status === 'completed' &&
              audit.completedAt &&
              new Date().getTime() - new Date(audit.completedAt).getTime() < 24 * 60 * 60 * 1000;
            return (
              <tr
                key={audit.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                  {new Date(audit.auditDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-400">
                  {audit.property?.name || '—'}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="py-3 text-slate-500 dark:text-slate-400 text-xs">
                  {audit.completedAt ? new Date(audit.completedAt).toLocaleString() : '—'}
                </td>
                <td className="py-3 text-slate-500 dark:text-slate-400 text-xs">
                  {audit.results?.completedBy || '—'}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewReport(audit)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="View Report"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canRollback && (
                      <button
                        onClick={() => onRollback(audit.id)}
                        disabled={rollingBack === audit.id}
                        className="rounded-lg p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50"
                        title="Rollback (within 24h)"
                      >
                        {rollingBack === audit.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReportModal({ audit, onClose }) {
  if (!audit) return null;
  const results = audit.results || {};
  const report = results.reportsGenerated;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Night Audit Report
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {audit.property?.name} —{' '}
              {new Date(audit.auditDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              audit.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : audit.status === 'failed'
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
            }`}
          >
            {audit.status === 'completed' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : audit.status === 'failed' ? (
              <XCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
            <div>
              <p className="font-semibold">Audit {audit.status.replace('_', ' ')}</p>
              <p className="text-sm opacity-80">
                Completed at{' '}
                {audit.completedAt ? new Date(audit.completedAt).toLocaleString() : 'N/A'}
                {results.completedBy ? ` by ${results.completedBy}` : ''}
              </p>
            </div>
          </div>

          {/* Daily Stats */}
          {report && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Daily Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {report.arrivals}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Arrivals</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {report.departures}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Departures</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {report.inHouse}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">In House</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {report.noShows}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No-Shows</p>
                </div>
              </div>

              {/* Occupancy */}
              {report.occupancy && (
                <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Occupancy
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {report.occupancy.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${report.occupancy.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{report.occupancy.occupied} occupied</span>
                    <span>{report.occupancy.available} available</span>
                    <span>{report.occupancy.ooo} OOO</span>
                  </div>
                </div>
              )}

              {/* Revenue */}
              {report.revenue && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      ${report.revenue.roomRevenue?.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Room Revenue</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      ${report.revenue.totalRevenue?.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">Total Revenue</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                      ${report.revenue.revPAR?.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-500">RevPAR</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step Results */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Step Results
            </h3>
            <div className="space-y-2">
              {Object.entries(stepLabels).map(([key, label]) => {
                const result = results[key];
                if (result === undefined) return null;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    {typeof result === 'object' && result !== null && (
                      <pre className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded p-2 overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Business Date Roll */}
          {results.businessDateRolled && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Business Date Rolled
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {results.businessDateRolled.previousDate} → {results.businessDateRolled.newDate}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {audit.errorMessage && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">{audit.errorMessage}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify({ audit, results }, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `night-audit-${audit.auditDate?.split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function NightAuditPage() {
  const {
    properties,
    selectedProperty,
    setSelectedProperty,
    isLoading: propertiesLoading,
  } = useProperties();
  const [activeTab, setActiveTab] = useState('run');

  // Run tab state
  const [preChecks, setPreChecks] = useState(null);
  const [auditStatus, setAuditStatus] = useState(null);
  const [steps, setSteps] = useState(defaultSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [loadingPreChecks, setLoadingPreChecks] = useState(false);

  // History tab state
  const [history, setHistory] = useState({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [rollingBack, setRollingBack] = useState(null);

  // Automation tab state
  const [schedule, setSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledTime: '02:00',
    timezone: 'UTC',
    isActive: false,
    autoRun: false,
    steps: defaultSteps,
    notifyEmails: [],
  });
  const [newEmail, setNewEmail] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const propertyId = selectedProperty?.id;

  // ─── Data Fetching ───

  const fetchPreChecks = useCallback(async () => {
    if (!propertyId) return;
    setLoadingPreChecks(true);
    try {
      const res = await nightAuditApi.getPreChecks(propertyId);
      setPreChecks(res.data);
    } catch (err) {
      toast.error('Failed to load pre-audit checks');
      console.error(err);
    } finally {
      setLoadingPreChecks(false);
    }
  }, [propertyId]);

  const fetchStatus = useCallback(async () => {
    if (!propertyId) return;
    try {
      const res = await nightAuditApi.getStatus(propertyId);
      setAuditStatus(res.data);
    } catch (err) {
      console.error('Failed to load audit status:', err);
    }
  }, [propertyId]);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setLoadingHistory(true);
      try {
        const res = await nightAuditApi.getHistory(propertyId, page, 20);
        setHistory(res);
      } catch (err) {
        toast.error('Failed to load audit history');
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    },
    [propertyId]
  );

  const fetchSchedule = useCallback(async () => {
    if (!propertyId) return;
    try {
      const res = await nightAuditApi.getSchedule(propertyId);
      if (res.data) {
        setSchedule(res.data);
        setScheduleForm({
          scheduledTime: res.data.scheduledTime || '02:00',
          timezone: res.data.timezone || 'UTC',
          isActive: res.data.isActive ?? false,
          autoRun: res.data.autoRun ?? false,
          steps: { ...defaultSteps, ...res.data.steps },
          notifyEmails: res.data.notifyEmails || [],
        });
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    const timer = setTimeout(() => {
      fetchPreChecks();
      fetchStatus();
      fetchHistory(1);
      fetchSchedule();
      setHistoryPage(1);
      setRunResult(null);
      setCurrentStep(-1);
    }, 0);
    return () => clearTimeout(timer);
  }, [propertyId, fetchPreChecks, fetchStatus, fetchHistory, fetchSchedule]);

  // ─── Handlers ───

  const handleRunAudit = async () => {
    if (!propertyId) return;
    setIsRunning(true);
    setRunResult(null);
    setCurrentStep(0);

    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await nightAuditApi.run({
        propertyId,
        auditDate: today,
        ...steps,
      });
      setRunResult(res.data);
      setCurrentStep(Object.keys(stepLabels).length);
      toast.success('Night audit completed successfully');
      fetchPreChecks();
      fetchStatus();
      fetchHistory(1);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Audit failed';
      toast.error(message);
      setRunResult({ status: 'failed', errorMessage: message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRollback = async (auditId) => {
    if (
      !confirm(
        'Are you sure you want to rollback this audit? This will reverse posted charges and reset the business date.'
      )
    )
      return;
    setRollingBack(auditId);
    try {
      await nightAuditApi.rollback(auditId);
      toast.success('Audit rolled back successfully');
      fetchHistory(historyPage);
      fetchStatus();
      fetchPreChecks();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rollback failed');
    } finally {
      setRollingBack(null);
    }
  };

  const handleSaveSchedule = async () => {
    if (!propertyId) return;
    setSavingSchedule(true);
    try {
      await nightAuditApi.saveSchedule({
        propertyId,
        ...scheduleForm,
      });
      toast.success('Schedule saved successfully');
      fetchSchedule();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    if (scheduleForm.notifyEmails.includes(newEmail.trim())) return;
    setScheduleForm((prev) => ({
      ...prev,
      notifyEmails: [...prev.notifyEmails, newEmail.trim()],
    }));
    setNewEmail('');
  };

  const handleRemoveEmail = (email) => {
    setScheduleForm((prev) => ({
      ...prev,
      notifyEmails: prev.notifyEmails.filter((e) => e !== email),
    }));
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(history.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `night-audit-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ───

  const tabs = [
    { id: 'run', label: 'Run Audit', icon: Play },
    { id: 'history', label: 'History', icon: History },
    { id: 'automation', label: 'Automation', icon: Settings },
  ];

  const todayStats = auditStatus?.todayStats;
  const canRun = preChecks?.canRunAudit && !preChecks?.summary?.isDayClosed && !isRunning;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-2">
              <Moon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Night Audit
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Close the business day, post charges, and roll to the next date
          </p>
        </div>
        <div className="flex items-center gap-3">
          {properties.length > 1 && (
            <select
              value={propertyId || ''}
              onChange={(e) => {
                const prop = properties.find((p) => p.id === e.target.value);
                setSelectedProperty(prop);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              fetchPreChecks();
              fetchStatus();
            }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day Status Banner */}
      {auditStatus && (
        <div
          className={`rounded-xl p-4 flex items-center gap-4 ${
            auditStatus.isDayClosed
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {auditStatus.isDayClosed ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
          ) : (
            <Clock className="h-6 w-6 text-amber-500 shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={`font-semibold ${auditStatus.isDayClosed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}
            >
              {auditStatus.isDayClosed ? 'Business Day Closed' : 'Business Day Open'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Current business date:{' '}
              {auditStatus.businessDate
                ? new Date(auditStatus.businessDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
              {auditStatus.lastAuditDate &&
                ` | Last audit: ${new Date(auditStatus.lastAuditDate).toLocaleDateString()}`}
            </p>
          </div>
          {todayStats && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {todayStats.occupancyRate}%
                </p>
                <p className="text-xs text-slate-400">Occupancy</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-slate-100">{todayStats.inHouse}</p>
                <p className="text-xs text-slate-400">In House</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {todayStats.arrivals}
                </p>
                <p className="text-xs text-slate-400">Arrivals</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {todayStats.departures}
                </p>
                <p className="text-xs text-slate-400">Departures</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {todayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BedDouble}
            label="Occupied Rooms"
            value={`${todayStats.occupiedRooms}/${todayStats.totalRooms}`}
            subtext={`${todayStats.occupancyRate}% occupancy`}
            color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            icon={Users}
            label="Guests In House"
            value={todayStats.inHouse}
            subtext={`${todayStats.arrivals} arrivals today`}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={DollarSign}
            label="Pending Checkouts"
            value={auditStatus?.pendingCheckouts ?? 0}
            subtext={auditStatus?.pendingCheckouts > 0 ? 'Needs attention' : 'All clear'}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Unbalanced Folios"
            value={auditStatus?.unbalancedFolios ?? 0}
            subtext={auditStatus?.unbalancedFolios > 0 ? 'Review required' : 'All balanced'}
            color="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'run' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Pre-Checks + Steps */}
          <div className="space-y-6">
            {/* Pre-Audit Checklist */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Pre-Audit Checklist
                </h2>
                {loadingPreChecks && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </div>

              {preChecks ? (
                <>
                  <div className="space-y-2 mb-4">
                    {preChecks.checklist.map((item) => (
                      <ChecklistItem key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p
                        className={`text-xl font-bold ${preChecks.blockerCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}
                      >
                        {preChecks.blockerCount}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Blockers</p>
                    </div>
                    <div>
                      <p
                        className={`text-xl font-bold ${preChecks.warningCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}
                      >
                        {preChecks.warningCount}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Warnings</p>
                    </div>
                    <div>
                      <p
                        className={`text-xl font-bold ${preChecks.canRunAudit ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {preChecks.canRunAudit ? 'Yes' : 'No'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Can Run</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  {loadingPreChecks ? 'Loading checks...' : 'Select a property to view checks'}
                </div>
              )}
            </div>

            {/* Audit Steps Configuration */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-500" />
                Audit Steps
              </h2>
              <div className="space-y-2">
                {Object.entries(stepLabels).map(([key, label]) => (
                  <StepToggle
                    key={key}
                    label={label}
                    checked={steps[key]}
                    onChange={(val) => setSteps((prev) => ({ ...prev, [key]: val }))}
                    disabled={isRunning}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Run + Progress */}
          <div className="space-y-6">
            {/* Run Button */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-indigo-500" />
                Execute Night Audit
              </h2>

              {preChecks?.summary?.isDayClosed ? (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    Day Already Closed
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                    The night audit has already been completed for this business date.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Audit Date</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-500 dark:text-slate-400">Property</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedProperty?.name || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-500 dark:text-slate-400">Steps Selected</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {Object.values(steps).filter(Boolean).length} of {Object.keys(steps).length}
                      </span>
                    </div>
                  </div>

                  {!canRun && preChecks && (
                    <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {preChecks.blockerCount > 0
                          ? `${preChecks.blockerCount} blocker(s) must be resolved before running the audit.`
                          : 'Warnings detected. You can still proceed, but review them first.'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleRunAudit}
                    disabled={!canRun || isRunning}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold transition-all ${
                      canRun && !isRunning
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Running Audit...
                      </>
                    ) : (
                      <>
                        <Play className="h-6 w-6" />
                        Run Night Audit
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Progress / Results */}
            {(isRunning || runResult) && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  {runResult?.status === 'failed' ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" /> Audit Failed
                    </>
                  ) : runResult?.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Audit Complete
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Processing...
                    </>
                  )}
                </h2>

                {runResult?.status === 'failed' ? (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                      {runResult.errorMessage}
                    </p>
                  </div>
                ) : runResult?.status === 'completed' ? (
                  <div className="space-y-4">
                    <AuditProgress
                      steps={steps}
                      currentStep={Object.keys(stepLabels).length}
                      results={runResult.results || {}}
                    />
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        Audit completed successfully!
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                        Business date rolled to{' '}
                        {runResult.results?.businessDateRolled?.newDate || 'next day'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AuditProgress steps={steps} currentStep={currentStep} results={{}} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Audit History
              <span className="text-sm font-normal text-slate-400">
                ({history.meta.total} total)
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHistory}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" /> Export
              </button>
              <button
                onClick={() => fetchHistory(historyPage)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
            </div>
          ) : (
            <>
              <HistoryTable
                audits={history.data}
                onViewReport={setSelectedAudit}
                onRollback={handleRollback}
                rollingBack={rollingBack}
              />

              {/* Pagination */}
              {history.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page {history.meta.page} of {history.meta.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = historyPage - 1;
                        setHistoryPage(newPage);
                        fetchHistory(newPage);
                      }}
                      disabled={historyPage <= 1}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        const newPage = historyPage + 1;
                        setHistoryPage(newPage);
                        fetchHistory(newPage);
                      }}
                      disabled={historyPage >= history.meta.totalPages}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              Automation Settings
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Configure automatic night audit execution. When enabled, the audit will run at the
              scheduled time without manual intervention.
            </p>

            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Enable Automation
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automatically run night audit on schedule
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scheduleForm.isActive}
                  onClick={() => setScheduleForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${scheduleForm.isActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${scheduleForm.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>

              {/* Auto Run vs Reminder */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Auto-Run Mode</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {scheduleForm.autoRun
                      ? 'Audit runs automatically without confirmation'
                      : 'Send reminder email only, manual confirmation required'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={scheduleForm.autoRun}
                  onClick={() => setScheduleForm((prev) => ({ ...prev, autoRun: !prev.autoRun }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${scheduleForm.autoRun ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${scheduleForm.autoRun ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>

              {/* Schedule Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, scheduledTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={scheduleForm.timezone}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Denver">America/Denver (MST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  </select>
                </div>
              </div>

              {/* Steps for automation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Automated Steps
                </label>
                <div className="space-y-2">
                  {Object.entries(stepLabels).map(([key, label]) => (
                    <StepToggle
                      key={key}
                      label={label}
                      checked={scheduleForm.steps[key]}
                      onChange={(val) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          steps: { ...prev.steps, [key]: val },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Notification Emails */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notification Emails
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                      placeholder="manager@hotel.com"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleAddEmail}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {scheduleForm.notifyEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {scheduleForm.notifyEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 text-sm"
                      >
                        <Bell className="h-3 w-3" />
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {savingSchedule ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Automation Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schedule Info */}
          {schedule?.nextRunAt && scheduleForm.isActive && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  Next scheduled run
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">
                  {new Date(schedule.nextRunAt).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal audit={selectedAudit} onClose={() => setSelectedAudit(null)} />
    </div>
  );
}
