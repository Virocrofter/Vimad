/* src/app/guest-portal/keys/page.jsx */
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  useStayDetails,
  useDigitalKey,
  useServiceRequest,
  getGuestToken,
} from '../../../hooks/useGuestPortalData';
import { formatDateTime } from '../../../lib/guest-utils';

export default function KeysPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading: stayLoading } = useStayDetails();
  const {
    data: keyData,
    isLoading: keyLoading,
    isError: keyError,
    refetch,
    isFetching,
  } = useDigitalKey();
  const serviceRequest = useServiceRequest();

  if (!hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Please verify your reservation first</p>
        <button
          onClick={() => navigate('/guest-portal/auth/login')}
          className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
        >
          Verify Reservation
        </button>
      </div>
    );
  }

  if (stayLoading || keyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your digital key…</p>
      </div>
    );
  }

  const now = new Date();
  const activeFrom = keyData ? new Date(keyData.activeFrom) : null;
  const activeUntil = keyData ? new Date(keyData.activeUntil) : null;
  const isActive = Boolean(keyData) && activeFrom <= now && activeUntil > now;
  const isScheduled = Boolean(keyData) && activeFrom > now;

  const handleRequestPhysicalKey = () => {
    serviceRequest.mutate({
      type: 'amenity',
      message: 'Guest requested a physical key card for their room.',
    });
  };

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
          <h1 className="text-xl font-bold text-text-primary">Digital Key</h1>
          <p className="text-xs text-text-muted">
            {stay ? `Room ${stay.roomNumber}` : 'Your room key'}
          </p>
        </div>
      </div>

      {/* No key issued / not ready */}
      {(keyError || !keyData) && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto" />
          <p className="text-sm font-semibold text-warning">No digital key yet</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {stay?.digitalKeyReady
              ? 'Your key is ready but could not be loaded. Try refreshing, or contact the front desk.'
              : 'Your digital key activates on arrival day after check-in. Complete pre-check-in to speed things up.'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated"
            >
              Refresh
            </button>
            {!stay?.checkedIn && (
              <button
                onClick={() => navigate('/guest-portal/check-in')}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-white hover:bg-secondary/90"
              >
                Start Check-In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Key Status Banner */}
      {keyData && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            isActive ? 'border-accent/20 bg-accent/5' : 'border-info/20 bg-info/5'
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isActive ? 'bg-accent/10' : 'bg-info/10'
            )}
          >
            {isActive ? (
              <Shield className="h-5 w-5 text-accent" />
            ) : (
              <Clock className="h-5 w-5 text-info" />
            )}
          </div>
          <div>
            <p className={cn('text-sm font-semibold', isActive ? 'text-accent' : 'text-info')}>
              {isActive ? 'Key Active' : isScheduled ? 'Key Scheduled' : 'Key Expired'}
            </p>
            <p className="text-xs text-text-secondary">
              {isActive
                ? `Valid until ${formatDateTime(keyData.activeUntil)}`
                : isScheduled
                  ? `Activates ${formatDateTime(keyData.activeFrom)}`
                  : 'Contact the front desk for assistance'}
            </p>
          </div>
        </div>
      )}

      {/* Key Code Card */}
      {keyData && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider">Room</p>
              <p className="text-4xl font-bold text-text-primary">{stay?.roomNumber ?? '—'}</p>
            </div>

            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border border-border bg-background">
              <div className="text-center px-4">
                <QrCode className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="font-mono text-lg font-bold tracking-widest text-text-primary break-all">
                  {keyData.keyCode}
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  Show this code at the door reader or front desk
                </p>
              </div>
            </div>

            <p className={cn('text-sm font-medium', isActive ? 'text-accent' : 'text-text-muted')}>
              {isActive ? 'Ready to use' : 'Not active yet'}
            </p>
          </div>
        </div>
      )}

      {/* Key Details */}
      {keyData && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Key Details</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Active from</span>
              <span className="text-text-primary">{formatDateTime(keyData.activeFrom)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Active until</span>
              <span className="text-text-primary">{formatDateTime(keyData.activeUntil)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Status</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  isActive ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
                )}
              >
                {isActive ? 'Active' : isScheduled ? 'Scheduled' : 'Expired'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Need Help?</h2>
        <div className="space-y-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full flex items-center justify-between rounded-lg bg-background p-3 text-left hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className={cn('h-4 w-4 text-text-muted', isFetching && 'animate-spin')} />
              <span className="text-sm text-text-primary">Refresh Key</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={handleRequestPhysicalKey}
            disabled={serviceRequest.isPending || serviceRequest.isSuccess}
            className="w-full flex items-center justify-between rounded-lg bg-background p-3 text-left hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {serviceRequest.isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-accent" />
              ) : (
                <KeyRound className="h-4 w-4 text-text-muted" />
              )}
              <span className="text-sm text-text-primary">
                {serviceRequest.isPending
                  ? 'Requesting…'
                  : serviceRequest.isSuccess
                    ? 'Physical key requested — front desk notified'
                    : 'Request Physical Key'}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/guest-portal/stay/issues')}
            className="w-full flex items-center justify-between rounded-lg bg-background p-3 text-left hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-primary">Report Key Issue</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}
