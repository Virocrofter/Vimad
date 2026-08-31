/* src/app/guest-portal/support/contact/page.jsx */
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Phone, Mail, MessageSquare, MapPin, Clock,
  ExternalLink, Copy, Check
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

const contactMethods = [
  {
    label: 'Front Desk',
    value: '+1 (617) 555-0100',
    icon: Phone,
    action: 'tel:+16175550100',
    available: '24/7',
    description: 'For urgent requests and general inquiries',
  },
  {
    label: 'Email',
    value: 'guestservices@grandhotel.com',
    icon: Mail,
    action: 'mailto:guestservices@grandhotel.com',
    available: 'Response within 24h',
    description: 'For non-urgent inquiries and feedback',
  },
  {
    label: 'Live Chat',
    value: 'Start Chat',
    icon: MessageSquare,
    action: '/guest-portal/messages',
    available: 'Typically 2 min response',
    description: 'Fastest way to get help',
    internal: true,
  },
];

const hotelInfo = {
  name: 'Grand Hotel Boston',
  address: '123 Beacon Street, Boston, MA 02116',
  phone: '+1 (617) 555-0100',
  email: 'info@grandhotel.com',
  coordinates: { lat: 42.3601, lng: -71.0589 },
};

export default function ContactPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/support')}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Contact Hotel</h1>
          <p className="text-sm text-text-secondary">Multiple ways to reach us</p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="space-y-3">
        {contactMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.label}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                  <Icon className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">{method.label}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-accent">
                      <Clock className="h-3 w-3" /> {method.available}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{method.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => method.internal ? navigate(method.action) : window.open(method.action, '_blank')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
                    >
                      {method.value}
                      {!method.internal && <ExternalLink className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(method.value, method.label)}
                      className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted"
                    >
                      {copied === method.label ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hotel Info Card */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Hotel Information</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-primary">{hotelInfo.name}</p>
              <p className="text-xs text-text-muted">{hotelInfo.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-text-muted shrink-0" />
            <p className="text-sm text-text-primary">{hotelInfo.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-text-muted shrink-0" />
            <p className="text-sm text-text-primary">{hotelInfo.email}</p>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-4 h-40 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-xs text-text-muted">Interactive map</p>
            <p className="text-[10px] text-text-muted">{hotelInfo.coordinates.lat}, {hotelInfo.coordinates.lng}</p>
          </div>
        </div>
      </div>

      {/* Emergency */}
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
        <h3 className="text-sm font-semibold text-danger mb-2">Emergency</h3>
        <p className="text-xs text-text-secondary mb-3">
          For emergencies, please dial 911 or contact the front desk immediately.
        </p>
        <Button
          variant="outline"
          className="w-full border-danger/30 text-danger hover:bg-danger/10"
          onClick={() => window.open('tel:+16175550100', '_blank')}
        >
          <Phone className="mr-1.5 h-4 w-4" /> Call Front Desk
        </Button>
      </div>
    </div>
  );
}
