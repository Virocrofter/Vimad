/* src/app/guest-portal/profile/preferences/page.jsx */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  BedDouble,
  UtensilsCrossed,
  Globe,
  Bell,
  Save,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  useGuestPreferences,
  useUpdatePreferences,
  getGuestToken,
} from '../../../../hooks/useGuestPortalData';

const roomTypeOptions = [
  { value: 'no_preference', label: 'No preference' },
  { value: 'high_floor', label: 'High floor' },
  { value: 'low_floor', label: 'Low floor' },
  { value: 'quiet_area', label: 'Quiet area' },
  { value: 'near_elevator', label: 'Near elevator' },
];

const bedTypeOptions = [
  { value: 'no_preference', label: 'No preference' },
  { value: 'king', label: 'King' },
  { value: 'twin', label: 'Twin' },
  { value: 'queen', label: 'Queen' },
];

const pillowOptions = [
  { value: 'no_preference', label: 'No preference' },
  { value: 'firm', label: 'Firm' },
  { value: 'soft', label: 'Soft' },
  { value: 'hypoallergenic', label: 'Hypoallergenic' },
];

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'nut_allergy', label: 'Nut allergy' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zu', label: 'isiZulu' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
];

function SelectPref({ label, prefKey, value, onChange, options, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" />}
        <p className="text-xs font-medium text-text-secondary">{label}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(prefKey, e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PreferencesPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: prefsData, isLoading } = useGuestPreferences();
  const updatePreferences = useUpdatePreferences();

  const [prefs, setPrefs] = useState({
    roomType: 'no_preference',
    bedType: 'no_preference',
    pillowType: 'no_preference',
    language: 'en',
    dietary: [],
    marketingEmails: 'true',
    stayReminders: 'true',
  });
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefsData?.preferences && !initialized) {
      const p = prefsData.preferences;
      setPrefs((prev) => ({
        ...prev,
        roomType: p.roomType ?? prev.roomType,
        bedType: p.bedType ?? prev.bedType,
        pillowType: p.pillowType ?? prev.pillowType,
        language: p.language ?? prev.language,
        dietary: p.dietary ? p.dietary.split(',').filter(Boolean) : [],
        marketingEmails: p.marketingEmails ?? prev.marketingEmails,
        stayReminders: p.stayReminders ?? prev.stayReminders,
      }));
      setInitialized(true);
    }
  }, [prefsData, initialized]);

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  const setPref = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const toggleDietary = (value) => {
    setPrefs((p) => ({
      ...p,
      dietary: p.dietary.includes(value)
        ? p.dietary.filter((v) => v !== value)
        : [...p.dietary, value],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        roomType: prefs.roomType,
        bedType: prefs.bedType,
        pillowType: prefs.pillowType,
        language: prefs.language,
        dietary: prefs.dietary.join(','),
        marketingEmails: String(prefs.marketingEmails),
        stayReminders: String(prefs.stayReminders),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      /* error surfaces via updatePreferences.isError */
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/profile')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Preferences</h1>
          <p className="text-xs text-text-muted">
            Saved to your guest profile and applied to this stay
          </p>
        </div>
      </div>

      {isLoading && !initialized ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
          <p className="text-sm text-text-muted">Loading your preferences…</p>
        </div>
      ) : (
        <>
          {/* Room Preferences */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-secondary" /> Room Preferences
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectPref
                label="Room location"
                prefKey="roomType"
                value={prefs.roomType}
                onChange={setPref}
                options={roomTypeOptions}
              />
              <SelectPref
                label="Bed type"
                prefKey="bedType"
                value={prefs.bedType}
                onChange={setPref}
                options={bedTypeOptions}
              />
              <SelectPref
                label="Pillows"
                prefKey="pillowType"
                value={prefs.pillowType}
                onChange={setPref}
                options={pillowOptions}
              />
            </div>
          </div>

          {/* Dietary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-secondary" /> Dietary Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleDietary(opt.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    prefs.dietary.includes(opt.value)
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Globe className="h-4 w-4 text-secondary" /> Language
            </h3>
            <select
              value={prefs.language}
              onChange={(e) => setPref('language', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {languageOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Communications */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" /> Communications
            </h3>
            {[
              { key: 'marketingEmails', label: 'Offers & promotions', desc: 'Deals and news' },
              {
                key: 'stayReminders',
                label: 'Stay reminders',
                desc: 'Check-in and check-out alerts',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPref(item.key, prefs[item.key] === 'true' ? 'false' : 'true')}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    prefs[item.key] === 'true' ? 'bg-secondary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                      prefs[item.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          {updatePreferences.isError && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-2 text-sm text-danger flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {updatePreferences.error?.message ?? 'Could not save. Please try again.'}
            </div>
          )}
          {saved && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Preferences saved.
            </div>
          )}

          <Button className="w-full" onClick={handleSave} disabled={updatePreferences.isPending}>
            {updatePreferences.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Preferences
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
