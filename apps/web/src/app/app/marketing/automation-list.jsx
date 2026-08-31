// pages/app/marketing/automation-list.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  BarChart3,
  Users,
  Mail,
  Bell,
  Workflow,
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar,
  ArrowRight,
  Sparkles,
  PauseCircle,
  PlayCircle,
  Timer,
  RefreshCw,
  GripVertical,
  LayoutTemplate,
  Settings,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Mock Data ─── */
const mockWorkflows = [
  {
    id: 'WF-1001',
    name: 'Welcome Series',
    description: 'Onboarding sequence for new guests after booking confirmation',
    status: 'active',
    trigger: 'Booking Confirmed',
    nodes: 8,
    executions: 12450,
    successRate: 98.2,
    avgDuration: '3.2 days',
    lastRun: '2026-08-12 08:30',
    createdAt: '2026-07-01',
    category: 'onboarding',
    icon: 'mail',
  },
  {
    id: 'WF-1002',
    name: 'Cart Recovery',
    description: 'Recover abandoned bookings with email + SMS follow-up',
    status: 'active',
    trigger: 'Abandoned Cart',
    nodes: 7,
    executions: 3420,
    successRate: 34.5,
    avgDuration: '2.1 days',
    lastRun: '2026-08-12 09:15',
    createdAt: '2026-07-15',
    category: 'retention',
    icon: 'shopping',
  },
  {
    id: 'WF-1003',
    name: 'Birthday Rewards',
    description: 'Automatic birthday perks and loyalty points bonus',
    status: 'active',
    trigger: 'Guest Birthday',
    nodes: 4,
    executions: 560,
    successRate: 100,
    avgDuration: '0 minutes',
    lastRun: '2026-08-12 00:00',
    createdAt: '2026-06-20',
    category: 'loyalty',
    icon: 'gift',
  },
  {
    id: 'WF-1004',
    name: 'Post-Stay Review',
    description: 'Request reviews 3 days after checkout with incentive',
    status: 'scheduled',
    trigger: 'Check-out + 3 days',
    nodes: 5,
    executions: 8920,
    successRate: 42.1,
    avgDuration: '3 days',
    lastRun: '2026-08-11 14:00',
    createdAt: '2026-07-10',
    category: 'feedback',
    icon: 'star',
  },
  {
    id: 'WF-1005',
    name: 'VIP Upgrade Offer',
    description: 'Targeted suite upgrade for platinum members',
    status: 'draft',
    trigger: 'Loyalty Tier Upgrade',
    nodes: 6,
    executions: 0,
    successRate: 0,
    avgDuration: '—',
    lastRun: null,
    createdAt: '2026-08-11',
    category: 'upsell',
    icon: 'crown',
  },
  {
    id: 'WF-1006',
    name: 'Flash Sale Alert',
    description: 'Urgent promotional blast to all subscribers',
    status: 'paused',
    trigger: 'Manual / Scheduled',
    nodes: 3,
    executions: 2100,
    successRate: 28.3,
    avgDuration: '0 minutes',
    lastRun: '2026-08-05 10:00',
    createdAt: '2026-08-01',
    category: 'promotion',
    icon: 'bolt',
  },
  {
    id: 'WF-1007',
    name: 'Corporate Onboarding',
    description: 'Specialized flow for corporate account registrations',
    status: 'active',
    trigger: 'Account Created',
    nodes: 10,
    executions: 340,
    successRate: 95.8,
    avgDuration: '5.4 days',
    lastRun: '2026-08-12 07:00',
    createdAt: '2026-06-01',
    category: 'onboarding',
    icon: 'building',
  },
  {
    id: 'WF-1008',
    name: 'Win-Back Campaign',
    description: "Re-engage guests who haven't booked in 12 months",
    status: 'draft',
    trigger: 'Inactive 12 Months',
    nodes: 9,
    executions: 0,
    successRate: 0,
    avgDuration: '—',
    lastRun: null,
    createdAt: '2026-08-10',
    category: 'retention',
    icon: 'refresh',
  },
];

const statusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    icon: PlayCircle,
    dot: 'bg-accent',
  },
  scheduled: {
    label: 'Scheduled',
    class: 'bg-info/10 text-info border-info/20',
    icon: Clock,
    dot: 'bg-info',
  },
  draft: {
    label: 'Draft',
    class: 'bg-neutral/10 text-text-muted border-border',
    icon: Edit3,
    dot: 'bg-text-muted',
  },
  paused: {
    label: 'Paused',
    class: 'bg-warning/10 text-warning border-warning/20',
    icon: PauseCircle,
    dot: 'bg-warning',
  },
  error: {
    label: 'Error',
    class: 'bg-danger/10 text-danger border-danger/20',
    icon: XCircle,
    dot: 'bg-danger',
  },
};

const categoryMeta = {
  onboarding: { label: 'Onboarding', color: 'bg-blue-500/10 text-blue-500' },
  retention: { label: 'Retention', color: 'bg-purple-500/10 text-purple-500' },
  loyalty: { label: 'Loyalty', color: 'bg-pink-500/10 text-pink-500' },
  feedback: { label: 'Feedback', color: 'bg-green-500/10 text-green-500' },
  upsell: { label: 'Upsell', color: 'bg-amber-500/10 text-amber-500' },
  promotion: { label: 'Promotion', color: 'bg-orange-500/10 text-orange-500' },
};

const iconMap = {
  mail: Mail,
  shopping: Zap,
  gift: Sparkles,
  star: CheckCircle2,
  crown: Users,
  bolt: Zap,
  building: Users,
  refresh: RefreshCw,
};

/* ─── Helpers ─── */
function formatNumber(num) {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last month
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('secondary', 'secondary/10')
              .replace('info', 'info/10')
              .replace('warning', 'warning/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ data, color = '#3B82F6' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 60;
      const y = 20 - ((v - min) / range) * 20;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="64" height="24" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy={20 - ((data[data.length - 1] - min) / range) * 20} r="2" fill={color} />
    </svg>
  );
}

function WorkflowRow({ workflow, onToggle, onDuplicate, onDelete, onEdit, isSelected, onSelect }) {
  const status = statusMeta[workflow.status];
  const StatusIcon = status.icon;
  const category = categoryMeta[workflow.category];
  const Icon = iconMap[workflow.icon] || Workflow;
  const sparkData = useMemo(() => {
    // Generate fake 7-day trend based on execution count
    const base = workflow.executions / 7;
    return Array.from({ length: 7 }, (_, i) => Math.round(base * (0.7 + Math.random() * 0.6)));
  }, [workflow.executions]);

  return (
    <tr
      className={cn(
        'hover:bg-background/50 transition-colors group cursor-pointer',
        isSelected && 'bg-secondary/5'
      )}
      onClick={() => onSelect(workflow.id)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              workflow.status === 'active' ? 'bg-accent/10' : 'bg-surface-elevated'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                workflow.status === 'active' ? 'text-accent' : 'text-text-muted'
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary truncate">{workflow.name}</p>
              {workflow.status === 'active' && (
                <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', status.dot)} />
              )}
            </div>
            <p className="text-xs text-text-muted truncate max-w-[200px]">{workflow.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            status.class
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            category.color
          )}
        >
          {category.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Zap className="h-3 w-3 text-text-muted" />
          {workflow.trigger}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-mono font-medium text-text-primary">
              {formatNumber(workflow.executions)}
            </p>
            <p className="text-[10px] text-text-muted">executions</p>
          </div>
          <MiniSparkline
            data={sparkData}
            color={workflow.status === 'active' ? '#10B981' : '#94A3B8'}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Success</span>
            <span
              className={cn(
                'font-mono font-medium',
                workflow.successRate > 50 ? 'text-accent' : 'text-text-primary'
              )}
            >
              {workflow.successRate}%
            </span>
          </div>
          <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                workflow.successRate > 80
                  ? 'bg-accent'
                  : workflow.successRate > 40
                    ? 'bg-warning'
                    : 'bg-danger'
              )}
              style={{ width: `${workflow.successRate}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs text-text-secondary font-mono">{workflow.avgDuration}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs text-text-muted">{workflow.lastRun || '—'}</p>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(workflow.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          {workflow.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(workflow.id);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-warning/10 hover:text-warning"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : workflow.status === 'paused' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(workflow.id);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
              title="Resume"
            >
              <Play className="h-4 w-4" />
            </button>
          ) : workflow.status === 'draft' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(workflow.id);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
              title="Activate"
            >
              <Play className="h-4 w-4" />
            </button>
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(workflow.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(workflow.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Execution Log Panel ─── */
function ExecutionLogPanel({ workflow, onClose }) {
  const logs = useMemo(() => {
    if (!workflow) return [];
    const entries = [];
    const count = Math.min(20, Math.floor(workflow.executions / 100) + 5);
    for (let i = 0; i < count; i++) {
      const success = Math.random() > 0.05;
      entries.push({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - i * 3600000 * (1 + Math.random() * 4)).toISOString(),
        status: success ? 'success' : 'error',
        node: ['Trigger', 'Wait', 'Send Email', 'Condition', 'End'][Math.floor(Math.random() * 5)],
        message: success ? 'Completed successfully' : 'SMTP timeout after 30s',
        guest: `Guest #${10000 + Math.floor(Math.random() * 5000)}`,
      });
    }
    return entries;
  }, [workflow]);

  if (!workflow) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 border-l border-border bg-surface shadow-xl transform transition-transform">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Execution Log</h3>
            <p className="text-xs text-text-muted">{workflow.name}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    log.status === 'success'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-danger/10 text-danger'
                  )}
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {log.status}
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-text-secondary font-medium">{log.node}</p>
              <p className="text-[10px] text-text-muted">{log.message}</p>
              <p className="text-[10px] text-text-muted">Guest: {log.guest}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function AutomationListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  const stats = useMemo(() => {
    const active = workflows.filter((w) => w.status === 'active');
    const totalExecs = workflows.reduce((s, w) => s + w.executions, 0);
    const avgSuccess =
      workflows.filter((w) => w.executions > 0).reduce((s, w) => s + w.successRate, 0) /
        workflows.filter((w) => w.executions > 0).length || 0;
    return {
      activeCount: active.length,
      totalExecs,
      avgSuccess: Math.round(avgSuccess),
      totalNodes: workflows.reduce((s, w) => s + w.nodes, 0),
    };
  }, [workflows]);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchesQuery =
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || w.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [workflows, query, statusFilter, categoryFilter]);

  const handleToggle = (id) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.status === 'active') return { ...w, status: 'paused' };
        if (w.status === 'paused') return { ...w, status: 'active' };
        if (w.status === 'draft') return { ...w, status: 'active' };
        return w;
      })
    );
  };

  const handleDuplicate = (id) => {
    const original = workflows.find((w) => w.id === id);
    if (!original) return;
    const newWorkflow = {
      ...original,
      id: `WF-${Date.now().toString().slice(-4)}`,
      name: `${original.name} (Copy)`,
      status: 'draft',
      executions: 0,
      successRate: 0,
      lastRun: null,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWorkflows((prev) => [newWorkflow, ...prev]);
  };

  const handleDelete = (id) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    if (selectedWorkflowId === id) setSelectedWorkflowId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Automation Workflows</h1>
          <p className="text-sm text-text-secondary">
            Visual workflow builder for guest engagement automations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/app/marketing')}>
            <BarChart3 className="mr-1.5 h-4 w-4" /> Campaigns
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/marketing/templates')}>
            <LayoutTemplate className="mr-1.5 h-4 w-4" /> Templates
          </Button>
          <Button size="sm" onClick={() => navigate('/app/marketing/automation/builder')}>
            <Plus className="mr-1.5 h-4 w-4" /> New Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Workflows"
          value={stats.activeCount}
          icon={PlayCircle}
          color="text-accent"
          subtext="Currently running"
        />
        <StatCard
          label="Total Executions"
          value={formatNumber(stats.totalExecs)}
          icon={Activity}
          color="text-info"
          subtext="All time"
          trend={8}
        />
        <StatCard
          label="Avg. Success Rate"
          value={`${stats.avgSuccess}%`}
          icon={CheckCircle2}
          color="text-secondary"
          subtext="Across all workflows"
          trend={3}
        />
        <StatCard
          label="Total Nodes"
          value={stats.totalNodes}
          icon={Workflow}
          color="text-warning"
          subtext="In all workflows"
        />
      </div>

      {/* Quick Start Templates */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Quick Start Templates</h3>
            <p className="text-xs text-text-muted">Pre-built workflows you can customize</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide' : 'Show All'}
          </Button>
        </div>
        <div
          className={cn(
            'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 transition-all',
            showTemplates ? '' : 'max-h-24 overflow-hidden'
          )}
        >
          {[
            {
              name: 'Welcome Series',
              icon: Mail,
              desc: 'Onboard new guests',
              color: 'text-blue-500',
              bg: 'bg-blue-500/10',
              nodes: 8,
            },
            {
              name: 'Cart Recovery',
              icon: Zap,
              desc: 'Recover abandoned bookings',
              color: 'text-purple-500',
              bg: 'bg-purple-500/10',
              nodes: 7,
            },
            {
              name: 'Birthday Rewards',
              icon: Sparkles,
              desc: 'Automatic birthday perks',
              color: 'text-pink-500',
              bg: 'bg-pink-500/10',
              nodes: 4,
            },
            {
              name: 'Review Request',
              icon: CheckCircle2,
              desc: 'Post-stay feedback',
              color: 'text-green-500',
              bg: 'bg-green-500/10',
              nodes: 5,
            },
            {
              name: 'Flash Sale',
              icon: Timer,
              desc: 'Urgent promotional blast',
              color: 'text-orange-500',
              bg: 'bg-orange-500/10',
              nodes: 3,
            },
            {
              name: 'VIP Upgrade',
              icon: Users,
              desc: 'Targeted upsell flow',
              color: 'text-amber-500',
              bg: 'bg-amber-500/10',
              nodes: 6,
            },
            {
              name: 'Win-Back',
              icon: RefreshCw,
              desc: 'Re-engage inactive guests',
              color: 'text-cyan-500',
              bg: 'bg-cyan-500/10',
              nodes: 9,
            },
            {
              name: 'Loyalty Points',
              icon: TrendingUp,
              desc: 'Points balance reminder',
              color: 'text-indigo-500',
              bg: 'bg-indigo-500/10',
              nodes: 5,
            },
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => navigate('/app/marketing/automation/builder')}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-secondary/50 hover:shadow-sm"
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  template.bg
                )}
              >
                <template.icon className={cn('h-4 w-4', template.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary">{template.name}</p>
                <p className="text-[10px] text-text-muted truncate">
                  {template.desc} · {template.nodes} nodes
                </p>
              </div>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-text-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search workflows by name or trigger..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryMeta).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-secondary text-white'
                  : 'text-text-secondary hover:bg-surface-elevated'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-white'
                  : 'text-text-secondary hover:bg-surface-elevated'
              )}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Trigger
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Success
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-4 py-3 w-40"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((workflow) => (
                  <WorkflowRow
                    key={workflow.id}
                    workflow={workflow}
                    isSelected={selectedWorkflowId === workflow.id}
                    onSelect={setSelectedWorkflowId}
                    onToggle={handleToggle}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onEdit={(id) => navigate(`/app/marketing/automation/builder?id=${id}`)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                      <Workflow className="mx-auto h-10 w-10 mb-3" />
                      <p>No workflows match your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workflow) => {
            const status = statusMeta[workflow.status];
            const StatusIcon = status.icon;
            const category = categoryMeta[workflow.category];
            const Icon = iconMap[workflow.icon] || Workflow;

            return (
              <div
                key={workflow.id}
                onClick={() => setSelectedWorkflowId(workflow.id)}
                className={cn(
                  'rounded-xl border bg-surface p-5 cursor-pointer transition-all hover:shadow-md',
                  selectedWorkflowId === workflow.id
                    ? 'border-secondary ring-1 ring-secondary/30'
                    : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      workflow.status === 'active' ? 'bg-accent/10' : 'bg-surface-elevated'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        workflow.status === 'active' ? 'text-accent' : 'text-text-muted'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      status.class
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{workflow.name}</h3>
                <p className="text-xs text-text-muted mb-4 line-clamp-2">{workflow.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      category.color
                    )}
                  >
                    {category.label}
                  </span>
                  <span className="text-[10px] text-text-muted">{workflow.nodes} nodes</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-lg font-bold font-mono text-text-primary">
                      {formatNumber(workflow.executions)}
                    </p>
                    <p className="text-[10px] text-text-muted">Executions</p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-lg font-bold font-mono',
                        workflow.successRate > 50 ? 'text-accent' : 'text-text-primary'
                      )}
                    >
                      {workflow.successRate}%
                    </p>
                    <p className="text-[10px] text-text-muted">Success Rate</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/marketing/automation/builder?id=${workflow.id}`);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-secondary/5 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  {workflow.status === 'active' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(workflow.id);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-warning/5 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10 transition-colors"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(workflow.id);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Play className="h-3 w-3" />{' '}
                      {workflow.status === 'draft' ? 'Activate' : 'Resume'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-text-muted">
              <Workflow className="h-10 w-10 mb-3" />
              <p>No workflows match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Execution Log Slide-over */}
      {selectedWorkflowId && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedWorkflowId(null)}
          />
          <ExecutionLogPanel
            workflow={selectedWorkflow}
            onClose={() => setSelectedWorkflowId(null)}
          />
        </>
      )}
    </div>
  );
}

export default AutomationListPage;
