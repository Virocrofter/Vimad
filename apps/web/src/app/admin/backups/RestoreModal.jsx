// apps/web/src/app/admin/backups/RestoreModal.jsx
import { useState } from 'react';
import { restoreBackup } from '../../../api/backups';
import { useToast } from '../../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function RestoreModal({ open, onOpenChange, backup, onSuccess }) {
  const { toast } = useToast();
  const [targetEnvironment, setTargetEnvironment] = useState('staging');
  const [verifyAfterRestore, setVerifyAfterRestore] = useState(true);
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (!backup) return;
    setRestoring(true);
    try {
      const result = await restoreBackup({
        backupId: backup.id,
        targetEnvironment,
        verifyAfterRestore,
      });
      toast({
        title: 'Restore Initiated',
        description: `Restore job ${result.id} started. Target: ${targetEnvironment}`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Restore Failed',
        description: err.message || 'Failed to start restore',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  if (!backup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Restore Backup
          </DialogTitle>
          <DialogDescription>
            You are about to restore <strong>{backup.name}</strong>. This is a destructive
            operation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Restoring will overwrite existing data in the target
              environment. Make sure you have a current backup before proceeding.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-env">Target Environment</Label>
            <Select id="target-env" value={targetEnvironment} onValueChange={setTargetEnvironment}>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="development">Development</option>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="verify"
              checked={verifyAfterRestore}
              onCheckedChange={setVerifyAfterRestore}
            />
            <Label htmlFor="verify" className="text-sm font-normal">
              Verify data integrity after restore
            </Label>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Backup Details</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Type: {backup.type}</p>
              <p>Size: {backup.sizeFormatted || backup.sizeBytes?.toLocaleString() + ' bytes'}</p>
              <p>Created: {new Date(backup.startedAt).toLocaleString()}</p>
              <p>Tables: {backup.tables?.join(', ') || 'All tables'}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={restoring}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRestore}
            disabled={restoring || targetEnvironment === 'production'}
          >
            {restoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              'Start Restore'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
