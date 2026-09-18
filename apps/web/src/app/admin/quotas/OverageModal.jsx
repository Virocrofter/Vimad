'use client';

import { useState } from 'react';
import { X, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from './data';

const STATUS_OPTIONS = [
  { value: 'billed', label: 'Mark as Billed', description: 'Charge will be invoiced' },
  { value: 'waived', label: 'Waive Charge', description: 'Forgive this overage' },
  { value: 'disputed', label: 'Mark as Disputed', description: 'Under review' },
];

export function OverageModal({ entry, onClose, onSave, loading }) {
  const [status, setStatus] = useState('');

  const [prevEntry, setPrevEntry] = useState(null);
  if (entry !== prevEntry) {
    setPrevEntry(entry);
    if (entry) {
      setStatus(entry.status);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({ id: entry.id, status });
    } catch (err) {
      // Error handled by parent
    }
  };

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Manage Overage</h2>
            <p className="text-sm text-text-muted">Update billing status for this overage charge</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-neutral/10 hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Entry Summary */}
        <div className="rounded-lg border border-border bg-background p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Tenant</span>
            <span className="text-sm font-medium text-text-primary">{entry.tenantName}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Resource</span>
            <span className="text-sm font-medium text-text-primary">{entry.resource}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Period</span>
            <span className="text-sm font-medium text-text-primary">{entry.period}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Excess Usage</span>
            <span className="text-sm font-medium text-text-primary">
              {entry.excessAmount} units
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm font-medium text-text-primary">Charge Amount</span>
            <span className="text-lg font-bold text-accent">{formatCurrency(entry.charge)}</span>
          </div>
        </div>

        {/* Warning for disputed */}
        {status === 'disputed' && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Dispute in Progress</p>
              <p className="text-xs text-warning/80">
                This charge will be held pending resolution. The tenant will see this as disputed.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-text-muted">{opt.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || status === entry.status}>
              {loading ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
