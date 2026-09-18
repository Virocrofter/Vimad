/* src/app/app/meal-plans/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Coffee,
  Sun,
  Moon,
  GlassWater,
  Cherry,
  Drumstick,
  Shrimp,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  Clock,
  DollarSign,
  BedDouble,
  Users,
  Link2,
  Settings,
  AlertCircle,
  CheckCircle2,
  Ban,
  ArrowRightLeft,
  Copy,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Save,
  Calendar,
  Download,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';

/* ─── Board Basis Codes ─── */
const boardBasisCodes = {
  RO: {
    label: 'Room Only',
    description: 'No meals included',
    icon: BedDouble,
    color: 'text-text-muted',
  },
  BB: {
    label: 'Bed & Breakfast',
    description: 'Breakfast only',
    icon: Coffee,
    color: 'text-amber-500',
  },
  HB: {
    label: 'Half Board',
    description: 'Breakfast + Dinner',
    icon: Sun,
    color: 'text-orange-500',
  },
  FB: {
    label: 'Full Board',
    description: 'Breakfast + Lunch + Dinner',
    icon: Utensils,
    color: 'text-emerald-500',
  },
  AI: {
    label: 'All Inclusive',
    description: 'All meals + selected drinks',
    icon: GlassWater,
    color: 'text-purple-500',
  },
  UAI: {
    label: 'Ultra All Inclusive',
    description: 'All meals + premium drinks + snacks',
    icon: GlassWater,
    color: 'text-pink-500',
  },
};

/* ─── Mock Data ─── */
const initialMealPlans = [
  {
    id: 'MP-001',
    name: 'Standard Breakfast',
    code: 'BB-STD',
    boardBasis: 'BB',
    price: 25,
    currency: 'USD',
    taxInclusive: true,
    autoPost: true,
    postFrequency: 'daily',
    postTime: '06:00',
    applicableRoomTypes: ['std-twin', 'std-queen', 'del-king'],
    restaurant: 'The Garden Restaurant',
    restaurantId: 'REST-001',
    menu: 'breakfast-buffet',
    isActive: true,
    description: 'Continental and hot breakfast buffet',
    inclusions: ['Continental buffet', 'Hot station', 'Coffee & tea', 'Fresh juice'],
    exclusions: ['Alcoholic beverages', 'Room service'],
    childPolicy: { under6: 'free', under12: '50%', under16: '75%' },
    seasonality: 'year-round',
    startDate: null,
    endDate: null,
  },
  {
    id: 'MP-002',
    name: 'Half Board Premium',
    code: 'HB-PREM',
    boardBasis: 'HB',
    price: 65,
    currency: 'USD',
    taxInclusive: true,
    autoPost: true,
    postFrequency: 'daily',
    postTime: '18:00',
    applicableRoomTypes: ['del-king', 'suite'],
    restaurant: 'The Garden Restaurant',
    restaurantId: 'REST-001',
    menu: 'dinner-a-la-carte',
    isActive: true,
    description: 'Breakfast buffet + 3-course dinner',
    inclusions: ['Breakfast buffet', '3-course dinner', 'House wine with dinner', 'Coffee & tea'],
    exclusions: ['Premium spirits', 'Room service', 'Minibar'],
    childPolicy: { under6: 'free', under12: '50%', under16: '75%' },
    seasonality: 'year-round',
    startDate: null,
    endDate: null,
  },
  {
    id: 'MP-003',
    name: 'Full Board Family',
    code: 'FB-FAM',
    boardBasis: 'FB',
    price: 89,
    currency: 'USD',
    taxInclusive: true,
    autoPost: true,
    postFrequency: 'daily',
    postTime: '12:00',
    applicableRoomTypes: ['std-twin', 'std-queen', 'del-king', 'suite'],
    restaurant: 'The Garden Restaurant',
    restaurantId: 'REST-001',
    menu: 'full-menu',
    isActive: true,
    description: 'All meals included — perfect for families',
    inclusions: [
      'Breakfast buffet',
      'Lunch buffet',
      'Dinner buffet',
      'Soft drinks with meals',
      'Kids menu',
    ],
    exclusions: ['Alcoholic beverages', 'Room service', 'Minibar'],
    childPolicy: { under6: 'free', under12: '50%', under16: '75%' },
    seasonality: 'summer',
    startDate: '2026-06-01',
    endDate: '2026-09-15',
  },
  {
    id: 'MP-004',
    name: 'All Inclusive Resort',
    code: 'AI-RESORT',
    boardBasis: 'AI',
    price: 129,
    currency: 'USD',
    taxInclusive: true,
    autoPost: true,
    postFrequency: 'daily',
    postTime: '06:00',
    applicableRoomTypes: ['del-king', 'suite'],
    restaurant: 'Multiple Venues',
    restaurantId: 'MULTI',
    menu: 'all-venues',
    isActive: true,
    description: 'Unlimited dining across all resort restaurants',
    inclusions: [
      'All meals',
      'Selected alcoholic drinks',
      'Pool snacks',
      'Minibar restocked daily',
      'Room service (limited)',
    ],
    exclusions: ['Premium spirits', 'Bottled wine', 'Special events'],
    childPolicy: { under6: 'free', under12: '50%', under16: '75%' },
    seasonality: 'year-round',
    startDate: null,
    endDate: null,
  },
  {
    id: 'MP-005',
    name: 'Room Only — No Meals',
    code: 'RO-NONE',
    boardBasis: 'RO',
    price: 0,
    currency: 'USD',
    taxInclusive: true,
    autoPost: false,
    postFrequency: null,
    postTime: null,
    applicableRoomTypes: ['std-twin', 'std-queen', 'del-king', 'suite', 'accessible'],
    restaurant: null,
    restaurantId: null,
    menu: null,
    isActive: true,
    description: 'No meals included — à la carte dining available',
    inclusions: [],
    exclusions: ['All meals', 'Beverages'],
    childPolicy: { under6: 'n/a', under12: 'n/a', under16: 'n/a' },
    seasonality: 'year-round',
    startDate: null,
    endDate: null,
  },
  {
    id: 'MP-006',
    name: 'Winter Half Board',
    code: 'HB-WIN',
    boardBasis: 'HB',
    price: 55,
    currency: 'USD',
    taxInclusive: true,
    autoPost: true,
    postFrequency: 'daily',
    postTime: '18:00',
    applicableRoomTypes: ['std-twin', 'std-queen', 'del-king'],
    restaurant: 'The Garden Restaurant',
    restaurantId: 'REST-001',
    menu: 'winter-dinner',
    isActive: false,
    description: 'Seasonal half board for winter months',
    inclusions: ['Breakfast buffet', 'Winter dinner menu', 'Mulled wine'],
    exclusions: ['Lunch', 'Premium spirits', 'Room service'],
    childPolicy: { under6: 'free', under12: '50%', under16: '75%' },
    seasonality: 'winter',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
  },
];

const linkedRestaurants = [
  {
    id: 'REST-001',
    name: 'The Garden Restaurant',
    type: 'main',
    capacity: 120,
    operatingHours: '06:00 - 22:00',
    cuisine: 'International',
  },
  {
    id: 'REST-002',
    name: 'The Pool Bar & Grill',
    type: 'pool',
    capacity: 60,
    operatingHours: '10:00 - 20:00',
    cuisine: 'Casual / BBQ',
  },
  {
    id: 'REST-003',
    name: 'Sakura Sushi',
    type: 'specialty',
    capacity: 40,
    operatingHours: '18:00 - 23:00',
    cuisine: 'Japanese',
  },
  {
    id: 'REST-004',
    name: 'La Terrazza',
    type: 'specialty',
    capacity: 50,
    operatingHours: '18:00 - 23:00',
    cuisine: 'Italian',
  },
];

const postingLog = [
  {
    id: 1,
    date: '2026-08-12',
    time: '06:15',
    reservationId: 'R-4021',
    guest: 'John Smith',
    plan: 'Standard Breakfast',
    amount: 25.0,
    status: 'posted',
    postedBy: 'System',
  },
  {
    id: 2,
    date: '2026-08-12',
    time: '06:15',
    reservationId: 'R-4022',
    guest: 'Sarah Johnson',
    plan: 'Standard Breakfast',
    amount: 25.0,
    status: 'posted',
    postedBy: 'System',
  },
  {
    id: 3,
    date: '2026-08-12',
    time: '18:30',
    reservationId: 'R-4021',
    guest: 'John Smith',
    plan: 'Half Board Premium',
    amount: 65.0,
    status: 'posted',
    postedBy: 'System',
  },
  {
    id: 4,
    date: '2026-08-13',
    time: '06:15',
    reservationId: 'R-4021',
    guest: 'John Smith',
    plan: 'Standard Breakfast',
    amount: 25.0,
    status: 'posted',
    postedBy: 'System',
  },
  {
    id: 5,
    date: '2026-08-13',
    time: '06:15',
    reservationId: 'R-4023',
    guest: 'Michael Brown',
    plan: 'All Inclusive Resort',
    amount: 129.0,
    status: 'failed',
    postedBy: 'System',
    error: 'Folio balance exceeded credit limit',
  },
  {
    id: 6,
    date: '2026-08-13',
    time: '12:00',
    reservationId: 'R-4024',
    guest: 'Emily Davis',
    plan: 'Full Board Family',
    amount: 89.0,
    status: 'posted',
    postedBy: 'System',
  },
  {
    id: 7,
    date: '2026-08-13',
    time: '18:30',
    reservationId: 'R-4024',
    guest: 'Emily Davis',
    plan: 'Full Board Family',
    amount: 89.0,
    status: 'pending',
    postedBy: 'System',
  },
];

const roomTypes = [
  { id: 'std-twin', name: 'Standard Twin' },
  { id: 'std-queen', name: 'Standard Queen' },
  { id: 'del-king', name: 'Deluxe King' },
  { id: 'suite', name: 'Executive Suite' },
  { id: 'accessible', name: 'Accessible King' },
];

/* ─── Helpers ─── */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const statusMeta = {
  posted: {
    label: 'Posted',
    class: 'bg-accent/10 text-accent border-accent/20',
    icon: CheckCircle2,
  },
  pending: { label: 'Pending', class: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  failed: {
    label: 'Failed',
    class: 'bg-danger/10 text-danger border-danger/20',
    icon: AlertCircle,
  },
};

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function BoardBasisBadge({ code }) {
  const meta = boardBasisCodes[code] || boardBasisCodes.RO;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        'bg-surface-elevated border-border'
      )}
    >
      <Icon className={cn('h-3 w-3', meta.color)} />
      <span className="text-text-primary">{code}</span>
      <span className="text-text-muted hidden sm:inline">· {meta.label}</span>
    </span>
  );
}

/* ─── Meal Plan Form Modal ─── */
function MealPlanModal({ plan, onClose, onSave }) {
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name: plan?.name || '',
    code: plan?.code || '',
    boardBasis: plan?.boardBasis || 'BB',
    price: plan?.price || 0,
    currency: plan?.currency || 'USD',
    taxInclusive: plan?.taxInclusive ?? true,
    autoPost: plan?.autoPost ?? true,
    postFrequency: plan?.postFrequency || 'daily',
    postTime: plan?.postTime || '06:00',
    applicableRoomTypes: plan?.applicableRoomTypes || [],
    restaurantId: plan?.restaurantId || '',
    description: plan?.description || '',
    inclusions: plan?.inclusions?.join('\\n') || '',
    exclusions: plan?.exclusions?.join('\\n') || '',
    seasonality: plan?.seasonality || 'year-round',
    startDate: plan?.startDate || '',
    endDate: plan?.endDate || '',
    isActive: plan?.isActive ?? true,
    childPolicy: plan?.childPolicy || { under6: 'free', under12: '50%', under16: '75%' },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: plan?.id || `MP-${1007 + Math.floor(Math.random() * 900)}`,
      price: parseFloat(form.price) || 0,
      inclusions: form.inclusions.split('\\n').filter(Boolean),
      exclusions: form.exclusions.split('\\n').filter(Boolean),
      restaurant: linkedRestaurants.find((r) => r.id === form.restaurantId)?.name || null,
    });
    onClose();
  };

  const toggleRoomType = (rtId) => {
    setForm((prev) => ({
      ...prev,
      applicableRoomTypes: prev.applicableRoomTypes.includes(rtId)
        ? prev.applicableRoomTypes.filter((id) => id !== rtId)
        : [...prev.applicableRoomTypes, rtId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">
              {isEdit ? 'Edit' : 'New'} Meal Plan
            </h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Plan Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Standard Breakfast"
                required
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Plan Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BB-STD"
                required
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Board Basis
              </label>
              <select
                value={form.boardBasis}
                onChange={(e) => setForm({ ...form, boardBasis: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(boardBasisCodes).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {code} — {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Price / Night
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Auto-Posting */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Auto-Posting</h4>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, autoPost: !form.autoPost })}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  form.autoPost ? 'bg-secondary' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                    form.autoPost ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {form.autoPost && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Post Frequency
                  </label>
                  <select
                    value={form.postFrequency}
                    onChange={(e) => setForm({ ...form, postFrequency: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="daily">Daily (per night)</option>
                    <option value="per-stay">Per Stay (lump sum)</option>
                    <option value="check-in">At Check-in Only</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Post Time
                  </label>
                  <input
                    type="time"
                    value={form.postTime}
                    onChange={(e) => setForm({ ...form, postTime: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Restaurant Link */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-secondary" />
              <h4 className="text-sm font-semibold text-text-primary">Restaurant Link</h4>
            </div>
            <select
              value={form.restaurantId}
              onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— No Restaurant —</option>
              {linkedRestaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.cuisine})
                </option>
              ))}
              <option value="MULTI">Multiple Venues</option>
            </select>
          </div>

          {/* Applicable Room Types */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Applicable Room Types</h4>
            <div className="flex flex-wrap gap-2">
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => toggleRoomType(rt.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.applicableRoomTypes.includes(rt.id)
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.applicableRoomTypes.includes(rt.id) && <Check className="h-3 w-3" />}
                  {rt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Inclusions (one per line)
              </label>
              <textarea
                value={form.inclusions}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
                rows={4}
                placeholder="Continental buffet\\nHot station\\nCoffee & tea"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Exclusions (one per line)
              </label>
              <textarea
                value={form.exclusions}
                onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                rows={4}
                placeholder="Alcoholic beverages\\nRoom service"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Child Policy */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Child Policy</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'under6', label: 'Under 6' },
                { key: 'under12', label: 'Under 12' },
                { key: 'under16', label: 'Under 16' },
              ].map((age) => (
                <div key={age.key}>
                  <label className="mb-1 block text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    {age.label}
                  </label>
                  <select
                    value={form.childPolicy[age.key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        childPolicy: { ...form.childPolicy, [age.key]: e.target.value },
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-text-primary"
                  >
                    <option value="free">Free</option>
                    <option value="25%">25%</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                    <option value="100%">Full Price</option>
                    <option value="n/a">N/A</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonality */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Seasonality
              </label>
              <select
                value={form.seasonality}
                onChange={(e) => setForm({ ...form, seasonality: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="year-round">Year-Round</option>
                <option value="summer">Summer Only</option>
                <option value="winter">Winter Only</option>
                <option value="holiday">Holiday Season</option>
                <option value="custom">Custom Dates</option>
              </select>
            </div>
            {form.seasonality === 'custom' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                  />
                </div>
              </>
            )}
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isActive ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className="text-sm text-text-primary">Plan is active and bookable</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Save className="mr-1.5 h-4 w-4" /> {isEdit ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState(initialMealPlans);
  const [query, setQuery] = useState('');
  const [boardFilter, setBoardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'posting-log' | 'restaurants'
  const [selectedPlan, setSelectedPlan] = useState(null);

  const filteredPlans = useMemo(() => {
    return mealPlans.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());
      const matchesBoard = boardFilter === 'all' || p.boardBasis === boardFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? p.isActive : !p.isActive);
      return matchesQuery && matchesBoard && matchesStatus;
    });
  }, [mealPlans, query, boardFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: mealPlans.length,
      active: mealPlans.filter((p) => p.isActive).length,
      autoPost: mealPlans.filter((p) => p.autoPost).length,
      avgPrice:
        mealPlans.filter((p) => p.price > 0).length > 0
          ? Math.round(
              mealPlans.filter((p) => p.price > 0).reduce((s, p) => s + p.price, 0) /
                mealPlans.filter((p) => p.price > 0).length
            )
          : 0,
    }),
    [mealPlans]
  );

  const handleSave = (plan) => {
    setMealPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [plan, ...prev];
    });
  };

  const handleDelete = (id) => {
    setMealPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingPlan(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Meal Plans & Board Basis</h1>
          <p className="text-sm text-text-secondary">
            Configure dining packages, auto-posting rules, and restaurant links
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> New Meal Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Plans" value={stats.total} icon={Utensils} color="text-secondary" />
        <StatCard
          label="Active Plans"
          value={stats.active}
          icon={CheckCircle2}
          color="text-accent"
        />
        <StatCard label="Auto-Posting" value={stats.autoPost} icon={Clock} color="text-info" />
        <StatCard
          label="Avg. Price"
          value={formatCurrency(stats.avgPrice)}
          icon={DollarSign}
          color="text-warning"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {[
            { id: 'plans', label: 'Meal Plans', icon: Utensils },
            { id: 'posting-log', label: 'Posting Log', icon: Clock },
            { id: 'restaurants', label: 'Restaurants', icon: Link2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
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

      {/* ─── PLANS TAB ─── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search meal plans..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="all">All Board Basis</option>
                {Object.keys(boardBasisCodes).map((code) => (
                  <option key={code} value={code}>
                    {code} — {boardBasisCodes[code].label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex rounded-md border border-border bg-surface p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-secondary text-white'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'list'
                      ? 'bg-secondary text-white'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map((plan) => {
                const bbMeta = boardBasisCodes[plan.boardBasis];
                const BbIcon = bbMeta.icon;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'group rounded-xl border bg-surface p-5 transition-all hover:shadow-md',
                      plan.isActive
                        ? 'border-border hover:border-secondary/50'
                        : 'border-danger/20 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            bbMeta.color.replace('text-', 'bg-').replace('500', '500/10')
                          )}
                        >
                          <BbIcon className={cn('h-5 w-5', bbMeta.color)} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{plan.name}</h3>
                          <p className="text-xs text-text-muted font-mono">{plan.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {plan.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    <BoardBasisBadge code={plan.boardBasis} />

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Price / night</span>
                        <span className="font-mono font-bold text-text-primary">
                          {formatCurrency(plan.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Auto-post</span>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            plan.autoPost ? 'text-accent' : 'text-text-muted'
                          )}
                        >
                          {plan.autoPost ? `${plan.postFrequency} @ ${plan.postTime}` : 'Manual'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Restaurant</span>
                        <span className="text-xs text-text-secondary truncate max-w-32">
                          {plan.restaurant || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {plan.applicableRoomTypes.map((rtId) => {
                        const rt = roomTypes.find((r) => r.id === rtId);
                        return (
                          <span
                            key={rtId}
                            className="rounded-md bg-background border border-border px-1.5 py-0.5 text-[10px] text-text-muted"
                          >
                            {rt?.name || rtId}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(plan)}
                      >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger/30 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredPlans.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                  <Utensils className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-text-muted">No meal plans match your filters.</p>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Code</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Board</th>
                      <th className="px-4 py-3 text-right font-medium text-text-secondary">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Auto-Post
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Restaurant
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Status
                      </th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{plan.name}</p>
                          <p className="text-xs text-text-muted">
                            {plan.applicableRoomTypes.length} room types
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                          {plan.code}
                        </td>
                        <td className="px-4 py-3">
                          <BoardBasisBadge code={plan.boardBasis} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                          {formatCurrency(plan.price)}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {plan.autoPost ? (
                            <span className="flex items-center gap-1 text-accent">
                              <Clock className="h-3 w-3" /> {plan.postFrequency}
                            </span>
                          ) : (
                            <span className="text-text-muted">Manual</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {plan.restaurant || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {plan.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                              <Ban className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(plan)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPlans.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                          No meal plans match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── POSTING LOG TAB ─── */}
      {activeTab === 'posting-log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Auto-Posting Log</h3>
              <p className="text-xs text-text-muted">
                Recent meal plan charges posted to guest folios
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Export Log
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Reservation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Posted By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {postingLog.map((entry) => {
                    const meta = statusMeta[entry.status];
                    const StatusIcon = meta.icon;
                    return (
                      <tr key={entry.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          <div>{entry.date}</div>
                          <div className="text-text-muted">{entry.time}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">
                          {entry.reservationId}
                        </td>
                        <td className="px-4 py-3 text-text-primary text-sm">{entry.guest}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{entry.plan}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                              meta.class
                            )}
                          >
                            <StatusIcon className="h-3 w-3" /> {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{entry.postedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Postings Alert */}
          {postingLog.some((e) => e.status === 'failed') && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {postingLog.filter((e) => e.status === 'failed').length} posting(s) failed
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Review failed entries above. Common causes: credit limit exceeded, folio closed,
                  or plan inactive.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── RESTAURANTS TAB ─── */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Linked Restaurants</h3>
              <p className="text-xs text-text-muted">
                Restaurants available for meal plan fulfillment
              </p>
            </div>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add Restaurant
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linkedRestaurants.map((rest) => {
              const linkedPlans = mealPlans.filter((p) => p.restaurantId === rest.id);
              return (
                <div
                  key={rest.id}
                  className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                        <Utensils className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{rest.name}</h3>
                        <p className="text-xs text-text-muted capitalize">
                          {rest.type} · {rest.cuisine}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {rest.capacity} seats
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock className="h-3.5 w-3.5 text-text-muted" />
                      {rest.operatingHours}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Link2 className="h-3.5 w-3.5 text-text-muted" />
                      {linkedPlans.length} meal plan{linkedPlans.length !== 1 ? 's' : ''} linked
                    </div>
                  </div>

                  {linkedPlans.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {linkedPlans.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-md bg-background border border-border px-1.5 py-0.5 text-[10px] text-text-muted"
                        >
                          {p.code}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MealPlanModal plan={editingPlan} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
