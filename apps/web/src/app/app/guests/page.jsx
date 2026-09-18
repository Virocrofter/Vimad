import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Calendar,
  Filter,
  Download,
  UserPlus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  useGuestsList,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
} from '../../../hooks/useGuests';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Dialog } from '../../../components/ui/dialog';
import { Skeleton, SkeletonText } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Select } from '../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown';
import { cn } from '../../../lib/utils';

// ─── Constants ───
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
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

// ─── Guest Form Component ───
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
        <Input
          label="First Name"
          required
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          required
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
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

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
        />
        <Input
          label="Country"
          value={formData.country}
          onChange={(e) => handleChange('country', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Passport Number"
          value={formData.passportNumber}
          onChange={(e) => handleChange('passportNumber', e.target.value)}
        />
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
          {guest ? 'Update Guest' : 'Create Guest'}
        </Button>
      </div>
    </form>
  );
}

// ─── Delete Confirmation Dialog ───
function DeleteConfirmDialog({ guest, open, onClose, onConfirm, isDeleting }) {
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
      </div>
    </Dialog>
  );
}

// ─── Guest Detail Drawer ───
function GuestDetailDrawer({ guest, open, onClose }) {
  if (!guest) return null;

  const detailItems = [
    { label: 'Email', value: guest.email, icon: Mail },
    { label: 'Phone', value: guest.phone, icon: Phone },
    {
      label: 'Address',
      value: [guest.address, guest.city, guest.country].filter(Boolean).join(', '),
      icon: MapPin,
    },
    {
      label: 'Date of Birth',
      value: guest.dateOfBirth ? new Date(guest.dateOfBirth).toLocaleDateString() : null,
      icon: Calendar,
    },
    { label: 'Nationality', value: guest.nationality, icon: null },
    { label: 'Passport', value: guest.passportNumber, icon: null },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={`${guest.firstName} ${guest.lastName}`} size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
            <span className="text-xl font-bold text-secondary">
              {guest.firstName?.[0]}
              {guest.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {guest.vipStatus && <Badge variant="accent">{guest.vipStatus.toUpperCase()}</Badge>}
              <StatusBadge status="active" />
            </div>
            <p className="mt-1 text-sm text-text-muted">ID: {guest.id}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {detailItems.map(({ label, value, icon: Icon }) =>
            value ? (
              <div key={label} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-xs font-medium text-text-muted">{label}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-primary">
                  {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" />}
                  {value}
                </p>
              </div>
            ) : null
          )}
        </div>

        {/* Notes */}
        {guest.notes && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium text-text-muted mb-2">Notes</p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{guest.notes}</p>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-muted mb-3">Stay History</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-text-primary">{guest.totalStays ?? 0}</p>
              <p className="text-xs text-text-muted">Total Stays</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{guest.totalNights ?? 0}</p>
              <p className="text-xs text-text-muted">Total Nights</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                ${guest.totalRevenue?.toLocaleString() ?? '0'}
              </p>
              <p className="text-xs text-text-muted">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Loading Skeleton ───
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
            <div className="col-span-2 flex items-center gap-3">
              <Skeleton circle className="h-8 w-8" />
              <SkeletonText className="w-20" />
            </div>
            <SkeletonText className="col-span-2" />
            <SkeletonText className="col-span-2" />
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

// ─── Main Guests Page ───
export default function GuestsPage() {
  // ─── State ───
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);

  // ─── Toast ───
  const { toast } = useToast();

  // ─── API Queries ───
  const { data, isLoading, error, isFetching } = useGuestsList({
    page,
    pageSize,
    search: searchDebounced || undefined,
  });

  const guests = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  // ─── Mutations ───
  const createMutation = useCreateGuest();
  const updateMutation = useUpdateGuest();
  const deleteMutation = useDeleteGuest();

  // ─── Search Debounce ───
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // ─── Handlers ───
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
    if (!deleteGuest) return;
    try {
      await deleteMutation.mutateAsync(deleteGuest.id);
      toast({
        title: 'Guest deleted',
        description: `${deleteGuest.firstName} ${deleteGuest.lastName} has been removed.`,
      });
      setDeleteGuest(null);
    } catch (err) {
      toast({
        title: 'Failed to delete guest',
        description: err.message || 'Something went wrong',
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
  };

  // ─── Sorted Guests (client-side for now; move to server later) ───
  const sortedGuests = useMemo(() => {
    const sorted = [...guests];
    sorted.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [guests, sortField, sortDirection]);

  // ─── Render: Loading ───
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

  // ─── Render: Error ───
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

  // ─── Render: Main ───
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
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Guest
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                className="flex h-10 w-full rounded-md border bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Show</span>
              <select
                className="h-10 rounded-md border bg-surface px-3 py-2 text-sm text-text-primary"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guests Table */}
      <Card>
        <CardContent className="p-0">
          {guests.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Users}
                title="No guests found"
                description={
                  searchDebounced
                    ? 'No guests match your search criteria.'
                    : 'Get started by adding your first guest.'
                }
                action={
                  !searchDebounced && (
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
                    {[
                      { key: 'lastName', label: 'Guest' },
                      { key: 'email', label: 'Contact' },
                      { key: 'nationality', label: 'Details' },
                      { key: 'vipStatus', label: 'Status' },
                      { key: 'createdAt', label: 'Joined' },
                    ].map(({ key, label }) => (
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
                    <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="border-b border-border hover:bg-surface-elevated/50 transition-colors"
                    >
                      {/* Guest Name */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailGuest(guest)}
                          className="flex items-center gap-3 text-left hover:opacity-80"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary font-medium text-sm">
                            {guest.firstName?.[0]}
                            {guest.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {guest.firstName} {guest.lastName}
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

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailGuest(guest)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditGuest(guest)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteGuest(guest)}
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
        guest={deleteGuest}
        open={!!deleteGuest}
        onClose={() => setDeleteGuest(null)}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* Detail Drawer */}
      <GuestDetailDrawer
        guest={detailGuest}
        open={!!detailGuest}
        onClose={() => setDetailGuest(null)}
      />
    </div>
  );
}
