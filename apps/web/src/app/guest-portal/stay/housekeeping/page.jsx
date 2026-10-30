/* src/app/guest-portal/stay/housekeeping/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  Droplets,
  Bed,
  Moon,
  EyeOff,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  useStayDetails,
  useServiceRequest,
  getGuestToken,
} from '../../../../hooks/useGuestPortalData';
import { timeAgo } from '../../../../lib/guest-utils';
import { HousekeepingServiceCard } from './components';

const services = [
  {
    id: 'standard-cleaning',
    label: 'Standard Cleaning',
    description: 'Bed making, vacuuming, and bathroom refresh',
    estimatedTime: '30 min',
    icon: 'Sparkles',
  },
  {
    id: 'deep-cleaning',
    label: 'Deep Cleaning',
    description: 'Thorough clean including windows and sanitization',
    estimatedTime: '90 min',
    icon: 'Sparkles',
  },
  {
    id: 'turndown',
    label: 'Turndown Service',
    description: 'Evening bed turn-down and ambient setup',
    estimatedTime: '15 min',
    icon: 'Moon',
  },
  {
    id: 'extra-towels',
    label: 'Extra Towels',
    description: 'Additional bath and hand towels delivered to your room',
    estimatedTime: '10 min',
    icon: 'Droplets',
  },
  {
    id: 'extra-pillows',
    label: 'Extra Pillows',
    description: 'Additional pillows delivered to your room',
    estimatedTime: '10 min',
    icon: 'Bed',
  },
  {
    id: 'extra-toiletries',
    label: 'Extra Toiletries',
    description: 'Refill of toiletries and amenities',
    estimatedTime: '10 min',
    icon: 'Droplets',
  },
];

const timeSlots = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export default function HousekeepingPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading } = useStayDetails();
  const serviceRequest = useServiceRequest();

  const [dndEnabled, setDndEnabled] = useState(false);
  const [cleaningSchedule, setCleaningSchedule] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionRequests, setSessionRequests] = useState([]);

  const submit = async (message, requestedAt) => {
    const result = await serviceRequest.mutateAsync({
      type: 'housekeeping',
      message,
      requestedAt,
    });
    setSessionRequests((prev) => [
      {
        id: result.id,
        description: message,
        status: 'pending',
        createdAt: result.createdAt,
      },
      ...prev,
    ]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleSubmitRequest = async () => {
    if (!selectedService) return;
    try {
      await submit(`Housekeeping: ${selectedService.label} — ${selectedService.description}`);
      setSelectedService(null);
    } catch {
      /* error surfaces via serviceRequest.isError */
    }
  };

  const handleScheduleCleaning = async (slot) => {
    setCleaningSchedule(slot);
    setScheduleModal(false);
    try {
      await submit(`Housekeeping: scheduled cleaning during ${slot}`);
    } catch {
      /* keep the local selection even if the request fails */
    }
  };

  const toggleDnd = async () => {
    const next = !dndEnabled;
    setDndEnabled(next);
    try {
      await submit(next ? 'Do Not Disturb: please skip my room today' : 'Do Not Disturb: off');
    } catch {
      setDndEnabled(!next);
    }
  };

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    );
  }

  const roomLabel = stay?.roomNumber ? `Room ${stay.roomNumber}` : 'Your room';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Housekeeping</h1>
          <p className="text-xs text-text-muted">
            {roomLabel} · Request services or schedule cleaning
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {submitted && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">Request Submitted!</p>
            <p className="text-xs text-text-secondary">
              Our team will attend to your request shortly.
            </p>
          </div>
        </div>
      )}
      {serviceRequest.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-danger">
            {serviceRequest.error?.message ?? 'Could not submit your request. Please try again.'}
          </p>
        </div>
      )}

      {/* Do Not Disturb Toggle */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                dndEnabled ? 'bg-danger/10' : 'bg-accent/10'
              )}
            >
              {dndEnabled ? (
                <EyeOff className="h-5 w-5 text-danger" />
              ) : (
                <Eye className="h-5 w-5 text-accent" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Do Not Disturb</p>
              <p className="text-xs text-text-muted">
                {dndEnabled
                  ? 'Housekeeping will skip your room today'
                  : 'Your room is available for service'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDnd}
            disabled={serviceRequest.isPending}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              dndEnabled ? 'bg-danger' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                dndEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Schedule Cleaning */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Schedule Cleaning</p>
              <p className="text-xs text-text-muted">
                {cleaningSchedule
                  ? `Scheduled for ${cleaningSchedule}`
                  : 'Select a preferred time slot'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScheduleModal(!scheduleModal)}
            disabled={serviceRequest.isPending}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors"
          >
            {cleaningSchedule ? 'Change' : 'Schedule'}
          </button>
        </div>

        {scheduleModal && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleScheduleCleaning(slot)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  cleaningSchedule === slot
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Service Request Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedService(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                <Sparkles className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selectedService.label}</h3>
                <p className="text-xs text-text-muted">
                  Estimated time: {selectedService.estimatedTime}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Request {selectedService.description.toLowerCase()} for {roomLabel}.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/20 p-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-text-secondary">
                Please ensure you are not in the room or have secured valuables if requesting full
                cleaning.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedService(null)}
                className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={serviceRequest.isPending}
                className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {serviceRequest.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Confirm Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Request a Service</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <HousekeepingServiceCard
              key={service.id}
              service={service}
              isDnd={dndEnabled}
              onRequest={setSelectedService}
            />
          ))}
        </div>
      </div>

      {/* Active Requests */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Requests</h2>
        {sessionRequests.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-border bg-surface">
            <Sparkles className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No requests yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Select a service above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessionRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{req.description}</p>
                    <p className="text-xs text-text-muted">Requested {timeAgo(req.createdAt)}</p>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize bg-warning/10 text-warning">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
