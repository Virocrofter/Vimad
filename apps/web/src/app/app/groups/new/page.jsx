/* src/app/app/groups/new/page.jsx — G1: create group block */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ChevronLeft, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useCreateGroup } from '../../../../hooks/useGroups';
import { useProperties } from '../../../../hooks/useProperties';
import { useRoomTypes } from '../../../../hooks/useRoomTypes';

export default function NewBlockPage() {
  const navigate = useNavigate();
  const { properties, isLoading: propsLoading } = useProperties();
  const propertyId = properties?.[0]?.id;
  const { roomTypes } = useRoomTypes(propertyId);
  const createGroup = useCreateGroup();

  const [form, setForm] = useState({
    name: '',
    company: '',
    contactName: '',
    email: '',
    phone: '',
    arrivalDate: '',
    departureDate: '',
    cutOffDate: '',
    blockType: 'courtesy',
    eventSpace: '',
    notes: '',
    rate: '',
  });
  const [blocks, setBlocks] = useState([{ roomTypeId: '', roomsBlocked: 10, rate: '', notes: '' }]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const updateBlock = (i, key, value) =>
    setBlocks((p) => p.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)));

  const handleSubmit = (e) => {
    e.preventDefault();
    createGroup.mutate(
      {
        propertyId,
        name: form.name,
        company: form.company || undefined,
        contactName: form.contactName || undefined,
        contactEmail: form.email || undefined,
        contactPhone: form.phone || undefined,
        blockType: form.blockType,
        arrivalDate: form.arrivalDate,
        departureDate: form.departureDate,
        cutOffDate: form.cutOffDate || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        eventSpace: form.eventSpace || undefined,
        notes: form.notes || undefined,
        blocks: blocks
          .filter((b) => b.roomTypeId && Number(b.roomsBlocked) > 0)
          .map((b) => ({
            roomTypeId: b.roomTypeId,
            roomsBlocked: Number(b.roomsBlocked),
            rate: b.rate ? Number(b.rate) : undefined,
            notes: b.notes || undefined,
          })),
      },
      { onSuccess: (detail) => navigate(`/app/groups/detail?id=${detail.group.id}`) }
    );
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        required={key === 'name' || key === 'arrivalDate' || key === 'departureDate'}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/groups')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Group Block</h1>
          <p className="text-sm text-text-secondary">
            Create a new group reservation or event block
          </p>
        </div>
      </div>

      {propsLoading && <p className="text-sm text-text-muted">Loading property…</p>}
      {createGroup.error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {createGroup.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-text-primary">Group Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Group Name', 'name', 'text', 'e.g. Annual Sales Meeting')}
            {field('Company / Organization', 'company', 'text', 'Optional')}
            {field('Primary Contact', 'contactName', 'text', 'Full name')}
            {field('Email', 'email', 'email', 'contact@company.com')}
            {field('Phone', 'phone', 'tel', '+27 82 000 0000')}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Block Type
              </label>
              <select
                value={form.blockType}
                onChange={(e) => update('blockType', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="courtesy">Courtesy</option>
                <option value="negotiated">Negotiated</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            {field('Arrival Date', 'arrivalDate', 'date')}
            {field('Departure Date', 'departureDate', 'date')}
            {field('Fallback Group Rate (R)', 'rate', 'number', '0.00')}
            {field('Cut-off Date', 'cutOffDate', 'date')}
            {field('Event Space', 'eventSpace', 'text', 'e.g. Grand Ballroom')}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={4}
              placeholder="Special requests, billing instructions, VIP notes..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Room blocks */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text-primary">Room Blocks</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setBlocks((p) => [...p, { roomTypeId: '', roomsBlocked: 10, rate: '', notes: '' }])
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Room Type
            </Button>
          </div>

          {blocks.map((b, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_140px_36px] items-end"
            >
              <div>
                {i === 0 && (
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Room Type
                  </label>
                )}
                <select
                  value={b.roomTypeId}
                  onChange={(e) => updateBlock(i, 'roomTypeId', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select room type…</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {i === 0 && (
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Rooms
                  </label>
                )}
                <input
                  type="number"
                  min="1"
                  value={b.roomsBlocked}
                  onChange={(e) => updateBlock(i, 'roomsBlocked', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                {i === 0 && (
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Rate (R)
                  </label>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={b.rate}
                  onChange={(e) => updateBlock(i, 'rate', e.target.value)}
                  placeholder={form.rate || '0.00'}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="button"
                onClick={() => setBlocks((p) => p.filter((_, idx) => idx !== i))}
                className="inline-flex h-10 w-9 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="text-sm text-text-muted">
              No room types blocked — you can add blocks later from the group detail page.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/app/groups')}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={createGroup.isPending || !propertyId}>
            {createGroup.isPending ? 'Creating…' : 'Create Block'}
          </Button>
        </div>
      </form>
    </div>
  );
}
