/* src/app/guest-portal/stay/housekeeping/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bed,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Send,
  Calendar,
  Loader2,
  Droplets,
  Shirt,
  Moon,
  Star,
  Wrench,
  MessageSquare,
  ChevronRight,
  EyeOff,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useGuestStore } from '../../store';
import { guestStays, housekeepingServices, timeAgo } from '../../data';
import { HousekeepingServiceCard } from './components';

export default function HousekeepingPage() {
  const navigate = useNavigate();
  const stay = guestStays[0];
  const { dndEnabled, toggleDnd, addRequest, requests, cleaningSchedule, setCleaningSchedule } =
    useGuestStore();
  const [selectedService, setSelectedService] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
  ];

  const handleRequest = (service) => {
    if (dndEnabled) return;
    setSelectedService(service);
  };

  const handleSubmitRequest = () => {
    if (!selectedService) return;
    setLoading(true);
    setTimeout(() => {
      const newRequest = {
        id: `REQ-${Date.now().toString(36).toUpperCase()}`,
        type: selectedService.type,
        description: selectedService.label,
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedTime: selectedService.estimatedTime,
      };
      addRequest(newRequest);
      setLoading(false);
      setSubmitted(true);
      setSelectedService(null);
      setTimeout(() => setSubmitted(false), 4000);
    }, 800);
  };

  const handleScheduleCleaning = (slot) => {
    setCleaningSchedule(slot);
    setScheduleModal(false);
  };

  const allRequests = [...stay.requests, ...requests];

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
            Room 204 · Request services or schedule cleaning
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
              Request {selectedService.description.toLowerCase()} for Room 204.
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
                disabled={loading}
                className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
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
          {housekeepingServices.map((service) => (
            <HousekeepingServiceCard
              key={service.id}
              service={service}
              isDnd={dndEnabled}
              onRequest={handleRequest}
            />
          ))}
        </div>
      </div>

      {/* Active Requests */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Requests</h2>
        {allRequests.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-border bg-surface">
            <Sparkles className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No requests yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Select a service above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allRequests.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border border-border bg-surface p-4',
                  req.status === 'completed' && 'opacity-70'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      req.status === 'completed'
                        ? 'bg-accent/10'
                        : req.status === 'in-progress'
                          ? 'bg-info/10'
                          : 'bg-warning/10'
                    )}
                  >
                    {req.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : req.status === 'in-progress' ? (
                      <Loader2 className="h-4 w-4 text-info animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {req.description || req.type}
                    </p>
                    <p className="text-xs text-text-muted">
                      {req.status === 'completed' && req.completedAt
                        ? `Completed ${timeAgo(req.completedAt)}`
                        : `Requested ${timeAgo(req.createdAt)}`}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize',
                    req.status === 'completed'
                      ? 'bg-accent/10 text-accent'
                      : req.status === 'in-progress'
                        ? 'bg-info/10 text-info'
                        : 'bg-warning/10 text-warning'
                  )}
                >
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
