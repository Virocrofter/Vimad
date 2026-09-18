import { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  MoreHorizontal,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const NODE_TYPES = ['Trigger', 'Wait', 'Send Email', 'Condition', 'End'];

export default function AutomationList({ workflows }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-accent/10 text-accent';
      case 'paused':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-background-secondary text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onSelect={() => setSelectedWorkflow(workflow)}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      ))}
    </div>
  );
}

function WorkflowCard({ workflow, onSelect, getStatusColor, getStatusIcon }) {
  // Generate fake 7-day trend based on execution count
  const trendData = useMemo(() => {
    const base = workflow.executions / 7;
    return Array.from({ length: 7 }, (_, i) =>
      Math.round(base * (0.7 + seededRandom(workflow.id + i) * 0.6))
    );
  }, [workflow.executions, workflow.id]);

  // Generate fake log entries
  const [logBaseTime] = useState(() => Date.now());
  const logEntries = useMemo(() => {
    const entries = [];
    const count = Math.min(20, Math.floor(workflow.executions / 100) + 5);
    const now = logBaseTime;
    for (let i = 0; i < count; i++) {
      const seed = workflow.id + i;
      const success = seededRandom(seed) > 0.05;
      entries.push({
        id: `log-${i}`,
        timestamp: new Date(now - i * 3600000 * (1 + seededRandom(seed + 1) * 4)).toISOString(),
        status: success ? 'success' : 'error',
        node: NODE_TYPES[Math.floor(seededRandom(seed + 2) * NODE_TYPES.length)],
        message: success ? 'Completed successfully' : 'SMTP timeout after 30s',
        guest: `Guest #${10000 + Math.floor(seededRandom(seed + 3) * 5000)}`,
      });
    }
    return entries;
  }, [workflow.executions, workflow.id, logBaseTime]);

  return (
    <div
      className="rounded-lg border border-border p-4 hover:bg-background-secondary cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}
          >
            {getStatusIcon(workflow.status)}
            {workflow.status}
          </span>
          <div>
            <h3 className="font-medium text-text-primary">{workflow.name}</h3>
            <p className="text-sm text-text-secondary">{workflow.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-semibold text-text-primary">
              {workflow.executions.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">executions</p>
          </div>
          <button className="p-2 hover:bg-background rounded-lg">
            <MoreHorizontal className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Mini trend chart */}
      <div className="mt-4 flex items-end gap-1 h-8">
        {trendData.map((value, i) => (
          <div
            key={i}
            className="flex-1 bg-primary/20 rounded-sm"
            style={{ height: `${(value / Math.max(...trendData)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
