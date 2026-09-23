import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Building2,
  User,
  BedDouble,
  Link2,
  Rocket,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const step1Schema = z
  .object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const step2Schema = z.object({
  propertyName: z.string().min(2, 'Property name required'),
  address: z.string().min(5, 'Full address required'),
  phone: z.string().min(10, 'Valid phone required'),
  roomCount: z.string().min(1, 'Room count required'),
});

const step3Schema = z.object({
  roomTypes: z
    .array(
      z.object({
        name: z.string().min(1, 'Name required'),
        count: z.string().min(1, 'Count required'),
        rate: z.string().min(1, 'Rate required'),
      })
    )
    .min(1, 'Add at least one room type'),
});

const step4Schema = z.object({
  connectBookingEngine: z.boolean().optional(),
  connectChannelManager: z.boolean().optional(),
  connectPaymentGateway: z.boolean().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

const steps = [
  { label: 'Account', icon: User },
  { label: 'Property', icon: Building2 },
  { label: 'Rooms', icon: BedDouble },
  { label: 'Connect', icon: Link2 },
  { label: 'Review', icon: Rocket },
];

export function RegisterWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      propertyName: '',
      address: '',
      phone: '',
      roomCount: '',
      roomTypes: [{ name: '', count: '', rate: '' }],
      connectBookingEngine: false,
      connectChannelManager: false,
      connectPaymentGateway: false,
    },
  });

  const roomTypes = watch('roomTypes');

  const addRoomType = () => {
    setValue('roomTypes', [...roomTypes, { name: '', count: '', rate: '' }]);
  };

  const removeRoomType = (index) => {
    const updated = roomTypes.filter((_, i) => i !== index);
    setValue('roomTypes', updated);
  };

  const validateStep = async () => {
    const fields = [];
    if (currentStep === 0) fields.push('fullName', 'email', 'password', 'confirmPassword');
    if (currentStep === 1) fields.push('propertyName', 'address', 'phone', 'roomCount');
    if (currentStep === 2) fields.push('roomTypes');
    if (currentStep === 3)
      fields.push('connectBookingEngine', 'connectChannelManager', 'connectPaymentGateway');
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
    navigate('/app/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@property.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="Property Name"
              placeholder="Grand Plaza Hotel"
              error={errors.propertyName?.message}
              {...register('propertyName')}
            />
            <Input
              label="Address"
              placeholder="123 Main St, City, Country"
              error={errors.address?.message}
              {...register('address')}
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Total Room Count"
              type="number"
              placeholder="50"
              error={errors.roomCount?.message}
              {...register('roomCount')}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-primary">Room Types</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRoomType}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Type
              </Button>
            </div>
            {roomTypes.map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Type name (e.g. Deluxe)"
                    error={errors.roomTypes?.[index]?.name?.message}
                    {...register(`roomTypes.${index}.name`)}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Count"
                      className="w-24"
                      {...register(`roomTypes.${index}.count`)}
                    />
                    <Input
                      type="number"
                      placeholder="Rate ($)"
                      className="flex-1"
                      {...register(`roomTypes.${index}.rate`)}
                    />
                  </div>
                </div>
                {roomTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoomType(index)}
                    className="mt-2 text-text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.roomTypes?.message && (
              <p className="text-xs text-danger">{errors.roomTypes.message}</p>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Connect integrations to get started faster.
            </p>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer hover:bg-surface-elevated">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                {...register('connectBookingEngine')}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Booking Engine</p>
                <p className="text-xs text-text-muted">Accept direct bookings on your website</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer hover:bg-surface-elevated">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                {...register('connectChannelManager')}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Channel Manager</p>
                <p className="text-xs text-text-muted">Sync with Booking.com, Expedia, Airbnb</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 cursor-pointer hover:bg-surface-elevated">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                {...register('connectPaymentGateway')}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">Payment Gateway</p>
                <p className="text-xs text-text-muted">Process cards with Stripe</p>
              </div>
            </label>
          </div>
        );
      case 4: {
        const data = getValues();
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Account
                </p>
                <p className="text-sm text-text-primary">
                  {data.fullName} — {data.email}
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Property
                </p>
                <p className="text-sm text-text-primary">{data.propertyName}</p>
                <p className="text-xs text-text-secondary">{data.address}</p>
                <p className="text-xs text-text-secondary">{data.roomCount} rooms</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Room Types
                </p>
                <div className="mt-1 space-y-1">
                  {data.roomTypes.map((rt, i) => (
                    <p key={i} className="text-sm text-text-primary">
                      {rt.name}: {rt.count} rooms @ ${rt.rate}
                    </p>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Integrations
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.connectBookingEngine && (
                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                      Booking Engine
                    </span>
                  )}
                  {data.connectChannelManager && (
                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                      Channel Manager
                    </span>
                  )}
                  {data.connectPaymentGateway && (
                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                      Payments
                    </span>
                  )}
                  {!data.connectBookingEngine &&
                    !data.connectChannelManager &&
                    !data.connectPaymentGateway && (
                      <span className="text-xs text-text-muted">None selected</span>
                    )}
                </div>
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center px-2">
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

      <div className="min-h-[260px]">{renderStepContent()}</div>

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
            <Rocket className="mr-1 h-4 w-4" /> Launch Property
          </Button>
        )}
      </div>
    </form>
  );
}
