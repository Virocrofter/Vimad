/* src/app/admin/backups/TestRestoreModal.jsx */
import { useState } from 'react';
import { X, Play, CheckCircle2, XCircle, AlertTriangle, Clock, Database, Server, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { TestStatusBadge, TestResultRow, LogEntry, IssueAlert, CopyableId } from './components';

const testEnvironments = [
  { id: 'staging-restore-01', label: 'Staging Restore 01', status: 'available' },
  { id: 'staging-restore-02', label: 'Staging Restore 02', status: 'available' },
  { id: 'isolated-test-01', label: 'Isolated Test Env 01', status: 'available' },
];

export default function TestRestoreModal({ testRun, restorePoint, onClose, onStartTest }) {
  const [selectedEnv, setSelectedEnv] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // View mode: show test run details
  if (testRun) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                testRun.status === 'success' ? 'bg-accent/10' : testRun.status === 'warning' ? 'bg-warning/10' : 'bg-danger/10'
              )}>
                {testRun.status === 'success' ? <CheckCircle2 className="h-5 w-5 text-accent" /> :
                 testRun.status === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
                 <XCircle className="h-5 w-5 text-danger" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Test Restore Result</h3>
                <p className="text-xs text-text-muted">{testRun.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <TestStatusBadge status={testRun.status} />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Duration</p>
                <p className="mt-1 text-lg font-bold font-mono text-text-primary">{testRun.duration}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">RTO Achieved</p>
                <p className={cn('mt-1 text-lg font-bold font-mono',
                  testRun.rtoAchieved && parseFloat(testRun.rtoAchieved) <= parseFloat(testRun.rtoTarget) ? 'text-accent' : 'text-danger'
                )}>
                  {testRun.rtoAchieved || '—'}
                </p>
                <p className="text-[10px] text-text-muted">Target: {testRun.rtoTarget}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">RPO Achieved</p>
                <p className="mt-1 text-lg font-bold font-mono text-accent">{testRun.rpoAchieved || '—'}</p>
                <p className="text-[10px] text-text-muted">Target: {testRun.rpoTarget}</p>
              </div>
            </div>

            {/* Test Results */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Validation Results</h4>
              <TestResultRow label="Database Validation" status={testRun.databaseValidated ? 'passed' : 'failed'} />
              <TestResultRow label="Data Integrity Check" status={testRun.dataIntegrity} />
              <TestResultRow label="Row Count Match" status={testRun.rowCountMatch ? 'passed' : 'failed'} />
              <TestResultRow label="Index Rebuild" status={testRun.indexRebuild} />
              <TestResultRow label="Application Smoke Test" status={testRun.appSmokeTest} />
            </div>

            {/* Issues */}
            {testRun.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Issues Found</h4>
                {testRun.issues.map((issue, i) => (
                  <IssueAlert key={i} severity={issue.severity} message={issue.message} component={issue.component} />
                ))}
              </div>
            )}

            {/* Logs */}
            <div>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">Execution Logs</span>
                  <span className="text-xs text-text-muted">({testRun.logs.length} entries)</span>
                </div>
                {showLogs ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
              </button>
              {showLogs && (
                <div className="mt-2 rounded-xl border border-border bg-background p-4 space-y-0.5">
                  {testRun.logs.map((log, i) => (
                    <LogEntry key={i} time={log.time} level={log.level} message={log.message} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Start mode: configure and start a new test
  if (!restorePoint) return null;

  const handleStart = async () => {
    setIsStarting(true);
    await new Promise(r => setTimeout(r, 1500));
    onStartTest(restorePoint.id, selectedEnv);
    setIsStarting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Play className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Run Test Restore</h3>
              <p className="text-xs text-text-muted">Validate backup integrity</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Restore Point Summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Restore Point</span>
              <CopyableId id={restorePoint.id} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Size</span>
              <span className="text-sm font-mono text-text-primary">{restorePoint.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Created</span>
              <span className="text-sm text-text-primary">{restorePoint.createdAt}</span>
            </div>
          </div>

          {/* Target Environment */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Test Environment</label>
            <div className="space-y-2">
              {testEnvironments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => env.status === 'available' && setSelectedEnv(env.id)}
                  disabled={env.status !== 'available'}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    selectedEnv === env.id
                      ? 'border-secondary bg-secondary/5'
                      : env.status === 'available'
                      ? 'border-border bg-surface hover:border-secondary/30'
                      : 'border-border bg-neutral/5 opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    selectedEnv === env.id ? 'bg-secondary/10' : 'bg-neutral/10'
                  )}>
                    <Server className={cn('h-4 w-4', selectedEnv === env.id ? 'text-secondary' : 'text-text-muted')} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', selectedEnv === env.id ? 'text-secondary' : 'text-text-primary')}>
                      {env.label}
                    </p>
                    <p className="text-xs text-text-muted">Isolated test environment</p>
                  </div>
                  {selectedEnv === env.id && <CheckCircle2 className="h-5 w-5 text-secondary" />}
                </button>
              ))}
            </div>
          </div>

          {/* What will happen */}
          <div className="rounded-lg border border-info/20 bg-info/5 p-4">
            <h4 className="text-xs font-semibold text-info mb-2">What happens during a test restore?</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <Database className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                Backup is downloaded and decrypted to the test environment
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                Database is restored and indexes are rebuilt
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                RTO and RPO are measured against targets
              </li>
              <li className="flex items-start gap-2">
                <Terminal className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                Application smoke tests validate data integrity
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleStart} disabled={!selectedEnv || isStarting} isLoading={isStarting}>
            <Play className="mr-1.5 h-4 w-4" /> Start Test Restore
          </Button>
        </div>
      </div>
    </div>
  );
}
