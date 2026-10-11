import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CalendarPlus,
  Pencil,
  Ban,
  BellOff,
  Bell,
  ShieldCheck,
  BedDouble,
  Clock,
  Banknote,
  StickyNote,
  Trash2,
  FileText,
  Heart,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import {
  useGuest,
  useUpdateGuest,
  useCreateGuestNote,
  useDeleteGuestNote,
  useCreateGuestPreference,
  useDeleteGuestPreference,
  useCreateGuestDocument,
  useDeleteGuestDocument,
} from '../../../../hooks/useGuests';
import { useToast } from '../../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Dialog } from '../../../../components/ui/dialog';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { timeAgo, formatDate, formatCurrency } from '../../../../lib/guest-utils';

const VIP_LEVELS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const PREFERENCE_CATEGORIES = ['room', 'bed', 'dietary', 'amenity', 'accessibility', 'other'];
const DOCUMENT_TYPES = ['passport', 'national_id', 'driver_license', 'visa', 'other'];

const stayStatusVariant = {
  confirmed: 'info',
  checked_in: 'accent',
  checked_out: 'neutral',
  cancelled: 'danger',
  no_show: 'danger',
};

// ─── Edit Form (compact) ───
function EditGuestForm({ guest, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    firstName: guest.firstName ?? '',
    lastName: guest.lastName ?? '',
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    nationality: guest.nationality ?? '',
    vipStatus: guest.vipStatus ?? '',
    passportNumber: guest.passportNumber ?? '',
    notes: guest.notes ?? '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {['firstName', 'lastName'].map((f) => (
          <div key={f} className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary capitalize">
              {f === 'firstName' ? 'First Name' : 'Last Name'} *
            </label>
            <input
              className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData[f]}
              onChange={(e) => setFormData((p) => ({ ...p, [f]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Email</label>
          <input
            type="email"
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Phone</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Nationality</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.nationality}
            onChange={(e) => setFormData((p) => ({ ...p, nationality: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Passport</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.passportNumber}
            onChange={(e) => setFormData((p) => ({ ...p, passportNumber: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">VIP Status</label>
        <select
          className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData.vipStatus}
          onChange={(e) => setFormData((p) => ({ ...p, vipStatus: e.target.value }))}
        >
          <option value="">None</option>
          {VIP_LEVELS.map((v) => (
            <option key={v} value={v}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          rows={3}
          className="flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ─── Blacklist Dialog ───
function BlacklistDialog({ guest, open, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-danger">
          <Ban className="h-5 w-5" />
          {guest?.blacklisted ? 'Remove Blacklist' : 'Blacklist Guest'}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={guest?.blacklisted ? 'primary' : 'danger'}
            onClick={() => onConfirm(reason)}
            isLoading={isSubmitting}
          >
            {guest?.blacklisted ? 'Remove Blacklist' : 'Blacklist'}
          </Button>
        </>
      }
    >
      {guest?.blacklisted ? (
        <p className="text-sm text-text-secondary">
          Remove the blacklist flag from {guest.firstName} {guest.lastName}? They will be bookable
          again.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Blacklisting blocks this guest from future stays. Add a reason for the record.
          </p>
          <textarea
            rows={3}
            className="flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Reason (e.g. no-show, property damage, fraud)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
    </Dialog>
  );
}

// ─── Notes Tab ───
function NotesTab({ guest }) {
  const [body, setBody] = useState('');
  const { toast } = useToast();
  const createNote = useCreateGuestNote(guest.id);
  const deleteNote = useDeleteGuestNote(guest.id);
  const notes = guest.notes ?? [];

  const handleAdd = async () => {
    if (!body.trim()) return;
    try {
      await createNote.mutateAsync(body.trim());
      setBody('');
    } catch (err) {
      toast({ title: 'Failed to add note', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          rows={3}
          className="flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Add a note (visible to staff only)..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            isLoading={createNote.isPending}
            disabled={!body.trim()}
          >
            <StickyNote className="h-4 w-4 mr-1.5" />
            Add Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Internal notes about this guest will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  {note.author
                    ? `${note.author.firstName ?? ''} ${note.author.lastName ?? ''}`.trim() ||
                      'Staff'
                    : 'Staff'}
                  {' · '}
                  {timeAgo(note.createdAt)}
                </p>
                <button
                  onClick={() => deleteNote.mutate(note.id)}
                  className="text-text-muted hover:text-danger transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preferences Tab ───
function PreferencesTab({ guest }) {
  const { toast } = useToast();
  const createPref = useCreateGuestPreference(guest.id);
  const deletePref = useDeleteGuestPreference(guest.id);
  const [form, setForm] = useState({ category: 'room', key: '', value: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.key.trim() || !form.value.trim()) return;
    try {
      await createPref.mutateAsync({
        category: form.category,
        key: form.key.trim(),
        value: form.value.trim(),
      });
      setForm({ category: 'room', key: '', value: '' });
      toast({ title: 'Preference added' });
    } catch (err) {
      toast({
        title: 'Failed to add preference',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const prefs = guest.preferences ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
          Add Preference
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {PREFERENCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <input
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. Pillow type"
            value={form.key}
            onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
          />
          <input
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="e.g. Firm"
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
          />
          <Button
            type="submit"
            isLoading={createPref.isPending}
            disabled={!form.key.trim() || !form.value.trim()}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>
      </form>

      {prefs.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No preferences recorded"
          description="Guest preferences (pillow type, floor, dietary, etc.) will appear here once saved."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prefs.map((pref) => (
            <Card key={pref.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {pref.category}
                  </Badge>
                  <button
                    onClick={() => deletePref.mutate(pref.id)}
                    className="text-text-muted hover:text-danger transition-colors"
                    title="Delete preference"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-muted capitalize">{pref.key}</p>
                <p className="mt-2 text-sm text-text-primary">{pref.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Documents Tab ───
function DocumentsTab({ guest }) {
  const { toast } = useToast();
  const createDoc = useCreateGuestDocument(guest.id);
  const deleteDoc = useDeleteGuestDocument(guest.id);
  const [form, setForm] = useState({
    type: 'passport',
    number: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createDoc.mutateAsync({
        type: form.type,
        number: form.number.trim() || undefined,
        issuedBy: form.issuedBy.trim() || undefined,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
      });
      setForm({ type: 'passport', number: '', issuedBy: '', issueDate: '', expiryDate: '' });
      toast({ title: 'Document added' });
    } catch (err) {
      toast({ title: 'Failed to add document', description: err.message, variant: 'destructive' });
    }
  };

  const docs = guest.documents ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
          Add Document
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <select
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <input
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Number"
            value={form.number}
            onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
          />
          <input
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Issued by"
            value={form.issuedBy}
            onChange={(e) => setForm((p) => ({ ...p, issuedBy: e.target.value }))}
          />
          <input
            type="date"
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Issue date"
            value={form.issueDate}
            onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
          />
          <input
            type="date"
            className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Expiry date"
            value={form.expiryDate}
            onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="submit" isLoading={createDoc.isPending}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Document
          </Button>
        </div>
      </form>

      {docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents on file"
          description="ID copies, passports, and visas attached to this guest will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Number</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Issued By</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Issue Date</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Expiry</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted"></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3 capitalize text-text-primary">
                        {doc.type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{doc.number ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{doc.issuedBy ?? '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {doc.issueDate ? formatDate(doc.issueDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {doc.expiryDate ? formatDate(doc.expiryDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteDoc.mutate(doc.id)}
                          className="text-text-muted hover:text-danger transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Detail Page ───
export default function GuestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: guest, isLoading, error } = useGuest(id);
  const updateMutation = useUpdateGuest();

  const [editOpen, setEditOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);

  const handleUpdate = async (formData) => {
    try {
      await updateMutation.mutateAsync({ id: guest.id, input: formData });
      toast({ title: 'Guest updated', description: 'Profile saved.' });
      setEditOpen(false);
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleDnd = async () => {
    try {
      await updateMutation.mutateAsync({
        id: guest.id,
        input: { doNotDisturb: !guest.doNotDisturb },
      });
      toast({
        title: guest.doNotDisturb ? 'DND removed' : 'Do-not-disturb enabled',
        description: `${guest.firstName} ${guest.lastName}`,
      });
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleBlacklist = async (reason) => {
    try {
      await updateMutation.mutateAsync({
        id: guest.id,
        input: guest.blacklisted
          ? { blacklisted: false }
          : { blacklisted: true, blacklistReason: reason || undefined },
      });
      toast({
        title: guest.blacklisted ? 'Blacklist removed' : 'Guest blacklisted',
        description: `${guest.firstName} ${guest.lastName}`,
      });
      setBlacklistOpen(false);
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/app/guests')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Guests
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title="Guest not found"
          description={error?.message || 'This guest may have been deleted.'}
          action={<Button onClick={() => navigate('/app/guests')}>Go to Guests</Button>}
        />
      </div>
    );
  }

  const activeReservation = guest.reservations?.find((r) => r.status === 'checked_in');

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/guests')}
          className="mb-3 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Guests
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <span className="text-xl font-bold text-secondary">
                {guest.firstName?.[0]}
                {guest.lastName?.[0]}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">
                  {guest.firstName} {guest.lastName}
                </h1>
                {guest.vipStatus && (
                  <Badge
                    variant={
                      guest.vipStatus === 'diamond'
                        ? 'accent'
                        : guest.vipStatus === 'platinum'
                          ? 'info'
                          : guest.vipStatus === 'gold'
                            ? 'warning'
                            : 'secondary'
                    }
                  >
                    {guest.vipStatus.toUpperCase()}
                  </Badge>
                )}
                {guest.blacklisted && (
                  <Badge variant="danger">
                    <Ban className="h-3 w-3 mr-1" />
                    BLACKLISTED
                  </Badge>
                )}
                {guest.doNotDisturb && (
                  <Badge variant="warning">
                    <BellOff className="h-3 w-3 mr-1" />
                    DND
                  </Badge>
                )}
                {activeReservation && <Badge variant="accent">IN HOUSE</Badge>}
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Guest since {formatDate(guest.createdAt)} · ID: {guest.id.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(`/app/reservations/new?guestId=${guest.id}`)}>
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              New Reservation
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleToggleDnd} disabled={updateMutation.isPending}>
              {guest.doNotDisturb ? (
                <Bell className="h-4 w-4 mr-1.5" />
              ) : (
                <BellOff className="h-4 w-4 mr-1.5" />
              )}
              {guest.doNotDisturb ? 'Remove DND' : 'Set DND'}
            </Button>
            <Button
              variant={guest.blacklisted ? 'outline' : 'danger'}
              onClick={() => setBlacklistOpen(true)}
              disabled={updateMutation.isPending}
            >
              <Ban className="h-4 w-4 mr-1.5" />
              {guest.blacklisted ? 'Unblacklist' : 'Blacklist'}
            </Button>
          </div>
        </div>
        {guest.blacklisted && guest.blacklistReason && (
          <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>Blacklist reason:</strong> {guest.blacklistReason}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{guest.totalStays ?? 0}</p>
              <p className="text-xs text-text-muted">Total Stays</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{guest.totalNights ?? 0}</p>
              <p className="text-xs text-text-muted">Total Nights</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(guest.totalRevenue ?? 0)}
              </p>
              <p className="text-xs text-text-muted">Lifetime Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stays">
            Stays
            {guest.reservations?.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                {guest.reservations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            Preferences
            {guest.preferences?.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                {guest.preferences.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {guest.documents?.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                {guest.documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes
            {guest.notes?.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                {guest.notes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Mail, label: 'Email', value: guest.email },
                  { icon: Phone, label: 'Phone', value: guest.phone },
                  {
                    icon: MapPin,
                    label: 'Address',
                    value: [guest.address, guest.city, guest.country].filter(Boolean).join(', '),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">{label}</p>
                      <p className="text-sm text-text-primary">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Identity & Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Nationality', value: guest.nationality },
                  { label: 'Passport Number', value: guest.passportNumber },
                  {
                    label: 'Date of Birth',
                    value: guest.dateOfBirth ? formatDate(guest.dateOfBirth) : null,
                  },
                  {
                    label: 'Loyalty Points',
                    value: guest.loyaltyPoints?.toLocaleString?.() ?? guest.loyaltyPoints ?? 0,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-text-muted">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{value ?? '—'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            {guest.notes && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Profile Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{guest.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Stays */}
        <TabsContent value="stays" className="pt-4">
          {!guest.reservations?.length ? (
            <EmptyState
              icon={BedDouble}
              title="No stays yet"
              description="Reservations for this guest will appear here."
              action={
                <Link to={`/app/reservations/new?guestId=${guest.id}`}>
                  <Button>
                    <BedDouble className="h-4 w-4 mr-1.5" />
                    New Reservation
                  </Button>
                </Link>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-text-muted">
                          Confirmation
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-text-muted">
                          Property
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-text-muted">Dates</th>
                        <th className="px-4 py-3 text-left font-medium text-text-muted">Room</th>
                        <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-text-muted">Total</th>
                        <th className="px-4 py-3 text-right font-medium text-text-muted"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {guest.reservations.map((res) => (
                        <tr
                          key={res.id}
                          className="border-b border-border hover:bg-surface-elevated/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-text-primary">
                            {res.confirmationNumber}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {res.property?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {formatDate(res.arrivalDate)} → {formatDate(res.departureDate)}
                            <span className="ml-1 text-xs text-text-muted">({res.nights}n)</span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {res.stays
                              ?.map((s) => s.room?.number)
                              .filter(Boolean)
                              .join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={stayStatusVariant[res.status] ?? 'neutral'}>
                              {res.status?.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-text-primary">
                            {formatCurrency(Number(res.totalAmount ?? 0))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/app/reservations/${res.id}`}>
                              <Button variant="ghost" size="icon" title="Open reservation">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="pt-4">
          <PreferencesTab guest={guest} />
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="pt-4">
          <DocumentsTab guest={guest} />
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="pt-4">
          <NotesTab guest={guest} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Guest" size="lg">
        <EditGuestForm
          guest={guest}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          isSubmitting={updateMutation.isPending}
        />
      </Dialog>

      {/* Blacklist Dialog */}
      <BlacklistDialog
        guest={guest}
        open={blacklistOpen}
        onClose={() => setBlacklistOpen(false)}
        onConfirm={handleBlacklist}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
