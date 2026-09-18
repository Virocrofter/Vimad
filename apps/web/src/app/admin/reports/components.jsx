/* src/app/admin/reports/components.jsx */
import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  ShieldCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Copy,
  Check,
  Eye,
  Trash2,
  Edit3,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Mail,
  Send,
  Printer,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Layers,
  PieChart,
  Activity,
  Target,
  Zap,
  Globe,
  Building2,
  Tag,
  Hash,
  Link2,
  ExternalLink,
  Lock,
  Unlock,
  Settings,
  Bell,
  History,
  RotateCcw,
  Save,
  X,
  Loader2,
  MapPin,
  Server,
  Database,
  HardDrive,
  Cloud,
  Wifi,
  WifiOff,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Percent,
  Flag,
  Ban,
  Play,
  Pause,
  Terminal,
  Gauge,
  Crosshair,
  Crown,
  Star,
  Flame,
  MousePointer,
  MousePointerClick,
  Timer,
  PercentIcon,
  BarChart,
  LineChart,
  AreaChart,
  Radar,
  Scan,
  ScanLine,
  ScanSearch,
  Focus,
  Aperture,
  Radio,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Antenna,
  Satellite,
  Orbit,
  Rocket,
  ZapOff,
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryFull,
  Plug,
  PlugZap,
  Unplug,
  CircuitBoard,
  Cpu,
  HardDriveDownload,
  HardDriveUpload,
  Disc,
  Disc3,
  Album,
  FileBarChart,
  FilePieChart,
  FileLineChart,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  LayoutList,
  LayoutGrid,
  Table,
  List,
  ListFilter,
  ListOrdered,
  ListChecks,
  ListTree,
  ListCollapse,
  ListStart,
  ListEnd,
  ListVideo,
  ListMusic,
  ListPlus,
  ListMinus,
  ListX,
  ListRestart,
  ListTodo,
  ListOrderedIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  AlignHorizontalDistributeStart,
  AlignHorizontalDistributeCenter,
  AlignHorizontalDistributeEnd,
  AlignVerticalDistributeStart,
  AlignVerticalDistributeCenter,
  AlignVerticalDistributeEnd,
  Space,
  SpaceIcon,
  StretchHorizontal,
  StretchVertical,
  Move,
  MoveHorizontal,
  MoveVertical,
  MoveDiagonal,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Fullscreen,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  PanelLeftClose,
  PanelRightClose,
  PanelTopClose,
  PanelBottomClose,
  PanelLeftOpen,
  PanelRightOpen,
  PanelTopOpen,
  PanelBottomOpen,
  Sidebar,
  SidebarClose,
  SidebarOpen,
  SidebarIcon,
  LayoutTemplate,
  LayoutPanelLeft,
  LayoutPanelTop,
  LayoutGridIcon,
  Rows3,
  Columns3,
  Grid2x2,
  Grid3x3,
  Grip,
  GripHorizontal,
  GripVertical,
  GripIcon,
  PanelTopDashed,
  PanelBottomDashed,
  PanelLeftDashed,
  PanelRightDashed,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════
   LATENCY SPARKLINE
   ═══════════════════════════════════════════ */
export function LatencySparkline({ data, width = 120, height = 30, color = 'text-secondary' }) {
  if (!data || data.length === 0) return <div className="text-xs text-text-muted">—</div>;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const colorMap = {
    'text-secondary': '#863bff',
    'text-accent': '#22c55e',
    'text-warning': '#f59e0b',
    'text-danger': '#ef4444',
    'text-info': '#3b82f6',
  };

  const strokeColor = colorMap[color] || colorMap['text-secondary'];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   REGION STAT CARD
   ═══════════════════════════════════════════ */
export function RegionStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last period
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('rose-500', 'rose-500/10')
              .replace('emerald-500', 'emerald-500/10')
              .replace('amber-500', 'amber-500/10')
              .replace('blue-500', 'blue-500/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPLIANCE CARD
   ═══════════════════════════════════════════ */
export function ComplianceCard({ report, onView, onDownload, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    complete: {
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      label: 'Complete',
    },
    pending: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      label: 'Pending',
    },
    failed: {
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      label: 'Failed',
    },
    generating: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      label: 'Generating',
    },
  };

  const config = statusConfig[report.status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-5 transition-all hover:shadow-md',
        config.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              config.bg
            )}
          >
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{report.title}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {report.id} &middot; {report.framework}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  config.bg,
                  config.color,
                  config.border
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', config.color.replace('text-', 'bg-'))}
                />
                {config.label}
              </span>
              {report.status === 'complete' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-elevated shadow-xl py-1">
                <button
                  onClick={() => {
                    onView?.(report);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Eye className="h-4 w-4" /> View Report
                </button>
                <button
                  onClick={() => {
                    onDownload?.(report);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(report.id);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Copy className="h-4 w-4" /> Copy ID
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    onDelete?.(report.id);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-text-muted">Period</p>
          <p className="text-text-primary font-medium">{report.period}</p>
        </div>
        <div>
          <p className="text-text-muted">Generated</p>
          <p className="text-text-primary font-medium">{report.generatedAt}</p>
        </div>
        <div>
          <p className="text-text-muted">Records</p>
          <p className="text-text-primary font-medium font-mono">
            {report.recordCount?.toLocaleString() || '—'}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Generated By</p>
          <p className="text-text-primary font-medium">{report.generatedBy}</p>
        </div>
      </div>

      {report.description && (
        <p className="mt-3 text-xs text-text-secondary">{report.description}</p>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <Calendar className="h-3 w-3" />
          <span>{report.period}</span>
        </div>
        <div className="flex items-center gap-2">
          {report.status === 'complete' && (
            <Button size="sm" variant="outline" onClick={() => onDownload?.(report)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onView?.(report)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MIGRATION JOB CARD
   ═══════════════════════════════════════════ */
export function MigrationJobCard({ job, onView, onRetry, onCancel }) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      label: 'Pending',
    },
    running: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      label: 'Running',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      label: 'Completed',
    },
    failed: {
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      label: 'Failed',
    },
    cancelled: {
      icon: X,
      color: 'text-text-muted',
      bg: 'bg-neutral/10',
      border: 'border-border',
      label: 'Cancelled',
    },
  };

  const config = statusConfig[job.status] || statusConfig.pending;
  const Icon = config.icon;
  const progress = job.progress || 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-5 transition-all hover:shadow-md',
        config.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              config.bg
            )}
          >
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{job.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {job.id} &middot; {job.sourceRegion} &rarr; {job.targetRegion}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  config.bg,
                  config.color,
                  config.border
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', config.color.replace('text-', 'bg-'))}
                />
                {config.label}
              </span>
              <span className="text-[10px] text-text-muted">{job.type}</span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-elevated shadow-xl py-1">
                <button
                  onClick={() => {
                    onView?.(job);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Eye className="h-4 w-4" /> View Details
                </button>
                {job.status === 'failed' && (
                  <button
                    onClick={() => {
                      onRetry?.(job.id);
                      setShowActions(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-surface"
                  >
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                )}
                {(job.status === 'pending' || job.status === 'running') && (
                  <button
                    onClick={() => {
                      onCancel?.(job.id);
                      setShowActions(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/5"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-muted">Progress</span>
          <span className={cn('font-mono font-medium', config.color)}>{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              job.status === 'failed'
                ? 'bg-rose-500'
                : job.status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-secondary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-text-muted">Source</p>
          <p className="text-text-primary font-medium">{job.sourceRegion}</p>
        </div>
        <div>
          <p className="text-text-muted">Target</p>
          <p className="text-text-primary font-medium">{job.targetRegion}</p>
        </div>
        <div>
          <p className="text-text-muted">Records</p>
          <p className="text-text-primary font-medium font-mono">
            {job.recordsProcessed?.toLocaleString() || 0} /{' '}
            {job.recordsTotal?.toLocaleString() || '—'}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Started</p>
          <p className="text-text-primary font-medium">{job.startedAt || '—'}</p>
        </div>
      </div>

      {job.errorMessage && (
        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
          <p className="text-xs text-rose-500 font-medium">Error</p>
          <p className="text-xs text-text-secondary mt-0.5">{job.errorMessage}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <Clock className="h-3 w-3" />
          <span>{job.duration || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onView?.(job)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
          {job.status === 'failed' && (
            <Button size="sm" variant="secondary" onClick={() => onRetry?.(job.id)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REGION CARD
   ═══════════════════════════════════════════ */
export function RegionCard({ region, onView, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    active: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      label: 'Active',
    },
    deploying: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      label: 'Deploying',
    },
    maintenance: {
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      label: 'Maintenance',
    },
    degraded: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      label: 'Degraded',
    },
    offline: {
      color: 'text-text-muted',
      bg: 'bg-neutral/10',
      border: 'border-border',
      label: 'Offline',
    },
  };

  const config = statusConfig[region.status] || statusConfig.active;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-5 transition-all hover:shadow-md',
        config.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              config.bg
            )}
          >
            <Globe className={cn('h-5 w-5', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{region.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {region.id} &middot; {region.code}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  config.bg,
                  config.color,
                  config.border
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', config.color.replace('text-', 'bg-'))}
                />
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-surface-elevated shadow-xl py-1">
                <button
                  onClick={() => {
                    onView?.(region);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Eye className="h-4 w-4" /> View Details
                </button>
                <button
                  onClick={() => {
                    onEdit?.(region);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    onDelete?.(region.id);
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-text-muted">Location</p>
          <p className="text-text-primary font-medium">{region.location}</p>
        </div>
        <div>
          <p className="text-text-muted">Tenants</p>
          <p className="text-text-primary font-medium font-mono">
            {region.tenantCount?.toLocaleString() || 0}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Latency</p>
          <p className="text-text-primary font-medium">{region.latencyMs || '—'} ms</p>
        </div>
        <div>
          <p className="text-text-muted">Uptime</p>
          <p
            className={cn(
              'font-medium font-mono',
              (region.uptimePct || 0) >= 99.9
                ? 'text-emerald-500'
                : (region.uptimePct || 0) >= 99
                  ? 'text-amber-500'
                  : 'text-rose-500'
            )}
          >
            {region.uptimePct ? `${region.uptimePct}%` : '—'}
          </p>
        </div>
      </div>

      {region.latencyHistory && region.latencyHistory.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-text-muted mb-1">Latency Trend (24h)</p>
          <LatencySparkline
            data={region.latencyHistory}
            color={region.latencyMs > 100 ? 'text-warning' : 'text-accent'}
          />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <Server className="h-3 w-3" />
          <span>{region.serverCount || 0} servers</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onView?.(region)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit?.(region)}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT STAT CARD
   ═══════════════════════════════════════════ */
export function ReportStatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last period
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('rose-500', 'rose-500/10')
              .replace('emerald-500', 'emerald-500/10')
              .replace('amber-500', 'amber-500/10')
              .replace('blue-500', 'blue-500/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT SCHEDULE CARD
   ═══════════════════════════════════════════ */
export function ReportScheduleCard({ schedule, onEdit, onDelete, onRunNow }) {
  const [expanded, setExpanded] = useState(false);

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
            <Calendar className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{schedule.name}</h3>
            <p className="text-xs text-text-muted font-mono">{schedule.id}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  schedule.enabled
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-neutral/10 text-text-muted border-border'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    schedule.enabled ? 'bg-emerald-500' : 'bg-text-muted'
                  )}
                />
                {schedule.enabled ? 'Active' : 'Paused'}
              </span>
              <span className="text-[10px] text-text-muted">
                {frequencyLabels[schedule.frequency] || schedule.frequency}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(schedule)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(schedule.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-rose-500/10 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-text-muted">Format</p>
          <p className="text-text-primary font-medium uppercase">{schedule.format}</p>
        </div>
        <div>
          <p className="text-text-muted">Recipients</p>
          <p className="text-text-primary font-medium">
            {schedule.recipients?.length || 0} email(s)
          </p>
        </div>
        <div>
          <p className="text-text-muted">Next Run</p>
          <p className="text-text-primary font-medium">{schedule.nextRun || '—'}</p>
        </div>
        <div>
          <p className="text-text-muted">Last Run</p>
          <p className="text-text-primary font-medium">{schedule.lastRun || 'Never'}</p>
        </div>
      </div>

      {schedule.recipients && schedule.recipients.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-text-muted mb-1">Recipients</p>
          <div className="flex flex-wrap gap-1">
            {schedule.recipients.map((email) => (
              <span
                key={email}
                className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary"
              >
                <Mail className="inline h-2.5 w-2.5 mr-1" />
                {email}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-text-muted">
          {schedule.framework} &middot; {schedule.reportType}
        </span>
        {schedule.enabled && (
          <Button size="sm" variant="outline" onClick={() => onRunNow?.(schedule)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Run Now
          </Button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT BUILDER PREVIEW
   ═══════════════════════════════════════════ */
export function ReportBuilderPreview({ config, data }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-secondary" /> Preview
        </h3>
        <span className="text-xs text-text-muted">{data?.length || 0} records</span>
      </div>

      {data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {config.columns?.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-background/50">
                  {config.columns?.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-xs text-text-primary">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 5 && (
            <p className="text-xs text-text-muted text-center py-2">+{data.length - 5} more rows</p>
          )}
        </div>
      ) : (
        <div className="py-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-text-muted mb-2" />
          <p className="text-xs text-text-muted">No preview data available</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════ */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs text-text-muted max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
