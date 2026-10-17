/* src/app/app/groups/detail/page.jsx — G1: live group detail */
import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  X,
  Edit3,
  Mail,
  BedDouble,
  Check,
  DollarSign,
  Clock,
  LayoutGrid,
  List,
  Briefcase,
  Building2,
  Plus,
  Upload,
  ChevronLeft,
  FileSpreadsheet,
  Download,
  Trash2,
  AlertCircle,
  Activity,
  UserPlus,
  Receipt,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  useGroup,
  useUpdateGroup,
  useAddBlock,
  useDeleteBlock,
  useImportRoomingList,
  useRemoveMember,
  usePostCharge,
  useRecordPayment,
  useAddEvent,
  useDeleteEvent,
} from '../../../../hooks/useGroups';
import { useRoomTypes } from '../../../../hooks/useRoomTypes';
import {
  formatCurrency,
  fmtDate,
  downloadTemplate,
  parseRoomingCsv,
  groupColor,
  statusMeta,
} from '../data';
import {
  StatusBadge,
  BlockTypeBadge,
  PickupBar,
  GroupPipeline,
  PIPELINE_STAGES,
} from '../components';

/* ─── Rooming list upload modal (CSV → API) ─── */
function RoomingListModal({ group, roomTypes, onClose }) {
  const importList = useImportRoomingList();
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    const text = await file.text();
    const parsed = parseRoomingCsv(text).map((r) => ({
      ...r,
      roomTypeId: r.roomTypeName
        ? roomTypes.find((rt) => rt.name.toLowerCase() === r.roomTypeName.toLowerCase())?.id
        : undefined,
      valid: !!r.firstName && !!r.lastName,
    }));
    setRows(parsed);
    setStep('preview');
  };

  const handleImport = () =>
    importList.mutate({ id: group.id, rows: rows.filter((r) => r.valid) }, { onSuccess: onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Rooming List — {group.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {importList.error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {importList.error.message}
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                'rounded-xl border-2 border-dashed p-12 text-center transition-colors',
                dragOver ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'
              )}
            >
              <Upload className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm font-medium text-text-primary">
                Drag & drop your rooming list here
              </p>
              <p className="text-xs text-text-muted mt-1">
                CSV with headers: Last Name, First Name, Email, Phone, Room Type, Arrival,
                Departure, Special Requests
              </p>
              <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-secondary hover:underline">
                Browse files
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </label>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FileSpreadsheet className="h-4 w-4 text-text-muted" /> Need a template?
              </div>
              <button
                onClick={downloadTemplate}
                className="text-sm font-medium text-secondary hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV Template
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    {['Name', 'Email', 'Room Type', 'Dates', 'Requests', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-surface/50">
                      <td className="px-3 py-2 text-text-primary">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">{row.email || '—'}</td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {row.roomTypeName || '—'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {row.arrivalDate
                          ? `${row.arrivalDate} → ${row.departureDate}`
                          : 'Group dates'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">{row.notes || '—'}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <Check className="h-4 w-4 text-accent" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-danger" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">
                  {rows.filter((r) => r.valid).length} of {rows.length} guests ready to import
                </span>
                <Button size="sm" onClick={handleImport} disabled={importList.isPending}>
                  <Check className="mr-1.5 h-4 w-4" />
                  {importList.isPending ? 'Importing…' : 'Confirm Import'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Edit group modal ─── */
function EditGroupModal({ detail, onClose }) {
  const updateGroup = useUpdateGroup();
  const g = detail.group;
  const [form, setForm] = useState({
    name: g.name,
    company: g.company || '',
    contactName: g.contactName || '',
    contactEmail: g.contactEmail || '',
    contactPhone: g.contactPhone || '',
    status: g.status,
    blockType: g.blockType,
    eventSpace: g.eventSpace || '',
    cutOffDate: fmtDate(g.cutOffDate),
    rate: g.rate ?? '',
    notes: g.notes || '',
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Edit {g.code}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        {updateGroup.error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {updateGroup.error.message}
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Group Name', 'name', 'text'],
            ['Company', 'company', 'text'],
            ['Contact', 'contactName', 'text'],
            ['Email', 'contactEmail', 'email'],
            ['Phone', 'contactPhone', 'tel'],
            ['Event Space', 'eventSpace', 'text'],
            ['Cut-off Date', 'cutOffDate', 'date'],
            ['Group Rate (R)', 'rate', 'number'],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[...PIPELINE_STAGES.map((s) => s.id), 'cancelled'].map((s) => (
                <option key={s} value={s}>
                  {statusMeta[s]?.label ?? s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Block Type
            </label>
            <select
              value={form.blockType}
              onChange={(e) => set('blockType', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="courtesy">Courtesy</option>
              <option value="negotiated">Negotiated</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={updateGroup.isPending}
            onClick={() =>
              updateGroup.mutate(
                {
                  id: g.id,
                  input: {
                    name: form.name,
                    company: form.company || undefined,
                    contactName: form.contactName || undefined,
                    contactEmail: form.contactEmail || undefined,
                    contactPhone: form.contactPhone || undefined,
                    status: form.status,
                    blockType: form.blockType,
                    eventSpace: form.eventSpace || undefined,
                    cutOffDate: form.cutOffDate || undefined,
                    rate: form.rate !== '' ? Number(form.rate) : undefined,
                    notes: form.notes || undefined,
                  },
                },
                { onSuccess: onClose }
              )
            }
          >
            {updateGroup.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main detail page ─── */
export default function GroupDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const { data: detail, isLoading, error, refetch } = useGroup(id);
  const { roomTypes } = useRoomTypes(detail?.group.propertyId);

  const updateGroup = useUpdateGroup();
  const addBlock = useAddBlock();
  const deleteBlock = useDeleteBlock();
  const removeMember = useRemoveMember();
  const postCharge = usePostCharge();
  const recordPayment = useRecordPayment();
  const addEvent = useAddEvent();
  const deleteEvent = useDeleteEvent();

  const [activeTab, setActiveTab] = useState('allocation');
  const [showRoomingUpload, setShowRoomingUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPostCharge, setShowPostCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newBlock, setNewBlock] = useState({ roomTypeId: '', roomsBlocked: 5, rate: '' });
  const [chargeForm, setChargeForm] = useState({
    type: 'misc',
    description: '',
    amount: '',
    quantity: 1,
  });
  const [paymentForm, setPaymentForm] = useState({
    method: 'bank_transfer',
    amount: '',
    reference: '',
    note: '',
  });
  const [eventForm, setEventForm] = useState({
    name: '',
    venue: '',
    date: '',
    startTime: '',
    endTime: '',
    guests: 0,
    status: 'tentative',
    tags: '',
  });

  // NOTE: all hooks must run before any early return — floors is computed
  // here with a null-safe guard, not after the loading/error returns.
  const floors = useMemo(() => {
    const byFloor = {};
    for (const r of detail?.freeRooms ?? []) {
      const f = r.floor || '—';
      (byFloor[f] ??= []).push(r);
    }
    return byFloor;
  }, [detail?.freeRooms]);

  const assignedRoomIds = useMemo(
    () => new Set((detail?.reservations ?? []).map((r) => r.roomNumber).filter(Boolean)),
    [detail]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center text-text-muted">
        Loading group…
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-text-muted">
            {error ? `Failed to load group: ${error.message}` : 'Group not found.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/groups')}>
              Back to Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { group, stats, blocks, freeRooms, reservations, charges, payments, events } = detail;
  const c = groupColor(group.blockType);
  const chargeTotal = charges.reduce((s, t) => s + t.total, 0);
  const paymentTotal = payments.reduce((s, t) => s + t.amount, 0);

  // Real activity feed — every entry is a timestamped row from the API.
  const timeline = [
    { at: group.createdAt, icon: Users, text: `Group ${group.code} created` },
    ...reservations.map((r) => ({
      at: r.createdAt,
      icon: UserPlus,
      text: `${r.guestName} joined the rooming list (${r.confirmationNumber})`,
    })),
    ...charges.map((c) => ({
      at: c.postedAt,
      icon: Receipt,
      text: `Charge posted: ${c.description} — ${formatCurrency(c.total)}`,
    })),
    ...payments.map((p) => ({
      at: p.receivedAt,
      icon: DollarSign,
      text: `Payment received (${p.method}) — ${formatCurrency(p.amount)}`,
    })),
    ...events.map((e) => ({
      at: e.createdAt,
      icon: Briefcase,
      text: `Event added: ${e.name}`,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  const tabs = [
    { id: 'allocation', label: 'Room Allocation', icon: LayoutGrid },
    { id: 'rooming', label: `Rooming List (${reservations.length})`, icon: List },
    { id: 'folio', label: 'Group Folio', icon: DollarSign },
    { id: 'events', label: 'Events & BEO', icon: Briefcase },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/groups')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border',
                c.color
              )}
            >
              <Users className={cn('h-5 w-5', c.textColor)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{group.name}</h1>
              <p className="text-sm text-text-muted">
                {group.code} · {group.company || 'No company'} ·{' '}
                <StatusBadge status={group.status} /> <BlockTypeBadge type={group.blockType} />
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {group.contactEmail && (
            <a href={`mailto:${group.contactEmail}`}>
              <Button variant="outline" size="sm">
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Booking pipeline */}
      <GroupPipeline
        status={group.status}
        pending={updateGroup.isPending}
        onMove={(status) => updateGroup.mutate({ id: group.id, input: { status } })}
      />
      {updateGroup.error && (
        <p className="text-xs text-danger -mt-3">
          Status change failed: {updateGroup.error.message}
        </p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Rooms Blocked', value: stats.roomsBlocked, icon: BedDouble },
          { label: 'Picked Up', value: stats.roomsPickedUp, icon: Check },
          { label: 'Pickup %', value: `${stats.pickupPct}%`, icon: Clock },
          {
            label: 'Group Rate',
            value: group.rate ? formatCurrency(group.rate) : '—',
            icon: DollarSign,
          },
          { label: 'Master Balance', value: formatCurrency(stats.balance), icon: DollarSign },
          { label: 'Cut-off', value: fmtDate(group.cutOffDate), icon: Clock },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</p>
            <p
              className={cn(
                'mt-1 text-lg font-bold font-mono text-text-primary',
                s.label === 'Master Balance' && stats.balance > 0 && 'text-danger',
                s.label === 'Master Balance' && stats.balance <= 0 && 'text-accent'
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Blocks overview + add block */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-primary">Room Blocks</h4>
          <div className="flex items-center gap-2">
            <select
              value={newBlock.roomTypeId}
              onChange={(e) => setNewBlock((p) => ({ ...p, roomTypeId: e.target.value }))}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
            >
              <option value="">Room type…</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={newBlock.roomsBlocked}
              onChange={(e) => setNewBlock((p) => ({ ...p, roomsBlocked: e.target.value }))}
              className="h-9 w-20 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              title="Rooms"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={newBlock.rate}
              placeholder="Rate"
              onChange={(e) => setNewBlock((p) => ({ ...p, rate: e.target.value }))}
              className="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              title="Rate"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newBlock.roomTypeId || addBlock.isPending}
              onClick={() =>
                addBlock.mutate(
                  {
                    id: group.id,
                    input: {
                      roomTypeId: newBlock.roomTypeId,
                      roomsBlocked: Number(newBlock.roomsBlocked),
                      rate: newBlock.rate ? Number(newBlock.rate) : undefined,
                    },
                  },
                  { onSuccess: () => setNewBlock({ roomTypeId: '', roomsBlocked: 5, rate: '' }) }
                )
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Block
            </Button>
          </div>
        </div>
        {addBlock.error && <p className="mb-2 text-xs text-danger">{addBlock.error.message}</p>}
        <div className="space-y-2">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{b.roomTypeName}</p>
                <p className="text-xs text-text-muted">
                  {formatCurrency(b.rate ?? group.rate ?? 0)} / night · {b.roomsAvailable} still
                  available
                  {b.overblocked && (
                    <span className="ml-2 text-warning font-medium">Overblocked</span>
                  )}
                </p>
              </div>
              <div className="w-40">
                <PickupBar picked={b.roomsPickedUp} blocked={b.roomsBlocked} />
                <p className="mt-1 text-[10px] text-text-muted text-right">
                  {b.roomsPickedUp} / {b.roomsBlocked}
                </p>
              </div>
              <button
                onClick={() => deleteBlock.mutate({ id: group.id, blockId: b.id })}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
                title="Remove block"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="text-sm text-text-muted">No room types blocked yet.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px whitespace-nowrap',
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

      <div className="min-h-[300px]">
        {/* ─── Allocation ─── */}
        {activeTab === 'allocation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Live Availability — {fmtDate(group.arrivalDate)} → {fmtDate(group.departureDate)}
                </h4>
                <p className="text-xs text-text-muted">
                  Rooms currently free for the block dates. Assigned group rooms show the guest
                  name.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
                  <Check className="h-3 w-3" /> Assigned
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary border border-secondary/20">
                  <BedDouble className="h-3 w-3" /> Available
                </span>
              </div>
            </div>

            {Object.entries(floors).map(([floor, rooms]) => (
              <div key={floor}>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Floor {floor || '—'}
                </h5>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
                  {rooms.map((room) => {
                    const member = reservations.find((r) => r.roomNumber === room.number);
                    return (
                      <div
                        key={room.id}
                        className={cn(
                          'relative rounded-lg border p-3 text-left transition-all hover:shadow-md',
                          member ? 'border-accent bg-accent/5' : 'border-border bg-surface'
                        )}
                        title={
                          member
                            ? `${member.guestName} · ${member.confirmationNumber}`
                            : `${room.roomTypeName} · available`
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-text-primary">{room.number}</span>
                          {member ? (
                            <Check className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <BedDouble className="h-3.5 w-3.5 text-text-muted" />
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted truncate">{room.roomTypeName}</p>
                        {member && (
                          <p className="mt-1 text-[10px] font-medium text-accent truncate">
                            {member.guestName}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {freeRooms.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <BedDouble className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No rooms available for the block dates.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Rooming ─── */}
        {activeTab === 'rooming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                Rooming List ({reservations.length} guests)
              </h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowRoomingUpload(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload List
                </Button>
              </div>
            </div>
            {removeMember.error && (
              <p className="text-xs text-danger">{removeMember.error.message}</p>
            )}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    {['Guest', 'Confirmation', 'Room', 'Type', 'Dates', 'Status', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-surface/50">
                      <td className="px-3 py-2">
                        <p className="text-text-primary">{r.guestName}</p>
                        <p className="text-[10px] text-text-muted">{r.email || r.phone || ''}</p>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                        {r.confirmationNumber}
                      </td>
                      <td className="px-3 py-2 font-mono text-text-secondary">
                        {r.roomNumber || '—'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {r.roomTypeName || '—'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {fmtDate(r.arrivalDate)} → {fmtDate(r.departureDate)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border',
                            r.checkedIn
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : r.status === 'cancelled'
                                ? 'bg-danger/10 text-danger border-danger/20'
                                : 'bg-warning/10 text-warning border-warning/20'
                          )}
                        >
                          {r.checkedIn
                            ? 'Checked In'
                            : r.status === 'cancelled'
                              ? 'Cancelled'
                              : r.status === 'checked_out'
                                ? 'Checked Out'
                                : 'Confirmed'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeMember.mutate({ id: group.id, reservationId: r.id })}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
                          title="Remove from group"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-text-muted">
                        No guests on the rooming list yet — upload a CSV to add the whole list at
                        once.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showRoomingUpload && (
              <RoomingListModal
                group={group}
                roomTypes={roomTypes}
                onClose={() => setShowRoomingUpload(false)}
              />
            )}
          </div>
        )}

        {/* ─── Folio ─── */}
        {activeTab === 'folio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">Group Master Folio</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPayment(true)}>
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Record Payment
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPostCharge(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Post Charge
                </Button>
              </div>
            </div>

            {(postCharge.error || recordPayment.error) && (
              <p className="text-xs text-danger">
                {(postCharge.error || recordPayment.error)?.message}
              </p>
            )}

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    {['Date', 'Description', 'Charge', 'Payment'].map((h, i) => (
                      <th
                        key={i}
                        className={cn(
                          'px-3 py-2 text-xs font-medium text-text-secondary uppercase',
                          i >= 2 && 'text-right'
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ...charges.map((t) => ({
                      kind: 'charge',
                      date: t.postedAt,
                      desc: t.description,
                      charge: t.total,
                      payment: 0,
                    })),
                    ...payments.map((t) => ({
                      kind: 'payment',
                      date: t.receivedAt,
                      desc: `Payment — ${t.method}${t.reference ? ` (${t.reference})` : ''}`,
                      charge: 0,
                      payment: t.amount,
                    })),
                  ]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((t, i) => (
                      <tr key={i} className="hover:bg-surface/50">
                        <td className="px-3 py-2 text-text-secondary">{fmtDate(t.date)}</td>
                        <td className="px-3 py-2 text-text-primary">{t.desc}</td>
                        <td className="px-3 py-2 text-right font-mono text-text-primary">
                          {t.charge > 0 ? formatCurrency(t.charge) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-accent">
                          {t.payment > 0 ? formatCurrency(t.payment) : '—'}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-surface font-semibold">
                    <td className="px-3 py-2 text-text-primary" colSpan={2}>
                      Balance
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary" colSpan={2}>
                      <span
                        className={chargeTotal - paymentTotal > 0 ? 'text-danger' : 'text-accent'}
                      >
                        {formatCurrency(chargeTotal - paymentTotal)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {charges.length === 0 && payments.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-text-muted">
                  No charges or payments yet.
                </p>
              )}
            </div>
            <p className="text-xs text-text-muted">
              Projected room revenue at full pickup:{' '}
              <span className="font-medium text-text-primary">
                {formatCurrency(stats.projectedRoomRevenue)}
              </span>
            </p>
          </div>
        )}

        {/* ─── Events ─── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                Events & Banquet Event Orders
              </h4>
              <Button variant="outline" size="sm" onClick={() => setShowAddEvent(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Event
              </Button>
            </div>
            {deleteEvent.error && (
              <p className="text-xs text-danger">{deleteEvent.error.message}</p>
            )}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {events.map((evt) => (
                <div key={evt.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                      <Building2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-medium text-text-primary">{evt.name}</h5>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium border',
                              evt.status === 'confirmed'
                                ? 'bg-accent/10 text-accent border-accent/20'
                                : evt.status === 'cancelled'
                                  ? 'bg-danger/10 text-danger border-danger/20'
                                  : 'bg-warning/10 text-warning border-warning/20'
                            )}
                          >
                            {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                          </span>
                          <button
                            onClick={() => deleteEvent.mutate({ id: group.id, eventId: evt.id })}
                            className="text-text-muted hover:text-danger"
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {fmtDate(evt.date)} · {evt.startTime || '—'}
                        {evt.endTime ? ` – ${evt.endTime}` : ''} · {evt.guests} guests
                        {evt.venue ? ` · ${evt.venue}` : ''}
                      </p>
                      {evt.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {evt.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-secondary border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {events.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No events scheduled for this group.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Activity ─── */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary">Activity</h4>
            {timeline.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <Activity className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No activity yet.</p>
              </div>
            ) : (
              <ol className="relative ml-3 space-y-5 border-l border-border pl-8">
                {timeline.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface">
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                      </span>
                      <p className="text-sm text-text-primary">{item.text}</p>
                      <p className="text-xs text-text-muted">
                        {item.at ? new Date(item.at).toLocaleString() : ''}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {showEdit && <EditGroupModal detail={detail} onClose={() => setShowEdit(false)} />}

      {showPostCharge && (
        <Modal title="Post Charge to Master Folio" onClose={() => setShowPostCharge(false)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Type
              </label>
              <select
                value={chargeForm.type}
                onChange={(e) => setChargeForm((p) => ({ ...p, type: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="room_block">Room Block</option>
                <option value="event_space">Event Space</option>
                <option value="av">AV / Equipment</option>
                <option value="f_b">F&B</option>
                <option value="misc">Misc</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Amount (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={chargeForm.amount}
                onChange={(e) => setChargeForm((p) => ({ ...p, amount: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Description
            </label>
            <input
              value={chargeForm.description}
              onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Grand Ballroom — Day 1 hire"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </div>
          {postCharge.error && (
            <p className="mt-3 text-xs text-danger">{postCharge.error.message}</p>
          )}
          <ModalActions
            onCancel={() => setShowPostCharge(false)}
            onSubmit={() =>
              postCharge.mutate(
                {
                  id: group.id,
                  input: {
                    type: chargeForm.type,
                    description: chargeForm.description,
                    amount: Number(chargeForm.amount),
                    quantity: Number(chargeForm.quantity) || 1,
                  },
                },
                {
                  onSuccess: () => {
                    setShowPostCharge(false);
                    setChargeForm({ type: 'misc', description: '', amount: '', quantity: 1 });
                  },
                }
              )
            }
            pending={postCharge.isPending}
            submitDisabled={!chargeForm.description || !Number(chargeForm.amount)}
            submitLabel="Post charge"
          />
        </Modal>
      )}

      {showPayment && (
        <Modal title="Record Group Payment" onClose={() => setShowPayment(false)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Method
              </label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Amount (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Reference
              </label>
              <input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                placeholder="Invoice / EFT ref"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Note
              </label>
              <input
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
          </div>
          {recordPayment.error && (
            <p className="mt-3 text-xs text-danger">{recordPayment.error.message}</p>
          )}
          <ModalActions
            onCancel={() => setShowPayment(false)}
            onSubmit={() =>
              recordPayment.mutate(
                {
                  id: group.id,
                  input: {
                    method: paymentForm.method,
                    amount: Number(paymentForm.amount),
                    reference: paymentForm.reference || undefined,
                    note: paymentForm.note || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    setShowPayment(false);
                    setPaymentForm({
                      method: 'bank_transfer',
                      amount: '',
                      reference: '',
                      note: '',
                    });
                  },
                }
              )
            }
            pending={recordPayment.isPending}
            submitDisabled={!Number(paymentForm.amount)}
            submitLabel="Record payment"
          />
        </Modal>
      )}

      {showAddEvent && (
        <Modal title="Add Event / BEO" onClose={() => setShowAddEvent(false)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Event Name
              </label>
              <input
                value={eventForm.name}
                onChange={(e) => setEventForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Grand Ballroom — Reception"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Venue
              </label>
              <input
                value={eventForm.venue}
                onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Start
              </label>
              <input
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm((p) => ({ ...p, startTime: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                End
              </label>
              <input
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm((p) => ({ ...p, endTime: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Guests
              </label>
              <input
                type="number"
                min="0"
                value={eventForm.guests}
                onChange={(e) => setEventForm((p) => ({ ...p, guests: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Status
              </label>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm((p) => ({ ...p, status: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                <option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Tags (comma separated)
              </label>
              <input
                value={eventForm.tags}
                onChange={(e) => setEventForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="AV Package, Open Bar, Buffet Dinner"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              />
            </div>
          </div>
          {addEvent.error && <p className="mt-3 text-xs text-danger">{addEvent.error.message}</p>}
          <ModalActions
            onCancel={() => setShowAddEvent(false)}
            onSubmit={() =>
              addEvent.mutate(
                {
                  id: group.id,
                  input: {
                    name: eventForm.name,
                    venue: eventForm.venue || undefined,
                    date: eventForm.date,
                    startTime: eventForm.startTime || undefined,
                    endTime: eventForm.endTime || undefined,
                    guests: Number(eventForm.guests) || 0,
                    status: eventForm.status,
                    tags: eventForm.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  },
                },
                {
                  onSuccess: () => {
                    setShowAddEvent(false);
                    setEventForm({
                      name: '',
                      venue: '',
                      date: '',
                      startTime: '',
                      endTime: '',
                      guests: 0,
                      status: 'tentative',
                      tags: '',
                    });
                  },
                }
              )
            }
            pending={addEvent.isPending}
            submitDisabled={!eventForm.name || !eventForm.date}
            submitLabel="Add event"
          />
        </Modal>
      )}
    </div>
  );
}

/* ─── Modal helpers ─── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSubmit, pending, submitDisabled, submitLabel }) {
  return (
    <div className="mt-5 flex justify-end gap-3">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="secondary" onClick={onSubmit} disabled={pending || submitDisabled}>
        {pending ? 'Working…' : submitLabel}
      </Button>
    </div>
  );
}
