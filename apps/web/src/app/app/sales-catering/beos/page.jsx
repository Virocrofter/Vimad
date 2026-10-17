/* src/app/app/sales-catering/beos/page.jsx */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Check,
  FileText,
  Loader2,
  Users,
  MapPin,
  Utensils,
  Mic,
  LayoutGrid,
  Flower2,
  X,
  DollarSign,
  ClipboardList,
  Settings2,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  useScBeos,
  useScBeo,
  useScEvents,
  useScCatalog,
  useScMutations,
} from '../../../../hooks/useSalesCatering';
import { useToast } from '../../../../hooks/use-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n || 0);
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const beoStatusMeta = {
  draft: { label: 'Draft', cls: 'bg-neutral/10 text-text-muted' },
  pending_approval: { label: 'Pending Approval', cls: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', cls: 'bg-secondary/10 text-secondary' },
  signed: { label: 'Signed', cls: 'bg-success/10 text-success' },
  changes_requested: { label: 'Changes Requested', cls: 'bg-error/10 text-error' },
};

// Server recomputes totals on save — this mirrors for live display only
function localTotals(f, guests) {
  const room = Number(f.roomPrice ?? 0),
    setup = Number(f.setupPrice ?? 0),
    menu = Number(f.menuPrice ?? 0),
    av = Number(f.avPrice ?? 0),
    services = Number(f.servicesTotal ?? 0),
    decor = Number(f.decorTotal ?? 0);
  const subtotal = room + setup + menu + av + services + decor;
  const gratuity = menu * 0.22;
  const vat = (subtotal + gratuity) * 0.15;
  return { subtotal, gratuity, vat, grand: subtotal + gratuity + vat };
}

function BeoEditor({ beoId, eventId, onDone }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = beoId === 'new';
  const { data: beo, isLoading } = useScBeo(isNew ? null : beoId);
  const { data: eventsData } = useScEvents();
  const { data: venues } = useScCatalog('venues');
  const { data: menus } = useScCatalog('menus');
  const { data: avs } = useScCatalog('av-packages');
  const { data: setups } = useScCatalog('setups');
  const { data: decorOptions } = useScCatalog('decor');
  const { saveBeo, submitBeo } = useScMutations();

  const [form, setForm] = useState({
    eventId: eventId ?? '',
    title: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    guestCount: 0,
    venueId: '',
    setupId: '',
    menuId: '',
    avId: '',
    priceOverrides: {},
    additionalServices: [],
    decor: [],
    specialInstructions: '',
    logistics: {},
  });

  useEffect(() => {
    if (beo) {
      setForm({
        eventId: beo.eventId,
        title: beo.title,
        eventDate: beo.eventDate?.slice(0, 10),
        startTime: beo.startTime ?? '',
        endTime: beo.endTime ?? '',
        guestCount: beo.guestCount,
        venueId: beo.venueId ?? '',
        setupId: beo.setupId ?? '',
        menuId: beo.menuId ?? '',
        avId: beo.avId ?? '',
        priceOverrides: beo.priceOverrides ?? {},
        additionalServices: beo.additionalServices ?? [],
        decor: beo.decor ?? [],
        specialInstructions: beo.specialInstructions ?? '',
        logistics: beo.logistics ?? {},
      });
    }
  }, [beo]);

  const locked = beo && ['approved', 'signed', 'pending_approval'].includes(beo.status);

  const totals = useMemo(() => {
    const venue = (venues ?? []).find((v) => v.id === form.venueId);
    const setup = (setups ?? []).find((s) => s.id === form.setupId);
    const menu = (menus ?? []).find((m) => m.id === form.menuId);
    const av = (avs ?? []).find((a) => a.id === form.avId);
    return localTotals({
      roomPrice: form.priceOverrides.room ?? (venue ? Number(venue.rentalPrice) : 0),
      setupPrice: form.priceOverrides.setup ?? (setup ? Number(setup.price) : 0),
      menuPrice:
        (form.priceOverrides.menu ?? (menu ? Number(menu.pricePerPerson) : 0)) *
        (Number(form.guestCount) || 0),
      avPrice: form.priceOverrides.av ?? (av ? Number(av.price) : 0),
      servicesTotal: form.additionalServices.reduce((s, x) => s + Number(x.price || 0), 0),
      decorTotal: form.decor.reduce((s, d) => {
        const opt = (decorOptions ?? []).find((o) => o.id === d.optionId);
        return s + (opt ? Number(opt.price) * d.qty : 0);
      }, 0),
    });
  }, [form, venues, setups, menus, avs, decorOptions]);

  const save = async (thenSubmit = false) => {
    try {
      const payload = {
        ...(isNew ? {} : { id: beoId }),
        ...form,
        eventId: form.eventId,
        guestCount: Number(form.guestCount) || 0,
        venueId: form.venueId || undefined,
        setupId: form.setupId || undefined,
        menuId: form.menuId || undefined,
        avId: form.avId || undefined,
        priceOverrides: Object.fromEntries(
          Object.entries(form.priceOverrides).filter(([, v]) => v !== '' && v != null)
        ),
      };
      const saved = await saveBeo.mutateAsync(payload);
      if (thenSubmit) await submitBeo.mutateAsync(saved.id);
      toast({ title: thenSubmit ? 'BEO submitted for approval' : 'BEO saved' });
      onDone(saved.id);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  const setService = (i, patch) =>
    setForm({
      ...form,
      additionalServices: form.additionalServices.map((s, idx) =>
        idx === i ? { ...s, ...patch } : s
      ),
    });
  const setDecorLine = (i, patch) =>
    setForm({ ...form, decor: form.decor.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) });

  const Sel = ({
    icon: Icon,
    label,
    value,
    onChange,
    options,
    renderPrice,
    overrideKey,
    locked,
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-text-muted flex items-center gap-1">
          <Icon size={12} /> {label}
        </label>
        {overrideKey && value && (
          <input
            className="input w-24 h-6 text-xs"
            placeholder="override R"
            value={form.priceOverrides[overrideKey] ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                priceOverrides: {
                  ...form.priceOverrides,
                  [overrideKey]: e.target.value === '' ? undefined : Number(e.target.value),
                },
              })
            }
          />
        )}
      </div>
      <select
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
      >
        <option value="">— None —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {renderPrice ? ` (${renderPrice(o)})` : ''}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={onDone}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} />{' '}
        {isNew ? 'Cancel' : `BEO v${beo?.version} — ${beo?.status.replace('_', ' ')}`}
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Event</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-text-muted">Title</label>
                <Input
                  value={form.title}
                  disabled={locked}
                  placeholder="Q4 Offsite — BEO"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-text-muted">Event *</label>
                <select
                  className="input w-full"
                  value={form.eventId}
                  disabled={locked || !!eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                >
                  <option value="">— Select event —</option>
                  {(eventsData?.data ?? []).map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({fmtDate(ev.eventDate)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted">Date</label>
                <Input
                  type="date"
                  value={form.eventDate}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Guests</label>
                <Input
                  type="number"
                  min="0"
                  value={form.guestCount}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">Start</label>
                <Input
                  type="time"
                  value={form.startTime}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted">End</label>
                <Input
                  type="time"
                  value={form.endTime}
                  disabled={locked}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Space, Setup & Packages</h2>
            <div className="grid grid-cols-2 gap-3">
              <Sel
                icon={MapPin}
                label="Venue"
                value={form.venueId}
                locked={locked}
                onChange={(v) => setForm({ ...form, venueId: v })}
                options={venues ?? []}
                overrideKey="room"
                renderPrice={(o) => fmt(Number(o.rentalPrice))}
              />
              <Sel
                icon={LayoutGrid}
                label="Setup Style"
                value={form.setupId}
                locked={locked}
                onChange={(v) => setForm({ ...form, setupId: v })}
                options={setups ?? []}
                overrideKey="setup"
                renderPrice={(o) => fmt(Number(o.price))}
              />
              <Sel
                icon={Utensils}
                label="Menu (per person)"
                value={form.menuId}
                locked={locked}
                onChange={(v) => setForm({ ...form, menuId: v })}
                options={menus ?? []}
                overrideKey="menu"
                renderPrice={(o) => fmt(Number(o.pricePerPerson))}
              />
              <Sel
                icon={Mic}
                label="AV Package"
                value={form.avId}
                locked={locked}
                onChange={(v) => setForm({ ...form, avId: v })}
                options={avs ?? []}
                overrideKey="av"
                renderPrice={(o) => fmt(Number(o.price))}
              />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Flower2 size={16} /> Décor & Additional Services
              </h2>
              {!locked && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      setForm({ ...form, decor: [...form.decor, { optionId: '', qty: 1 }] })
                    }
                  >
                    <Plus size={12} className="mr-1" /> Décor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      setForm({
                        ...form,
                        additionalServices: [...form.additionalServices, { name: '', price: 0 }],
                      })
                    }
                  >
                    <Plus size={12} className="mr-1" /> Service
                  </Button>
                </div>
              )}
            </div>
            {form.decor.map((d, i) => {
              const opt = (decorOptions ?? []).find((o) => o.id === d.optionId);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="input flex-1"
                    value={d.optionId}
                    disabled={locked}
                    onChange={(e) => setDecorLine(i, { optionId: e.target.value })}
                  >
                    <option value="">— Select décor —</option>
                    {(decorOptions ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({fmt(Number(o.price))}/{o.unit})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={d.qty}
                    disabled={locked}
                    onChange={(e) => setDecorLine(i, { qty: Number(e.target.value) })}
                  />
                  <span className="w-24 text-right text-sm">
                    {fmt((opt ? Number(opt.price) : 0) * d.qty)}
                  </span>
                  {!locked && (
                    <button
                      className="text-error"
                      onClick={() =>
                        setForm({ ...form, decor: form.decor.filter((_, x) => x !== i) })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {form.additionalServices.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Service name (e.g. Security, DJ)"
                  value={s.name}
                  disabled={locked}
                  onChange={(e) => setService(i, { name: e.target.value })}
                />
                <Input
                  type="number"
                  className="w-28"
                  placeholder="Price"
                  value={s.price}
                  disabled={locked}
                  onChange={(e) => setService(i, { price: Number(e.target.value) })}
                />
                {!locked && (
                  <button
                    className="text-error"
                    onClick={() =>
                      setForm({
                        ...form,
                        additionalServices: form.additionalServices.filter((_, x) => x !== i),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Instructions & Logistics</h2>
            <textarea
              className="input w-full min-h-20"
              placeholder="Special instructions for kitchen, AV, banquet staff…"
              value={form.specialInstructions}
              disabled={locked}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                ['loadIn', 'Load-in time'],
                ['loadOut', 'Load-out time'],
                ['floristAccess', 'Florist access'],
                ['contactName', 'Day-of contact'],
                ['contactPhone', 'Contact phone'],
              ].map(([k, label]) => (
                <Input
                  key={k}
                  placeholder={label}
                  value={form.logistics[k] ?? ''}
                  disabled={locked}
                  onChange={(e) =>
                    setForm({ ...form, logistics: { ...form.logistics, [k]: e.target.value } })
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Totals sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={16} /> Totals
            </h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span>{fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Service charge (22% F&B)</span>
                <span>{fmt(totals.gratuity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">VAT (15%)</span>
                <span>{fmt(totals.vat)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold text-base">
                <span>Grand Total</span>
                <span>{fmt(totals.grand)}</span>
              </div>
              <div className="text-xs text-text-muted text-right">
                {fmt(totals.grand / Math.max(Number(form.guestCount) || 1, 1))} / guest
              </div>
            </div>

            {!locked && (
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={() => save(false)} disabled={saveBeo.isPending || !form.eventId}>
                  <Save size={14} className="mr-1" /> Save Draft
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => save(true)}
                  disabled={saveBeo.isPending || !form.eventId}
                >
                  <Send size={14} className="mr-1" /> Save & Submit for Approval
                </Button>
              </div>
            )}
            {beo?.status === 'changes_requested' && (
              <p className="mt-3 text-xs text-error">
                Changes were requested. Saving creates a new version.
              </p>
            )}
            {locked && (
              <p className="mt-3 text-xs text-text-muted">
                This version is {beo.status.replace('_', ' ')} — editing creates v
                {(beo?.version ?? 0) + 1}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BeoView({ id, onEdit }) {
  const { toast } = useToast();
  const { data: beo, isLoading } = useScBeo(id);
  const { approveBeo, requestChanges, signBeo } = useScMutations();
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Client');

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!beo) return <p className="text-text-muted p-6">BEO not found.</p>;

  const f = beo.financials;
  const meta = beoStatusMeta[beo.status];
  const act = async (fn, ok) => {
    try {
      await fn();
      toast({ title: ok });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{beo.title}</h1>
          <p className="text-sm text-text-muted">
            v{beo.version} · {beo.event?.name} · {beo.event?.client?.name} ·{' '}
            {fmtDate(beo.eventDate)}
            {' · '}
            {beo.guestCount} guests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', meta.cls)}>
            {meta.label}
          </span>
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit (new version)
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <MapPin size={13} /> Venue
                </span>
                <span>
                  {beo.venue?.name ?? '—'}
                  {beo.setup ? ` · ${beo.setup.name}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Utensils size={13} /> Menu
                </span>
                <span>{beo.menu?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Mic size={13} /> AV
                </span>
                <span>{beo.av?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Users size={13} /> Guests
                </span>
                <span>{beo.guestCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <ClipboardList size={13} /> Services
                </span>
                <span>{f.servicesTotal > 0 ? fmt(f.servicesTotal) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Flower2 size={13} /> Décor
                </span>
                <span>{f.decorTotal > 0 ? fmt(f.decorTotal) : '—'}</span>
              </div>
            </div>
            {beo.specialInstructions && (
              <p className="mt-4 text-sm bg-warning/5 border border-warning/20 rounded-lg p-3">
                {beo.specialInstructions}
              </p>
            )}
            {Object.keys(beo.logistics ?? {}).length > 0 && (
              <div className="mt-3 text-xs text-text-muted space-y-1">
                {Object.entries(beo.logistics)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                      {String(v)}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {beo.menu?.courses?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold mb-3">Menu — {beo.menu.name}</h2>
              <div className="space-y-3">
                {beo.menu.courses.map((c, i) => (
                  <div key={i}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
                      {c.course}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.items.map((it, j) => (
                        <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-neutral/5">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Financials</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span>{fmt(f.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Service charge</span>
                <span>{fmt(f.gratuity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">VAT (15%)</span>
                <span>{fmt(f.vat)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span>Total</span>
                <span>{fmt(f.grandTotal)}</span>
              </div>
              <div className="text-xs text-text-muted text-right">
                {fmt(f.grandTotal / Math.max(beo.guestCount, 1))} / guest
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Workflow</h2>
            {beo.status === 'pending_approval' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => act(() => approveBeo.mutateAsync(id), 'BEO approved')}
                >
                  <Check size={14} className="mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => act(() => requestChanges.mutateAsync(id), 'Changes requested')}
                >
                  <X size={14} className="mr-1" /> Request Changes
                </Button>
              </div>
            )}
            {beo.status === 'approved' && (
              <div className="space-y-2">
                <Input
                  placeholder="Signer full name"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
                <select
                  className="input w-full"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                >
                  <option>Client</option>
                  <option>Event Manager</option>
                  <option>Banquet Captain</option>
                  <option>Other</option>
                </select>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!signerName}
                  onClick={() =>
                    act(
                      () =>
                        signBeo.mutateAsync({ id, signer: { name: signerName, role: signerRole } }),
                      'Signed'
                    )
                  }
                >
                  Sign BEO ({(beo.signatures ?? []).length}/2)
                </Button>
                <p className="text-xs text-text-muted">
                  Two signatures (client + property) lock the event as confirmed.
                </p>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-text-muted mb-1">Signatures</div>
              {(beo.signatures ?? []).length === 0 && (
                <p className="text-xs text-text-muted">None yet.</p>
              )}
              {(beo.signatures ?? []).map((s, i) => (
                <div key={i} className="text-xs py-1 flex justify-between">
                  <span>
                    {s.name} <span className="text-text-muted">({s.role})</span>
                  </span>
                  <span className="text-text-muted">{fmtDate(s.signedAt)}</span>
                </div>
              ))}
            </div>
            {beo.approvedAt && (
              <p className="text-xs text-text-muted">Approved {fmtDate(beo.approvedAt)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogAdmin({ onClose }) {
  const { toast } = useToast();
  const kinds = [
    {
      key: 'venues',
      label: 'Venues',
      fields: [
        { k: 'name', label: 'Name' },
        { k: 'code', label: 'Code' },
        { k: 'capacity', label: 'Capacity', num: true },
        { k: 'rentalPrice', label: 'Rental price', num: true },
        { k: 'features', label: 'Features (comma-separated)' },
      ],
    },
    {
      key: 'menus',
      label: 'Menus',
      fields: [
        { k: 'name', label: 'Name' },
        { k: 'pricePerPerson', label: 'Price per person', num: true },
        { k: 'description', label: 'Description' },
      ],
    },
    {
      key: 'av-packages',
      label: 'AV Packages',
      fields: [
        { k: 'name', label: 'Name' },
        { k: 'price', label: 'Price', num: true },
        { k: 'description', label: 'Description' },
      ],
    },
    {
      key: 'setups',
      label: 'Setup Styles',
      fields: [
        { k: 'name', label: 'Name' },
        { k: 'price', label: 'Price', num: true },
      ],
    },
    {
      key: 'decor',
      label: 'Décor',
      fields: [
        { k: 'name', label: 'Name' },
        { k: 'price', label: 'Price', num: true },
        { k: 'unit', label: 'Unit' },
      ],
    },
  ];
  const [kind, setKind] = useState('venues');
  const { data: items, isLoading } = useScCatalog(kind);
  const { saveCatalogItem, deleteCatalogItem } = useScMutations();
  const active = kinds.find((k) => k.key === kind);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const payload = {};
      for (const f of active.fields) {
        const v = form[f.k];
        if (v === undefined || v === '') continue;
        payload[f.k] = f.num
          ? Number(v)
          : f.k === 'features'
            ? String(v)
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
            : v;
      }
      await saveCatalogItem.mutateAsync({ kind, data: payload });
      setForm({});
      toast({ title: 'Item added' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const priceOf = (it) => Number(it.rentalPrice ?? it.pricePerPerson ?? it.price ?? 0);

  return (
    <div className="card max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Catering Catalogs</h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X size={14} className="mr-1" /> Close
        </Button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {kinds.map((k) => (
          <button
            key={k.key}
            onClick={() => {
              setKind(k.key);
              setForm({});
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium',
              kind === k.key
                ? 'bg-primary text-white'
                : 'bg-neutral/5 text-text-muted hover:bg-neutral/10'
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap items-end">
        {active.fields.map((f) => (
          <div key={f.k} className="flex-1 min-w-32">
            <label className="text-xs text-text-muted">{f.label}</label>
            <Input
              value={form[f.k] ?? ''}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
            />
          </div>
        ))}
        <Button onClick={create} disabled={busy}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted border-b border-border">
              <th className="p-2">Name</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id} className="border-b border-border/50">
                <td className="p-2 font-medium">
                  {it.name}
                  {it.code ? (
                    <span className="text-xs text-text-muted ml-2">({it.code})</span>
                  ) : null}
                </td>
                <td className="p-2">{fmt(priceOf(it))}</td>
                <td className="p-2">
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full',
                      it.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-neutral/10 text-text-muted'
                    )}
                  >
                    {it.status}
                  </span>
                </td>
                <td className="p-2 text-right">
                  {it.status === 'active' && (
                    <button
                      className="text-error"
                      title="Archive"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Archive "${it.name}"? Existing BEO versions keep their snapshots.`
                          )
                        )
                          return;
                        try {
                          await deleteCatalogItem.mutateAsync({ kind, id: it.id });
                          toast({ title: 'Archived' });
                        } catch (e) {
                          toast({
                            title: 'Failed',
                            description: e.message,
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-text-muted">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ScBeosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const editParam = searchParams.get('edit');
  const eventParam = searchParams.get('eventId');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);

  const { data, isLoading } = useScBeos({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(eventParam ? { eventId: eventParam } : {}),
  });

  const editing = editParam === 'new' || (selectedId && editParam === '1');

  if (editing) {
    return (
      <BeoEditor
        beoId={editParam === 'new' ? 'new' : selectedId}
        eventId={eventParam}
        onDone={(id) => setSearchParams(id ? { id } : {})}
      />
    );
  }

  if (selectedId) {
    return (
      <BeoView id={selectedId} onEdit={() => setSearchParams({ id: selectedId, edit: '1' })} />
    );
  }

  const beos = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banquet Event Orders</h1>
          <p className="text-sm text-text-muted mt-1">{beos.length} BEOs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatalog(true)}>
            <Settings2 size={16} className="mr-1" /> Catalogs
          </Button>
          <Button onClick={() => setSearchParams({ edit: 'new' })}>
            <Plus size={16} className="mr-1" /> New BEO
          </Button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['', ...Object.keys(beoStatusMeta)].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize',
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-neutral/5 text-text-muted hover:bg-neutral/10'
            )}
          >
            {s ? beoStatusMeta[s].label : 'All'}
          </button>
        ))}
      </div>

      {showCatalog && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
          onClick={() => setShowCatalog(false)}
        >
          <div className="py-10" onClick={(e) => e.stopPropagation()}>
            <CatalogAdmin onClose={() => setShowCatalog(false)} />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="p-3">BEO</th>
                <th className="p-3">Event</th>
                <th className="p-3">Client</th>
                <th className="p-3">Date</th>
                <th className="p-3">Venue</th>
                <th className="p-3">Guests</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {beos.map((b) => {
                const meta = beoStatusMeta[b.status];
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border/50 hover:bg-neutral/5 cursor-pointer"
                    onClick={() => setSearchParams({ id: b.id })}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-text-muted" />
                        <span className="font-medium">v{b.version}</span>
                      </div>
                    </td>
                    <td className="p-3">{b.event?.name}</td>
                    <td className="p-3 text-text-muted">{b.event?.client?.name ?? '—'}</td>
                    <td className="p-3">{fmtDate(b.eventDate)}</td>
                    <td className="p-3 text-text-muted">{b.venue?.name ?? '—'}</td>
                    <td className="p-3">{b.guestCount}</td>
                    <td className="p-3 font-medium">{fmt(b.financials?.grandTotal)}</td>
                    <td className="p-3">
                      <span
                        className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', meta.cls)}
                      >
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {beos.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-text-muted">
                    No BEOs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
