/* src/app/app/sales-catering/clients/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  X,
  Plus,
  ArrowLeft,
  PhoneCall,
  Video,
  StickyNote,
  PartyPopper,
  Award,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { useScClients, useScClient, useScMutations } from '../../../../hooks/useSalesCatering';
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

const typeMeta = {
  corporate: { label: 'Corporate', icon: Building2, color: 'text-secondary' },
  wedding: { label: 'Wedding', icon: PartyPopper, color: 'text-accent' },
  social: { label: 'Social', icon: Users, color: 'text-info' },
  nonprofit: { label: 'Nonprofit', icon: Award, color: 'text-warning' },
  individual: { label: 'Individual', icon: User, color: 'text-text-muted' },
};
const activityIcons = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  note: StickyNote,
  status_change: Calendar,
};

function ClientDetail({ id, onBack }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: client, isLoading } = useScClient(id);
  const { addActivity } = useScMutations();
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('note');

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!client) return <p className="text-text-muted p-6">Client not found.</p>;

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await addActivity.mutateAsync({ clientId: id, type: noteType, body: note.trim() });
      setNote('');
      toast({ title: 'Activity logged' });
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
        <ArrowLeft size={14} /> Back to clients
      </button>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            {(() => {
              const T = typeMeta[client.type]?.icon ?? Building2;
              return <T size={24} className="text-primary" />;
            })()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            <p className="text-sm text-text-muted">
              {typeMeta[client.type]?.label} · client since {fmtDate(client.clientSince)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/app/sales-catering/events?clientId=${id}`)}
        >
          View events
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lifetime Value', value: fmt(client.lifetimeValue), icon: DollarSign },
          { label: 'Total Events', value: client.events?.length ?? 0, icon: Calendar },
          { label: 'Primary Contact', value: client.primaryContact ?? '—', icon: User },
          { label: 'Tags', value: client.tags?.join(', ') || '—', icon: StickyNote },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <s.icon size={12} /> {s.label}
            </div>
            <div className="text-lg font-semibold truncate">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Contact</h2>
          <div className="space-y-2.5 text-sm">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-text-muted" /> {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-text-muted" /> {client.phone}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-text-muted" /> {client.address}
              </div>
            )}
            {client.accountManager && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-muted" />
                Account manager: {client.accountManager.firstName} {client.accountManager.lastName}
              </div>
            )}
          </div>
          {client.notes && (
            <p className="mt-4 text-sm bg-neutral/5 rounded-lg p-3">{client.notes}</p>
          )}
          {client.events?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Events</h3>
              {client.events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/app/sales-catering/events?id=${e.id}`)}
                  className="w-full flex items-center justify-between text-sm py-2 px-2 rounded hover:bg-neutral/5"
                >
                  <span className="truncate">{e.name}</span>
                  <span className="text-xs text-text-muted">
                    {fmtDate(e.eventDate)} · {e.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4">Activity Timeline</h2>
          <div className="flex gap-2 mb-4">
            <select
              className="input w-28"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log an interaction…"
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <Button size="sm" onClick={addNote} disabled={addActivity.isPending}>
              Log
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {client.activities?.length === 0 && (
              <p className="text-sm text-text-muted">No activity yet.</p>
            )}
            {client.activities?.map((a) => {
              const I = activityIcons[a.type] ?? StickyNote;
              return (
                <div key={a.id} className="flex gap-3">
                  <div className="p-2 rounded-lg bg-neutral/5 h-fit">
                    <I size={14} className="text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{a.body}</div>
                    <div className="text-xs text-text-muted mt-0.5">{fmtDate(a.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScClientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'corporate',
    primaryContact: '',
    email: '',
    phone: '',
    tags: '',
  });
  const { data, isLoading } = useScClients(query);
  const { saveClient, deleteClient } = useScMutations();

  const clients = useMemo(() => {
    const list = data?.data ?? [];
    const filtered = typeFilter === 'all' ? list : list.filter((c) => c.type === typeFilter);
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [data, typeFilter]);

  if (selectedId) {
    return (
      <ClientDetail
        id={selectedId}
        onBack={() => navigate('/app/sales-catering/clients', { replace: true })}
      />
    );
  }

  const createClient = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    try {
      await saveClient.mutateAsync({
        data: {
          name: form.name,
          type: form.type,
          primaryContact: form.primaryContact || undefined,
          email: form.email,
          phone: form.phone || undefined,
          tags: form.tags
            ? form.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        },
      });
      toast({ title: 'Client created' });
      setShowNew(false);
      setForm({ name: '', type: 'corporate', primaryContact: '', email: '', phone: '', tags: '' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-text-muted mt-1">{clients.length} accounts</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-1" /> New Client
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {['all', ...Object.keys(typeMeta)].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize',
                typeFilter === t
                  ? 'bg-primary text-white'
                  : 'bg-neutral/5 text-text-muted hover:bg-neutral/10'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => {
            const T = typeMeta[c.type]?.icon ?? Building2;
            return (
              <div key={c.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <T size={18} className="text-primary" />
                    </div>
                    <div>
                      <button
                        className="font-semibold text-left hover:text-primary"
                        onClick={() => navigate(`/app/sales-catering/clients?id=${c.id}`)}
                      >
                        {c.name}
                      </button>
                      <div className="text-xs text-text-muted">
                        {c.primaryContact ?? typeMeta[c.type]?.label}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-text-muted hover:text-error"
                    title="Archive client"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${c.name}?`)) return;
                      try {
                        await deleteClient.mutateAsync(c.id);
                        toast({ title: 'Client deleted' });
                      } catch (e) {
                        toast({ title: 'Failed', description: e.message, variant: 'destructive' });
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {c._count?.events ?? 0} events
                  </span>
                  {c.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail size={11} /> {c.email}
                    </span>
                  )}
                </div>
                {c.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-neutral/10 text-text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {c.events?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border text-xs">
                    <span className="text-text-muted">Next: </span>
                    <button
                      className="text-primary hover:underline"
                      onClick={() => navigate(`/app/sales-catering/events?id=${c.events[0].id}`)}
                    >
                      {c.events[0].name} · {fmtDate(c.events[0].eventDate)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="col-span-full text-center py-16 text-text-muted">
              <Building2 size={32} className="mx-auto mb-3 opacity-40" />
              <p>No clients found.</p>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNew(false)}
        >
          <div className="card w-full max-w-md p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Client</h2>
              <button onClick={() => setShowNew(false)}>
                <X size={18} />
              </button>
            </div>
            <Input
              placeholder="Company / client name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(typeMeta).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Primary contact"
                value={form.primaryContact}
                onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
              />
            </div>
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Tags (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button onClick={createClient} disabled={saveClient.isPending}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
