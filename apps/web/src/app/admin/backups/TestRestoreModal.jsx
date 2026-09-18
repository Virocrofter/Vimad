// apps/web/src/app/admin/backups/TestRestoreModal.jsx
import { useState } from 'react';
import { testRestoreBackup } from '../../../api/backups';
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
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';

export function TestRestoreModal({ open, onOpenChange, backup }) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    if (!backup) return;
    setTesting(true);
    setResult(null);
    try {
      const testResult = await testRestoreBackup({
        backupId: backup.id,
      });
      setResult(testResult);
      if (testResult.success) {
        toast({
          title: 'Test Restore Passed',
          description: 'All validation checks passed successfully',
        });
      } else {
        toast({
          title: 'Test Restore Failed',
          description: testResult.message || 'Validation checks failed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Test Failed',
        description: err.message || 'Failed to run test restore',
        variant: 'destructive',
      });
      setResult({ success: false, message: err.message, validationResults: {} });
    } finally {
      setTesting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTesting(false);
  };

  if (!backup) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-500" />
            Test Restore
          </DialogTitle>
          <DialogDescription>
            Validate backup integrity without affecting production data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> This runs a test restore in an isolated environment to verify
              the backup is valid. No production data will be modified.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Backup Details</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Name: {backup.name}</p>
              <p>Type: {backup.type}</p>
              <p>Size: {backup.sizeFormatted || backup.sizeBytes?.toLocaleString() + ' bytes'}</p>
              <p>Created: {new Date(backup.startedAt).toLocaleString()}</p>
            </div>
          </div>

          {testing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Running validation...</p>
              <Progress value={undefined} className="animate-pulse" />
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700">All checks passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">Validation failed</span>
                  </>
                )}
              </div>

              {result.validationResults && Object.keys(result.validationResults).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Validation Results</p>
                  <div className="space-y-1">
                    {Object.entries(result.validationResults).map(([check, passed]) => (
                      <div key={check} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{check.replace(/_/g, ' ')}</span>
                        <Badge variant={passed ? 'default' : 'destructive'} className="text-xs">
                          {passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={testing}>
            Close
          </Button>
          {!result && (
            <Button onClick={handleTest} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Test'
              )}
            </Button>
          )}
          {result && (
            <Button variant="outline" onClick={reset}>
              Run Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
