/* src/app/admin/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  BedDouble,
  DollarSign,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  ExternalLink,
  Copy,
  Ban,
  Play,
  Pause,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTenantStore } from './store';
import {
  statusMeta,
  billingStatusMeta,
  planMeta,
  getUsagePercent,
  getUsageColor,
  getUsageBarColor,
  formatCurrency,
} from './data';
import {
  TenantStatusBadge,
  BillingStatusBadge,
  PlanBadge,
  StatCard,
  MiniUsageBar,
  MrrSparkline,
  TenantAvatar,
} from './components';

/* ─── Mock MRR Data for Sparklines ─── */
const mrrHistory = {
  'TNT-001': [420, 435, 450, 445, 460, 475, 480, 499, 499, 499, 499, 499],
  'TNT-002': [850, 880, 900, 920, 950, 975, 990, 999, 999, 999, 999, 999],
  'TNT-003': [180, 185, 190, 195, 199, 199, 199, 199, 199, 199, 199, 199],
  'TNT-004': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'TNT-005': [499, 499, 499, 499, 499, 0, 0, 0, 0, 0, 0, 0],
  'TNT-006': [850, 900, 925, 950, 975, 999, 999, 999, 999, 999, 999, 999],
  'TNT-007': [199, 199, 199, 199, 199, 0, 0, 0, 0, 0, 0, 0],
  'TNT-008': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'TNT-009': [199, 199, 199, 199, 199, 199, 199, 199, 199, 199, 199, 199],
  'TNT-010': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/* ─── Tenant Detail Drawer ─── */
function TenantDetailDrawer({ tenant, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!tenant) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'usage', label: 'Usage & Limits', icon: BarChart3 },
    { id: 'billing', label: 'Billing History', icon: CreditCard },
    { id: 'activity', label: 'Activity Log', icon: Clock },
  ];

  const handleStatusChange = (newStatus) => {
    onUpdate(tenant.id, {
      status: newStatus,
      lastActive: newStatus === 'active' ? new Date().toISOString() : tenant.lastActive,
    });
    setShowSuspendConfirm(false);
  };

  const mockBillingHistory = [
    {
      id: 'INV-2026-0812',
      date: '2026-08-12',
      amount: tenant.revenue.mrr,
      status: 'paid',
      method: 'Visa •••• 4242',
    },
    {
      id: 'INV-2026-0712',
      date: '2026-07-12',
      amount: tenant.revenue.mrr,
      status: 'paid',
      method: 'Visa •••• 4242',
    },
    {
      id: 'INV-2026-0612',
      date: '2026-06-12',
      amount: tenant.revenue.mrr,
      status: 'paid',
      method: 'Visa •••• 4242',
    },
  ];

  const mockActivityLog = [
    { date: '2026-08-15 14:32', action: 'User login', user: 'Robert Chen', ip: '192.168.1.45' },
    {
      date: '2026-08-15 10:15',
      action: 'Reservation created',
      user: 'Sarah J.',
      ip: '192.168.1.12',
    },
    { date: '2026-08-14 22:00', action: 'Night audit completed', user: 'System', ip: '127.0.0.1' },
    { date: '2026-08-14 16:45', action: 'Rate override', user: 'David Park', ip: '192.168.1.78' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TenantAvatar name={tenant.name} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">{tenant.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-text-muted font-mono">{tenant.id}</span>
                  <span className="text-xs text-text-muted">·</span>
                  <TenantStatusBadge status={tenant.status} />
                  <PlanBadge plan={tenant.plan} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
              </Button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">
                    Monthly Recurring Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(tenant.revenue.mrr)}
                  </p>
                  <div className="mt-2">
                    <MrrSparkline
                      data={mrrHistory[tenant.id] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Revenue</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(tenant.revenue.totalPaid)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Lifetime value</p>
                </div>
              </div>

              {/* Owner Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Users className="h-4 w-4 text-text-muted" />
                    {tenant.owner.name}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {tenant.owner.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" />
                    {tenant.owner.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    {tenant.location}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Enabled Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tenant.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {feature}
                    </span>
                  ))}
                  {tenant.features.length === 0 && (
                    <p className="text-sm text-text-muted">No features enabled</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {tenant.notes && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-text-secondary">{tenant.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {tenant.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => setShowSuspendConfirm(true)}
                  >
                    <Pause className="mr-1.5 h-3.5 w-3.5" /> Suspend
                  </Button>
                ) : tenant.status === 'suspended' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-accent border-accent/30 hover:bg-accent/10"
                    onClick={() => handleStatusChange('active')}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                  </Button>
                ) : null}
                <Button variant="outline" size="sm">
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger border-danger/30 hover:bg-danger/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <MiniUsageBar used={tenant.rooms.used} total={tenant.rooms.total} label="Rooms" />
                <MiniUsageBar
                  used={tenant.users.used}
                  total={tenant.users.total}
                  label="Users"
                  unit=""
                />
                <MiniUsageBar
                  used={tenant.storage.used}
                  total={tenant.storage.total}
                  label="Storage"
                  unit={tenant.storage.unit}
                />
                <MiniUsageBar
                  used={tenant.apiCalls.used}
                  total={tenant.apiCalls.total}
                  label="API Calls"
                  unit=""
                />
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Usage Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Room Utilization</span>
                    <span
                      className={cn(
                        'font-mono font-medium',
                        getUsageColor(getUsagePercent(tenant.rooms.used, tenant.rooms.total))
                      )}
                    >
                      {getUsagePercent(tenant.rooms.used, tenant.rooms.total)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Storage Used</span>
                    <span className="font-mono font-medium text-text-primary">
                      {tenant.storage.used}
                      {tenant.storage.unit} / {tenant.storage.total}
                      {tenant.storage.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">API Usage</span>
                    <span
                      className={cn(
                        'font-mono font-medium',
                        getUsageColor(getUsagePercent(tenant.apiCalls.used, tenant.apiCalls.total))
                      )}
                    >
                      {getUsagePercent(tenant.apiCalls.used, tenant.apiCalls.total)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Team Size</span>
                    <span className="font-mono font-medium text-text-primary">
                      {tenant.users.used} users
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Current Plan</p>
                  <p className="text-lg font-bold text-text-primary">{tenant.plan}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Next Renewal</p>
                  <p className="text-sm text-text-primary">{tenant.nextRenewal || '—'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockBillingHistory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-background/50">
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">{inv.id}</td>
                        <td className="px-4 py-3 text-text-secondary">{inv.date}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {mockActivityLog.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <Clock className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{entry.action}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                      <span>{entry.user}</span>
                      <span>·</span>
                      <span>{entry.date}</span>
                      <span>·</span>
                      <span className="font-mono">{entry.ip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suspend Confirm Modal */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSuspendConfirm(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Suspend Tenant</h3>
                <p className="text-xs text-text-muted">{tenant.name}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Suspending this tenant will immediately restrict access to the platform. All active
              sessions will be terminated. This action can be reversed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSuspendConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-warning border-warning/30 hover:bg-warning/10"
                onClick={() => handleStatusChange('suspended')}
              >
                <Ban className="mr-1.5 h-4 w-4" /> Suspend Tenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <Trash2 className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Tenant</h3>
                <p className="text-xs text-text-muted">{tenant.name}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              This will permanently delete the tenant and all associated data. This action{' '}
              <strong className="text-danger">cannot be undone</strong>.
            </p>
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 mb-4">
              <p className="text-xs text-danger">
                Type <span className="font-mono font-bold">{tenant.id}</span> to confirm deletion
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── New Tenant Modal ─── */
function NewTenantModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    plan: 'Starter',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    location: '',
    timezone: 'America/New_York',
    currency: 'USD',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      id: `TNT-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      name: form.name,
      subdomain: form.subdomain,
      plan: form.plan,
      status: 'pending',
      owner: { name: form.ownerName, email: form.ownerEmail, phone: form.ownerPhone },
      users: { used: 0, total: 'Unlimited' },
      rooms: {
        used: 0,
        total: form.plan === 'Enterprise' ? 500 : form.plan === 'Professional' ? 200 : 75,
      },
      storage: {
        used: 0,
        total: form.plan === 'Enterprise' ? 500 : form.plan === 'Professional' ? 100 : 50,
        unit: 'GB',
      },
      revenue: { mrr: 0, totalPaid: 0 },
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: null,
      billingStatus: 'pending',
      nextRenewal: null,
      features: [],
      location: form.location,
      timezone: form.timezone,
      currency: form.currency,
      apiCalls: {
        used: 0,
        total: form.plan === 'Enterprise' ? 500000 : form.plan === 'Professional' ? 100000 : 25000,
      },
      notes: 'New tenant awaiting onboarding.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Create New Tenant</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Property Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Grand Hotel Boston"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
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
                placeholder="grandhotel"
                className="h-10 flex-1 rounded-l-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-border bg-background px-3 text-sm text-text-muted">
                .unifiedpms.com
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Starter', 'Professional', 'Enterprise'].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => update('plan', plan)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Owner Name
              </label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => update('ownerName', e.target.value)}
                placeholder="Full name"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Owner Email
              </label>
              <input
                type="email"
                required
                value={form.ownerEmail}
                onChange={(e) => update('ownerEmail', e.target.value)}
                placeholder="email@company.com"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                value={form.ownerPhone}
                onChange={(e) => update('ownerPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="City, State"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Phoenix">Arizona (MST)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Create Tenant
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const tenants = useTenantStore((s) => s.tenants);
  const updateTenant = useTenantStore((s) => s.updateTenant);
  const addTenant = useTenantStore((s) => s.addTenant);
  const removeTenant = useTenantStore((s) => s.removeTenant);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'lastActive', dir: 'desc' });

  const filteredTenants = useMemo(() => {
    let result = tenants.filter((t) => {
      const matchesQuery =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(query.toLowerCase()) ||
        t.owner.name.toLowerCase().includes(query.toLowerCase()) ||
        t.owner.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPlan = planFilter === 'all' || t.plan === planFilter;
      const matchesBilling = billingFilter === 'all' || t.billingStatus === billingFilter;
      return matchesQuery && matchesStatus && matchesPlan && matchesBilling;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'lastActive') {
        const aDate = a.lastActive ? new Date(a.lastActive) : new Date(0);
        const bDate = b.lastActive ? new Date(b.lastActive) : new Date(0);
        return sortConfig.dir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.dir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'mrr') {
        return sortConfig.dir === 'asc'
          ? a.revenue.mrr - b.revenue.mrr
          : b.revenue.mrr - a.revenue.mrr;
      }
      if (sortConfig.key === 'createdAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return result;
  }, [tenants, query, statusFilter, planFilter, billingFilter, sortConfig]);

  const stats = useMemo(() => {
    const active = tenants.filter((t) => t.status === 'active').length;
    const trial = tenants.filter((t) => t.status === 'trial').length;
    const suspended = tenants.filter((t) => t.status === 'suspended').length;
    const totalMrr = tenants.reduce((s, t) => s + t.revenue.mrr, 0);
    const totalPaid = tenants.reduce((s, t) => s + t.revenue.totalPaid, 0);
    return { active, trial, suspended, totalMrr, totalPaid, total: tenants.length };
  }, [tenants]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tenant Management</h1>
          <p className="text-sm text-text-secondary">
            Manage all properties, subscriptions, and billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewTenant(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Tenant
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Tenants"
          value={stats.active}
          icon={CheckCircle2}
          color="text-accent"
          subtext={`of ${stats.total} total`}
        />
        <StatCard
          label="In Trial"
          value={stats.trial}
          icon={Clock}
          color="text-info"
          subtext="Pending conversion"
        />
        <StatCard
          label="Suspended"
          value={stats.suspended}
          icon={AlertTriangle}
          color="text-warning"
          subtext="Require attention"
        />
        <StatCard
          label="Total MRR"
          value={formatCurrency(stats.totalMrr)}
          icon={DollarSign}
          color="text-secondary"
          subtext={`${formatCurrency(stats.totalPaid)} lifetime`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search tenants by name, ID, subdomain, owner..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select
            value={sortConfig.key}
            onChange={(e) => setSortConfig({ key: e.target.value, dir: 'desc' })}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="lastActive">Sort by Last Active</option>
            <option value="name">Sort by Name</option>
            <option value="mrr">Sort by MRR</option>
            <option value="createdAt">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Billing</label>
              <select
                value={billingFilter}
                onChange={(e) => setBillingFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Billing</option>
                <option value="paid">Paid</option>
                <option value="trial">Trial</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPlanFilter('all');
                setBillingFilter('all');
                setQuery('');
              }}
              className="text-xs text-secondary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredTenants.length}</span> of{' '}
        {tenants.length} tenants
      </p>

      {/* Tenant Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { key: 'name', label: 'Tenant' },
                  { key: 'status', label: 'Status' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'mrr', label: 'MRR' },
                  { key: 'usage', label: 'Usage' },
                  { key: 'lastActive', label: 'Last Active' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key &&
                        (sortConfig.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTenants.map((tenant) => {
                const roomPct = getUsagePercent(tenant.rooms.used, tenant.rooms.total);
                const storagePct = getUsagePercent(tenant.storage.used, tenant.storage.total);
                return (
                  <tr
                    key={tenant.id}
                    className="hover:bg-background/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTenant(tenant)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-border" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TenantAvatar name={tenant.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{tenant.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">
                            {tenant.subdomain}.unifiedpms.com
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TenantStatusBadge status={tenant.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={tenant.plan} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-mono font-medium text-text-primary">
                        {formatCurrency(tenant.revenue.mrr)}
                      </div>
                      <BillingStatusBadge status={tenant.billingStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <MiniUsageBar
                          used={tenant.rooms.used}
                          total={tenant.rooms.total}
                          label="Rooms"
                        />
                        <MiniUsageBar
                          used={tenant.storage.used}
                          total={tenant.storage.total}
                          label="Storage"
                          unit={tenant.storage.unit}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary text-xs">
                        {tenant.lastActive
                          ? new Date(tenant.lastActive).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(tenant);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Building2 className="mx-auto h-10 w-10 mb-3" />
                    <p>No tenants match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showNewTenant && (
        <NewTenantModal onClose={() => setShowNewTenant(false)} onCreate={addTenant} />
      )}

      {selectedTenant && (
        <TenantDetailDrawer
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onUpdate={updateTenant}
        />
      )}
    </div>
  );
}
