/* src/app/guest-portal/page.jsx */
import { useMemo } from 'react';
import {
  Home,
  Calendar,
  KeyRound,
  UtensilsCrossed,
  CreditCard,
  Crown,
  MessageSquare,
  Star,
  ChevronRight,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  Phone,
  Wifi,
  Coffee,
  Car,
  Dumbbell,
  Waves,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { guestProfile, guestStays, guestAnnouncements, getStayPhase } from './data';
import {
  GuestBookingCard,
  DigitalKeyWidget,
  PointsDisplay,
  GuestAnnouncementCard,
  QuickAction,
  SectionHeader,
} from './components';

export default function GuestDashboard() {
  const currentStay = guestStays[0];
  const phase = getStayPhase(currentStay);

  const phaseConfig = {
    'pre-arrival': {
      title: 'Get Ready for Your Stay',
      subtitle: `${currentStay.dates.nights} nights at ${currentStay.property.name}`,
      actions: [
        { icon: Calendar, label: 'Check In', href: '/guest-portal/check-in', color: 'accent' },
        {
          icon: CreditCard,
          label: 'View Booking',
          href: '/guest-portal/booking',
          color: 'secondary',
        },
        {
          icon: Star,
          label: 'Add Requests',
          href: '/guest-portal/profile/preferences',
          color: 'info',
        },
      ],
    },
    'in-stay': {
      title: 'Enjoy Your Stay',
      subtitle: `Room ${currentStay.room.number} · ${currentStay.property.name}`,
      actions: [
        { icon: KeyRound, label: 'Digital Key', href: '/guest-portal/keys', color: 'secondary' },
        {
          icon: UtensilsCrossed,
          label: 'Room Service',
          href: '/guest-portal/stay/room-service',
          color: 'accent',
        },
        {
          icon: CreditCard,
          label: 'View Folio',
          href: '/guest-portal/billing',
          color: 'text-primary',
        },
        {
          icon: MessageSquare,
          label: 'Message Staff',
          href: '/guest-portal/messages',
          color: 'info',
        },
      ],
    },
    'post-stay': {
      title: 'Thank You for Staying',
      subtitle: `We hope you enjoyed ${currentStay.property.name}`,
      actions: [
        { icon: Star, label: 'Leave Review', href: '/guest-portal/reviews', color: 'warning' },
        { icon: Crown, label: 'Loyalty', href: '/guest-portal/loyalty', color: 'secondary' },
        {
          icon: CreditCard,
          label: 'View Receipt',
          href: '/guest-portal/billing/invoice',
          color: 'text-primary',
        },
        { icon: Calendar, label: 'Book Again', href: '/guest-portal/booking', color: 'accent' },
      ],
    },
  };
  const cfg = phaseConfig[phase];

  const activeAnnouncements = useMemo(
    () =>
      guestAnnouncements.filter(
        (a) => a.status === 'published' && new Date(a.expiresAt) > new Date()
      ),
    []
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Welcome back, {guestProfile.firstName}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{cfg.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/guest-portal/status"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              <Wifi className="h-3.5 w-3.5 text-accent" />
              All Services Operational
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cfg.actions.map((action) => (
            <QuickAction
              key={action.label}
              icon={action.icon}
              label={action.label}
              href={action.href}
              color={action.color}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Stay Card */}
          <GuestBookingCard stay={currentStay} />

          {/* Digital Key (in-stay only) */}
          {phase === 'in-stay' && currentStay.digitalKey && (
            <DigitalKeyWidget keyData={currentStay.digitalKey} />
          )}

          {/* Property Amenities */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Home className="h-4 w-4 text-secondary" /> Property Amenities
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: Wifi, label: 'Free Wi-Fi' },
                { icon: Dumbbell, label: 'Fitness Center' },
                { icon: Waves, label: 'Pool' },
                { icon: Coffee, label: 'Restaurant' },
                { icon: Car, label: 'Valet' },
                { icon: MapPin, label: 'City Center' },
                { icon: Phone, label: '24/7 Concierge' },
                { icon: Star, label: 'Spa' },
              ].map((amenity) => (
                <div
                  key={amenity.label}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5"
                >
                  <amenity.icon className="h-4 w-4 text-text-muted" />
                  <span className="text-xs text-text-secondary">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          {activeAnnouncements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Bell className="h-4 w-4 text-secondary" /> Announcements
                </h3>
                <a
                  href="/guest-portal/status/announcements"
                  className="text-xs text-secondary hover:underline"
                >
                  View all <ChevronRight className="h-3 w-3 inline" />
                </a>
              </div>
              <div className="space-y-3">
                {activeAnnouncements.slice(0, 2).map((ann) => (
                  <GuestAnnouncementCard key={ann.id} announcement={ann} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Column */}
        <div className="space-y-4">
          {/* Loyalty Card */}
          <PointsDisplay
            points={guestProfile.points}
            toNextTier={guestProfile.pointsToNextTier}
            tier={guestProfile.tier}
          />

          {/* Quick Links */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Links</h3>
            <div className="space-y-1">
              {[
                { label: 'Modify Booking', href: '/guest-portal/booking/modify', icon: Calendar },
                {
                  label: 'Room Service',
                  href: '/guest-portal/stay/room-service',
                  icon: UtensilsCrossed,
                },
                { label: 'Housekeeping', href: '/guest-portal/stay/housekeeping', icon: Home },
                { label: 'Concierge', href: '/guest-portal/stay/concierge', icon: MessageSquare },
                { label: 'Support', href: '/guest-portal/support', icon: MessageSquare },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                >
                  <link.icon className="h-4 w-4 text-text-muted" />
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight className="h-3 w-3 text-text-muted" />
                </a>
              ))}
            </div>
          </div>

          {/* Need Help */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Need Help?</h3>
            <p className="text-xs text-text-muted mb-3">
              Our front desk is available 24/7 to assist you.
            </p>
            <div className="space-y-2">
              <a
                href="tel:+16175550100"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <Phone className="h-4 w-4 text-accent" />
                +1 (617) 555-0100
              </a>
              <a
                href="/guest-portal/messages"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-secondary" />
                Message Front Desk
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
