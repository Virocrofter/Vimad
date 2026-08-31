import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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
  Star,
  Wifi,
  Coffee,
} from 'lucide-react';

const steps = [
  { label: 'Dates', icon: Calendar },
  { label: 'Room', icon: BedDouble },
  { label: 'Rate', icon: DollarSign },
  { label: 'Guest', icon: User },
  { label: 'Confirm', icon: Check },
];

const roomTypes = [
  {
    id: 'std-twin',
    name: 'Standard Twin',
    baseRate: 145,
    occupancy: 2,
    size: '28m²',
    amenities: ['WiFi', 'TV', 'AC'],
  },
  {
    id: 'del-king',
    name: 'Deluxe King',
    baseRate: 189,
    occupancy: 2,
    size: '35m²',
    amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Balcony'],
  },
  {
    id: 'suite',
    name: 'Executive Suite',
    baseRate: 320,
    occupancy: 4,
    size: '55m²',
    amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Balcony', 'Kitchenette'],
  },
];

const rateCodes = [
  {
    id: 'rack',
    name: 'Rack Rate',
    rate: 189,
    description: 'Best available rate',
    rules: 'Free cancellation until 24h before arrival',
  },
  {
    id: 'corp',
    name: 'Corporate',
    rate: 165,
    description: 'Corporate negotiated rate',
    rules: 'Requires valid corporate ID',
  },
  {
    id: 'advance',
    name: 'Advance Purchase',
    rate: 149,
    description: 'Non-refundable, book 14+ days ahead',
    rules: 'Full prepayment required, non-refundable',
  },
];

const schema = z.object({
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  adults: z.string().min(1),
  children: z.string().optional(),
  roomTypeId: z.string().min(1, 'Select a room type'),
  rateCodeId: z.string().min(1, 'Select a rate'),
  guestName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone required'),
  specialRequests: z.string().optional(),
});

export default function NewReservationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      arrivalDate: '',
      departureDate: '',
      adults: '2',
      children: '0',
      roomTypeId: '',
      rateCodeId: '',
      guestName: '',
      email: '',
      phone: '',
      specialRequests: '',
    },
  });

  const values = watch();
  const selectedRoom = roomTypes.find((r) => r.id === values.roomTypeId);
  const selectedRate = rateCodes.find((r) => r.id === values.rateCodeId);

  const nights = (() => {
    if (!values.arrivalDate || !values.departureDate) return 0;
    const diff = new Date(values.departureDate) - new Date(values.arrivalDate);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const validateStep = async () => {
    const fields = [];
    if (currentStep === 0) fields.push('arrivalDate', 'departureDate');
    if (currentStep === 1) fields.push('roomTypeId');
    if (currentStep === 2) fields.push('rateCodeId');
    if (currentStep === 3) fields.push('guestName', 'email', 'phone');
    if (fields.length === 0) return true;
    return await trigger(fields);
  };

  const nextStep = async () => {
    const valid = await validateStep();
    if (valid) setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    navigate('/app/reservations');
  };

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
            {roomTypes.map((room) => (
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
                    <span className="text-sm font-bold text-secondary">${room.baseRate}/night</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Up to {room.occupancy} guests · {room.size}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {room.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-secondary border border-border"
                      >
                        {a === 'WiFi' && <Wifi className="h-3 w-3" />}
                        {a === 'TV' && <Star className="h-3 w-3" />}
                        {a === 'Minibar' && <Coffee className="h-3 w-3" />}
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                {values.roomTypeId === room.id && <Check className="h-5 w-5 text-secondary" />}
              </label>
            ))}
            {errors.roomTypeId && (
              <p className="text-xs text-danger">{errors.roomTypeId.message}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            {rateCodes.map((rate) => (
              <label
                key={rate.id}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all',
                  values.rateCodeId === rate.id
                    ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                )}
              >
                <input
                  type="radio"
                  value={rate.id}
                  className="sr-only"
                  {...register('rateCodeId')}
                />
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text-primary">{rate.name}</h4>
                    <span className="text-lg font-bold text-secondary">${rate.rate}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{rate.description}</p>
                  <p className="text-xs text-text-muted mt-1">{rate.rules}</p>
                </div>
                {values.rateCodeId === rate.id && <Check className="h-5 w-5 text-secondary" />}
              </label>
            ))}
            {errors.rateCodeId && (
              <p className="text-xs text-danger">{errors.rateCodeId.message}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.guestName?.message}
              {...register('guestName')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                placeholder="john@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
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

      case 4: {
        const total = selectedRate ? selectedRate.rate * nights : 0;
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
                  <p className="text-text-muted text-xs uppercase tracking-wider">Room</p>
                  <p className="font-medium text-text-primary">{selectedRoom?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Rate</p>
                  <p className="font-medium text-text-primary">{selectedRate?.name || '—'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Guest</p>
                <p className="font-medium text-text-primary">{values.guestName || '—'}</p>
                <p className="text-sm text-text-secondary">{values.email}</p>
                <p className="text-sm text-text-secondary">{values.phone}</p>
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
                <span className="text-sm text-text-secondary">Total Estimated</span>
                <span className="text-2xl font-bold text-text-primary">${total}</span>
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
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
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
              <Button type="submit" isLoading={isSubmitting}>
                <Rocket className="mr-1 h-4 w-4" /> Create Reservation
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
