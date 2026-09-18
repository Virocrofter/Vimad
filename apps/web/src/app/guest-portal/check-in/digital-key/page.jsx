/* src/app/guest-portal/check-in/digital-key/page.jsx */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  QrCode,
  Wifi,
  Bluetooth,
  Battery,
  ShieldCheck,
  Info,
  ChevronRight,
  RotateCcw,
  Lock,
  Unlock,
  DoorOpen,
  MapPin,
  Clock,
  Calendar,
  Bell,
  BellOff,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestStays, formatDate } from '../../data';
import { DigitalKeyWidget } from '../../components';

export default function GuestDigitalKeySetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stayId = searchParams.get('stay');

  const stay = guestStays.find((s) => s.id === stayId);

  const [step, setStep] = useState(1); // 1: setup, 2: activating, 3: active, 4: error
  const [progress, setProgress] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [deviceBound, setDeviceBound] = useState(false);

  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep(3);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);

  if (!stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Reservation not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/guest-portal/booking')}
        >
          Back to Reservations
        </Button>
      </div>
    );
  }

  const handleActivate = () => {
    setStep(2);
    setProgress(0);
  };

  const handleRetry = () => {
    setStep(1);
    setProgress(0);
  };

  const keyData = {
    id: 'DK-2026-001',
    status: step === 3 ? 'active' : 'pending',
    type: 'mobile',
    roomNumber: stay.room.number || '204',
    issuedAt: new Date().toISOString(),
    expiresAt: stay.dates.departure + 'T' + stay.dates.departureTime + ':00Z',
    accessLog: stay.digitalKey?.accessLog || [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/check-in')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Digital Key Setup</h1>
          <p className="text-xs text-text-muted">
            {stay.property.name} · Room {stay.room.number || 'TBD'}
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Key Preview Card */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 mb-4">
                <KeyRound className="h-10 w-10 text-secondary" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Mobile Key</h2>
              <p className="text-xs text-text-muted mt-1">
                Room {stay.room.number || '204'} · {stay.property.name}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Valid {formatDate(stay.dates.arrival)} – {formatDate(stay.dates.departure)}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-text-muted" />
                  Device
                </span>
                <span className="text-text-primary font-medium">This device</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-text-muted" />
                  Bluetooth Required
                </span>
                <span className="text-accent flex items-center gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-2">
                  <Battery className="h-4 w-4 text-text-muted" />
                  Battery Level
                </span>
                <span className="text-text-primary font-medium">85%</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Key Settings</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Unlock Notifications</span>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 rounded-full transition-colors',
                    notifications ? 'bg-secondary' : 'bg-border'
                  )}
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Biometric Unlock</span>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors">
                <input
                  type="checkbox"
                  checked={biometric}
                  onChange={(e) => setBiometric(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                    biometric ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 rounded-full transition-colors',
                    biometric ? 'bg-secondary' : 'bg-border'
                  )}
                />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Device Binding</span>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors">
                <input
                  type="checkbox"
                  checked={deviceBound}
                  onChange={(e) => setDeviceBound(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                    deviceBound ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 rounded-full transition-colors',
                    deviceBound ? 'bg-secondary' : 'bg-border'
                  )}
                />
              </div>
            </label>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <div className="text-xs text-text-secondary space-y-1">
              <p>
                Your digital key is encrypted and tied to this device. Keep Bluetooth and location
                services enabled for the best experience.
              </p>
              <p>If you lose your device, contact the front desk immediately to revoke the key.</p>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={handleActivate}>
            <KeyRound className="mr-2 h-4 w-4" />
            Activate Digital Key
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="text-center py-12 space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary/10">
            <Loader2 className="h-12 w-12 text-secondary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Activating Your Key...</h3>
            <p className="text-sm text-text-muted mt-1">Please keep your device nearby</p>
          </div>

          <div className="max-w-xs mx-auto">
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">{progress}%</p>
          </div>

          <div className="space-y-2 text-xs text-text-muted">
            <p className={progress > 20 ? 'text-accent' : ''}>✓ Connecting to hotel system</p>
            <p className={progress > 40 ? 'text-accent' : ''}>✓ Generating secure key</p>
            <p className={progress > 60 ? 'text-accent' : ''}>✓ Binding to device</p>
            <p className={progress > 80 ? 'text-accent' : ''}>✓ Configuring access permissions</p>
            <p className={progress > 95 ? 'text-accent' : ''}>✓ Finalizing setup</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 mb-4">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Digital Key Active!</h3>
            <p className="text-sm text-text-muted mt-1">
              Your key is ready to use. Tap the button below to unlock your door.
            </p>
          </div>

          <DigitalKeyWidget
            keyData={keyData}
            onUnlock={() => {
              // Simulate unlock
              alert('Door unlocked!');
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate('/guest-portal/keys')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Key Details
            </Button>
            <Button variant="outline" onClick={() => navigate('/guest-portal')}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
