/* src/app/admin/profiler/SlowQueryModal.jsx */
import { useState } from 'react';
import {
  X, Clock, Database, Zap, Copy, Check, Play, AlertTriangle,
  BarChart3, Layers, ArrowRight, ChevronRight, ChevronDown,
  ChevronUp, Search, Filter
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { formatDuration, formatNumber } from './data';

/* ─── Mock Execution Plan ─── */
function generateExplainPlan(query) {
  return [
    { id: 1, operation: 'Seq Scan', table: query.table, cost: '0.00..28400.00', rows: query.rowsExamined, width: 1240, actualTime: `${(query.avgDuration * 0.6).toFixed(2)}..${(query.avgDuration * 0.95).toFixed(2)}`, loops: 1, detail: null },
    { id: 2, operation: 'Filter', table: null, cost: '28400.00..28400.00', rows: query.rowsReturned, width: 1240, actualTime: `${(query.avgDuration * 0.95).toFixed(2)}..${query.avgDuration.toFixed(2)}`, loops: 1, detail: `(${query.query.includes('status') ? "status = ANY('{confirmed,checked_in}'::text[])" : 'custom filter'})` },
    ...(query.query.includes('JOIN') ? [
      { id: 3, operation: 'Hash Join', table: 'guests', cost: '28400.00..31200.00', rows: Math.round(query.rowsReturned * 1.2), width: 2100, actualTime: `${(query.avgDuration * 0.7).toFixed(2)}..${(query.avgDuration * 0.98).toFixed(2)}`, loops: 1, detail: 'Hash Cond: (r.guest_id = g.id)' },
      { id: 4, operation: 'Hash', table: null, cost: '0.00..2800.00', rows: 42000, width: 680, actualTime: `${(query.avgDuration * 0.1).toFixed(2)}..${(query.avgDuration * 0.15).toFixed(2)}`, loops: 1, detail: null },
      { id: 5, operation: 'Seq Scan', table: 'guests', cost: '0.00..2800.00', rows: 42000, width: 680, actualTime: `${(query.avgDuration * 0.05).toFixed(2)}..${(query.avgDuration * 0.12).toFixed(2)}`, loops: 1, detail: null },
    ] : []),
    ...(query.query.includes('payments') ? [
      { id: 6, operation: 'Hash Left Join', table: 'payments', cost: '31200.00..35600.00', rows: Math.round(query.rowsReturned * 1.5), width: 3200, actualTime: `${(query.avgDuration * 0.75).toFixed(2)}..${query.avgDuration.toFixed(2)}`, loops: 1, detail: 'Hash Cond: (r.id = p.reservation_id)' },
    ] : []),
  ];
}

/* ─── Mock Index Analysis ─── */
function generateIndexAnalysis(query) {
  const analyses = [
    {
      title: 'Missing Composite Index',
      severity: 'critical',
      description: `Table ${query.table} is missing an index on the filtered columns. Current query performs a sequential scan on ${formatNumber(query.rowsExamined)} rows.`,
      recommendation: query.suggestedIndex || `CREATE INDEX idx_${query.table}_composite ON ${query.table}(filtered_columns);`,
      estimatedImprovement: `${Math.round((1 - (query.rowsReturned / query.rowsExamined)) * 100)}% reduction in rows scanned`,
    },
    {
      title: 'Inefficient JOIN Order',
      severity: query.query.includes('JOIN') ? 'medium' : 'low',
      description: 'The query planner is choosing a suboptimal join order. Consider rewriting with explicit join order or using CTEs.',
      recommendation: 'Rewrite query to use CTEs for intermediate results or add join_collapse_limit hint.',
      estimatedImprovement: '20-40% latency reduction',
    },
    {
      title: 'Over-fetching Columns',
      severity: 'low',
      description: 'Query selects all columns (*) when only a subset is needed by the application.',
      recommendation: 'Replace SELECT * with specific column list. Estimated 15% reduction in I/O.',
      estimatedImprovement: '15% I/O reduction',
    },
  ];
  return analyses;
}

export default function SlowQueryModal({ query, onClose, onApplyRecommendation }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set([1]));

  if (!query) return null;

  const explainPlan = generateExplainPlan(query);
  const indexAnalysis = generateIndexAnalysis(query);

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query.query);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleCopyIndex = () => {
    if (query.suggestedIndex) {
      navigator.clipboard.writeText(query.suggestedIndex);
      setCopiedIndex(true);
      setTimeout(() => setCopiedIndex(false), 2000);
    }
  };

  const toggleNode = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'execution', label: 'Execution Plan', icon: Layers },
    { id: 'indexes', label: 'Index Analysis', icon: Database },
    { id: 'history', label: 'Call History', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <Clock className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Slow Query Analyzer</h3>
              <p className="text-xs text-text-muted font-mono">{query.id} · {query.endpoint}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-surface/50 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors -mb-px',
                    active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Query */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Query</p>
                  <button
                    onClick={handleCopyQuery}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated"
                  >
                    {copiedQuery ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                    {copiedQuery ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-lg bg-background border border-border p-4 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {query.query}
                </pre>
              </div>

              {/* Normalized */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Normalized Pattern</p>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <code className="text-xs font-mono text-text-secondary">{query.normalized}</code>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase">Avg Duration</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-danger">{formatDuration(query.avgDuration)}</p>
                  <p className="text-[10px] text-text-muted">p95: {formatDuration(query.p95Duration)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase">Max Duration</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-warning">{formatDuration(query.maxDuration)}</p>
                  <p className="text-[10px] text-text-muted">Worst case</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase">Call Count</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{formatNumber(query.callCount)}</p>
                  <p className="text-[10px] text-text-muted">Total executions</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase">Efficiency</p>
                  <p className={cn('mt-1 text-2xl font-bold font-mono', query.rowsReturned / query.rowsExamined < 0.001 ? 'text-danger' : 'text-accent')}>
                    {((query.rowsReturned / query.rowsExamined) * 100).toFixed(3)}%
                  </p>
                  <p className="text-[10px] text-text-muted">rows returned / examined</p>
                </div>
              </div>

              {/* Tenant & Endpoint */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase mb-1">Tenant</p>
                  <p className="text-sm font-medium text-text-primary">{query.tenantName}</p>
                  <p className="text-xs text-text-muted font-mono">{query.tenant}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase mb-1">Endpoint</p>
                  <p className="text-sm font-medium text-text-primary font-mono">{query.endpoint}</p>
                  <p className="text-xs text-text-muted">{query.method}</p>
                </div>
              </div>

              {/* Optimization */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-accent">Recommended Optimization</p>
                    <p className="text-sm text-text-secondary mt-1">{query.optimization}</p>
                  </div>
                </div>
              </div>

              {query.suggestedIndex && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-warning">Suggested Index</p>
                    <button
                      onClick={handleCopyIndex}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated"
                    >
                      {copiedIndex ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                      {copiedIndex ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-warning">{query.suggestedIndex}</code>
                </div>
              )}
            </div>
          )}

          {/* ─── EXECUTION PLAN TAB ─── */}
          {activeTab === 'execution' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary">Query Execution Plan</h4>
                <span className="text-xs text-text-muted">Visualized tree view</span>
              </div>

              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Node</th>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Operation</th>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Table</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Cost</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Rows</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Actual Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {explainPlan.map((node) => (
                      <tr key={node.id} className="hover:bg-background/50">
                        <td className="px-4 py-2 font-mono text-text-muted">#{node.id}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            {node.operation === 'Seq Scan' && <AlertTriangle className="h-3 w-3 text-danger" />}
                            {node.operation === 'Hash Join' && <Layers className="h-3 w-3 text-info" />}
                            <span className={cn('font-medium', node.operation === 'Seq Scan' ? 'text-danger' : 'text-text-primary')}>
                              {node.operation}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{node.table || '—'}</td>
                        <td className="px-4 py-2 text-right font-mono text-text-primary">{node.cost}</td>
                        <td className="px-4 py-2 text-right font-mono text-text-primary">{formatNumber(node.rows)}</td>
                        <td className="px-4 py-2 text-right font-mono text-text-primary">{node.actualTime}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottleneck Highlight */}
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger">Bottleneck Detected</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Sequential Scan on <code className="font-mono text-danger">{query.table}</code> is the primary bottleneck,
                      consuming {(query.avgDuration * 0.6).toFixed(0)}ms ({Math.round(60)}%) of total query time.
                      {query.rowsExamined > 1000000 && ` Examining ${formatNumber(query.rowsExamined)} rows to return ${formatNumber(query.rowsReturned)}.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── INDEX ANALYSIS TAB ─── */}
          {activeTab === 'indexes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary">Index Analysis</h4>
                <span className="text-xs text-text-muted">{indexAnalysis.length} findings</span>
              </div>

              {indexAnalysis.map((analysis, i) => (
                <div key={i} className={cn(
                  'rounded-xl border p-4',
                  analysis.severity === 'critical' ? 'border-danger/30 bg-danger/5' :
                  analysis.severity === 'medium' ? 'border-warning/30 bg-warning/5' :
                  'border-border bg-surface'
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase',
                      analysis.severity === 'critical' ? 'bg-danger/10 text-danger border-danger/20' :
                      analysis.severity === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-accent/10 text-accent border-accent/20'
                    )}>
                      {analysis.severity}
                    </span>
                    <h5 className="text-sm font-semibold text-text-primary">{analysis.title}</h5>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">{analysis.description}</p>
                  <div className="mt-2 rounded-lg border border-border bg-background p-2">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Recommendation</p>
                    <code className="text-xs font-mono text-text-secondary">{analysis.recommendation}</code>
                  </div>
                  <p className="mt-2 text-xs text-accent font-medium">{analysis.estimatedImprovement}</p>
                </div>
              ))}

              {/* Current Indexes */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <h5 className="text-sm font-semibold text-text-primary mb-3">Current Indexes on {query.table}</h5>
                <div className="space-y-2">
                  {query.indexUsed ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      <code className="font-mono text-text-primary">{query.indexName}</code>
                      <span className="text-xs text-accent">(used)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      <span className="text-text-secondary">No suitable index found — sequential scan used</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Database className="h-4 w-4" />
                    <code className="font-mono">idx_{query.table}_primary</code>
                    <span className="text-xs">(primary key)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── CALL HISTORY TAB ─── */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary">Call History (Last 24h)</h4>
                <span className="text-xs text-text-muted">{formatNumber(query.callCount)} total calls</span>
              </div>

              {/* Hourly Distribution */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Hourly Call Distribution</p>
                <div className="flex items-end gap-1 h-24">
                  {[12, 8, 15, 22, 35, 48, 62, 58, 45, 38, 42, 55, 68, 72, 65, 58, 52, 48, 42, 35, 28, 22, 18, 15].map((v, i) => {
                    const max = 72;
                    const height = (v / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={cn('w-full rounded-t-sm transition-all hover:opacity-80', v > 50 ? 'bg-danger' : v > 30 ? 'bg-warning' : 'bg-accent')}
                          style={{ height: `${height}%` }}
                          title={`${String(i).padStart(2, '0')}:00 — ${v} calls`}
                        />
                        <span className="text-[8px] text-text-muted">{String(i).padStart(2, '0')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Calls Table */}
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Time</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Duration</th>
                      <th className="px-4 py-2 text-right font-medium text-text-secondary">Rows</th>
                      <th className="px-4 py-2 text-left font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const duration = query.avgDuration + (Math.random() - 0.5) * query.avgDuration * 0.5;
                      const isSlow = duration > query.p95Duration;
                      return (
                        <tr key={i} className="hover:bg-background/50">
                          <td className="px-4 py-2 text-text-secondary">
                            {new Date(Date.now() - i * 15 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className={cn('px-4 py-2 text-right font-mono', isSlow ? 'text-danger' : 'text-text-primary')}>
                            {formatDuration(Math.round(duration))}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-text-primary">
                            {Math.round(query.rowsReturned * (0.8 + Math.random() * 0.4))}
                          </td>
                          <td className="px-4 py-2">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', isSlow ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent')}>
                              {isSlow ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              {isSlow ? 'Slow' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>First seen: {query.firstSeen}</span>
            <span>Last seen: {query.lastSeen}</span>
          </div>
          <div className="flex items-center gap-2">
            {query.suggestedIndex && (
              <Button variant="outline" size="sm" onClick={handleCopyIndex}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Index
              </Button>
            )}
            <Button size="sm" onClick={() => onApplyRecommendation(query)}>
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Apply Fix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
