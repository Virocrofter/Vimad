/* src/app/guest-portal/profile/page.jsx */
import { useState } from 'react';
import {
  User, Mail, Phone, Globe, Calendar, Shield, CreditCard,
  Edit3, Check, X, Camera, Loader2, Crown, MapPin,
  ChevronRight, Bell, Lock, FileText, HelpCircle, Settings,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { guestProfile, tierBenefits, formatDate } from '../data';
import { TierBadge, FormInput, FormSelect, SectionHeader } from '../components';
import { languageOptions } from '../data';

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: guestProfile.firstName,
    lastName: guestProfile.lastName,
    email: guestProfile.email,
    phone: guestProfile.phone,
    language: guestProfile.language,
  });
  const [avatar, setAvatar] = useState(guestProfile.avatar);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setEditing(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    { icon: User, label: 'Personal Information', href: '#', active: true },
    { icon: Settings, label: 'Preferences', href: '/guest-portal/profile/preferences' },
    { icon: FileText, label: 'Documents & IDs', href: '/guest-portal/profile/documents' },
    { icon: CreditCard, label: 'Payment Methods', href: '/guest-portal/billing' },
    { icon: Bell, label: 'Notifications', href: '/guest-portal/messages/notifications' },
    { icon: Lock, label: 'Security & Password', href: '#' },
    { icon: HelpCircle, label: 'Help & Support', href: '/guest-portal/support' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Profile"
        subtitle="Manage your personal information and account settings"
        action={!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="mr-1.5 h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Save
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column — Avatar & Quick Info */}
        <div className="space-y-4 lg:col-span-1">
          {/* Avatar Card */}
          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <div className="relative mx-auto h-24 w-24">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/10 overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-secondary" />
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-secondary text-white shadow-md hover:bg-secondary/90">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <h3 className="mt-3 text-lg font-bold text-text-primary">
              {guestProfile.firstName} {guestProfile.lastName}
            </h3>
            <p className="text-xs text-text-muted">{guestProfile.email}</p>
            <div className="mt-2 flex justify-center">
              <TierBadge tier={guestProfile.tier} />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Member since {formatDate(guestProfile.memberSince)}
            </p>
          </div>

          {/* Loyalty Summary */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">Loyalty Status</h4>
              <Crown className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Points Balance</span>
                <span className="font-mono font-bold text-text-primary">{guestProfile.points.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">To Next Tier</span>
                <span className="font-mono font-bold text-text-primary">{guestProfile.pointsToNextTier.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-border overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: `${(guestProfile.points / (guestProfile.points + guestProfile.pointsToNextTier)) * 100}%` }}
                />
              </div>
            </div>
            <a
              href="/guest-portal/loyalty"
              className="mt-3 inline-flex items-center gap-1 text-xs text-secondary hover:underline"
            >
              View full loyalty dashboard <ChevronRight className="h-3 w-3" />
            </a>
          </div>

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

        {/* Right Column — Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Info */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))}
                disabled={!editing}
                required
              />
              <FormInput
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))}
                disabled={!editing}
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                disabled={!editing}
                required
              />
              <FormInput
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                disabled={!editing}
              />
              <FormSelect
                label="Language"
                value={form.language}
                onChange={(e) => setForm(p => ({ ...p, language: e.target.value }))}
                options={languageOptions}
                disabled={!editing}
              />
              <FormInput
                label="Currency"
                value={guestProfile.currency}
                disabled
                helper="Currency is set based on your property location"
              />
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" /> Contact Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                    <p className="text-xs text-text-muted">Booking confirmations, offers, updates</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">SMS Notifications</p>
                    <p className="text-xs text-text-muted">Check-in reminders, room ready alerts</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Push Notifications</p>
                    <p className="text-xs text-text-muted">Real-time updates on your mobile device</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  <Check className="h-3 w-3" /> Enabled
                </span>
              </div>
            </div>
            <a
              href="/guest-portal/messages/notifications"
              className="mt-3 inline-flex items-center gap-1 text-xs text-secondary hover:underline"
            >
              Manage notification settings <ChevronRight className="h-3 w-3" />
            </a>
          </div>

          {/* Security */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" /> Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Password</p>
                    <p className="text-xs text-text-muted">Last changed 3 months ago</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                    <p className="text-xs text-text-muted">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
