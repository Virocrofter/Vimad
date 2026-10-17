/* src/app/app/sales-catering/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Heart,
  Users,
  Mic,
  Utensils,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ClipboardList,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  useScStats,
  useScEvents,
  useScClients,
  useScMutations,
} from '../../../hooks/useSalesCatering';
import { useToast } from '../../../hooks/use-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n || 0);
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const eventTypes = {
  wedding: { label: 'Wedding', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  corporate: { label: 'Corporate', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  social: { label: 'Social', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  conference: {
    label: 'Conference',
    icon: Mic,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  banquet: { label: 'Banquet', icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};
const statusMeta = {
  lead: { label: 'Lead', cls: 'bg-neutral/10 text-text-muted' },
  quoted: { label: 'Quoted', cls: 'bg-info/10 text-info' },
  contracted: { label: 'Contracted', cls: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmed', cls: 'bg-secondary/10 text-secondary' },
  in_progress: { label: 'In Progress', cls: 'bg-accent/10 text-accent' },
  completed: { label: 'Completed', cls: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', cls: 'bg-neutral/10 text-text-muted' },
  lost: { label: 'Lost', cls: 'bg-error/10 text-error' },
};
const PIPELINE = ['lead', 'quoted', 'contracted', 'confirmed', 'in_progress'];

export default function SalesCateringPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useScStats();
  const { data: eventsData, isLoading: eventsLoading } = useScEvents();
  const { data: clientsData } = useScClients();
  const { saveEvent } = useScMutations();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'corporate',
    eventDate: '',
    guestCount: '',
    budget: '',
    clientId: '',
  });

  const events = eventsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const pipeline = stats?.pipeline ?? [];
  const maxTotal = Math.max(...pipeline.map((p) => p.total), 1);
  const upcoming = events
    .filter((e) => ['confirmed', 'contracted', 'in_progress'].includes(e.status))
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    .slice(0, 6);
  const needsAction = events.filter(
    (e) => (e.status === 'lead' && e.beos?.length === 0) || e.status === 'quoted'
  );

  const createEvent = async () => {
    if (!form.name || !form.eventDate) {
      toast({ title: 'Name and event date are required', variant: 'destructive' });
      return;
    }
    try {
      await saveEvent.mutateAsync({
        data: {
          ...form,
          guestCount: Number(form.guestCount) || 0,
          budget: form.budget ? Number(form.budget) : undefined,
          clientId: form.clientId || undefined,
        },
      });
      toast({ title: 'Event created' });
      setShowNew(false);
      setForm({
        name: '',
        type: 'corporate',
        eventDate: '',
        guestCount: '',
        budget: '',
        clientId: '',
      });
    } catch (e) {
      toast({ title: 'Failed to create event', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales & Catering</h1>
          <p className="text-sm text-text-muted mt-1">Pipeline, events and banquet orders</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-1" /> New Lead / Event
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Pipeline Value',
            value: fmt(pipeline.reduce((s, p) => s + p.total, 0)),
            icon: DollarSign,
            sub: `${pipeline.reduce((s, p) => s + p.count, 0)} open events`,
          },
          {
            label: 'Weighted Pipeline',
            value: fmt(pipeline.reduce((s, p) => s + p.weighted, 0)),
            icon: TrendingUp,
            sub: 'probability-adjusted',
          },
          {
            label: 'Upcoming Events',
            value: stats?.upcoming ?? '—',
            icon: Calendar,
            sub: `${statsLoading ? '…' : (stats?.openBeos ?? 0)} BEOs in draft`,
          },
          {
            label: 'Completed This Year',
            value: stats?.completedThisYear ?? '—',
            icon: ClipboardList,
            sub: 'events delivered',
          },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
              <k.icon size={14} /> {k.label}
            </div>
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-text-muted mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">Pipeline Funnel</h2>
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {pipeline.map((p) => (
              <button
                key={p.status}
                onClick={() => navigate(`/app/sales-catering/events?status=${p.status}`)}
                className="w-full flex items-center gap-4 group"
              >
                <span
                  className={cn(
                    'w-24 text-xs text-left font-medium capitalize',
                    statusMeta[p.status]?.cls
                  )}
                >
                  {statusMeta[p.status]?.label ?? p.status}
                </span>
                <div className="flex-1 h-8 bg-neutral/5 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-primary/70 rounded-lg transition-all group-hover:bg-primary"
                    style={{ width: `${Math.max((p.total / maxTotal) * 100, 2)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium mix-blend-difference text-white">
                    {p.count} events
                  </span>
                </div>
                <span className="w-28 text-right text-sm font-semibold">{fmt(p.total)}</span>
                <span className="w-24 text-right text-xs text-text-muted">
                  w: {fmt(p.weighted)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Events</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/sales-catering/events')}
            >
              View all <ArrowUpRight size={14} />
            </Button>
          </div>
          {eventsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-text-muted">No confirmed upcoming events.</p>
              )}
              {upcoming.map((e) => {
                const t = eventTypes[e.type] ?? eventTypes.corporate;
                return (
                  <button
                    key={e.id}
                    onClick={() => navigate(`/app/sales-catering/events?id=${e.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral/5 text-left"
                  >
                    <div className={cn('p-2 rounded-lg', t.bg)}>
                      <t.icon size={18} className={t.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{e.name}</div>
                      <div className="text-xs text-text-muted">
                        {e.client?.name ?? '—'} · {e.guestCount} guests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{fmtDate(e.eventDate)}</div>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full',
                          statusMeta[e.status]?.cls
                        )}
                      >
                        {statusMeta[e.status]?.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs action */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Needs Action</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/sales-catering/beos')}>
              BEOs <ArrowUpRight size={14} />
            </Button>
          </div>
          <div className="space-y-3">
            {needsAction.length === 0 && (
              <p className="text-sm text-text-muted">Nothing waiting on you.</p>
            )}
            {needsAction.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20"
              >
                <ClipboardList size={18} className="text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{e.name}</div>
                  <div className="text-xs text-text-muted">
                    {e.status === 'lead' ? 'No BEO drafted yet' : 'Quote sent — awaiting client'} ·
                    due {fmtDate(e.eventDate)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      e.status === 'lead'
                        ? `/app/sales-catering/events?id=${e.id}`
                        : '/app/sales-catering/beos'
                    )
                  }
                >
                  {e.status === 'lead' ? 'Draft BEO' : 'Follow up'}
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Building2 size={14} /> Top Clients
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/sales-catering/clients')}
              >
                All clients <ArrowUpRight size={14} />
              </Button>
            </div>
            <div className="space-y-1.5">
              {clients.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/app/sales-catering/clients?id=${c.id}`)}
                  className="w-full flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-neutral/5"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-text-muted">{c._count?.events ?? 0} events</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New event modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNew(false)}
        >
          <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">New Lead / Event</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-text-muted">Event name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Q4 Leadership Offsite"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Type</label>
                <select
                  className="input w-full"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {Object.entries(eventTypes).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Event date *</label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Guests</label>
                <Input
                  type="number"
                  min="0"
                  value={form.guestCount}
                  onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Budget (ZAR)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-text-muted">Client</label>
                <select
                  className="input w-full"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">— No client (walk-in lead) —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button onClick={createEvent} disabled={saveEvent.isPending}>
                {saveEvent.isPending ? 'Saving…' : 'Create Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
