import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Download,
  UserPlus,
  AlertTriangle,
  Crown,
  BedDouble,
  UserCheck,
  Ban,
  Merge,
} from 'lucide-react';
import {
  useGuestsList,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useGuestStats,
  useMergeGuest,
} from '../../../hooks/useGuests';
import { listGuests, buildGuestsCsv, downloadCsv } from '../../../api/guests';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog } from '../../../components/ui/dialog';
import { Skeleton, SkeletonText } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown';

// ─── Constants ───
const VIP_LEVELS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const NATIONALITIES = [
  'US',
  'GB',
  'CA',
  'AU',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'BE',
  'CH',
  'AT',
  'SE',
  'NO',
  'DK',
  'FI',
  'JP',
  'CN',
  'KR',
  'SG',
  'AE',
  'SA',
  'BR',
  'MX',
  'AR',
  'IN',
  'TH',
  'MY',
  'ID',
  'PH',
  'RU',
  'PL',
  'CZ',
  'HU',
  'GR',
  'PT',
  'IE',
  'ZA',
  'NG',
  'KE',
  'EG',
  'IL',
  'TR',
  'NZ',
  'OTHER',
];

const SORT_COLUMNS = [
  { key: 'lastName', label: 'Guest' },
  { key: 'email', label: 'Contact' },
  { key: 'vipStatus', label: 'Status' },
  { key: 'createdAt', label: 'Joined' },
];

// ─── Guest Form ───
function GuestForm({ guest, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    firstName: guest?.firstName ?? '',
    lastName: guest?.lastName ?? '',
    email: guest?.email ?? '',
    phone: guest?.phone ?? '',
    dateOfBirth: guest?.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : '',
    nationality: guest?.nationality ?? '',
    address: guest?.address ?? '',
    city: guest?.city ?? '',
    country: guest?.country ?? '',
    passportNumber: guest?.passportNumber ?? '',
    vipStatus: guest?.vipStatus ?? '',
    notes: guest?.notes ?? '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Invalid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...formData };
    if (!payload.dateOfBirth) delete payload.dateOfBirth;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">First Name *</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
          {errors.firstName && <p className="text-xs text-danger">{errors.firstName}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Last Name *</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
          {errors.lastName && <p className="text-xs text-danger">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Email</label>
          <input
            type="email"
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Phone</label>
          <input
            type="tel"
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Date of Birth</label>
          <input
            type="date"
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Nationality</label>
          <select
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
          >
            <option value="">Select nationality</option>
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">Address</label>
        <input
          className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">City</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Country</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Passport Number</label>
          <input
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.passportNumber}
            onChange={(e) => handleChange('passportNumber', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">VIP Status</label>
          <select
            className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.vipStatus}
            onChange={(e) => handleChange('vipStatus', e.target.value)}
          >
            <option value="">None</option>
            {VIP_LEVELS.map((v) => (
              <option key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          rows={3}
          className="flex w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Special requests, preferences, etc."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {guest ? 'Save Changes' : 'Add Guest'}
        </Button>
      </div>
    </form>
  );
}

// ─── Blacklist Dialog ───
function BlacklistDialog({ guest, open, onClose, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setReason(''), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!guest) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-danger">
          <Ban className="h-5 w-5" />
          {guest.blacklisted ? 'Remove Blacklist' : 'Blacklist Guest'}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={guest.blacklisted ? 'primary' : 'danger'}
            onClick={() => onConfirm(reason)}
            isLoading={isSubmitting}
          >
            {guest.blacklisted ? 'Remove Blacklist' : 'Blacklist'}
          </Button>
        </>
      }
    >
      {guest.blacklisted ? (
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

// ─── Merge Dialog ───
function MergeDialog({ sourceGuest, open, onClose, onConfirm, isSubmitting }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSearch('');
        setDebouncedSearch('');
        setTarget(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data } = useGuestsList(
    debouncedSearch.trim() ? { search: debouncedSearch.trim(), pageSize: 8 } : { pageSize: 8 }
  );
  const candidates = useMemo(
    () => (data?.data ?? []).filter((g) => g.id !== sourceGuest?.id),
    [data, sourceGuest]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Merge className="h-5 w-5" />
          Merge Duplicate Profile
        </span>
      }
      description={
        sourceGuest
          ? `All reservations, notes, preferences, documents and loyalty points from "${sourceGuest.firstName} ${sourceGuest.lastName}" will be moved into the guest you select below. The duplicate profile will be deleted.`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => target && onConfirm(target.id)}
            disabled={!target}
            isLoading={isSubmitting}
          >
            Merge into {target ? `${target.firstName} ${target.lastName}` : 'selected guest'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTarget(null);
            }}
            placeholder="Search for the profile to keep..."
            className="flex h-10 w-full rounded-md border bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {candidates.length > 0 && !target && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {candidates.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setTarget(g)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-elevated border-b border-border last:border-b-0"
              >
                <span className="font-medium text-text-primary">
                  {g.firstName} {g.lastName}
                  {g.blacklisted && <Ban className="inline h-3.5 w-3.5 ml-1.5 text-danger" />}
                </span>
                <span className="text-xs text-text-muted">
                  {g.email ?? g.phone ?? ''} · {g._count?.reservations ?? 0} stay(s)
                </span>
              </button>
            ))}
          </div>
        )}
        {target && (
          <div className="flex items-center justify-between rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-2.5">
            <span className="text-sm font-medium text-text-primary">
              {target.firstName} {target.lastName}
              <span className="ml-2 text-xs text-text-muted">{target.email}</span>
            </span>
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="text-xs text-text-muted hover:text-danger"
            >
              Change
            </button>
          </div>
        )}
        {candidates.length === 0 && debouncedSearch && !target && (
          <p className="text-xs text-text-muted">No matching guests found.</p>
        )}
      </div>
    </Dialog>
  );
}

// ─── Delete Confirmation ───
function DeleteConfirmDialog({ guest, open, onClose, onConfirm, isDeleting, error }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-5 w-5" />
          Delete Guest
        </span>
      }
      description={`Are you sure you want to delete ${guest?.firstName} ${guest?.lastName}? This action cannot be undone.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Delete
          </Button>
        </>
      }
    >
      <div className="text-sm text-text-secondary">
        <p>
          Guest ID: <code className="bg-muted px-1 rounded">{guest?.id}</code>
        </p>
        {guest?.email && <p className="mt-1">Email: {guest.email}</p>}
        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

// ─── Skeleton ───
function GuestsTableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 grid grid-cols-12 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonText key={i} className="col-span-2" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4 grid grid-cols-12 gap-4 border-t border-border">
            <div className="col-span-3 flex items-center gap-3">
              <Skeleton circle className="h-8 w-8" />
              <SkeletonText className="w-20" />
            </div>
            <SkeletonText className="col-span-3" />
            <SkeletonText className="col-span-2" />
            <SkeletonText className="col-span-2" />
            <div className="col-span-2 flex justify-end">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, tone = 'secondary' }) {
  const tones = {
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value ?? '—'}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function GuestsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [vipFilter, setVipFilter] = useState('');
  const [blacklistFilter, setBlacklistFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isExporting, setIsExporting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [blacklistTarget, setBlacklistTarget] = useState(null);
  const [mergeSource, setMergeSource] = useState(null);

  // Fixed debounce: effect-based, cleanup actually runs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, isFetching } = useGuestsList({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    vipStatus: vipFilter || undefined,
    blacklisted: blacklistFilter || undefined,
    sortBy: sortField,
    sortDir: sortDirection,
  });

  const { data: stats } = useGuestStats();

  const guests = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const createMutation = useCreateGuest();
  const updateMutation = useUpdateGuest();
  const deleteMutation = useDeleteGuest();
  const mergeMutation = useMergeGuest();

  const handleCreate = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: 'Guest created',
        description: `${formData.firstName} ${formData.lastName} has been added.`,
      });
      setCreateOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to create guest',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (formData) => {
    if (!editGuest) return;
    try {
      await updateMutation.mutateAsync({ id: editGuest.id, input: formData });
      toast({
        title: 'Guest updated',
        description: `${formData.firstName} ${formData.lastName} has been updated.`,
      });
      setEditGuest(null);
    } catch (err) {
      toast({
        title: 'Failed to update guest',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: 'Guest deleted',
        description: `${deleteTarget.firstName} ${deleteTarget.lastName} has been removed.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const handleBlacklist = async (reason) => {
    if (!blacklistTarget) return;
    const input = blacklistTarget.blacklisted
      ? { blacklisted: false }
      : { blacklisted: true, blacklistReason: reason || undefined };
    try {
      await updateMutation.mutateAsync({ id: blacklistTarget.id, input });
      toast({
        title: blacklistTarget.blacklisted ? 'Blacklist removed' : 'Guest blacklisted',
        description: `${blacklistTarget.firstName} ${blacklistTarget.lastName}`,
        variant: blacklistTarget.blacklisted ? 'default' : 'destructive',
      });
      setBlacklistTarget(null);
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleMerge = async (targetGuestId) => {
    if (!mergeSource) return;
    try {
      const result = await mergeMutation.mutateAsync({ id: mergeSource.id, targetGuestId });
      toast({
        title: 'Profiles merged',
        description: `Moved ${result.movedReservations} reservation(s) and ${result.movedLoyaltyTransactions} loyalty transaction(s) into ${result.target.firstName} ${result.target.lastName}.`,
      });
      setMergeSource(null);
    } catch (err) {
      toast({
        title: 'Merge failed',
        description: err?.response?.data?.message || err.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await listGuests({
        page: 1,
        pageSize: 10000,
        search: debouncedSearch || undefined,
        vipStatus: vipFilter || undefined,
        blacklisted: blacklistFilter || undefined,
      });
      const csv = buildGuestsCsv(result.data);
      const stamp = new Date().toISOString().split('T')[0];
      downloadCsv(`vimad-guests-${stamp}.csv`, csv);
      toast({
        title: 'Export ready',
        description: `${result.data.length} guests exported to CSV.`,
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Guests</h1>
          <p className="text-sm text-text-muted">Manage your property guests</p>
        </div>
        <GuestsTableSkeleton />
      </div>
    );
  }

  if (error && !guests.length) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Guests</h1>
          <p className="text-sm text-text-muted">Manage your property guests</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load guests"
          description={error.message || 'Unable to fetch guest data from the server.'}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  const hasActiveFilters = debouncedSearch || vipFilter || blacklistFilter;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Guests</h1>
          <p className="text-sm text-text-muted">
            {meta?.total !== undefined
              ? `${meta.total} total guests`
              : 'Manage your property guests'}
            {isFetching && <span className="ml-2 text-text-muted">(refreshing...)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Guests" value={stats?.total} />
        <StatCard icon={Crown} label="VIP Guests" value={stats?.vip} tone="warning" />
        <StatCard
          icon={UserPlus}
          label="New This Month"
          value={stats?.newThisMonth}
          tone="accent"
        />
        <StatCard icon={BedDouble} label="In House Now" value={stats?.inHouse} tone="accent" />
        <StatCard icon={Ban} label="Blacklisted" value={stats?.blacklisted} tone="danger" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, phone, passport..."
                className="flex h-10 w-full rounded-md border bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">VIP</label>
              <select
                className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={vipFilter}
                onChange={(e) => {
                  setVipFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="vip">Any VIP</option>
                <option value="none">No VIP</option>
                {VIP_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">Blacklist</label>
              <select
                className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={blacklistFilter}
                onChange={(e) => {
                  setBlacklistFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="false">Not blacklisted</option>
                <option value="true">Blacklisted only</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">Show</label>
              <select
                className="flex h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {guests.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Users}
                title="No guests found"
                description={
                  hasActiveFilters
                    ? 'No guests match your filters.'
                    : 'Get started by adding your first guest.'
                }
                action={
                  !hasActiveFilters && (
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Guest
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {SORT_COLUMNS.map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left font-medium text-text-muted cursor-pointer select-none hover:text-text-primary"
                        onClick={() => handleSort(key)}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {sortField === key && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Details</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="border-b border-border hover:bg-surface-elevated/50 transition-colors"
                    >
                      {/* Guest */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/app/guests/${guest.id}`)}
                          className="flex items-center gap-3 text-left hover:opacity-80"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary font-medium text-sm">
                            {guest.firstName?.[0]}
                            {guest.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary flex items-center gap-1.5">
                              {guest.firstName} {guest.lastName}
                              {guest.blacklisted && <Ban className="h-3.5 w-3.5 text-danger" />}
                              {guest.doNotDisturb && (
                                <span className="text-xs text-warning font-normal">DND</span>
                              )}
                            </p>
                            <p className="text-xs text-text-muted">ID: {guest.id.slice(-8)}</p>
                          </div>
                        </button>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {guest.email && (
                            <p className="flex items-center gap-1.5 text-text-secondary">
                              <Mail className="h-3 w-3 text-text-muted" />
                              {guest.email}
                            </p>
                          )}
                          {guest.phone && (
                            <p className="flex items-center gap-1.5 text-text-secondary">
                              <Phone className="h-3 w-3 text-text-muted" />
                              {guest.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {guest.vipStatus ? (
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
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-text-secondary">
                        {guest.createdAt
                          ? new Date(guest.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-text-secondary">
                          {guest.nationality && (
                            <Badge variant="outline" className="text-xs">
                              {guest.nationality}
                            </Badge>
                          )}
                          {guest.city && (
                            <p className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3 text-text-muted" />
                              {guest.city}
                            </p>
                          )}
                          <p className="text-xs text-text-muted">
                            {guest._count?.reservations ?? 0} stay
                            {(guest._count?.reservations ?? 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/guests/${guest.id}`)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/app/reservations/new?guestId=${guest.id}`)}
                            >
                              New Reservation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditGuest(guest)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBlacklistTarget(guest)}>
                              <Ban className="h-3.5 w-3.5 mr-2" />
                              {guest.blacklisted ? 'Remove Blacklist' : 'Blacklist'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMergeSource(guest)}>
                              <Merge className="h-3.5 w-3.5 mr-2" />
                              Merge Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(guest);
                              }}
                              className="text-danger focus:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-muted">
                Showing {(meta.page - 1) * meta.pageSize + 1} to{' '}
                {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} guests
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-muted">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New Guest"
        description="Create a new guest profile"
        size="lg"
      >
        <GuestForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editGuest}
        onClose={() => setEditGuest(null)}
        title="Edit Guest"
        description={`Update ${editGuest?.firstName} ${editGuest?.lastName}'s information`}
        size="lg"
      >
        {editGuest && (
          <GuestForm
            guest={editGuest}
            onSubmit={handleUpdate}
            onCancel={() => setEditGuest(null)}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        guest={deleteTarget}
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
      />

      {/* Blacklist Dialog */}
      <BlacklistDialog
        guest={blacklistTarget}
        open={!!blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        onConfirm={handleBlacklist}
        isSubmitting={updateMutation.isPending}
      />

      {/* Merge Dialog */}
      <MergeDialog
        sourceGuest={mergeSource}
        open={!!mergeSource}
        onClose={() => setMergeSource(null)}
        onConfirm={handleMerge}
        isSubmitting={mergeMutation.isPending}
      />
    </div>
  );
}
