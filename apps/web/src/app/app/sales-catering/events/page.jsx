/* src/app/app/sales-catering/events/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Heart,
  Users,
  Mic,
  Utensils,
  Plus,
  ArrowLeft,
  Search,
  Loader2,
  FileText,
  Calendar,
  User,
  DollarSign,
  Trash2,
  ClipboardList,
  X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  useScEvents,
  useScEvent,
  useScClients,
  useScMutations,
} from '../../../../hooks/useSalesCatering';
import { useToast } from '../../../../hooks/use-toast';

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
const statuses = [
  'lead',
  'quoted',
  'contracted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'lost',
];
const statusMeta = {
  lead: 'bg-neutral/10 text-text-muted',
  quoted: 'bg-info/10 text-info',
  contracted: 'bg-warning/10 text-warning',
  confirmed: 'bg-secondary/10 text-secondary',
  in_progress: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-neutral/10 text-text-muted',
  lost: 'bg-error/10 text-error',
};

function EventDetail({ id, onBack }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: event, isLoading } = useScEvent(id);
  const { saveEvent, deleteEvent } = useScMutations();
  const [lostReason, setLostReason] = useState('');

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!event) return <p className="text-text-muted p-6">Event not found.</p>;

  const t = eventTypes[event.type] ?? eventTypes.corporate;
  const latestBeo = event.beos?.[0];
  const move = async (status) => {
    try {
      await saveEvent.mutateAsync({
        id,
        data: { status, ...(status === 'lost' && lostReason ? { lostReason } : {}) },
      });
      toast({ title: `Moved to ${status}` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} /> All events
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', t.bg)}>
            <t.icon size={24} className={t.color} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{event.name}</h1>
            <p className="text-sm text-text-muted">
              {event.client?.name ?? 'No client'} · {fmtDate(event.eventDate)}
              {event.startTime ? ` · ${event.startTime}` : ''}
              {event.endTime ? `–${event.endTime}` : ''}
              {' · '}
              {event.guestCount} guests
            </p>
          </div>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium capitalize',
            statusMeta[event.status]
          )}
        >
          {event.status.replace('_', ' ')}
        </span>
      </div>

      {/* Pipeline mover */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-text-muted mr-1">Move to:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => move(s)}
              disabled={s === event.status}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                s === event.status
                  ? 'bg-primary text-white'
                  : 'bg-neutral/5 text-text-muted hover:bg-neutral/15'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
          {event.status !== 'lost' && (
            <div className="flex items-center gap-1 ml-2">
              <Input
                className="w-44 h-8 text-xs"
                placeholder="Lost reason (optional)"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Event Value',
            value: event.financials ? fmt(event.financials.grandTotal) : fmt(event.budget),
            icon: DollarSign,
          },
          { label: 'Probability', value: `${event.probability}%`, icon: ClipboardList },
          { label: 'BEO Versions', value: event.beos?.length ?? 0, icon: FileText },
          {
            label: 'Owner',
            value: event.owner ? `${event.owner.firstName} ${event.owner.lastName}` : '—',
            icon: User,
          },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <s.icon size={12} /> {s.label}
            </div>
            <div className="text-lg font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* BEO versions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Banquet Event Orders</h2>
            <Button
              size="sm"
              onClick={() => navigate(`/app/sales-catering/beos?eventId=${id}&edit=new`)}
            >
              <Plus size={14} className="mr-1" /> {latestBeo ? 'New Version' : 'Draft BEO'}
            </Button>
          </div>
          {event.beos?.length === 0 && (
            <p className="text-sm text-text-muted">No BEO yet. Draft one to price this event.</p>
          )}
          <div className="space-y-2">
            {event.beos?.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/app/sales-catering/beos?id=${b.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 text-left"
              >
                <div>
                  <div className="text-sm font-medium">
                    v{b.version} — {b.title}
                  </div>
                  <div className="text-xs text-text-muted">
                    {b.venue?.name ?? 'No venue'} · {b.guestCount} guests
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full capitalize',
                    b.status === 'signed'
                      ? 'bg-success/10 text-success'
                      : b.status === 'approved'
                        ? 'bg-secondary/10 text-secondary'
                        : b.status === 'pending_approval'
                          ? 'bg-warning/10 text-warning'
                          : b.status === 'changes_requested'
                            ? 'bg-error/10 text-error'
                            : 'bg-neutral/10 text-text-muted'
                  )}
                >
                  {b.status.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details + activity */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Source</span>
              <span className="capitalize">{event.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Type</span>
              <span className="capitalize">{event.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Client contact</span>
              <span>{event.client?.primaryContact ?? '—'}</span>
            </div>
            {event.lostReason && (
              <div className="flex justify-between">
                <span className="text-text-muted">Lost reason</span>
                <span>{event.lostReason}</span>
              </div>
            )}
          </div>
          {event.notes && <p className="mt-4 text-sm bg-neutral/5 rounded-lg p-3">{event.notes}</p>}

          <h3 className="text-sm font-medium mt-6 mb-2">Activity</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {event.activities?.length === 0 && (
              <p className="text-xs text-text-muted">No activity yet.</p>
            )}
            {event.activities?.map((a) => (
              <div key={a.id} className="text-xs p-2 rounded bg-neutral/5">
                <span className="text-text-muted">
                  {fmtDate(a.createdAt)} · {a.type.replace('_', ' ')}:{' '}
                </span>
                {a.body}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScEventsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const statusParam = searchParams.get('status') ?? '';
  const clientParam = searchParams.get('clientId') ?? '';
  const { toast } = useToast();
  const [status, setStatus] = useState(statusParam);
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'corporate',
    eventDate: '',
    guestCount: '',
    budget: '',
    clientId: '',
  });

  const { data, isLoading } = useScEvents({
    ...(status ? { status } : {}),
    ...(clientParam ? { clientId: clientParam } : {}),
  });
  const { data: clientsData } = useScClients();
  const { saveEvent } = useScMutations();

  const events = useMemo(() => {
    const list = data?.data ?? [];
    const q = query.toLowerCase();
    return q
      ? list.filter(
          (e) => e.name.toLowerCase().includes(q) || e.client?.name?.toLowerCase().includes(q)
        )
      : list;
  }, [data, query]);

  if (selectedId) {
    return (
      <EventDetail
        id={selectedId}
        onBack={() => navigate('/app/sales-catering/events', { replace: true })}
      />
    );
  }

  const createEvent = async () => {
    if (!form.name || !form.eventDate) {
      toast({ title: 'Name and date required', variant: 'destructive' });
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
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events & Leads</h1>
          <p className="text-sm text-text-muted mt-1">{events.length} events</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-1" /> New Event
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['', ...statuses].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize',
                status === s
                  ? 'bg-primary text-white'
                  : 'bg-neutral/5 text-text-muted hover:bg-neutral/10'
              )}
            >
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="p-3">Event</th>
                <th className="p-3">Client</th>
                <th className="p-3">Date</th>
                <th className="p-3">Guests</th>
                <th className="p-3">Latest BEO</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const t = eventTypes[e.type] ?? eventTypes.corporate;
                return (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-neutral/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <t.icon size={15} className={t.color} />
                        <button
                          className="font-medium hover:text-primary text-left"
                          onClick={() => navigate(`/app/sales-catering/events?id=${e.id}`)}
                        >
                          {e.name}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-text-muted">{e.client?.name ?? '—'}</td>
                    <td className="p-3">{fmtDate(e.eventDate)}</td>
                    <td className="p-3">{e.guestCount}</td>
                    <td className="p-3">
                      {e.beos?.[0] ? (
                        <span className="text-xs">
                          v{e.beos[0].version} · {e.beos[0].status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-warning">none</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                          statusMeta[e.status]
                        )}
                      >
                        {e.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      {e.beos?.length === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            navigate(`/app/sales-catering/beos?eventId=${e.id}&edit=new`)
                          }
                        >
                          <FileText size={12} className="mr-1" /> Draft BEO
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-text-muted">
                    No events match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNew(false)}
        >
          <div className="card w-full max-w-lg p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Event</h2>
              <button onClick={() => setShowNew(false)}>
                <X size={18} />
              </button>
            </div>
            <Input
              placeholder="Event name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(eventTypes).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Guests"
                value={form.guestCount}
                onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Budget (ZAR)"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <select
              className="input w-full"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">— No client —</option>
              {(clientsData?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button onClick={createEvent} disabled={saveEvent.isPending}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
