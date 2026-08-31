/* src/app/admin/quotas/OverageModal.jsx */
import { useState, useEffect } from 'react';
import { X, Check, DollarSign, AlertTriangle, Calculator, Receipt } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { formatCurrency } from './data';

export default function OverageModal({ entry, onClose, onSave }) {
  const isEditing = !!entry;
  const [form, setForm] = useState({
    tenantId: '',
    resource: 'api_calls',
    period: '',
    excess: 0,
    rate: 0,
    charge: 0,
    status: 'projected',
    waiveReason: '',
    notes: '',
  });

  useEffect(() => {
    if (entry) {
      setForm({
        tenantId: entry.tenantId || '',
        resource: entry.resource || 'api_calls',
        period: entry.period || '',
        excess: entry.excess || 0,
        rate: entry.rate || 0,
        charge: entry.charge || 0,
        status: entry.status || 'projected',
        waiveReason: entry.waiveReason || '',
        notes: entry.notes || '',
      });
    }
  }, [entry]);

  const update = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'excess' || key === 'rate') {
        next.charge = (next.excess * next.rate);
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: entry?.id || `OV-${Date.now().toString(36).toUpperCase()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Overage Entry' : 'Record Overage Charge'}
              </h3>
              <p className="text-xs text-text-muted">{isEditing ? entry.id : 'Manual overage billing adjustment'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Banner */}
          {form.status === 'disputed' && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-warning">This overage is under dispute. Review before making changes.</p>
            </div>
          )}

          {/* Tenant & Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Tenant ID</label>
              <input
                type="text"
                required
                value={form.tenantId}
                onChange={(e) => update('tenantId', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Billing Period</label>
              <input
                type="text"
                required
                value={form.period}
                onChange={(e) => update('period', e.target.value)}
                placeholder="2026-08"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Resource */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Resource</label>
            <select
              value={form.resource}
              onChange={(e) => update('resource', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="api_calls">API Calls</option>
              <option value="storage">Storage</option>
              <option value="rooms">Rooms</option>
              <option value="users">Users</option>
            </select>
          </div>

          {/* Calculation */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-secondary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Charge Calculation</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Excess Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.excess}
                  onChange={(e) => update('excess', parseFloat(e.target.value) || 0)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Rate per Unit ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  required
                  value={form.rate}
                  onChange={(e) => update('rate', parseFloat(e.target.value) || 0)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Total Charge</span>
              </div>
              <span className="text-lg font-bold font-mono text-accent">{formatCurrency(form.charge)}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">Status</label>
            <div className="grid grid-cols-4 gap-2">
              {['projected', 'billed', 'waived', 'disputed'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => update('status', status)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-colors capitalize',
                    form.status === status
                      ? status === 'billed' ? 'bg-accent/10 text-accent border-accent/30' :
                        status === 'projected' ? 'bg-info/10 text-info border-info/30' :
                        status === 'waived' ? 'bg-neutral/10 text-text-muted border-border' :
                        'bg-warning/10 text-warning border-warning/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Waive Reason */}
          {form.status === 'waived' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Waive Reason</label>
              <textarea
                value={form.waiveReason}
                onChange={(e) => update('waiveReason', e.target.value)}
                rows={2}
                placeholder="Why is this charge being waived?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Any additional context..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> {isEditing ? 'Update Entry' : 'Record Charge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
