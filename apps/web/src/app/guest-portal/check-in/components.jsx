/* src/app/guest-portal/check-in/components.jsx */
import { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
  AlertTriangle,
  Scan,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Crop,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

/* ─── ID Upload Component ─── */
export function IDUpload({ onUpload, onVerify, verified = false, uploading = false }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onUpload?.(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleRetake = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (verified) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-accent">ID Verified</p>
            <p className="text-xs text-text-muted">Your identity has been confirmed</p>
          </div>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="relative aspect-[3/2] bg-background">
            <img src={preview} alt="ID Preview" className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleRetake}
                className="h-8 w-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">Preview</span>
            <button
              onClick={handleRetake}
              className="text-xs text-danger hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>

        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
            <span className="text-sm text-text-secondary">Verifying ID...</span>
          </div>
        ) : (
          <button
            onClick={onVerify}
            className="w-full rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
          >
            Verify ID
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-secondary bg-secondary/5'
            : 'border-border bg-background hover:bg-surface-elevated'
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 mb-3">
          <Upload className="h-6 w-6 text-secondary" />
        </div>
        <p className="text-sm font-medium text-text-primary">Upload ID Photo</p>
        <p className="text-xs text-text-muted mt-1">Drag & drop or click to browse</p>
        <p className="text-[10px] text-text-muted mt-1">JPG, PNG · Max 5MB</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors flex items-center justify-center gap-2"
      >
        <Camera className="h-4 w-4" />
        Take Photo
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-text-primary">Secure Upload</p>
            <p className="text-[10px] text-text-muted">
              Your ID is encrypted and stored securely. It will be deleted after your stay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Vehicle Form ─── */
export function VehicleForm({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">
          License Plate
        </label>
        <input
          type="text"
          value={value.plate || ''}
          onChange={(e) => onChange?.({ ...value, plate: e.target.value })}
          placeholder="ABC-1234"
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">
            Make
          </label>
          <input
            type="text"
            value={value.make || ''}
            onChange={(e) => onChange?.({ ...value, make: e.target.value })}
            placeholder="e.g. Toyota"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">
            Model
          </label>
          <input
            type="text"
            value={value.model || ''}
            onChange={(e) => onChange?.({ ...value, model: e.target.value })}
            placeholder="e.g. Camry"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Color</label>
        <input
          type="text"
          value={value.color || ''}
          onChange={(e) => onChange?.({ ...value, color: e.target.value })}
          placeholder="e.g. Silver"
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

/* ─── Preference Toggle ─── */
export function PreferenceToggle({ label, description, checked, onChange, icon: Icon }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 cursor-pointer hover:bg-surface-elevated transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
        <Icon className="h-5 w-5 text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-colors',
            checked ? 'bg-secondary' : 'bg-border'
          )}
        />
      </div>
    </label>
  );
}

/* ─── Check-In Progress Bar ─── */
export function CheckInProgress({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
              idx < currentStep
                ? 'bg-accent text-white'
                : idx === currentStep
                  ? 'bg-secondary text-white'
                  : 'bg-border text-text-muted'
            )}
          >
            {idx < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
          </div>
          <span
            className={cn(
              'text-[10px] font-medium hidden sm:inline',
              idx <= currentStep ? 'text-text-primary' : 'text-text-muted'
            )}
          >
            {step}
          </span>
          {idx < steps.length - 1 && (
            <div className={cn('h-px w-3', idx < currentStep ? 'bg-accent' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Verification Badge ─── */
export function VerificationBadge({ status, text }) {
  const configs = {
    verified: {
      icon: ShieldCheck,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
    },
    pending: { icon: Loader2, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
    failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.color,
        config.border
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'pending' && 'animate-spin')} />
      {text || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
