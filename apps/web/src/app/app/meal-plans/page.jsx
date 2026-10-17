/* src/app/app/meal-plans/page.jsx — T7: fully wired to /v1/meal-plans */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePropertyStore } from '../../../stores/propertyStore';
import {
  Utensils,
  Coffee,
  Sun,
  GlassWater,
  BedDouble,
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  List,
  Save,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { mealPlansApi } from '../../../api/meal-plans';
import { useMealPlans, useMealPlanSummary } from '../../../hooks/useMealPlans';

/* ─── Board basis metadata (unchanged design language) ─── */
const boardBasisCodes = {
  RO: { label: 'Room Only', icon: BedDouble, color: 'text-text-muted' },
  BB: { label: 'Bed & Breakfast', icon: Coffee, color: 'text-amber-500' },
  HB: { label: 'Half Board', icon: Sun, color: 'text-orange-500' },
  FB: { label: 'Full Board', icon: Utensils, color: 'text-emerald-500' },
  AI: { label: 'All Inclusive', icon: GlassWater, color: 'text-purple-500' },
  UAI: { label: 'Ultra All Inclusive', icon: GlassWater, color: 'text-pink-500' },
};

const CHILD_OPTIONS = ['free', '50', '75', 'full', 'n/a'];
const TABS = [
  { id: 'plans', label: 'Meal Plans' },
  { id: 'log', label: 'Posting Log' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'covers', label: 'Covers Forecast' },
];

function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount ?? 0);
}

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/* ─── Shared bits ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', color.replace('text-', 'bg-').concat('/10'))}>
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
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
      <Icon className={cn('h-3 w-3', meta.color)} />
      <span className="text-text-primary">{code}</span>
      <span className="hidden text-text-muted sm:inline">· {meta.label}</span>
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent';

/* ─── Meal plan modal ─── */
function MealPlanModal({ plan, restaurants, onClose, onSaved }) {
  const isEdit = !!plan;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: plan?.name || '',
    code: plan?.code || '',
    boardBasis: plan?.boardBasis || 'BB',
    price: plan?.price ?? 0,
    autoPost: plan?.autoPost ?? true,
    postTime: plan?.postTime || '06:00',
    restaurantId: plan?.restaurantId || '',
    description: plan?.description || '',
    inclusions: (plan?.inclusions || []).join('\n'),
    exclusions: (plan?.exclusions || []).join('\n'),
    childUnder6: plan?.childUnder6 || 'free',
    childUnder12: plan?.childUnder12 || '50',
    childUnder16: plan?.childUnder16 || '75',
    startDate: plan?.startDate?.slice(0, 10) || '',
    endDate: plan?.endDate?.slice(0, 10) || '',
    isActive: plan?.isActive ?? true,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const lines = (s) =>
    s
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        propertyId: 'demo-prop', // replaced below by caller
        ...form,
        price: Number(form.price),
        restaurantId: form.restaurantId || null,
        inclusions: lines(form.inclusions),
        exclusions: lines(form.exclusions),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      delete body.propertyId;
      if (isEdit) await mealPlansApi.update(plan.id, body);
      else
        await mealPlansApi.create({
          ...body,
          propertyId: plan?.propertyId || window.__vimadPropertyId || '',
        });
      toast({ title: isEdit ? 'Meal plan updated' : 'Meal plan created' });
      onSaved();
      onClose();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: String(e.message || e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Edit meal plan' : 'New meal plan'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Code">
            <input
              className={inputCls}
              value={form.code}
              onChange={set('code')}
              placeholder="HB-PREM"
            />
          </Field>
          <Field label="Board basis">
            <select className={inputCls} value={form.boardBasis} onChange={set('boardBasis')}>
              {Object.entries(boardBasisCodes).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} — {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price per adult / day (ZAR)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.price}
              onChange={set('price')}
            />
          </Field>
          <Field label="Restaurant">
            <select className={inputCls} value={form.restaurantId} onChange={set('restaurantId')}>
              <option value="">— none —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Posting">
            <div className="flex items-center gap-2">
              <select
                className={inputCls}
                value={form.autoPost ? 'auto' : 'manual'}
                onChange={(e) => setForm((f) => ({ ...f, autoPost: e.target.value === 'auto' }))}
              >
                <option value="auto">Auto-post daily</option>
                <option value="manual">Manual only</option>
              </select>
              {form.autoPost && (
                <input
                  type="time"
                  className={cn(inputCls, 'w-32')}
                  value={form.postTime}
                  onChange={set('postTime')}
                />
              )}
            </div>
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <input className={inputCls} value={form.description} onChange={set('description')} />
            </Field>
          </div>

          <Field label="Inclusions (one per line)">
            <textarea
              rows={3}
              className={inputCls}
              value={form.inclusions}
              onChange={set('inclusions')}
            />
          </Field>
          <Field label="Exclusions (one per line)">
            <textarea
              rows={3}
              className={inputCls}
              value={form.exclusions}
              onChange={set('exclusions')}
            />
          </Field>

          {['childUnder6', 'childUnder12', 'childUnder16'].map((k) => (
            <Field
              key={k}
              label={`Child ${k === 'childUnder6' ? '< 6' : k === 'childUnder12' ? '6–12' : '13–16'} pays`}
            >
              <select className={inputCls} value={form[k]} onChange={set(k)}>
                {CHILD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === 'free' ? 'Free' : o === 'n/a' ? 'N/A' : `${o}%`}
                  </option>
                ))}
              </select>
            </Field>
          ))}

          <Field label="Season start (optional)">
            <input
              type="date"
              className={inputCls}
              value={form.startDate}
              onChange={set('startDate')}
            />
          </Field>
          <Field label="Season end (optional)">
            <input
              type="date"
              className={inputCls}
              value={form.endDate}
              onChange={set('endDate')}
            />
          </Field>

          {isEdit && (
            <label className="col-span-2 flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Plan is active
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !form.name || !form.code}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEdit ? 'Save changes' : 'Create plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Plans tab ─── */
function PlansTab({ plans, loading, restaurants, onRefresh, propertyId }) {
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [modal, setModal] = useState(null); // null | {plan?}
  const { toast } = useToast();

  const filtered = useMemo(
    () =>
      plans.filter(
        (p) =>
          (!search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase())) &&
          (!boardFilter || p.boardBasis === boardFilter)
      ),
    [plans, search, boardFilter]
  );

  const remove = async (plan) => {
    try {
      const res = await mealPlansApi.remove(plan.id);
      toast({
        title: res.data.deactivated ? 'Plan deactivated' : 'Plan deleted',
        description: res.data.deactivated
          ? 'Active assignments exist — the plan was deactivated instead of deleted.'
          : undefined,
      });
      onRefresh();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: String(e.message || e),
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className={cn(inputCls, 'pl-9 w-64')}
          />
        </div>
        <select
          className={cn(inputCls, 'w-48')}
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
        >
          <option value="">All board bases</option>
          {Object.keys(boardBasisCodes).map((k) => (
            <option key={k} value={k}>
              {k} — {boardBasisCodes[k].label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          >
            {view === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={() => setModal({})}>
            <Plus className="mr-1 h-4 w-4" /> New plan
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-text-muted">
          <Utensils className="mx-auto mb-2 h-8 w-8" /> No meal plans match. Create your first plan.
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={cn(
                'rounded-xl border bg-surface p-4',
                p.isActive ? 'border-border' : 'border-border opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">
                    {p.code} · {p.restaurant?.name || 'No restaurant'}
                  </p>
                </div>
                <BoardBasisBadge code={p.boardBasis} />
              </div>
              <p className="mt-3 text-xl font-bold text-text-primary">
                {formatCurrency(p.price, p.currency)}
                <span className="text-xs font-normal text-text-muted"> /adult/day</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-text-muted">
                <span className="rounded bg-surface-elevated px-1.5 py-0.5">
                  {p.autoPost ? `Auto-post ${p.postTime}` : 'Manual posting'}
                </span>
                <span className="rounded bg-surface-elevated px-1.5 py-0.5">
                  {p._count?.assignments ?? 0} active stays
                </span>
                {(p.startDate || p.endDate) && (
                  <span className="rounded bg-surface-elevated px-1.5 py-0.5">
                    <Calendar className="mr-0.5 inline h-3 w-3" />
                    {p.startDate?.slice(0, 10) || '…'} → {p.endDate?.slice(0, 10) || '…'}
                  </span>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setModal({ plan: p })}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated text-left text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Basis</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Posting</th>
                <th className="px-4 py-2">Assignments</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <p className="font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-muted">
                      {p.code} · {p.restaurant?.name || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <BoardBasisBadge code={p.boardBasis} />
                  </td>
                  <td className="px-4 py-2 text-text-primary">
                    {formatCurrency(p.price, p.currency)}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {p.autoPost ? `Auto ${p.postTime}` : 'Manual'}
                  </td>
                  <td className="px-4 py-2 text-text-muted">{p._count?.assignments ?? 0}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setModal({ plan: p })}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <MealPlanModal
          plan={modal.plan}
          restaurants={restaurants}
          propertyId={propertyId}
          onClose={() => setModal(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

/* ─── Posting log tab ─── */
const postStatusMeta = {
  posted: { label: 'Posted', cls: 'bg-accent/10 text-accent border-accent/20', icon: CheckCircle2 },
  pending: { label: 'Pending', cls: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  failed: { label: 'Failed', cls: 'bg-danger/10 text-danger border-danger/20', icon: AlertCircle },
  skipped: { label: 'Skipped', cls: 'bg-surface-elevated text-text-muted border-border', icon: X },
};

function LogTab({ toast }) {
  const [params, setParams] = useState({ page: 1, pageSize: 25, status: '' });
  const [rows, setRows] = useState({
    data: [],
    meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    loading: true,
  });
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setRows((r) => ({ ...r, loading: true }));
    try {
      const res = await mealPlansApi.postings(params);
      setRows({ data: res.data, meta: res.meta, loading: false });
    } catch (e) {
      setRows((r) => ({ ...r, loading: false }));
      toast({
        variant: 'destructive',
        title: 'Log load failed',
        description: String(e.message || e),
      });
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id) => {
    try {
      await mealPlansApi.retryPosting(id);
      toast({ title: 'Posting retried' });
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Retry failed', description: String(e.message || e) });
    }
  };

  const postNow = async () => {
    setRunning(true);
    try {
      const res = await mealPlansApi.postNow();
      toast({
        title: 'Auto-post run complete',
        description: `${res.data.posted} posted · ${res.data.failed} failed · ${res.data.skipped} skipped`,
      });
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Run failed', description: String(e.message || e) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className={cn(inputCls, 'w-40')}
          value={params.status}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
        >
          <option value="">All statuses</option>
          {Object.keys(postStatusMeta).map((s) => (
            <option key={s} value={s}>
              {postStatusMeta[s].label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={cn(inputCls, 'w-40')}
          value={params.date || ''}
          onChange={(e) => setParams((p) => ({ ...p, date: e.target.value || undefined, page: 1 }))}
        />
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
        <Button size="sm" onClick={postNow} disabled={running}>
          {running ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1 h-4 w-4" />
          )}
          Run auto-post now
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Guest</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Error</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  No postings yet. Assign a plan to an in-house reservation and run auto-post.
                </td>
              </tr>
            ) : (
              rows.data.map((p) => {
                const meta = postStatusMeta[p.status] || postStatusMeta.pending;
                const Icon = meta.icon;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 text-text-primary">{p.date?.slice(0, 10)}</td>
                    <td className="px-4 py-2">
                      <p className="text-text-primary">
                        {p.assignment?.reservation?.guest?.firstName}{' '}
                        {p.assignment?.reservation?.guest?.lastName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {p.assignment?.reservation?.confirmationNumber}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-text-muted">{p.assignment?.mealPlan?.name}</td>
                    <td className="px-4 py-2 text-text-primary">
                      {formatCurrency(p.amount, p.assignment?.mealPlan?.currency)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                          meta.cls
                        )}
                      >
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="max-w-48 truncate px-4 py-2 text-xs text-danger">
                      {p.error || ''}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.status === 'failed' && (
                        <Button variant="outline" size="sm" onClick={() => retry(p.id)}>
                          <RefreshCw className="mr-1 h-3 w-3" /> Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.meta.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-text-muted">
          <Button
            variant="outline"
            size="sm"
            disabled={params.page <= 1}
            onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
          >
            Prev
          </Button>
          <span>
            {params.page} / {rows.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={params.page >= rows.meta.totalPages}
            onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Restaurants tab ─── */
function RestaurantsTab({ restaurants, onChanged, propertyId, toast }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'main',
    cuisine: '',
    capacity: 50,
    operatingHours: '',
    location: '',
  });

  const openNew = () => {
    setForm({
      name: '',
      type: 'main',
      cuisine: '',
      capacity: 50,
      operatingHours: '',
      location: '',
    });
    setModal({});
  };
  const openEdit = (r) => {
    setForm({
      name: r.name,
      type: r.type,
      cuisine: r.cuisine || '',
      capacity: r.capacity,
      operatingHours: r.operatingHours || '',
      location: r.location || '',
    });
    setModal(r);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal?.id)
        await mealPlansApi.updateRestaurant(modal.id, { ...form, capacity: Number(form.capacity) });
      else
        await mealPlansApi.createRestaurant({
          ...form,
          capacity: Number(form.capacity),
          propertyId,
        });
      toast({ title: 'Restaurant saved' });
      setModal(null);
      onChanged();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save failed', description: String(e.message || e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add restaurant
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-text-primary">{r.name}</p>
                <p className="text-xs capitalize text-text-muted">
                  {r.type.replace('_', ' ')} · {r.cuisine || '—'}
                </p>
              </div>
              <Utensils className="h-4 w-4 text-text-muted" />
            </div>
            <div className="mt-3 space-y-1 text-xs text-text-muted">
              <p>
                <Users className="mr-1 inline h-3 w-3" /> Capacity {r.capacity}
              </p>
              <p>
                <Clock className="mr-1 inline h-3 w-3" /> {r.operatingHours || 'Hours not set'}
              </p>
              <p>{r._count?.mealPlans ?? 0} linked meal plan(s)</p>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-text-muted">
            No restaurants yet.
          </div>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-text-primary">
              {modal.id ? 'Edit restaurant' : 'New restaurant'}
            </h3>
            <div className="space-y-3">
              <Field label="Name">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Type">
                <select
                  className={inputCls}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="main">Main restaurant</option>
                  <option value="pool">Pool / casual</option>
                  <option value="specialty">Specialty</option>
                  <option value="bar">Bar</option>
                  <option value="room_service">Room service</option>
                </select>
              </Field>
              <Field label="Cuisine">
                <input
                  className={inputCls}
                  value={form.cuisine}
                  onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity">
                  <input
                    type="number"
                    className={inputCls}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  />
                </Field>
                <Field label="Hours">
                  <input
                    className={inputCls}
                    placeholder="06:00 - 22:00"
                    value={form.operatingHours}
                    onChange={(e) => setForm((f) => ({ ...f, operatingHours: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Location">
                <input
                  className={inputCls}
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || !form.name}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}{' '}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Covers forecast tab (kitchen prep sheet) ─── */
function CoversTab({ propertyId, toast }) {
  const [date, setDate] = useState(todayStr(1));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await mealPlansApi.covers(propertyId, date);
      setData(res.data);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Covers load failed',
        description: String(e.message || e),
      });
    } finally {
      setLoading(false);
    }
  }, [propertyId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="date"
          className={cn(inputCls, 'w-44')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-1 h-4 w-4" /> Reload
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-text-muted" />
        </div>
      ) : !data ? null : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total covers"
              value={data.totalCovers}
              subtext={date}
              icon={Users}
              color="text-accent"
            />
            <StatCard label="Adults" value={data.totalAdults} icon={Coffee} color="text-info" />
            <StatCard
              label="Children"
              value={data.totalChildren}
              icon={Utensils}
              color="text-warning"
            />
          </div>

          {data.dietaryFlags.length > 0 && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-warning">
                <AlertCircle className="h-4 w-4" /> Dietary alerts ({data.dietaryFlags.length})
              </p>
              <ul className="list-inside list-disc text-xs text-text-primary">
                {data.dietaryFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {data.planBreakdown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-text-muted">
              No meal covers for this date.
            </div>
          ) : (
            <div className="space-y-4">
              {data.planBreakdown.map((b) => (
                <div key={b.plan.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <BoardBasisBadge code={b.plan.boardBasis} />
                      <p className="font-semibold text-text-primary">{b.plan.name}</p>
                      <p className="text-xs text-text-muted">{b.plan.restaurant?.name || '—'}</p>
                    </div>
                    <p className="text-sm text-text-muted">
                      {b.covers} covers ({b.adults} adults · {b.children} children)
                    </p>
                  </div>
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-text-muted">
                      <tr>
                        <th className="py-1">Guest</th>
                        <th className="py-1">Conf #</th>
                        <th className="py-1">Party</th>
                        <th className="py-1">Dietary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.reservations.map((r) => (
                        <tr key={r.confirmationNumber} className="border-t border-border">
                          <td className="py-1.5 text-text-primary">{r.guest}</td>
                          <td className="py-1.5 text-text-muted">{r.confirmationNumber}</td>
                          <td className="py-1.5 text-text-muted">{r.adults + r.children}</td>
                          <td className="py-1.5 text-xs text-warning">{r.dietary.join('; ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function MealPlansPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [propertyId, setPropertyId] = useState('');
  const { toast } = useToast();

  // Property resolution: the C1 property-switcher store (reactive — follows switching).
  const currentPropertyId = usePropertyStore((s) => s.currentPropertyId);
  useEffect(() => {
    if (currentPropertyId) setPropertyId(currentPropertyId);
  }, [currentPropertyId]);

  const { data: plans, loading, refetch } = useMealPlans({ page: 1, pageSize: 100 });
  const { summary, reload: reloadSummary } = useMealPlanSummary(propertyId || undefined);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantTick, setRestaurantTick] = useState(0);

  const loadRestaurants = useCallback(async () => {
    try {
      const res = await mealPlansApi.restaurants(propertyId || undefined);
      setRestaurants(res.data);
    } catch {
      /* non-fatal */
    }
  }, [propertyId]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants, restaurantTick]);

  const refreshAll = useCallback(() => {
    refetch();
    reloadSummary();
  }, [refetch, reloadSummary]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Utensils className="h-6 w-6 text-accent" /> Meal Plans
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Board-basis packages, auto-posting to folios, and kitchen covers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Active plans"
            value={summary.activePlans}
            icon={Utensils}
            color="text-accent"
          />
          <StatCard
            label="Assigned stays"
            value={summary.activeAssignments}
            icon={Users}
            color="text-info"
          />
          <StatCard
            label="Posted today"
            value={summary.postedToday}
            icon={CheckCircle2}
            color="text-emerald-500"
          />
          <StatCard
            label="Failed today"
            value={summary.failedToday}
            icon={AlertCircle}
            color={summary.failedToday > 0 ? 'text-danger' : 'text-text-muted'}
          />
          <StatCard
            label="Revenue this month"
            value={formatCurrency(summary.monthRevenue, summary.currency)}
            icon={Coffee}
            color="text-warning"
          />
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === t.id
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <PlansTab
          plans={plans}
          loading={loading}
          restaurants={restaurants}
          propertyId={propertyId}
          onRefresh={refreshAll}
        />
      )}
      {activeTab === 'log' && <LogTab toast={toast} />}
      {activeTab === 'restaurants' && (
        <RestaurantsTab
          restaurants={restaurants}
          propertyId={propertyId}
          onChanged={() => setRestaurantTick((n) => n + 1)}
          toast={toast}
        />
      )}
      {activeTab === 'covers' && <CoversTab propertyId={propertyId} toast={toast} />}
    </div>
  );
}
