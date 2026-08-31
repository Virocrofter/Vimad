import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  BedDouble,
  DollarSign,
  Receipt,
  ArrowRight,
  RotateCcw,
  Download,
  Printer,
  ChevronRight,
  Shield,
  Clock,
  FileText,
  XCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Mock Data ─── */
const initialChecklist = [
  {
    id: 'arrivals',
    label: 'Verify all arrivals have been checked in',
    detail: '3 arrivals pending for Room 105, 204, 310',
    severity: 'warning',
  },
  {
    id: 'departures',
    label: 'Verify all departures have been checked out',
    detail: '2 departures pending for Room 312, 118',
    severity: 'warning',
  },
  {
    id: 'no-shows',
    label: 'Review no-show reservations',
    detail: '1 no-show flagged for Robert Chen (Res #4025)',
    severity: 'info',
  },
  {
    id: 'charges',
    label: 'Confirm all charges have been posted',
    detail: '5 unposted room charges detected',
    severity: 'danger',
  },
  {
    id: 'payments',
    label: 'Verify payment batches are balanced',
    detail: 'Cash: $178.50 · Card: $25.00 · Balanced',
    severity: 'success',
  },
  {
    id: 'backup',
    label: 'Database backup completed',
    detail: 'Last backup: 2026-08-12 02:00 AM',
    severity: 'success',
  },
  {
    id: 'rooms',
    label: 'Confirm room status updates',
    detail: '8 rooms marked dirty, 5 due for inspection',
    severity: 'info',
  },
  {
    id: 'rates',
    label: 'Verify rate and availability for new business date',
    detail: 'Rates loaded for Aug 13 — Aug 19',
    severity: 'success',
  },
];

const eodSteps = [
  {
    id: 'backup',
    label: 'Database Backup',
    description: 'Creating incremental backup...',
    duration: 1200,
  },
  {
    id: 'post_charges',
    label: 'Post Room Charges',
    description: 'Posting recurring room charges and taxes...',
    duration: 2500,
  },
  {
    id: 'update_status',
    label: 'Update Room Statuses',
    description: 'Marking departure rooms as dirty...',
    duration: 1500,
  },
  {
    id: 'no_show',
    label: 'Process No-Shows',
    description: 'Applying no-show policies and charges...',
    duration: 1000,
  },
  {
    id: 'reports',
    label: 'Generate Audit Reports',
    description: 'Building reconciliation and management reports...',
    duration: 2000,
  },
  {
    id: 'roll_date',
    label: 'Roll Business Date',
    description: 'Advancing system date to 2026-08-13...',
    duration: 800,
  },
];

const reportData = {
  businessDate: '2026-08-12',
  nextBusinessDate: '2026-08-13',
  summary: {
    totalRooms: 45,
    occupied: 28,
    available: 12,
    ooo: 5,
    arrivals: 3,
    departures: 2,
    noShows: 1,
    walkIns: 1,
  },
  revenue: {
    roomRevenue: 5283.0,
    taxRevenue: 792.45,
    otherRevenue: 1247.0,
    totalRevenue: 7322.45,
  },
  payments: {
    cash: 178.5,
    creditCard: 4125.0,
    directBill: 1850.0,
    other: 450.0,
    totalPayments: 6603.5,
  },
  adjustments: {
    discounts: -320.0,
    writeOffs: 0.0,
    corrections: 45.0,
    totalAdjustments: -275.0,
  },
  balance: {
    opening: 12450.0,
    closing: 19497.45,
    netChange: 7047.45,
  },
};

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function SeverityIcon({ severity }) {
  switch (severity) {
    case 'danger':
      return <XCircle className="h-5 w-5 text-danger" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-accent" />;
    default:
      return <AlertCircle className="h-5 w-5 text-info" />;
  }
}

/* ─── Main Component ─── */
export default function NightAuditPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('checklist'); // checklist | processing | report | error
  const [checklist, setChecklist] = useState(initialChecklist);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isDarkOverride, setIsDarkOverride] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const logEndRef = useRef(null);

  /* Auto-dark-mode default for night audit */
  useEffect(() => {
    const html = document.documentElement;
    const hadLight = html.classList.contains('light');
    const hadDark = html.classList.contains('dark');

    // Force dark mode for night audit
    html.classList.remove('light');
    html.classList.add('dark');

    return () => {
      // Restore previous theme on unmount
      html.classList.remove('dark');
      if (hadLight) html.classList.add('light');
      if (!hadLight && !hadDark) {
        // If no explicit theme was set, check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) html.classList.add('dark');
        else html.classList.add('light');
      }
    };
  }, []);

  /* Toggle dark override manually */
  const toggleDarkOverride = () => {
    const html = document.documentElement;
    setIsDarkOverride((prev) => {
      const next = !prev;
      if (next) {
        html.classList.remove('light');
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
      return next;
    });
  };

  /* Scroll logs to bottom */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const allChecked = checklist.every((item) => {
    // Auto-check success items, require manual check for danger/warning
    if (item.severity === 'success') return true;
    return item.checked;
  });

  const pendingCount = checklist.filter((i) => !i.checked && i.severity !== 'success').length;
  const dangerCount = checklist.filter((i) => i.severity === 'danger' && !i.checked).length;

  const toggleCheck = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const startAudit = () => {
    if (dangerCount > 0) {
      setErrorMessage('Critical items must be resolved before running night audit.');
      return;
    }
    setErrorMessage('');
    setPhase('processing');
    setCurrentStep(0);
    setProgress(0);
    setLogs([
      {
        time: new Date().toLocaleTimeString(),
        message: 'Night audit initiated by Night Manager',
        type: 'info',
      },
    ]);
  };

  /* EOD Processing Simulation */
  useEffect(() => {
    if (phase !== 'processing') return;

    let cancelled = false;
    const runStep = async (stepIndex) => {
      if (stepIndex >= eodSteps.length) {
        if (!cancelled) {
          setLogs((prev) => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              message: 'Night audit completed successfully',
              type: 'success',
            },
          ]);
          setTimeout(() => setPhase('report'), 600);
        }
        return;
      }

      const step = eodSteps[stepIndex];
      setCurrentStep(stepIndex);
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: `Starting: ${step.label}`, type: 'info' },
      ]);

      await new Promise((r) => setTimeout(r, step.duration * 0.6));
      if (cancelled) return;

      setProgress(((stepIndex + 0.5) / eodSteps.length) * 100);
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message: `  ${step.description}`, type: 'muted' },
      ]);

      await new Promise((r) => setTimeout(r, step.duration * 0.4));
      if (cancelled) return;

      setProgress(((stepIndex + 1) / eodSteps.length) * 100);
      setLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          message: `Completed: ${step.label}`,
          type: 'success',
        },
      ]);

      runStep(stepIndex + 1);
    };

    runStep(0);
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const resetAudit = () => {
    setPhase('checklist');
    setChecklist(initialChecklist);
    setCurrentStep(0);
    setProgress(0);
    setLogs([]);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Night Audit</h1>
            <button
              onClick={toggleDarkOverride}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              title="Toggle night audit dark mode"
            >
              {isDarkOverride ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {isDarkOverride ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            Business Date:{' '}
            <span className="font-mono font-medium text-text-primary">
              {reportData.businessDate}
            </span>
            {' · '}
            Next Date:{' '}
            <span className="font-mono font-medium text-text-primary">
              {reportData.nextBusinessDate}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'report' && (
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
            </>
          )}
          {phase !== 'processing' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={phase === 'report' ? resetAudit : startAudit}
              disabled={phase === 'checklist' && !allChecked}
            >
              {phase === 'checklist' && (
                <>
                  <ArrowRight className="mr-1.5 h-4 w-4" /> Run Night Audit
                </>
              )}
              {phase === 'report' && (
                <>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Run Again
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Phase: Checklist */}
      {phase === 'checklist' && (
        <div className="space-y-6">
          {/* Stats Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Pending Items</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold',
                  pendingCount > 0 ? 'text-warning' : 'text-accent'
                )}
              >
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Critical</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold',
                  dangerCount > 0 ? 'text-danger' : 'text-accent'
                )}
              >
                {dangerCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Occupied Tonight</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {reportData.summary.occupied}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(reportData.revenue.totalRevenue)}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{errorMessage}</p>
            </div>
          )}

          {/* Checklist */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Pre-Audit Checklist
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Resolve all critical items before proceeding. Success items are auto-verified.
              </p>
            </div>
            <div className="divide-y divide-border">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4 transition-colors',
                    item.checked ? 'bg-accent/5' : 'hover:bg-surface-elevated'
                  )}
                >
                  <button
                    onClick={() => item.severity !== 'success' && toggleCheck(item.id)}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                      item.checked
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-background hover:border-secondary',
                      item.severity === 'success' && 'opacity-50 cursor-default'
                    )}
                  >
                    {item.checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityIcon severity={item.severity} />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          item.checked
                            ? 'text-text-primary line-through opacity-60'
                            : 'text-text-primary'
                        )}
                      >
                        {item.label}
                      </span>
                      {item.severity === 'success' && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary pl-7">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/reservations/front-desk')}
            >
              Front Desk
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/billing')}>
              Billing & Folio
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/housekeeping')}>
              Housekeeping
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Processing */}
      {phase === 'processing' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-text-primary">Running Night Audit</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Step {currentStep + 1} of {eodSteps.length}: {eodSteps[currentStep]?.label}
            </p>

            {/* Progress Bar */}
            <div className="mx-auto mt-6 max-w-md">
              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-mono text-text-muted">{Math.round(progress)}%</p>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {eodSteps.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  'rounded-lg border px-3 py-2 text-center transition-colors',
                  idx < currentStep
                    ? 'border-accent/20 bg-accent/5'
                    : idx === currentStep
                      ? 'border-secondary/20 bg-secondary/5'
                      : 'border-border bg-surface opacity-50'
                )}
              >
                <p
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-wider',
                    idx < currentStep
                      ? 'text-accent'
                      : idx === currentStep
                        ? 'text-secondary'
                        : 'text-text-muted'
                  )}
                >
                  {idx < currentStep ? 'Done' : idx === currentStep ? 'Running' : 'Pending'}
                </p>
                <p className="mt-0.5 text-xs font-medium text-text-primary truncate">
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          {/* Live Log */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="border-b border-border px-6 py-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Audit Log
              </h3>
              <span className="text-[10px] font-mono text-text-muted">{logs.length} entries</span>
            </div>
            <div className="max-h-64 overflow-auto p-4 space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 text-text-muted">[{log.time}]</span>
                  <span
                    className={cn(
                      log.type === 'success' && 'text-accent',
                      log.type === 'danger' && 'text-danger',
                      log.type === 'warning' && 'text-warning',
                      log.type === 'muted' && 'text-text-muted',
                      log.type === 'info' && 'text-info'
                    )}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Phase: Report */}
      {phase === 'report' && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Night Audit Complete</h2>
              <p className="text-sm text-text-secondary">
                Business date successfully rolled to{' '}
                <span className="font-mono font-medium text-text-primary">
                  {reportData.nextBusinessDate}
                </span>
                . All reports have been generated and archived.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium text-text-secondary border border-border">
                  <Clock className="h-3 w-3" /> Completed at {new Date().toLocaleTimeString()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium text-text-secondary border border-border">
                  <Database className="h-3 w-3" /> Backup saved
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <BedDouble className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Occupancy</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {Math.round((reportData.summary.occupied / reportData.summary.totalRooms) * 100)}%
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {reportData.summary.occupied} / {reportData.summary.totalRooms} rooms
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">RevPAR</span>
              </div>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(reportData.revenue.totalRevenue / reportData.summary.occupied)}
              </p>
              <p className="text-xs text-text-secondary mt-1">Per available room</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(reportData.revenue.totalRevenue)}
              </p>
              <p className="text-xs text-text-secondary mt-1">Incl. tax & other</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Payments</span>
              </div>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(reportData.payments.totalPayments)}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {reportData.summary.noShows} no-show
              </p>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Breakdown */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-background px-6 py-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-secondary" /> Revenue Breakdown
                </h3>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Room Revenue</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.revenue.roomRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Tax Revenue</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.revenue.taxRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Other Revenue</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.revenue.otherRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3 bg-secondary/5">
                  <span className="text-sm font-semibold text-text-primary">Total Revenue</span>
                  <span className="text-sm font-mono font-bold text-secondary">
                    {formatCurrency(reportData.revenue.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-background px-6 py-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-secondary" /> Payment Summary
                </h3>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Cash</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.payments.cash)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Credit Card</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.payments.creditCard)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Direct Bill</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.payments.directBill)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Other</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.payments.other)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3 bg-accent/5">
                  <span className="text-sm font-semibold text-text-primary">Total Payments</span>
                  <span className="text-sm font-mono font-bold text-accent">
                    {formatCurrency(reportData.payments.totalPayments)}
                  </span>
                </div>
              </div>
            </div>

            {/* Adjustments */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-background px-6 py-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Adjustments
                </h3>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Discounts</span>
                  <span className="text-sm font-mono font-medium text-danger">
                    {formatCurrency(reportData.adjustments.discounts)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Write-offs</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.adjustments.writeOffs)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Corrections</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.adjustments.corrections)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3 bg-warning/5">
                  <span className="text-sm font-semibold text-text-primary">Net Adjustments</span>
                  <span className="text-sm font-mono font-bold text-warning">
                    {formatCurrency(reportData.adjustments.totalAdjustments)}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance Summary */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-background px-6 py-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Database className="h-4 w-4 text-secondary" /> Balance Summary
                </h3>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Opening Balance</span>
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(reportData.balance.opening)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-text-secondary">Net Change</span>
                  <span className="text-sm font-mono font-medium text-accent">
                    +{formatCurrency(reportData.balance.netChange)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-3 bg-secondary/5">
                  <span className="text-sm font-semibold text-text-primary">Closing Balance</span>
                  <span className="text-sm font-mono font-bold text-secondary">
                    {formatCurrency(reportData.balance.closing)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-secondary" /> Activity Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Arrivals', value: reportData.summary.arrivals, color: 'text-accent' },
                {
                  label: 'Departures',
                  value: reportData.summary.departures,
                  color: 'text-warning',
                },
                { label: 'No-Shows', value: reportData.summary.noShows, color: 'text-danger' },
                { label: 'Walk-Ins', value: reportData.summary.walkIns, color: 'text-info' },
                { label: 'OOO Rooms', value: reportData.summary.ooo, color: 'text-text-muted' },
                {
                  label: 'Available',
                  value: reportData.summary.available,
                  color: 'text-text-secondary',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border bg-background p-3 text-center"
                >
                  <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
