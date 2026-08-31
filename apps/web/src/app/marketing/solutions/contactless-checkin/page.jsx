import { Link } from 'react-router-dom';
import {
  ArrowRight, Smartphone, QrCode, Key, CreditCard, Bell, Shield,
  Clock, Check, User, MessageSquare, MapPin
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

const steps = [
  {
    icon: Smartphone,
    title: 'Pre-Arrival Email',
    desc: 'Guest receives a branded email 24 hours before arrival with a secure link to the self-service portal.',
  },
  {
    icon: User,
    title: 'ID Upload & Verification',
    desc: "Guest uploads passport or driver's license. AI-powered OCR auto-fills profile data in seconds.",
  },
  {
    icon: CreditCard,
    title: 'Payment & Pre-Auth',
    desc: 'Secure tokenized card capture with PCI-DSS compliance. Deposit rules applied automatically.',
  },
  {
    icon: Key,
    title: 'Digital Key Issuance',
    desc: "BLE/NFC room key sent directly to the guest's phone via Apple Wallet or Google Pay.",
  },
  {
    icon: Bell,
    title: 'Room Ready Notification',
    desc: 'Guest gets a push notification the moment housekeeping marks their room as inspected.',
  },
  {
    icon: MapPin,
    title: 'Walk Straight to Room',
    desc: 'No front desk queue. Guest bypasses reception entirely and unlocks their door with their phone.',
  },
];

const benefits = [
  { icon: Clock, title: 'Reduce Check-In Time', desc: 'From 8 minutes to 30 seconds per guest.' },
  { icon: Shield, title: 'Health & Safety', desc: 'Minimize physical contact and shared surfaces.' },
  { icon: User, title: 'Staff Efficiency', desc: 'Front desk focuses on hospitality, not paperwork.' },
  { icon: MessageSquare, title: 'Guest Satisfaction', desc: '4.9★ average rating from contactless users.' },
];

export default function ContactlessCheckinPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Smartphone className="mr-1.5 h-3 w-3" />
              Post-COVID Hospitality
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Contactless Check-In <span className="text-secondary">Guests Love</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Let guests check themselves in from their phone. Reduce front desk queues, improve safety, and deliver a modern arrival experience.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/app"
                className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
              >
                See It in Action
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-text-primary">How contactless check-in works</h2>
            <p className="mt-2 text-text-secondary">Six simple steps. Zero friction.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-border bg-background p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white absolute -top-4 left-6">
                  {i + 1}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 mt-2">
                  <s.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Why hotels are going contactless</h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                The pandemic changed guest expectations forever. Today's travelers expect the same convenience from their hotel that they get from their airline.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <div key={b.title} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center gap-2">
                      <b.icon className="h-4 w-4 text-secondary" />
                      <h3 className="text-sm font-semibold text-text-primary">{b.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Check className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Check-In Complete</p>
                  <p className="text-xs text-text-muted">Room 402 · Sarah Johnson</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'ID Verified', status: 'done' },
                  { label: 'Payment Pre-Authorized', status: 'done' },
                  { label: 'Digital Key Sent', status: 'done' },
                  { label: 'Registration Card Signed', status: 'done' },
                  { label: 'Room Ready Alert', status: 'done' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-background border border-border px-4 py-2.5">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <Check className="h-4 w-4 text-accent" />
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-center">
                <p className="text-sm font-medium text-accent">Guest arrived and unlocked room 402</p>
                <p className="text-xs text-text-muted mt-0.5">No front desk interaction required</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Ready to eliminate front desk queues?</h2>
          <p className="mt-4 text-text-secondary">
            Contactless check-in is included in every plan. Set it up in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              Explore All Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}