import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  Palette,
  Users,
  Wifi,
  Shield,
  Star,
  Heart,
  Coffee,
  Sparkles,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

const features = [
  {
    icon: Palette,
    title: 'White-Label Everything',
    desc: 'Your brand, your colors, your domain. Guests never know we exist.',
  },
  {
    icon: Heart,
    title: 'Guest Preference Memory',
    desc: 'Auto-remember pillow type, floor preference, and dietary needs for every returning guest.',
  },
  {
    icon: MessageCircle,
    title: 'Concierge Chatbot',
    desc: '24/7 AI concierge answers questions, takes room service orders, and books spa appointments.',
  },
  {
    icon: Coffee,
    title: 'Experience Marketplace',
    desc: 'Sell local tours, restaurant reservations, and in-room experiences directly through the guest portal.',
  },
  {
    icon: Sparkles,
    title: 'VIP Arrival Alerts',
    desc: 'Front desk gets notified the moment a VIP walks on property with personalized greeting prompts.',
  },
  {
    icon: TrendingUp,
    title: 'Revenue per Guest',
    desc: 'AI upsell engine suggests room upgrades, late checkout, and add-ons with 70%+ acceptance rates.',
  },
];

const stats = [
  { value: '23%', label: 'Increase in direct bookings' },
  { value: '4 hrs', label: 'Staff training time' },
  { value: '$147', label: 'Average RevPAR lift' },
  { value: '4.9★', label: 'Average guest rating' },
];

export default function BoutiqueHotelsPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Gem className="mr-1.5 h-3 w-3" />
              For 50-200 Room Properties
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Built for <span className="text-secondary">Boutique Hotels</span> That Care About
              Every Detail
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Independent hotels and boutique properties need a PMS that matches their passion for
              hospitality — not a generic enterprise tool designed for 1,000-room chains.
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
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-secondary">{s.value}</p>
                <p className="mt-1 text-sm text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Tools that feel like an extension of your team
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              Every feature is designed to help boutique hotels deliver personalized, memorable
              stays.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-secondary/50 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-warning text-warning" />
            ))}
          </div>
          <blockquote className="text-xl font-medium text-text-primary leading-relaxed">
            "We switched from a generic chain PMS and immediately saw a 23% increase in direct
            bookings. The guest portal lets us sell experiences we never thought to offer before."
          </blockquote>
          <div className="mt-6">
            <p className="font-semibold text-text-primary">Sarah Chen</p>
            <p className="text-sm text-text-muted">
              General Manager, Seaside Resort & Spa · 87 rooms
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">
            Your boutique hotel deserves better software
          </h2>
          <p className="mt-4 text-text-secondary">
            Join 200+ independent hotels already using Unified PMS to deliver Hilton-level guest
            experiences.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Start 60-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
