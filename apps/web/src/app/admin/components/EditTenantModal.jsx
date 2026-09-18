/* src/app/admin/components/EditTenantModal.jsx */
import { useState } from 'react';
import {
  X,
  Check,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  HardDrive,
  Zap,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { planMeta } from '../data';

export default function EditTenantModal({ tenant, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    plan: 'Starter',
    status: 'active',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    location: '',
    roomsUsed: 0,
    roomsTotal: 75,
    usersUsed: 0,
    usersTotal: 5,
    storageUsed: 0,
    storageTotal: 50,
    storageUnit: 'GB',
    apiCallsUsed: 0,
    apiCallsTotal: 25000,
    mrr: 0,
    totalPaid: 0,
    notes: '',
    features: [],
  });

  // Populate form when tenant changes
  const [prevTenant, setPrevTenant] = useState(null);
  if (tenant !== prevTenant) {
    setPrevTenant(tenant);
    if (tenant) {
      setForm({
        name: tenant.name || '',
        subdomain: tenant.subdomain || '',
        plan: tenant.plan || 'Starter',
        status: tenant.status || 'active',
        ownerName: tenant.owner?.name || '',
        ownerEmail: tenant.owner?.email || '',
        ownerPhone: tenant.owner?.phone || '',
        location: tenant.location || '',
        roomsUsed: tenant.rooms?.used || 0,
        roomsTotal: typeof tenant.rooms?.total === 'number' ? tenant.rooms.total : 75,
        usersUsed: tenant.users?.used || 0,
        usersTotal: typeof tenant.users?.total === 'number' ? tenant.users.total : 5,
        storageUsed: tenant.storage?.used || 0,
        storageTotal: typeof tenant.storage?.total === 'number' ? tenant.storage.total : 50,
        storageUnit: tenant.storage?.unit || 'GB',
        apiCallsUsed: tenant.apiCalls?.used || 0,
        apiCallsTotal: typeof tenant.apiCalls?.total === 'number' ? tenant.apiCalls.total : 25000,
        mrr: tenant.revenue?.mrr || 0,
        totalPaid: tenant.revenue?.totalPaid || 0,
        notes: tenant.notes || '',
        features: tenant.features || [],
      });
    }
  }

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const planLimits = {
    Starter: { rooms: 75, storage: 50, apiCalls: 25000 },
    Professional: { rooms: 200, storage: 100, apiCalls: 100000 },
    Enterprise: { rooms: 500, storage: 500, apiCalls: 500000 },
  };

  const handlePlanChange = (plan) => {
    const limits = planLimits[plan];
    update('plan', plan);
    update('roomsTotal', limits.rooms);
    update('storageTotal', limits.storage);
    update('apiCallsTotal', limits.apiCalls);
  };

  const toggleFeature = (feature) => {
    const current = form.features;
    update(
      'features',
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    );
  };

  const availableFeatures = [
    'channel-manager',
    'booking-engine',
    'guest-portal',
    'crm-loyalty',
    'marketing-automation',
    'ai-revenue',
    'advanced-analytics',
    'white-label-portal',
    'multi-property-dashboard',
    'smart-housekeeping',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...tenant,
      name: form.name,
      subdomain: form.subdomain,
      plan: form.plan,
      status: form.status,
      owner: {
        ...tenant.owner,
        name: form.ownerName,
        email: form.ownerEmail,
        phone: form.ownerPhone,
      },
      location: form.location,
      rooms: { used: parseInt(form.roomsUsed) || 0, total: parseInt(form.roomsTotal) || 0 },
      users: { used: parseInt(form.usersUsed) || 0, total: parseInt(form.usersTotal) || 0 },
      storage: {
        used: parseFloat(form.storageUsed) || 0,
        total: parseInt(form.storageTotal) || 0,
        unit: form.storageUnit,
      },
      apiCalls: {
        used: parseInt(form.apiCallsUsed) || 0,
        total: parseInt(form.apiCallsTotal) || 0,
      },
      revenue: { mrr: parseFloat(form.mrr) || 0, totalPaid: parseFloat(form.totalPaid) || 0 },
      notes: form.notes,
      features: form.features,
    });
    onClose();
  };

  if (!tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Building2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Edit Tenant</h3>
              <p className="text-xs text-text-muted">{tenant.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Property Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={form.subdomain}
                    onChange={(e) =>
                      update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    className="h-10 flex-1 rounded-l-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-border bg-background px-3 text-sm text-text-muted">
                    .unifiedpms.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Starter', 'Professional', 'Enterprise'].map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => handlePlanChange(plan)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        form.plan === plan
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Owner Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => update('ownerName', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => update('ownerEmail', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Phone</label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => update('ownerPhone', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Usage & Limits */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Usage & Limits
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Rooms Used / Total
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={form.roomsUsed}
                    onChange={(e) => update('roomsUsed', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="flex items-center text-text-muted">/</span>
                  <input
                    type="number"
                    min="1"
                    value={form.roomsTotal}
                    onChange={(e) => update('roomsTotal', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Users Used / Total
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={form.usersUsed}
                    onChange={(e) => update('usersUsed', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="flex items-center text-text-muted">/</span>
                  <input
                    type="number"
                    min="1"
                    value={form.usersTotal}
                    onChange={(e) => update('usersTotal', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Storage Used / Total (GB)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.storageUsed}
                    onChange={(e) => update('storageUsed', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="flex items-center text-text-muted">/</span>
                  <input
                    type="number"
                    min="1"
                    value={form.storageTotal}
                    onChange={(e) => update('storageTotal', e.target.value)}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  API Calls Used / Total
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={form.apiCallsUsed}
                    onChange={(e) => update('apiCallsUsed', e.target.value)}
                    className="h-10 w-24 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="flex items-center text-text-muted">/</span>
                  <input
                    type="number"
                    min="1"
                    value={form.apiCallsTotal}
                    onChange={(e) => update('apiCallsTotal', e.target.value)}
                    className="h-10 w-24 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Revenue
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Monthly Recurring Revenue ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrr}
                  onChange={(e) => update('mrr', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Total Paid ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalPaid}
                  onChange={(e) => update('totalPaid', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Enabled Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.features.includes(feature)
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.features.includes(feature) && <Check className="h-3 w-3" />}
                  {feature
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
