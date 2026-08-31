/* src/app/guest-portal/stay/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  UtensilsCrossed,
  Sparkles,
  Wrench,
  ConciergeBell,
  ArrowRight,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Home,
  Wifi,
  Dumbbell,
  Waves,
  Car,
  Coffee,
  MessageSquare,
  Phone,
  Bell,
  Package,
  Trash2,
  Bed,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { guestStay, formatDate, getStayPhase } from '../data';

export default function StayPage() {
  const navigate = useNavigate();
  const stay = guestStay;
  const phase = getStayPhase(stay);

  const quickServices = [
    {
      id: 'room-service',
      label: 'Room Service',
      description: 'Browse menu & order',
      icon: UtensilsCrossed,
      href: '/guest-portal/stay/room-service',
      color: 'bg-orange-500/10 text-orange-500',
      available: true,
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      description: 'Request service',
      icon: Sparkles,
      href: '/guest-portal/stay/housekeeping',
      color: 'bg-blue-500/10 text-blue-500',
      available: true,
    },
    {
      id: 'concierge',
      label: 'Concierge',
      description: 'Local recommendations',
      icon: ConciergeBell,
      href: '/guest-portal/stay/concierge',
      color: 'bg-purple-500/10 text-purple-500',
      available: true,
    },
    {
      id: 'issues',
      label: 'Report Issue',
      description: 'Maintenance requests',
      icon: Wrench,
      href: '/guest-portal/stay/issues',
      color: 'bg-red-500/10 text-red-500',
      available: true,
    },
  ];

  const activeRequests = stay.requests || [];
  const activeServices = stay.services || [];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">In-Stay Services</h1>
        <p className="text-sm text-text-secondary mt-1">
          Room {stay.room.number} · {stay.property.name}
        </p>
      </div>

      {/* Stay Status Banner */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-accent">Checked In</p>
          <p className="text-xs text-text-secondary">
            {formatDate(stay.dates.arrival)} – {formatDate(stay.dates.departure)} ·{' '}
            {stay.dates.nights} nights
          </p>
        </div>
        <button
          onClick={() => navigate('/guest-portal/keys')}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <KeyRound className="h-3.5 w-3.5" /> Digital Key
        </button>
      </div>

      {/* Quick Services Grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Services</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickServices.map((service) => (
            <button
              key={service.id}
              onClick={() => navigate(service.href)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 active:scale-95 text-left',
                !service.available && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!service.available}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  service.color
                )}
              >
                <service.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">{service.label}</p>
                <p className="text-[10px] text-text-muted">{service.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Orders & Requests */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Active Services */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary" /> Active Orders
            </h3>
            <span className="text-xs text-text-muted">{activeServices.length} items</span>
          </div>
          <div className="divide-y divide-border">
            {activeServices.length > 0 ? (
              activeServices.map((svc) => (
                <div key={svc.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        svc.status === 'delivered' ? 'bg-accent/10' : 'bg-warning/10'
                      )}
                    >
                      {svc.type === 'room_service' ? (
                        <UtensilsCrossed
                          className={cn(
                            'h-4 w-4',
                            svc.status === 'delivered' ? 'text-accent' : 'text-warning'
                          )}
                        />
                      ) : (
                        <Sparkles className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {svc.type === 'room_service' ? 'Room Service' : 'Service'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {svc.items?.length || 0} items · {formatDate(svc.orderedAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                      svc.status === 'delivered'
                        ? 'bg-accent/10 text-accent'
                        : svc.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-secondary/10 text-secondary'
                    )}
                  >
                    {svc.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <UtensilsCrossed className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No active orders</p>
                <button
                  onClick={() => navigate('/guest-portal/stay/room-service')}
                  className="mt-2 text-xs text-secondary hover:underline"
                >
                  Browse Menu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Requests */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Wrench className="h-4 w-4 text-secondary" /> My Requests
            </h3>
            <span className="text-xs text-text-muted">{activeRequests.length} items</span>
          </div>
          <div className="divide-y divide-border">
            {activeRequests.length > 0 ? (
              activeRequests.map((req) => (
                <div key={req.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        req.status === 'completed' ? 'bg-accent/10' : 'bg-info/10'
                      )}
                    >
                      {req.type === 'housekeeping' ? (
                        <Sparkles
                          className={cn(
                            'h-4 w-4',
                            req.status === 'completed' ? 'text-accent' : 'text-info'
                          )}
                        />
                      ) : (
                        <Wrench className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary capitalize">
                        {req.description}
                      </p>
                      <p className="text-xs text-text-muted">
                        {req.type} · {formatDate(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                      req.status === 'completed'
                        ? 'bg-accent/10 text-accent'
                        : req.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-info/10 text-info'
                    )}
                  >
                    {req.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Wrench className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No active requests</p>
                <button
                  onClick={() => navigate('/guest-portal/stay/housekeeping')}
                  className="mt-2 text-xs text-secondary hover:underline"
                >
                  Request Service
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Home className="h-4 w-4 text-secondary" /> Property Information
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              icon: Phone,
              label: 'Front Desk',
              value: stay.property.phone,
              href: `tel:${stay.property.phone}`,
            },
            {
              icon: MessageSquare,
              label: 'Chat',
              value: 'Message Staff',
              href: '/guest-portal/messages',
            },
            { icon: Clock, label: 'Check-out', value: stay.dates.departureTime, href: null },
            { icon: Wifi, label: 'Wi-Fi', value: 'Vimad-Guest / ••••••••', href: null },
            { icon: Dumbbell, label: 'Gym', value: '5AM – 11PM', href: null },
            { icon: Waves, label: 'Pool', value: '6AM – 10PM', href: null },
          ].map((item) => (
            <div
              key={item.label}
              onClick={() => item.href && navigate(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-background p-3',
                item.href && 'cursor-pointer hover:bg-surface-elevated transition-colors'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <item.icon className="h-4 w-4 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-text-primary truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Need Help */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Need Help?</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/guest-portal/messages')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Chat with Front Desk</p>
                <p className="text-xs text-text-muted">Typically responds in 5 minutes</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/guest-portal/support')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Support Center</p>
                <p className="text-xs text-text-muted">FAQs, tickets, and contact</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}
