/* src/app/guest-portal/keys/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Lock,
  Unlock,
  Smartphone,
  Battery,
  BatteryCharging,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Bluetooth,
  Wifi,
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Nfc,
  CircleDot,
  Eye,
  EyeOff,
  History,
  Calendar,
  ArrowUpRight,
  Zap,
  Power,
  PowerOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { guestStays, timeAgo } from '../data';

export default function KeysPage() {
  const navigate = useNavigate();
  const stay = guestStays[0];
  const keyData = stay.digitalKey;
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showAccessLog, setShowAccessLog] = useState(false);

  const handleUnlock = () => {
    setUnlocking(true);
    setTimeout(() => {
      setUnlocking(false);
      setUnlocked(true);
      setTimeout(() => setUnlocked(false), 3000);
    }, 1500);
  };

  const expiresIn = keyData?.expiresAt
    ? Math.max(0, Math.floor((new Date(keyData.expiresAt) - new Date()) / (1000 * 60 * 60)))
    : 0;

  const isActive = keyData?.status === 'active';

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
          <p className="text-xs text-text-muted">Room 204 · {stay.property.name}</p>
        </div>
      </div>

      {/* Key Status Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-3',
          isActive ? 'border-accent/20 bg-accent/5' : 'border-warning/20 bg-warning/5'
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isActive ? 'bg-accent/10' : 'bg-warning/10'
          )}
        >
          {isActive ? (
            <Shield className="h-5 w-5 text-accent" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
        </div>
        <div>
          <p className={cn('text-sm font-semibold', isActive ? 'text-accent' : 'text-warning')}>
            {isActive ? 'Key Active' : 'Key Inactive'}
          </p>
          <p className="text-xs text-text-secondary">
            {isActive
              ? `Expires in ${expiresIn} hours · ${keyData.type} key`
              : 'Contact front desk for assistance'}
          </p>
        </div>
      </div>

      {/* Unlock Button */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="text-center space-y-4">
          {/* Room Info */}
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Room</p>
            <p className="text-4xl font-bold text-text-primary">204</p>
            <p className="text-sm text-text-secondary">{stay.room.type}</p>
          </div>

          {/* Unlock Button */}
          <button
            onClick={handleUnlock}
            disabled={!isActive || unlocking}
            className={cn(
              'relative mx-auto flex h-40 w-40 items-center justify-center rounded-full transition-all active:scale-95',
              unlocked
                ? 'bg-accent shadow-lg shadow-accent/30'
                : isActive
                  ? 'bg-secondary shadow-lg shadow-secondary/30 hover:bg-secondary/90'
                  : 'bg-border cursor-not-allowed'
            )}
          >
            {unlocking ? (
              <RefreshCw className="h-12 w-12 text-white animate-spin" />
            ) : unlocked ? (
              <Unlock className="h-12 w-12 text-white" />
            ) : (
              <Lock className="h-12 w-12 text-white" />
            )}
          </button>

          <p
            className={cn(
              'text-sm font-medium',
              unlocked ? 'text-accent' : isActive ? 'text-secondary' : 'text-text-muted'
            )}
          >
            {unlocking
              ? 'Unlocking...'
              : unlocked
                ? 'Door Unlocked!'
                : isActive
                  ? 'Tap to Unlock'
                  : 'Key Not Active'}
          </p>

          {/* Key Details */}
          <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              {keyData.type}
            </span>
            <span className="flex items-center gap-1">
              <Battery className="h-3 w-3" />
              85%
            </span>
            <span className="flex items-center gap-1">
              <SignalHigh className="h-3 w-3" />
              Strong
            </span>
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Key Details</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Key ID</span>
            <span className="text-text-primary font-mono text-xs">{keyData.id}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Type</span>
            <span className="text-text-primary capitalize">{keyData.type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Issued</span>
            <span className="text-text-primary">{new Date(keyData.issuedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Expires</span>
            <span className="text-text-primary">
              {new Date(keyData.expiresAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Status</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                isActive ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
              )}
            >
              {keyData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Access Log */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Access Log</h2>
          <button
            onClick={() => setShowAccessLog(!showAccessLog)}
            className="text-xs text-secondary hover:underline"
          >
            {showAccessLog ? 'Hide' : 'Show All'}
          </button>
        </div>
        <div className="space-y-2">
          {keyData.accessLog.slice(showAccessLog ? 0 : -3).map((log, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-background p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                <Unlock className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{log.location}</p>
                <p className="text-xs text-text-muted">{log.action}</p>
              </div>
              <span className="text-xs text-text-muted">
                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Need Help?</h2>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between rounded-lg bg-background p-3 text-left hover:bg-surface-elevated transition-colors">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-primary">Refresh Key</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button className="w-full flex items-center justify-between rounded-lg bg-background p-3 text-left hover:bg-surface-elevated transition-colors">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-primary">Request Physical Key</span>
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
