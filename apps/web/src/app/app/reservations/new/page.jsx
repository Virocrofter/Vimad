import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { cn } from '../../../../lib/utils';
import {
  Calendar,
  BedDouble,
  DollarSign,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Clock,
  Search,
  UserCheck,
} from 'lucide-react';
import { useProperties } from '../../../../hooks/useProperties';
import { useRoomTypes } from '../../../../hooks/useRoomTypes';
import { useRooms } from '../../../../hooks/useRooms';
import { useGuestsList, useCreateGuest, useGuest } from '../../../../hooks/useGuests';
import { useCreateReservation } from '../../../../hooks/useReservations';

const steps = [
  { label: 'Dates', icon: Calendar },
  { label: 'Room', icon: BedDouble },
  { label: 'Guest', icon: User },
  { label: 'Confirm', icon: Check },
];

const schema = z.object({
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  adults: z.string().min(1),
  children: z.string().optional(),
  roomTypeId: z.string().min(1, 'Select a room type'),
  roomId: z.string().optional(),
  rate: z.string().optional(),
  source: z.string(),
  specialRequests: z.string().optional(),
});

export default function NewReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGuestId = searchParams.get('guestId');
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  /* Guest selection state */
  const [guestSearch, setGuestSearch] = useState('');
  const [debouncedGuestSearch, setDebouncedGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedGuestSearch(guestSearch), 300);
    return () => clearTimeout(t);
  }, [guestSearch]);

  /* Preselect guest when arriving from a guest profile (?guestId=) */
  const { data: preselectedGuest } = useGuest(preselectedGuestId ?? undefined);
  useEffect(() => {
    if (preselectedGuest && !selectedGuest) {
      setSelectedGuest(preselectedGuest);
      setNewGuest({ firstName: '', lastName: '', email: '', phone: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedGuest]);

  /* Data */
  const { properties, isLoading: propertiesLoading } = useProperties();
  const propertyId = properties[0]?.id ?? null;

  const { roomTypes, isLoading: roomTypesLoading } = useRoomTypes(propertyId ?? undefined);
  const { rooms } = useRooms();
  const { data: guestsResult } = useGuestsList(
    debouncedGuestSearch.trim()
      ? { search: debouncedGuestSearch.trim(), pageSize: 8 }
      : { pageSize: 8 }
  );
  const guestResults = guestsResult?.data ?? [];

  const createGuest = useCreateGuest();
  const createReservation = useCreateReservation();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      arrivalDate: '',
      departureDate: '',
      adults: '2',
      children: '0',
      roomTypeId: '',
      rate: '',
      source: 'direct',
      specialRequests: '',
    },
  });

  const values = watch();
  const selectedRoomType = roomTypes.find((r) => r.id === values.roomTypeId);
  const roomsOfType = useMemo(
    () =>
      rooms.filter((r) => r.roomTypeId === values.roomTypeId && (r.status ?? '') !== 'occupied'),
    [rooms, values.roomTypeId]
  );

  const nights = (() => {
    if (!values.arrivalDate || !values.departureDate) return 0;
    const diff = new Date(values.departureDate) - new Date(values.arrivalDate);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const nightlyRate = values.rate ? Number(values.rate) : null;
  const estimatedTotal = nightlyRate ? nightlyRate * nights : null;

  const validateStep = async () => {
    const fields = [];
    if (currentStep === 0) fields.push('arrivalDate', 'departureDate');
    if (currentStep === 1) fields.push('roomTypeId');
    if (currentStep === 2) {
      if (!selectedGuest && (!newGuest.firstName.trim() || !newGuest.lastName.trim())) {
        return false;
      }
    }
    if (fields.length === 0) return true;
    return await trigger(fields);
  };

  const nextStep = async () => {
    if (currentStep === 0 && nights <= 0) {
      setSubmitError('Departure date must be after arrival date.');
      return;
    }
    setSubmitError(null);
    const valid = await validateStep();
    if (valid) setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    setSubmitError(null);
    try {
      if (!propertyId) throw new Error('No property available. Create a property first.');

      let guestId = selectedGuest?.id;
      if (!guestId) {
        const guest = await createGuest.mutateAsync({
          firstName: newGuest.firstName.trim(),
          lastName: newGuest.lastName.trim(),
          email: newGuest.email.trim() || undefined,
          phone: newGuest.phone.trim() || undefined,
        });
        guestId = guest.id;
      }

      const result = await createReservation.mutateAsync({
        propertyId,
        guestId,
        arrivalDate: values.arrivalDate,
        departureDate: values.departureDate,
        nights,
        adults: Number(values.adults) || 1,
        children: Number(values.children) || 0,
        rate: values.rate ? Number(values.rate) : undefined,
        source: values.source,
        notes: values.specialRequests?.trim() || undefined,
      });

      navigate(`/app/reservations/${result.data.id}`);
    } catch (e) {
      setSubmitError(e.message);
    }
  };

  const submitting = createGuest.isPending || createReservation.isPending;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Arrival Date"
                type="date"
                error={errors.arrivalDate?.message}
                {...register('arrivalDate')}
              />
              <Input
                label="Departure Date"
                type="date"
                error={errors.departureDate?.message}
                {...register('departureDate')}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Adults" type="number" min="1" {...register('adults')} />
              <Input label="Children" type="number" min="0" {...register('children')} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Source</label>
                <select
                  {...register('source')}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="direct">Direct</option>
                  <option value="walkin">Walk-in</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="bookingcom">Booking.com</option>
                  <option value="expedia">Expedia</option>
                </select>
              </div>
            </div>
            {nights > 0 && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <p className="text-sm font-medium text-accent">
                  <Clock className="inline h-4 w-4 mr-1.5" />
                  {nights} night{nights !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            {roomTypesLoading ? (
              <p className="text-sm text-text-muted">Loading room types...</p>
            ) : roomTypes.length === 0 ? (
              <p className="text-sm text-text-muted">No room types found for this property.</p>
            ) : (
              roomTypes.map((room) => (
                <label
                  key={room.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all',
                    values.roomTypeId === room.id
                      ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                      : 'border-border bg-surface hover:bg-surface-elevated'
                  )}
                >
                  <input
                    type="radio"
                    value={room.id}
                    className="sr-only"
                    {...register('roomTypeId')}
                  />
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <BedDouble className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-text-primary">{room.name}</h4>
                      <span className="text-xs text-text-muted">{room.code}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Base occupancy {room.baseOccupancy} · Max {room.maxOccupancy}
                    </p>
                  </div>
                  {values.roomTypeId === room.id && <Check className="h-5 w-5 text-secondary" />}
                </label>
              ))
            )}
            {errors.roomTypeId && (
              <p className="text-xs text-danger">{errors.roomTypeId.message}</p>
            )}

            {values.roomTypeId && (
              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-medium text-text-muted">
                  OPTIONAL — RESERVE A SPECIFIC ROOM ({roomsOfType.length} vacant of this type)
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Room</label>
                  <select
                    value={values.roomId ?? ''}
                    onChange={(e) => setValue('roomId', e.target.value || undefined)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Let front desk assign later</option>
                    {roomsOfType.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} — Floor {r.floor ?? '—'} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Nightly Rate (optional — leave blank to use the rate plan)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={
                    selectedRoomType ? `e.g. standard rate for ${selectedRoomType.name}` : ''
                  }
                  {...register('rate')}
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Preselected guest from profile */}
            {selectedGuest && preselectedGuestId === selectedGuest.id && (
              <div className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3">
                <UserCheck className="h-4 w-4 text-secondary shrink-0" />
                <p className="text-sm text-text-primary">
                  Booking for{' '}
                  <strong>
                    {selectedGuest.firstName} {selectedGuest.lastName}
                  </strong>
                  <span className="ml-2 text-xs text-text-muted">{selectedGuest.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedGuest(null)}
                  className="ml-auto text-xs text-text-muted hover:text-danger"
                >
                  Change
                </button>
              </div>
            )}

            {/* Search existing guest */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Find existing guest</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={guestSearch}
                  onChange={(e) => {
                    setGuestSearch(e.target.value);
                    setSelectedGuest(null);
                  }}
                  placeholder="Search by name..."
                  className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {guestResults.length > 0 && !selectedGuest && (
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background">
                  {guestResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGuest(g);
                        setNewGuest({ firstName: '', lastName: '', email: '', phone: '' });
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-elevated border-b border-border last:border-b-0"
                    >
                      <span className="font-medium text-text-primary">
                        {g.firstName} {g.lastName}
                      </span>
                      <span className="text-xs text-text-muted">{g.email ?? g.phone ?? ''}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedGuest && preselectedGuestId !== selectedGuest.id && (
                <div className="flex items-center justify-between rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-2.5">
                  <span className="text-sm font-medium text-text-primary">
                    {selectedGuest.firstName} {selectedGuest.lastName}
                    <span className="ml-2 text-xs text-text-muted">{selectedGuest.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedGuest(null)}
                    className="text-xs text-text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Or create new guest */}
            {!selectedGuest && (
              <div className="space-y-4 rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-medium text-text-muted">OR CREATE A NEW GUEST</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={newGuest.firstName}
                    onChange={(e) => setNewGuest((g) => ({ ...g, firstName: e.target.value }))}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    value={newGuest.lastName}
                    onChange={(e) => setNewGuest((g) => ({ ...g, lastName: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@email.com"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest((g) => ({ ...g, email: e.target.value }))}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest((g) => ({ ...g, phone: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Special Requests</label>
              <textarea
                {...register('specialRequests')}
                rows={3}
                placeholder="Early check-in, high floor, extra pillows..."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        );

      case 3: {
        const guestLabel = selectedGuest
          ? `${selectedGuest.firstName} ${selectedGuest.lastName}`
          : `${newGuest.firstName} ${newGuest.lastName}`;
        const selectedRoom = roomsOfType.find((r) => r.id === values.roomId);
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-text-primary">Reservation Summary</h3>
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  {nights} night{nights !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Arrival</p>
                  <p className="font-medium text-text-primary">{values.arrivalDate || '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Departure</p>
                  <p className="font-medium text-text-primary">{values.departureDate || '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Room Type</p>
                  <p className="font-medium text-text-primary">{selectedRoomType?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Room</p>
                  <p className="font-medium text-text-primary">
                    {selectedRoom ? `Room ${selectedRoom.number}` : 'Assign at check-in'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Rate</p>
                  <p className="font-medium text-text-primary">
                    {nightlyRate ? `$${nightlyRate.toFixed(2)}/night` : 'Rate plan default'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Source</p>
                  <p className="font-medium text-text-primary">{values.source}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Guest</p>
                <p className="font-medium text-text-primary">{guestLabel || '—'}</p>
                {(selectedGuest?.email || newGuest.email) && (
                  <p className="text-sm text-text-secondary">
                    {selectedGuest?.email || newGuest.email}
                  </p>
                )}
                {(selectedGuest?.phone || newGuest.phone) && (
                  <p className="text-sm text-text-secondary">
                    {selectedGuest?.phone || newGuest.phone}
                  </p>
                )}
              </div>

              {values.specialRequests && (
                <div className="border-t border-border pt-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                    Special Requests
                  </p>
                  <p className="text-sm text-text-secondary">{values.specialRequests}</p>
                </div>
              )}

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Total Estimated{estimatedTotal === null && ' (rate plan will apply)'}
                </span>
                <span className="text-2xl font-bold text-text-primary">
                  {estimatedTotal !== null ? `$${estimatedTotal.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/reservations')}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Back to Reservations
        </button>
        <h1 className="mt-2 text-2xl font-bold text-text-primary">New Reservation</h1>
      </div>

      {propertiesLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : !propertyId ? (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-6 text-center">
          <p className="text-sm font-medium text-text-primary">No property found</p>
          <p className="mt-1 text-xs text-text-muted">
            Create a property in Settings before taking reservations.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {/* Stepper */}
          <div className="mb-8 flex items-center px-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              const isLast = idx === steps.length - 1;

              return (
                <div key={step.label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                        isActive && 'border-secondary bg-secondary text-white',
                        isCompleted && 'border-secondary bg-secondary text-white',
                        !isActive && !isCompleted && 'border-border bg-surface text-text-muted'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isActive ? 'text-secondary' : 'text-text-muted'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'mx-1 h-0.5 flex-1 transition-colors',
                        isCompleted ? 'bg-secondary' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {submitError && (
            <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-2.5">
              <p className="text-sm text-danger">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="min-h-[280px]">{renderStepContent()}</div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" isLoading={submitting}>
                  <Rocket className="mr-1 h-4 w-4" /> Create Reservation
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
