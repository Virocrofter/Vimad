/* src/app/guest-portal/profile/preferences/page.jsx */
import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Globe,
  Bell,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  KeyRound,
  Bed,
  UtensilsCrossed,
  Accessibility,
  Volume2,
  VolumeX,
  Wifi,
  Plane,
  Hotel,
  CreditCard,
  User,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import {
  guestProfile,
  roomTypeOptions,
  bedTypeOptions,
  pillowTypeOptions,
  dietaryOptions,
  accessibilityOptions,
  communicationOptions,
  languageOptions,
} from '../../data';
import {
  SectionHeader,
  FormSelect,
  ToggleSwitch,
  CheckboxGroup,
  RadioGroup,
} from '../../components';

export default function PreferencesPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState({
    roomType: guestProfile.preferences.roomType,
    bedType: guestProfile.preferences.bedType,
    smoking: guestProfile.preferences.smoking,
    pillowType: guestProfile.preferences.pillowType,
    temperature: guestProfile.preferences.temperature,
    dietary: [...guestProfile.preferences.dietary],
    accessibility: [...guestProfile.preferences.accessibility],
    communication: [...guestProfile.preferences.communication],
    language: guestProfile.language,
    darkMode: false,
    autoCheckIn: true,
    marketingEmails: true,
    stayReminders: true,
  });

  const updatePref = (key, value) => {
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

  const toggleAccessibility = (value) => {
    setPrefs((p) => ({
      ...p,
      accessibility: p.accessibility.includes(value)
        ? p.accessibility.filter((v) => v !== value)
        : [...p.accessibility, value],
    }));
    setSaved(false);
  };

  const toggleCommunication = (value) => {
    setPrefs((p) => ({
      ...p,
      communication: p.communication.includes(value)
        ? p.communication.filter((v) => v !== value)
        : [...p.communication, value],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/guest-portal/profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Preferences</h1>
          <p className="text-sm text-text-secondary">Customize your stay experience</p>
        </div>
      </div>

      {/* Save Banner */}
      {saved && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 flex items-center gap-2 text-accent">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Preferences saved successfully</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Preferences */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-secondary" /> Room Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Room Location
              </label>
              <RadioGroup
                options={roomTypeOptions}
                value={prefs.roomType}
                onChange={(v) => updatePref('roomType', v)}
                columns={2}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Bed Type
              </label>
              <RadioGroup
                options={bedTypeOptions}
                value={prefs.bedType}
                onChange={(v) => updatePref('bedType', v)}
                columns={2}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Pillow Preference
              </label>
              <RadioGroup
                options={pillowTypeOptions}
                value={prefs.pillowType}
                onChange={(v) => updatePref('pillowType', v)}
                columns={2}
              />
            </div>

            <ToggleSwitch
              checked={!prefs.smoking}
              onChange={(v) => updatePref('smoking', !v)}
              label="Non-Smoking Room"
              description="Prefer a smoke-free environment"
            />

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Preferred Temperature
              </label>
              <div className="flex items-center gap-4">
                <Thermometer className="h-5 w-5 text-text-muted" />
                <input
                  type="range"
                  min="60"
                  max="80"
                  value={prefs.temperature}
                  onChange={(e) => updatePref('temperature', parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full bg-border accent-secondary"
                />
                <span className="text-sm font-mono font-bold text-text-primary w-12 text-right">
                  {prefs.temperature}°F
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-secondary" /> Dietary Preferences
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Select any dietary requirements. Our kitchen will be notified before your arrival.
          </p>
          <CheckboxGroup
            options={dietaryOptions.map((d) => ({
              value: d,
              label: d.charAt(0).toUpperCase() + d.slice(1).replace('-', ' '),
            }))}
            selected={prefs.dietary}
            onToggle={toggleDietary}
            columns={2}
          />
        </div>

        {/* Accessibility */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Accessibility className="h-4 w-4 text-secondary" /> Accessibility Needs
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Let us know if you require any accessibility accommodations.
          </p>
          <CheckboxGroup
            options={accessibilityOptions}
            selected={prefs.accessibility}
            onToggle={toggleAccessibility}
            columns={1}
          />
        </div>

        {/* Communication */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Languages className="h-4 w-4 text-secondary" /> Communication & Language
          </h3>
          <div className="space-y-4">
            <FormSelect
              label="Preferred Language"
              value={prefs.language}
              onChange={(e) => updatePref('language', e.target.value)}
              options={languageOptions}
            />

            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Communication Channels
              </label>
              <CheckboxGroup
                options={communicationOptions}
                selected={prefs.communication}
                onToggle={toggleCommunication}
                columns={2}
              />
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-secondary" /> App Settings
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleSwitch
              checked={prefs.darkMode}
              onChange={(v) => updatePref('darkMode', v)}
              label="Dark Mode"
              description="Use dark theme throughout the app"
            />
            <ToggleSwitch
              checked={prefs.autoCheckIn}
              onChange={(v) => updatePref('autoCheckIn', v)}
              label="Auto Check-In"
              description="Automatically check in when available"
            />
            <ToggleSwitch
              checked={prefs.marketingEmails}
              onChange={(v) => updatePref('marketingEmails', v)}
              label="Marketing Emails"
              description="Receive offers and promotions"
            />
            <ToggleSwitch
              checked={prefs.stayReminders}
              onChange={(v) => updatePref('stayReminders', v)}
              label="Stay Reminders"
              description="Get reminders about upcoming stays"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <a
          href="/guest-portal/profile"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
        >
          Cancel
        </a>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
