/* src/app/app/groups/new/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Plus, ChevronLeft } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGroupStore } from '../store';

export default function NewBlockPage() {
  const navigate = useNavigate();
  const addGroup = useGroupStore((s) => s.addGroup);

  const [form, setForm] = useState({
    name: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    arrival: '',
    departure: '',
    roomsBlocked: '',
    rate: '',
    cutOffDate: '',
    blockType: 'courtesy',
    eventSpace: '',
    notes: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const colors = {
      courtesy: { color: 'bg-secondary/20 border-secondary/30', textColor: 'text-secondary' },
      negotiated: { color: 'bg-info/20 border-info/30', textColor: 'text-info' },
      contract: { color: 'bg-accent/20 border-accent/30', textColor: 'text-accent' },
    };
    const meta = colors[form.blockType] || colors.courtesy;

    addGroup({
      ...form,
      id: `GRP-${1007 + Math.floor(Math.random() * 900)}`,
      roomsBlocked: parseInt(form.roomsBlocked) || 0,
      roomsPickedUp: 0,
      rate: parseFloat(form.rate) || 0,
      status: 'prospect',
      color: meta.color,
      textColor: meta.textColor,
    });
    navigate('/app/groups');
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
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-text-primary">Group Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Group Name', 'name', 'text', 'e.g. Annual Sales Meeting')}
            {field('Company / Organization', 'company', 'text', 'Optional')}
            {field('Primary Contact', 'contact', 'text', 'Full name')}
            {field('Email', 'email', 'email', 'contact@company.com')}
            {field('Phone', 'phone', 'tel', '+1 (555) 000-0000')}
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
            {field('Arrival Date', 'arrival', 'date')}
            {field('Departure Date', 'departure', 'date')}
            {field('Rooms Blocked', 'roomsBlocked', 'number', '0')}
            {field('Group Rate ($)', 'rate', 'number', '0.00')}
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

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/app/groups')}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary">
            <Plus className="mr-1.5 h-4 w-4" /> Create Block
          </Button>
        </div>
      </form>
    </div>
  );
}
