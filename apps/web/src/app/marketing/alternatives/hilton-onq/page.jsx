import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, X, Zap, Clock, DollarSign, Monitor, Smartphone,
  TrendingUp, Users, Building2, Shield, Globe
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

const painPoints = [
  {
    icon: Monitor,
    title: 'Windows-Only Legacy',
    desc: 'Tied to outdated desktop hardware. No tablets, no mobile, no remote access for managers.',
  },
  {
    icon: Clock,
    title: 'Complex Training',
    desc: 'New front desk staff need weeks of certification before they can operate independently.',
  },
  {
    icon: DollarSign,
    title: 'Expensive Infrastructure',
    desc: 'Requires dedicated on-premise servers, VPNs, and ongoing IT maintenance contracts.',
  },
  {
    icon: Smartphone,
    title: 'Zero Mobility',
    desc: 'No mobile app for staff or guests. Housekeeping runs on paper printouts.',
  },
];

const advantages = [
  {
    icon: Globe,
    title: 'Cloud-Native & Mobile',
    desc: 'Run your property from any device, anywhere. Native iOS and Android apps included.',
  },
  {
    icon: Users,
    title: '4-Hour Onboarding',
    desc: 'Intuitive interface designed for hospitality staff, not IT administrators.',
  },
  {
    icon: TrendingUp,
    title: 'AI Revenue Manager',
    desc: 'Automated pricing and demand forecasting that OnQ simply cannot match.',
  },
  {
    icon: Shield,
    title: 'Always Current',
    desc: 'Automatic updates, PCI-DSS compliance, and 99.99% uptime — no patching needed.',
  },
];

const comparison = [
  { label: 'Starting Cost', onq: 'Proprietary / Franchise', unified: '$199/mo' },
  { label: 'Training Time', onq: '3-4 weeks', unified: '4 hours' },
  { label: 'Deployment', onq: 'On-premise hardware', unified: 'Cloud (instant)' },
  { label: 'Mobile Access', onq: 'None', unified: 'Full iOS, Android & PWA' },
  { label: 'AI Revenue Mgmt', onq: 'Not available', unified: 'Built-in' },
  { label: 'Real-Time Updates', onq: 'Batch / delayed', unified: 'WebSocket live sync' },
  { label: 'Guest Portal', onq: 'Limited', unified: 'White-label included' },
  { label: 'API Access', onq: 'Restricted', unified: 'Open REST + webhooks' },
];

export default function HiltonOnqAlternativePage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Building2 className="mr-1.5 h-3 w-3" />
              Hilton OnQ Alternative
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              The Modern Alternative to <span className="text-secondary">Hilton OnQ</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Break free from franchise-mandated legacy software. Get deeper operational features, modern UX, and AI-powered revenue management at a fraction of the cost.
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

      {/* Pain Points */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Why hotels are leaving OnQ</h2>
            <p className="mt-2 text-text-secondary">The hidden costs of franchise-locked PMS software.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {painPoints.map((p) => (
              <div key={p.title} className="rounded-xl border border-danger/20 bg-danger/5 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                  <p.icon className="h-5 w-5 text-danger" />
                </div>
                <h3 className="mt-3 font-semibold text-text-primary">{p.title}</h3>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Head-to-head comparison</h2>
            <p className="mt-2 text-text-secondary">See what you get when you switch.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-3 bg-surface">
              <div className="px-6 py-4 text-sm font-semibold text-text-muted">Feature</div>
              <div className="px-6 py-4 text-sm font-semibold text-text-primary text-center">Hilton OnQ</div>
              <div className="px-6 py-4 text-sm font-semibold text-secondary text-center bg-secondary/5">Unified PMS</div>
            </div>
            {comparison.map((row, i) => (
              <div key={row.label} className={cn('grid grid-cols-3', i % 2 === 0 ? 'bg-background' : 'bg-surface')}>
                <div className="px-6 py-3.5 text-sm font-medium text-text-primary">{row.label}</div>
                <div className="px-6 py-3.5 text-center text-sm text-text-secondary">{row.onq}</div>
                <div className="px-6 py-3.5 text-center text-sm font-medium text-secondary bg-secondary/5">{row.unified}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Built for modern hospitality</h2>
            <p className="mt-2 text-text-secondary">Everything OnQ does — and everything it doesn't.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <a.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-3 font-semibold text-text-primary">{a.title}</h3>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Ready to move on from OnQ?</h2>
          <p className="mt-4 text-text-secondary">
            We handle data migration, staff training, and parallel-run support so your transition is seamless.
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
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              Explore All Features
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            60-day free trial · No credit card required · Migration assistance included
          </p>
        </div>
      </section>
    </div>
  );
}