/* src/app/admin/profiler/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Cpu,
  MemoryStick,
  Timer,
  Flame,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Layers,
  Server,
  Database,
  Globe,
  Wifi,
  HardDrive,
  FileCode,
  Package,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Mock Profiler Data ─── */
const profilerRuns = [
  {
    id: 'prof-001',
    timestamp: '2026-08-16 14:32:15',
    duration: 2847,
    route: '/api/v2/reservations',
    method: 'GET',
    status: 200,
    totalTime: 2847,
    dbTime: 1245,
    renderTime: 0,
    memoryPeak: 45.2,
    cpuPercent: 12.4,
    queries: 8,
    queryTime: 890,
    cacheHits: 12,
    cacheMisses: 3,
    externalCalls: 2,
    externalTime: 340,
    spans: [
      { name: 'auth.middleware', time: 45, type: 'middleware', depth: 0 },
      { name: 'cache.check', time: 12, type: 'cache', depth: 1 },
      {
        name: 'db.query: reservations',
        time: 890,
        type: 'db',
        depth: 1,
        query: 'SELECT * FROM reservations WHERE check_in > $1 ORDER BY check_in LIMIT 50',
      },
      {
        name: 'db.query: guests',
        time: 245,
        type: 'db',
        depth: 1,
        query: 'SELECT * FROM guests WHERE id IN (...)',
      },
      { name: 'serialize', time: 340, type: 'compute', depth: 1 },
      { name: 'external: stripe', time: 340, type: 'external', depth: 1 },
      { name: 'response.send', time: 12, type: 'io', depth: 0 },
    ],
    slowQueries: [
      {
        query: 'SELECT * FROM reservations WHERE check_in > $1 ORDER BY check_in LIMIT 50',
        time: 890,
        rows: 12400,
      },
    ],
    memoryBreakdown: [
      { name: 'Heap Used', value: 38.4, total: 64 },
      { name: 'Stack', value: 2.1, total: 8 },
      { name: 'Buffers', value: 4.7, total: 16 },
    ],
  },
  {
    id: 'prof-002',
    timestamp: '2026-08-16 14:31:42',
    duration: 523,
    route: '/api/v2/guests/:id',
    method: 'GET',
    status: 200,
    totalTime: 523,
    dbTime: 180,
    renderTime: 0,
    memoryPeak: 12.8,
    cpuPercent: 3.2,
    queries: 3,
    queryTime: 180,
    cacheHits: 8,
    cacheMisses: 1,
    externalCalls: 0,
    externalTime: 0,
    spans: [
      { name: 'auth.middleware', time: 32, type: 'middleware', depth: 0 },
      { name: 'cache.check', time: 8, type: 'cache', depth: 1 },
      { name: 'db.query: guest', time: 120, type: 'db', depth: 1 },
      { name: 'db.query: reservations', time: 60, type: 'db', depth: 1 },
      { name: 'serialize', time: 45, type: 'compute', depth: 1 },
      { name: 'response.send', time: 5, type: 'io', depth: 0 },
    ],
    slowQueries: [],
    memoryBreakdown: [
      { name: 'Heap Used', value: 10.2, total: 64 },
      { name: 'Stack', value: 0.8, total: 8 },
      { name: 'Buffers', value: 1.8, total: 16 },
    ],
  },
  {
    id: 'prof-003',
    timestamp: '2026-08-16 14:30:18',
    duration: 4520,
    route: '/api/v2/reports/revenue',
    method: 'POST',
    status: 200,
    totalTime: 4520,
    dbTime: 3200,
    renderTime: 0,
    memoryPeak: 128.4,
    cpuPercent: 34.8,
    queries: 24,
    queryTime: 3200,
    cacheHits: 4,
    cacheMisses: 20,
    externalCalls: 1,
    externalTime: 180,
    spans: [
      { name: 'auth.middleware', time: 38, type: 'middleware', depth: 0 },
      { name: 'validate.body', time: 12, type: 'compute', depth: 0 },
      {
        name: 'db.query: revenue_agg',
        time: 2100,
        type: 'db',
        depth: 1,
        query:
          "SELECT date_trunc('day', created_at), SUM(amount) FROM payments WHERE created_at > $1 GROUP BY 1",
      },
      { name: 'db.query: reservations', time: 890, type: 'db', depth: 1 },
      { name: 'db.query: refunds', time: 210, type: 'db', depth: 1 },
      { name: 'compute.aggregations', time: 340, type: 'compute', depth: 1 },
      { name: 'external: analytics', time: 180, type: 'external', depth: 1 },
      { name: 'serialize', time: 120, type: 'compute', depth: 1 },
      { name: 'response.send', time: 18, type: 'io', depth: 0 },
    ],
    slowQueries: [
      {
        query:
          "SELECT date_trunc('day', created_at), SUM(amount) FROM payments WHERE created_at > $1 GROUP BY 1",
        time: 2100,
        rows: 89000,
      },
      {
        query: 'SELECT * FROM reservations WHERE property_id = $1 AND check_in BETWEEN $2 AND $3',
        time: 890,
        rows: 4200,
      },
    ],
    memoryBreakdown: [
      { name: 'Heap Used', value: 112.4, total: 128 },
      { name: 'Stack', value: 4.2, total: 8 },
      { name: 'Buffers', value: 11.8, total: 16 },
    ],
  },
  {
    id: 'prof-004',
    timestamp: '2026-08-16 14:29:55',
    duration: 180,
    route: '/api/v2/health',
    method: 'GET',
    status: 200,
    totalTime: 180,
    dbTime: 45,
    renderTime: 0,
    memoryPeak: 8.2,
    cpuPercent: 1.1,
    queries: 1,
    queryTime: 45,
    cacheHits: 2,
    cacheMisses: 0,
    externalCalls: 0,
    externalTime: 0,
    spans: [
      { name: 'auth.middleware', time: 15, type: 'middleware', depth: 0 },
      { name: 'db.query: health_check', time: 45, type: 'db', depth: 1 },
      { name: 'response.send', time: 3, type: 'io', depth: 0 },
    ],
    slowQueries: [],
    memoryBreakdown: [
      { name: 'Heap Used', value: 6.4, total: 64 },
      { name: 'Stack', value: 0.4, total: 8 },
      { name: 'Buffers', value: 1.4, total: 16 },
    ],
  },
  {
    id: 'prof-005',
    timestamp: '2026-08-16 14:28:30',
    duration: 12500,
    route: '/api/v2/batch/import',
    method: 'POST',
    status: 500,
    totalTime: 12500,
    dbTime: 8200,
    renderTime: 0,
    memoryPeak: 512.0,
    cpuPercent: 78.5,
    queries: 156,
    queryTime: 8200,
    cacheHits: 12,
    cacheMisses: 144,
    externalCalls: 4,
    externalTime: 1200,
    spans: [
      { name: 'auth.middleware', time: 42, type: 'middleware', depth: 0 },
      { name: 'parse.csv', time: 890, type: 'compute', depth: 0 },
      { name: 'db.transaction.begin', time: 12, type: 'db', depth: 0 },
      { name: 'db.batch.insert', time: 6200, type: 'db', depth: 1 },
      { name: 'db.index.update', time: 1800, type: 'db', depth: 1 },
      { name: 'external: validate', time: 1200, type: 'external', depth: 1 },
      { name: 'db.transaction.rollback', time: 45, type: 'db', depth: 0 },
      { name: 'error.handler', time: 120, type: 'compute', depth: 0 },
      { name: 'response.send', time: 8, type: 'io', depth: 0 },
    ],
    slowQueries: [
      {
        query: 'INSERT INTO reservations (...) VALUES (...), (...), ... 5000 rows',
        time: 6200,
        rows: 5000,
      },
      {
        query: 'UPDATE search_index SET ... WHERE reservation_id IN (...)',
        time: 1800,
        rows: 5000,
      },
    ],
    memoryBreakdown: [
      { name: 'Heap Used', value: 480.0, total: 512 },
      { name: 'Stack', value: 6.8, total: 8 },
      { name: 'Buffers', value: 25.2, total: 32 },
    ],
  },
  {
    id: 'prof-006',
    timestamp: '2026-08-16 14:27:12',
    duration: 890,
    route: '/api/v2/channel-manager/sync',
    method: 'POST',
    status: 200,
    totalTime: 890,
    dbTime: 340,
    renderTime: 0,
    memoryPeak: 28.4,
    cpuPercent: 8.9,
    queries: 6,
    queryTime: 340,
    cacheHits: 18,
    cacheMisses: 2,
    externalCalls: 3,
    externalTime: 420,
    spans: [
      { name: 'auth.middleware', time: 28, type: 'middleware', depth: 0 },
      { name: 'db.query: availability', time: 180, type: 'db', depth: 1 },
      { name: 'db.query: rates', time: 120, type: 'db', depth: 1 },
      { name: 'external: booking.com', time: 180, type: 'external', depth: 1 },
      { name: 'external: expedia', time: 140, type: 'external', depth: 1 },
      { name: 'external: airbnb', time: 100, type: 'external', depth: 1 },
      { name: 'response.send', time: 5, type: 'io', depth: 0 },
    ],
    slowQueries: [],
    memoryBreakdown: [
      { name: 'Heap Used', value: 22.4, total: 64 },
      { name: 'Stack', value: 1.8, total: 8 },
      { name: 'Buffers', value: 4.2, total: 16 },
    ],
  },
];

/* ─── Type Colors ─── */
const typeMeta = {
  middleware: { color: 'bg-info', text: 'text-info', label: 'Middleware' },
  cache: { color: 'bg-accent', text: 'text-accent', label: 'Cache' },
  db: { color: 'bg-secondary', text: 'text-secondary', label: 'Database' },
  compute: { color: 'bg-warning', text: 'text-warning', label: 'Compute' },
  external: { color: 'bg-purple-500', text: 'text-purple-500', label: 'External' },
  io: { color: 'bg-text-muted', text: 'text-text-muted', label: 'I/O' },
};

/* ─── Helpers ─── */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatusColor(status) {
  if (status >= 500) return 'text-danger';
  if (status >= 400) return 'text-warning';
  return 'text-accent';
}

function getStatusBg(status) {
  if (status >= 500) return 'bg-danger/10 text-danger border-danger/20';
  if (status >= 400) return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-accent/10 text-accent border-accent/20';
}

/* ─── Stat Card ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
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
              {trend}% vs avg
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
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Span Tree ─── */
function SpanTree({ spans, totalTime }) {
  const maxTime = Math.max(...spans.map((s) => s.time));

  return (
    <div className="space-y-1">
      {spans.map((span, i) => {
        const meta = typeMeta[span.type] || typeMeta.compute;
        const pct = (span.time / totalTime) * 100;
        const barWidth = (span.time / maxTime) * 100;
        const indent = span.depth * 24;

        return (
          <div
            key={i}
            className="group relative flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-background/50 transition-colors"
            style={{ paddingLeft: `${12 + indent}px` }}
          >
            {/* Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 rounded-md bg-current opacity-5 transition-opacity group-hover:opacity-10"
              style={{ width: `${barWidth}%`, color: 'inherit' }}
            />

            {/* Type indicator */}
            <div className={cn('h-2 w-2 rounded-full shrink-0', meta.color)} />

            {/* Name */}
            <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{span.name}</span>

            {/* Query preview */}
            {span.query && (
              <span className="hidden sm:inline text-xs text-text-muted truncate max-w-[200px] font-mono">
                {span.query.slice(0, 60)}...
              </span>
            )}

            {/* Time */}
            <span className="text-xs font-mono font-medium text-text-secondary shrink-0">
              {formatDuration(span.time)}
            </span>

            {/* Percentage */}
            <span className={cn('text-xs font-mono shrink-0 w-12 text-right', meta.text)}>
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Flame Graph (Simple) ─── */
function FlameGraph({ spans, totalTime }) {
  const rows = [];
  const maxDepth = Math.max(...spans.map((s) => s.depth));

  for (let d = 0; d <= maxDepth; d++) {
    const rowSpans = spans.filter((s) => s.depth === d);
    if (rowSpans.length === 0) continue;

    let currentX = 0;
    const blocks = rowSpans.map((span, i) => {
      const width = (span.time / totalTime) * 100;
      const meta = typeMeta[span.type] || typeMeta.compute;
      const block = {
        left: currentX,
        width,
        span,
        meta,
      };
      currentX += width;
      return block;
    });

    rows.push({ depth: d, blocks });
  }

  return (
    <div className="space-y-0.5">
      {rows.map((row) => (
        <div key={row.depth} className="relative h-6">
          {row.blocks.map((block, i) => (
            <div
              key={i}
              className={cn(
                'absolute top-0 h-full rounded-sm flex items-center px-1.5 overflow-hidden',
                block.meta.color,
                block.width < 8 && 'min-w-[4px]'
              )}
              style={{
                left: `${block.left}%`,
                width: `${block.width}%`,
              }}
              title={`${block.span.name}: ${formatDuration(block.span.time)}`}
            >
              {block.width > 12 && (
                <span className="text-[10px] font-medium text-white truncate">
                  {block.span.name}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Memory Bar ─── */
function MemoryBar({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-2">
      <div className="flex h-4 w-full rounded-full overflow-hidden">
        {data.map((d, i) => {
          const colors = ['bg-secondary', 'bg-accent', 'bg-info', 'bg-warning'];
          const pct = (d.value / total) * 100;
          return (
            <div
              key={i}
              className={cn('h-full', colors[i % colors.length])}
              style={{ width: `${pct}%` }}
              title={`${d.name}: ${d.value}MB`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.map((d, i) => {
          const colors = ['bg-secondary', 'bg-accent', 'bg-info', 'bg-warning'];
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn('h-2 w-2 rounded-full', colors[i % colors.length])} />
              <span className="text-xs text-text-secondary">{d.name}</span>
              <span className="text-xs font-mono font-medium text-text-primary">{d.value}MB</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Detail Drawer ─── */
function DetailDrawer({ run, onClose }) {
  const [activeTab, setActiveTab] = useState('timeline');
  if (!run) return null;

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'flame', label: 'Flame Graph', icon: Flame },
    { id: 'queries', label: 'Slow Queries', icon: Database },
    { id: 'memory', label: 'Memory', icon: MemoryStick },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  getStatusBg(run.status)
                )}
              >
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{run.route}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-xs font-mono font-medium', getStatusColor(run.status))}>
                    {run.method} {run.status}
                  </span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{run.id}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">{run.timestamp}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
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
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Total Time</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                {formatDuration(run.totalTime)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">DB Time</p>
              <p className="mt-1 text-xl font-bold font-mono text-secondary">
                {formatDuration(run.dbTime)}
              </p>
              <p className="text-xs text-text-muted">
                {((run.dbTime / run.totalTime) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Queries</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">{run.queries}</p>
              <p className="text-xs text-text-muted">{run.cacheHits} cache hits</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Memory Peak</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                {run.memoryPeak}MB
              </p>
              <p className="text-xs text-text-muted">CPU {run.cpuPercent}%</p>
            </div>
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Execution Timeline</h3>
              <SpanTree spans={run.spans} totalTime={run.totalTime} />
            </div>
          )}

          {/* Flame Graph Tab */}
          {activeTab === 'flame' && (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Flame Graph</h3>
              <div className="flex flex-wrap gap-3 text-xs">
                {Object.entries(typeMeta).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={cn('h-2.5 w-2.5 rounded-sm', meta.color)} />
                    <span className="text-text-secondary">{meta.label}</span>
                  </div>
                ))}
              </div>
              <FlameGraph spans={run.spans} totalTime={run.totalTime} />
            </div>
          )}

          {/* Queries Tab */}
          {activeTab === 'queries' && (
            <div className="space-y-3">
              {run.slowQueries.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-accent mb-3" />
                  <p className="text-sm text-text-muted">No slow queries detected</p>
                </div>
              ) : (
                run.slowQueries.map((sq, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-text-muted">Query #{i + 1}</span>
                      <span className="text-xs font-mono font-medium text-danger">
                        {formatDuration(sq.time)}
                      </span>
                    </div>
                    <div className="rounded-md bg-background border border-border p-3">
                      <code className="text-xs font-mono text-text-primary whitespace-pre-wrap">
                        {sq.query}
                      </code>
                    </div>
                    <p className="text-xs text-text-muted">
                      {sq.rows.toLocaleString()} rows affected
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Memory Breakdown</h3>
              <MemoryBar data={run.memoryBreakdown} />
              <div className="grid grid-cols-3 gap-4 pt-2">
                {run.memoryBreakdown.map((d, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-text-muted">{d.name}</p>
                    <p className="text-lg font-bold font-mono text-text-primary">{d.value}MB</p>
                    <p className="text-xs text-text-muted">of {d.total}MB</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ProfilerPage() {
  const navigate = useNavigate();
  const [runs] = useState(profilerRuns);
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'duration', dir: 'desc' });
  const [selectedRun, setSelectedRun] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredRuns = useMemo(() => {
    let result = runs.filter((r) => {
      const matchesQuery =
        !query ||
        r.route.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase());
      const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'error' ? r.status >= 400 : r.status < 400);
      return matchesQuery && matchesMethod && matchesStatus;
    });

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      return sortConfig.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [runs, query, methodFilter, statusFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: runs.length,
      avgDuration: Math.round(runs.reduce((s, r) => s + r.totalTime, 0) / runs.length),
      avgDbTime: Math.round(runs.reduce((s, r) => s + r.dbTime, 0) / runs.length),
      totalQueries: runs.reduce((s, r) => s + r.queries, 0),
      errors: runs.filter((r) => r.status >= 400).length,
      maxMemory: Math.max(...runs.map((r) => r.memoryPeak)),
    }),
    [runs]
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">API Profiler</h1>
          <p className="text-sm text-text-secondary">Performance traces and request profiling</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          icon={Timer}
          color="text-text-primary"
          subtext={`${runs.length} requests`}
        />
        <StatCard
          label="Avg DB Time"
          value={formatDuration(stats.avgDbTime)}
          icon={Database}
          color="text-secondary"
          subtext={`${stats.totalQueries} total queries`}
        />
        <StatCard
          label="Errors"
          value={stats.errors}
          icon={AlertTriangle}
          color={stats.errors > 0 ? 'text-danger' : 'text-accent'}
          subtext={stats.errors > 0 ? 'Needs attention' : 'All healthy'}
        />
        <StatCard
          label="Peak Memory"
          value={`${stats.maxMemory}MB`}
          icon={MemoryStick}
          color="text-warning"
          subtext="Highest recorded"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by route or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success (2xx)</option>
                <option value="error">Error (4xx/5xx)</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setMethodFilter('all');
                setStatusFilter('all');
                setQuery('');
              }}
              className="text-xs text-secondary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredRuns.length}</span> of{' '}
        {runs.length} traces
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {[
                  { key: 'route', label: 'Route' },
                  { key: 'method', label: 'Method' },
                  { key: 'status', label: 'Status' },
                  { key: 'duration', label: 'Duration' },
                  { key: 'dbTime', label: 'DB Time' },
                  { key: 'queries', label: 'Queries' },
                  { key: 'memoryPeak', label: 'Memory' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key &&
                        (sortConfig.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRuns.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRun(run)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{run.route}</p>
                      <p className="text-[10px] text-text-muted font-mono">{run.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-medium text-text-secondary">
                      {run.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        getStatusBg(run.status)
                      )}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-sm font-mono font-medium',
                        run.totalTime > 3000
                          ? 'text-danger'
                          : run.totalTime > 1000
                            ? 'text-warning'
                            : 'text-accent'
                      )}
                    >
                      {formatDuration(run.totalTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-text-secondary">
                      {formatDuration(run.dbTime)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">{run.queries}</span>
                      {run.cacheHits > 0 && (
                        <span className="text-[10px] text-accent">+{run.cacheHits} cache</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-text-secondary">
                      {run.memoryPeak}MB
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRun(run);
                      }}
                    >
                      <Activity className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredRuns.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Activity className="mx-auto h-10 w-10 mb-3" />
                    <p>No traces match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedRun && <DetailDrawer run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </div>
  );
}
