import { useMemo, useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  MemoryStick,
  HardDrive,
} from 'lucide-react';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function SlowQueryModal({ query, onClose }) {
  // Generate stable sample execution data
  const [baseTime] = useState(() => Date.now());
  const sampleExecutions = useMemo(() => {
    if (!query) return [];
    return Array.from({ length: 10 }).map((_, i) => {
      const seed = query.id ? query.id.charCodeAt(0) + i : i;
      const duration = query.avgDuration + (seededRandom(seed) - 0.5) * query.avgDuration * 0.5;
      const isSlow = duration > query.p95Duration;
      const timestamp = new Date(baseTime - i * 15 * 60000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const rowsReturned = Math.round(query.rowsReturned * (0.8 + seededRandom(seed + 100) * 0.4));
      return { duration, isSlow, timestamp, rowsReturned, id: i };
    });
  }, [query, baseTime]);

  if (!query) return null;

  const formatDuration = (ms) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-background border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Query Details</h2>
            <p className="text-sm text-text-secondary font-mono">{query.queryText}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-background-secondary text-text-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Clock className="h-4 w-4" />
                Avg Duration
              </div>
              <p className="text-2xl font-semibold text-text-primary mt-1">
                {formatDuration(query.avgDuration)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <AlertTriangle className="h-4 w-4" />
                P95 Duration
              </div>
              <p className="text-2xl font-semibold text-text-primary mt-1">
                {formatDuration(query.p95Duration)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Database className="h-4 w-4" />
                Rows Returned
              </div>
              <p className="text-2xl font-semibold text-text-primary mt-1">
                {query.rowsReturned.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Cpu className="h-4 w-4" />
                Calls/Min
              </div>
              <p className="text-2xl font-semibold text-text-primary mt-1">{query.callsPerMin}</p>
            </div>
          </div>

          {/* Execution Plan */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">Execution Plan</h3>
            <div className="rounded-lg bg-background-secondary p-4 font-mono text-sm">
              <pre className="text-text-secondary whitespace-pre-wrap">{query.executionPlan}</pre>
            </div>
          </div>

          {/* Recent Executions */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">Recent Executions</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left text-text-secondary font-medium">Time</th>
                    <th className="px-4 py-2 text-left text-text-secondary font-medium">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-text-secondary font-medium">Rows</th>
                    <th className="px-4 py-2 text-left text-text-secondary font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sampleExecutions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-background/50">
                      <td className="px-4 py-2 text-text-secondary">{exec.timestamp}</td>
                      <td className="px-4 py-2 font-mono text-text-primary">
                        {formatDuration(Math.round(exec.duration))}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-text-primary">
                        {exec.rowsReturned}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            exec.isSlow ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {exec.isSlow ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {exec.isSlow ? 'Slow' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
            <div className="space-y-2">
              {query.recommendations?.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
