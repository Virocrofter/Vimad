import { useMemo } from 'react';
import { Bell, Calendar, Clock, MapPin, Users, Wifi, Coffee, Tv } from 'lucide-react';

export default function GuestPortalPage() {
  const guestStay = {
    id: 'stay-1',
    propertyName: 'Grand Hotel',
    propertyAddress: '123 Main St, Boston, MA',
    roomNumber: '204',
    roomType: 'Deluxe King',
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    dates: { nights: 4 },
    status: 'checked_in',
  };

  const guestAnnouncements = useMemo(
    () => [
      {
        id: 'ann-1',
        title: 'Pool Maintenance',
        message: 'The pool will be closed for maintenance on September 3rd from 10 AM to 2 PM.',
        status: 'published',
        expiresAt: '2026-09-03T23:59:59Z',
      },
      {
        id: 'ann-2',
        title: 'Welcome Reception',
        message: 'Join us for a welcome reception in the lobby on September 1st at 6 PM.',
        status: 'published',
        expiresAt: '2026-09-01T23:59:59Z',
      },
    ],
    []
  );

  const phase =
    guestStay.status === 'upcoming' ? 'pre' : guestStay.status === 'checked_in' ? 'during' : 'post';
  const phaseConfig = {
    pre: { label: 'Upcoming Stay', color: 'bg-info/10 text-info' },
    during: { label: 'Current Stay', color: 'bg-accent/10 text-accent' },
    post: { label: 'Past Stay', color: 'bg-background-secondary text-text-secondary' },
  };

  const cfg = phaseConfig[phase];

  const activeAnnouncements = useMemo(
    () =>
      guestAnnouncements.filter(
        (a) => a.status === 'published' && new Date(a.expiresAt) > new Date()
      ),
    [guestAnnouncements]
  );

  const amenities = [
    { icon: Wifi, name: 'Free WiFi' },
    { icon: Coffee, name: 'Coffee Maker' },
    { icon: Tv, name: 'Smart TV' },
    { icon: Users, name: 'Sleeps 3' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back!</h1>
          <p className="text-text-secondary mt-1">Manage your stay at {guestStay.propertyName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Stay Summary */}
      <div className="rounded-lg border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{guestStay.propertyName}</h2>
            <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {guestStay.propertyAddress}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">Room {guestStay.roomNumber}</p>
            <p className="text-sm text-text-secondary">{guestStay.roomType}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {guestStay.checkIn} → {guestStay.checkOut}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {guestStay.dates.nights} nights
          </span>
        </div>
      </div>

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Announcements
          </h2>
          <div className="space-y-3">
            {activeAnnouncements.map((ann) => (
              <div key={ann.id} className="rounded-lg border border-border p-4 bg-info/5">
                <h3 className="font-medium text-text-primary">{ann.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Amenities */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Room Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenities.map((amenity) => (
            <div key={amenity.name} className="rounded-lg border border-border p-4 text-center">
              <amenity.icon className="h-6 w-6 mx-auto text-text-secondary" />
              <p className="text-sm text-text-primary mt-2">{amenity.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Request Housekeeping', href: '/guest-portal/stay/housekeeping' },
            { label: 'Order Room Service', href: '/guest-portal/stay/room-service' },
            { label: 'Contact Concierge', href: '/guest-portal/stay/concierge' },
            { label: 'Report Issue', href: '/guest-portal/stay/issues' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-lg border border-border p-4 text-center hover:bg-background-secondary transition-colors"
            >
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
