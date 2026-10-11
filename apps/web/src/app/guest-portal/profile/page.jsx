/* src/app/guest-portal/profile/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  CreditCard,
  Edit3,
  Check,
  X,
  Loader2,
  ChevronRight,
  Lock,
  FileText,
  HelpCircle,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { FlagGate } from '@/components/FlagGate';
import { flags } from '../../../lib/flags';
import { formatDate } from '../../../lib/guest-utils';
import {
  useStayDetails,
  useUpdatePreferences,
  getGuestToken,
} from '../../../hooks/useGuestPortalData';
import { FormInput, FormSelect, SectionHeader } from '../components';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'ar', label: 'العربية' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay, isLoading, isError, refetch } = useStayDetails();
  const updatePreferences = useUpdatePreferences();

  const [editing, setEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [form, setForm] = useState({ language: 'en' });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
  });

  if (!hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Please verify your reservation first</p>
        <Button className="mt-4" onClick={() => navigate('/guest-portal/auth/login')}>
          Verify Reservation
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your profile…</p>
      </div>
    );
  }

  if (isError || !stay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn’t load your profile.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Stay API returns guestName as "Last, First"
  const [lastName, firstName] = stay.guestName?.includes(',')
    ? stay.guestName.split(',').map((s) => s.trim())
    : ['', stay.guestName ?? ''];

  const handleSave = async () => {
    setSaveMessage(null);
    try {
      await updatePreferences.mutateAsync({
        language: form.language,
        notifyEmail: String(notifications.email),
        notifySms: String(notifications.sms),
        notifyPush: String(notifications.push),
      });
      setEditing(false);
      setSaveMessage('Preferences saved.');
    } catch (err) {
      setSaveMessage(err?.message ?? 'Could not save. Please try again.');
    }
  };

  const toggleNotification = (key) =>
    setNotifications((p) => {
      const next = { ...p, [key]: !p[key] };
      // Persist immediately — these are standalone preferences
      updatePreferences.mutate({
        [`notify${key[0].toUpperCase()}${key.slice(1)}`]: String(next[key]),
      });
      return next;
    });

  const menuItems = [
    { icon: User, label: 'Personal Information', href: '#', active: true },
    { icon: Settings, label: 'Preferences', href: '/guest-portal/profile/preferences' },
    { icon: FileText, label: 'Documents & IDs', href: '/guest-portal/profile/documents' },
    { icon: CreditCard, label: 'Payment Methods', href: '/guest-portal/billing' },
    { icon: Bell, label: 'Notifications', href: '/guest-portal/messages/notifications' },
    { icon: HelpCircle, label: 'Help & Support', href: '/guest-portal/support' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Profile"
        subtitle="Manage your personal information and preferences"
        action={
          !editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="mr-1.5 h-4 w-4" /> Edit Preferences
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updatePreferences.isPending}>
                {updatePreferences.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          )
        }
      />

      {saveMessage && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column — Identity & Menu */}
        <div className="space-y-4 lg:col-span-1">
          {/* Identity Card */}
          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary/10">
              <span className="text-2xl font-bold text-secondary">
                {[firstName, lastName]
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-text-primary">
              {firstName} {lastName}
            </h3>
            <p className="text-xs text-text-muted">Room {stay.roomNumber}</p>
            <p className="mt-2 text-xs text-text-muted">
              Stay: {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)}
            </p>
          </div>

          {/* Loyalty — flag-gated */}
          {flags.loyalty && (
            <FlagGate flag="loyalty">
              <div className="rounded-xl border border-border bg-surface p-4">
                <a
                  href="/guest-portal/loyalty"
                  className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
                >
                  View loyalty dashboard <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </FlagGate>
          )}

          {/* Navigation Menu */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {menuItems.map((item, idx) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  item.active
                    ? 'bg-secondary/5 text-secondary'
                    : 'text-text-secondary hover:bg-surface-elevated',
                  idx !== menuItems.length - 1 && 'border-b border-border'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </a>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Info — read-only, owned by the reservation */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                label="First Name"
                value={firstName}
                disabled
                helper="Name changes are handled by the front desk"
              />
              <FormInput label="Last Name" value={lastName} disabled />
              <FormSelect
                label="Language"
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                options={languageOptions}
                disabled={!editing}
              />
            </div>
          </div>

          {/* Contact Preferences — real, persisted */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" /> Contact Preferences
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: 'email',
                  icon: Mail,
                  label: 'Email Notifications',
                  desc: 'Booking confirmations, offers, updates',
                },
                {
                  key: 'sms',
                  icon: Phone,
                  label: 'SMS Notifications',
                  desc: 'Check-in reminders, room ready alerts',
                },
                {
                  key: 'push',
                  icon: Bell,
                  label: 'Push Notifications',
                  desc: 'Real-time updates on your mobile device',
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleNotification(item.key)}
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border',
                      notifications[item.key]
                        ? 'bg-accent/10 border-accent/20 text-accent'
                        : 'bg-surface-elevated border-border text-text-muted'
                    )}
                  >
                    {notifications[item.key] && <Check className="h-3 w-3" />}
                    {notifications[item.key] ? 'Enabled' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Security — honest about the token model */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" /> Security
            </h3>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Secure Access Link</p>
                  <p className="text-xs text-text-muted">
                    You're signed in via your reservation verification — no password needed. Your
                    session ends when you close this browser tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
