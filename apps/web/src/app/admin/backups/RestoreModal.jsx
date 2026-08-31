/* src/app/admin/backups/RestoreModal.jsx */
import { useState } from 'react';
import {
  X,
  Database,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { RestorePointStatusBadge, CopyableId, RegionBadge } from './components';

const restoreTargets = [
  { id: 'staging-restore-01', label: 'Staging Restore 01', type: 'staging', status: 'available' },
  { id: 'staging-restore-02', label: 'Staging Restore 02', type: 'staging', status: 'available' },
  { id: 'dr-us-west', label: 'DR Site — US West', type: 'dr', status: 'available' },
  { id: 'dr-eu-west', label: 'DR Site — EU West', type: 'dr', status: 'maintenance' },
];

export default function RestoreModal({ restorePoint, onClose, onRestore }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [step, setStep] = useState(1);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!restorePoint) return null;

  const target = restoreTargets.find((t) => t.id === selectedTarget);
  const canProceed = step === 1 ? selectedTarget : confirmName === restorePoint.id;

  const handleRestore = async () => {
    setIsRestoring(true);
    await new Promise((r) => setTimeout(r, 2000));
    onRestore(restorePoint.id, selectedTarget);
    setIsRestoring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Database className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Restore from Backup</h3>
              <p className="text-xs text-text-muted">{restorePoint.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step >= 1 ? 'bg-secondary text-white' : 'bg-border text-text-muted'
              )}
            >
              1
            </div>
            <div className={cn('h-0.5 flex-1', step >= 2 ? 'bg-secondary' : 'bg-border')} />
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step >= 2 ? 'bg-secondary text-white' : 'bg-border text-text-muted'
              )}
            >
              2
            </div>
            <div className={cn('h-0.5 flex-1', step >= 3 ? 'bg-secondary' : 'bg-border')} />
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step >= 3 ? 'bg-secondary text-white' : 'bg-border text-text-muted'
              )}
            >
              3
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span className={step === 1 ? 'text-secondary font-medium' : ''}>Select Target</span>
            <span className={step === 2 ? 'text-secondary font-medium' : ''}>Confirm</span>
            <span className={step === 3 ? 'text-secondary font-medium' : ''}>Restore</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Restore Point Summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Restore Point</span>
              <CopyableId id={restorePoint.id} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Type</span>
              <span className="text-sm font-medium text-text-primary">{restorePoint.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Created</span>
              <span className="text-sm text-text-primary">{restorePoint.createdAt}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Size</span>
              <span className="text-sm font-mono text-text-primary">{restorePoint.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Region</span>
              <RegionBadge region={restorePoint.region} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Status</span>
              <RestorePointStatusBadge status={restorePoint.status} />
            </div>
            {restorePoint.databases.length > 0 && (
              <div className="pt-1">
                <span className="text-xs text-text-muted">Databases</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {restorePoint.databases.map((db) => (
                    <span
                      key={db}
                      className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary font-mono"
                    >
                      {db}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 1: Select Target */}
          {step === 1 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Select Restore Target
              </h4>
              <div className="space-y-2">
                {restoreTargets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => t.status === 'available' && setSelectedTarget(t.id)}
                    disabled={t.status !== 'available'}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      selectedTarget === t.id
                        ? 'border-secondary bg-secondary/5'
                        : t.status === 'available'
                          ? 'border-border bg-surface hover:border-secondary/30'
                          : 'border-border bg-neutral/5 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        selectedTarget === t.id ? 'bg-secondary/10' : 'bg-neutral/10'
                      )}
                    >
                      <Server
                        className={cn(
                          'h-4 w-4',
                          selectedTarget === t.id ? 'text-secondary' : 'text-text-muted'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          selectedTarget === t.id ? 'text-secondary' : 'text-text-primary'
                        )}
                      >
                        {t.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.type === 'staging'
                          ? 'Isolated staging environment'
                          : 'Production DR site'}
                      </p>
                    </div>
                    {t.status !== 'available' && (
                      <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] text-warning">
                        Maintenance
                      </span>
                    )}
                    {selectedTarget === t.id && <CheckCircle2 className="h-5 w-5 text-secondary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && target && (
            <div className="space-y-4">
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Destructive Action</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Restoring to <strong>{target.label}</strong> will overwrite existing data on
                      that environment. Any data created after this restore point will be lost.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Type the restore point ID to confirm:{' '}
                  <span className="font-mono text-text-primary">{restorePoint.id}</span>
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={restorePoint.id}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Source</span>
                  <span className="text-text-primary font-mono">{restorePoint.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Target</span>
                  <span className="text-text-primary">{target.label}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Estimated Duration</span>
                  <span className="text-text-primary flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> 20–35 minutes
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Data Size</span>
                  <span className="text-text-primary font-mono">{restorePoint.size}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Restoring */}
          {step === 3 && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-border" />
                <div className="absolute inset-0 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
                <Database className="absolute inset-0 m-auto h-6 w-6 text-secondary" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-text-primary">Restoring...</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Restoring <span className="font-mono">{restorePoint.id}</span> to {target?.label}
                </p>
              </div>
              <div className="mx-auto max-w-xs">
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary animate-pulse"
                    style={{ width: '60%' }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">Downloading and decrypting backup...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="border-t border-border p-4 flex items-center justify-end gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button type="button" onClick={() => setStep(2)} disabled={!canProceed}>
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleRestore}
                disabled={!canProceed || isRestoring}
                isLoading={isRestoring}
              >
                <HardDrive className="mr-1.5 h-4 w-4" /> Start Restore
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
