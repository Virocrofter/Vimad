/* src/app/guest-portal/check-in/page.jsx */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, User, CreditCard, Car,
  Clock, ShieldCheck, Loader2, AlertTriangle, Info, Upload,
  Camera, Smartphone, KeyRound, Bed, MapPin, Calendar, Phone,
  Mail, FileCheck, QrCode, Wifi, ParkingCircle, Utensils, Sparkles,
  Check, X, Star, Heart, ThumbsUp, ThumbsDown, ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { guestStays, formatDate, formatCurrency, getStayPhase, canCheckIn } from '../data';
import { StepIndicator, FileUploadZone } from '../components';

export default function GuestCheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stayId = searchParams.get('stay');
  
  const stay = guestStays.find(s => s.id === stayId);
  
  const [step, setStep] = useState(0); // 0: intro, 1: id, 2: vehicle, 3: preferences, 4: payment, 5: review, 6: complete
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [idUploaded, setIdUploaded] = useState(false);
  const [idPreview, setIdPreview] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState({ plate: '', make: '', model: '', color: '' });
  const [hasVehicle, setHasVehicle] = useState(false);
  const [preferences, setPreferences] = useState({
    earlyCheckIn: false,
    lateCheckOut: false,
    roomLocation: 'high-floor',
    pillowType: 'firm',
    temperature: 68,
    dietary: [],
    accessibility: [],
    specialRequests: '',
  });
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [digitalKey, setDigitalKey] = useState(false);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Kosher', 'Halal'];
  const accessibilityOptions = ['Wheelchair accessible', 'Hearing loop', 'Visual assistance', 'Service animal'];

  useEffect(() => {
    if (stay && !canCheckIn(stay)) {
      // Can't check in yet, show message
    }
  }, [stay]);

  if (!stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Reservation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/guest-portal/booking')}>
          Back to Reservations
        </Button>
      </div>
    );
  }

  const canProceed = () => {
    switch (step) {
      case 1: return idUploaded;
      case 2: return !hasVehicle || (vehicleInfo.plate && vehicleInfo.make);
      case 3: return true;
      case 4: return paymentVerified && termsAccepted;
      case 5: return true;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step === 5) {
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 2000));
      setIsSubmitting(false);
      setStep(6);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      navigate('/guest-portal/booking');
    } else {
      setStep(step - 1);
    }
  };

  const steps = [
    'Welcome',
    'ID Verification',
    'Vehicle Info',
    'Preferences',
    'Payment',
    'Review',
    'Complete',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Pre-Check-In</h1>
          <p className="text-xs text-text-muted">{stay.confirmationNumber} · {stay.property.name}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        steps={steps.slice(1, 6)}
        currentStep={Math.max(0, step - 1)}
      />

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="h-32 bg-background relative">
              <img
                src={stay.property.images[0]}
                alt={stay.property.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h2 className="text-white font-semibold text-lg">{stay.property.name}</h2>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {stay.property.address.city}, {stay.property.address.state}
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{stay.room.type}</p>
                  <p className="text-xs text-text-muted">{stay.dates.nights} nights</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-primary">{formatCurrency(stay.rate.total)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  <span>{formatDate(stay.dates.arrival)} – {formatDate(stay.dates.departure)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  <span>{stay.dates.arrivalTime} check-in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">What to expect</h3>
            <div className="space-y-3">
              {[
                { icon: ShieldCheck, title: 'ID Verification', desc: 'Upload a photo of your ID for a contactless check-in' },
                { icon: Car, title: 'Vehicle Information', desc: 'Add your vehicle details for parking' },
                { icon: Bed, title: 'Room Preferences', desc: 'Set your preferences for a personalized stay' },
                { icon: CreditCard, title: 'Payment Verification', desc: 'Confirm your payment method on file' },
                { icon: KeyRound, title: 'Digital Key', desc: 'Activate your mobile room key' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                    <item.icon className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              This pre-check-in process takes about 3 minutes. Your digital key will be activated on arrival day.
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={() => setStep(1)}>
            Start Pre-Check-In
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1: ID Verification */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">ID Verification</h3>
            <p className="text-xs text-text-muted mb-4">
              Upload a clear photo of your government-issued ID (passport, driver's license, or national ID). This is required for contactless check-in.
            </p>
            
            {!idUploaded ? (
              <FileUploadZone
                onUpload={(files) => {
                  if (files.length > 0) {
                    setIdPreview(URL.createObjectURL(files[0]));
                    setIdUploaded(true);
                  }
                }}
                accept="image/*"
                maxSize={5}
              />
            ) : (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-16 w-24 rounded-lg bg-background overflow-hidden">
                    {idPreview && <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent">ID Uploaded</p>
                    <p className="text-xs text-text-muted">Verification pending</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-accent ml-auto" />
                </div>
                <button
                  onClick={() => { setIdUploaded(false); setIdPreview(null); }}
                  className="text-xs text-secondary hover:underline"
                >
                  Upload different ID
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-3 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Your ID is encrypted and stored securely. It will only be used for identity verification and will be deleted after your stay.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button className="flex-1" disabled={!canProceed()} onClick={handleNext}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Info */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Vehicle Information</h3>
            <p className="text-xs text-text-muted mb-4">
              Add your vehicle details to reserve parking and streamline your arrival.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setHasVehicle(false)}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-center transition-all',
                  !hasVehicle ? 'border-secondary bg-secondary/5' : 'border-border bg-background'
                )}
              >
                <p className={cn('text-sm font-medium', !hasVehicle ? 'text-secondary' : 'text-text-primary')}>No Vehicle</p>
              </button>
              <button
                onClick={() => setHasVehicle(true)}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-center transition-all',
                  hasVehicle ? 'border-secondary bg-secondary/5' : 'border-border bg-background'
                )}
              >
                <p className={cn('text-sm font-medium', hasVehicle ? 'text-secondary' : 'text-text-primary')}>I have a vehicle</p>
              </button>
            </div>

            {hasVehicle && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">License Plate</label>
                  <input
                    type="text"
                    value={vehicleInfo.plate}
                    onChange={(e) => setVehicleInfo(p => ({ ...p, plate: e.target.value }))}
                    placeholder="ABC-1234"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Make</label>
                    <input
                      type="text"
                      value={vehicleInfo.make}
                      onChange={(e) => setVehicleInfo(p => ({ ...p, make: e.target.value }))}
                      placeholder="e.g. Toyota"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Model</label>
                    <input
                      type="text"
                      value={vehicleInfo.model}
                      onChange={(e) => setVehicleInfo(p => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. Camry"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Color</label>
                  <input
                    type="text"
                    value={vehicleInfo.color}
                    onChange={(e) => setVehicleInfo(p => ({ ...p, color: e.target.value }))}
                    placeholder="e.g. Silver"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button className="flex-1" disabled={!canProceed()} onClick={handleNext}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Room Preferences</h3>
            <p className="text-xs text-text-muted mb-4">
              Let us know your preferences to make your stay as comfortable as possible.
            </p>

            <div className="space-y-4">
              {/* Room Location */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Room Location</label>
                <div className="grid grid-cols-2 gap-2">
                  {['high-floor', 'low-floor', 'near-elevator', 'quiet-area'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setPreferences(p => ({ ...p, roomLocation: loc }))}
                      className={cn(
                        'rounded-lg border p-2.5 text-center text-xs font-medium transition-all',
                        preferences.roomLocation === loc
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {loc.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pillow Type */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Pillow Preference</label>
                <div className="flex gap-2">
                  {['firm', 'soft', 'feather', 'foam'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setPreferences(p => ({ ...p, pillowType: type }))}
                      className={cn(
                        'flex-1 rounded-lg border p-2.5 text-center text-xs font-medium transition-all capitalize',
                        preferences.pillowType === type
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
                  Preferred Temperature: {preferences.temperature}°F
                </label>
                <input
                  type="range"
                  min="60"
                  max="80"
                  value={preferences.temperature}
                  onChange={(e) => setPreferences(p => ({ ...p, temperature: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-lg bg-border appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>60°F</span>
                  <span>70°F</span>
                  <span>80°F</span>
                </div>
              </div>

              {/* Dietary */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Dietary Requirements</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((diet) => (
                    <button
                      key={diet}
                      onClick={() => setPreferences(p => ({
                        ...p,
                        dietary: p.dietary.includes(diet)
                          ? p.dietary.filter(d => d !== diet)
                          : [...p.dietary, diet]
                      }))}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        preferences.dietary.includes(diet)
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessibility */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Accessibility Needs</label>
                <div className="flex flex-wrap gap-2">
                  {accessibilityOptions.map((acc) => (
                    <button
                      key={acc}
                      onClick={() => setPreferences(p => ({
                        ...p,
                        accessibility: p.accessibility.includes(acc)
                          ? p.accessibility.filter(a => a !== acc)
                          : [...p.accessibility, acc]
                      }))}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        preferences.accessibility.includes(acc)
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Special Requests</label>
                <textarea
                  value={preferences.specialRequests}
                  onChange={(e) => setPreferences(p => ({ ...p, specialRequests: e.target.value }))}
                  rows={3}
                  placeholder="Any special requests for your stay..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleNext}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Payment Verification</h3>
            <p className="text-xs text-text-muted mb-4">
              Confirm your payment method on file. No additional charges will be made at this time.
            </p>

            <div className="rounded-lg border border-border bg-background p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <CreditCard className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">Visa ending in 4242</p>
                  <p className="text-xs text-text-muted">Expires 12/27</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="payment-verify"
                  checked={paymentVerified}
                  onChange={(e) => setPaymentVerified(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-secondary"
                />
                <label htmlFor="payment-verify" className="text-sm text-text-secondary">
                  I confirm this payment method is correct
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-secondary"
                />
                <label htmlFor="terms" className="text-sm text-text-secondary">
                  I agree to the <a href="#" className="text-secondary hover:underline">Terms & Conditions</a> and <a href="#" className="text-secondary hover:underline">Privacy Policy</a>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              A pre-authorization hold may be placed on your card. The full amount will be charged at check-out.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button className="flex-1" disabled={!canProceed()} onClick={handleNext}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Review Your Check-In</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">ID Verification</span>
                <span className="text-accent flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Complete
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Vehicle</span>
                <span className={hasVehicle ? 'text-accent' : 'text-text-muted'}>
                  {hasVehicle ? `${vehicleInfo.plate} (${vehicleInfo.make})` : 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Room Location</span>
                <span className="text-text-primary">{preferences.roomLocation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Pillow</span>
                <span className="text-text-primary capitalize">{preferences.pillowType}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Temperature</span>
                <span className="text-text-primary">{preferences.temperature}°F</span>
              </div>
              {preferences.dietary.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-secondary">Dietary</span>
                  <span className="text-text-primary">{preferences.dietary.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Payment</span>
                <span className="text-accent flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="digital-key"
              checked={digitalKey}
              onChange={(e) => setDigitalKey(e.target.checked)}
              className="h-4 w-4 rounded border-border text-secondary"
            />
            <label htmlFor="digital-key" className="text-sm text-text-secondary">
              Activate digital key on arrival day
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Check-In
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: Complete */}
      {step === 6 && (
        <div className="text-center py-8 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 mb-4">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Pre-Check-In Complete!</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            You're all set for your stay at {stay.property.name}. Your digital key will be activated on {formatDate(stay.dates.arrival)}.
          </p>

          <div className="rounded-xl border border-border bg-surface p-4 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <QrCode className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Digital Key</p>
                <p className="text-xs text-text-muted">{digitalKey ? 'Will activate on arrival' : 'Not requested'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Check-in Time</p>
                <p className="text-xs text-text-muted">{stay.dates.arrivalTime} on {formatDate(stay.dates.arrival)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            <Button onClick={() => navigate('/guest-portal')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/guest-portal/keys')}>
              <KeyRound className="mr-2 h-4 w-4" />
              View Digital Key
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
