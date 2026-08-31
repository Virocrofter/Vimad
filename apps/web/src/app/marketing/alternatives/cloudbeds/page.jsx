import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, X, Zap, Puzzle, DollarSign, Layers,
  TrendingUp, Users, Building2, Shield, Headphones
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

const painPoints = [
  {
    icon: Puzzle,
    title: 'Fragmented Modules',
    desc: 'Core features split across separate products. Pay extra for basics like a booking engine or channel manager.',
  },
  {
    icon: Layers,
    title: 'Limited Enterprise Depth',
    desc: 'Works for small hostels, but lacks group blocks, catering, and multi-property dashboards.',
  },
  {
    icon: Headphones,
    title: 'Support Bottlenecks',
    desc: 'Long ticket queues and generic responses when you need urgent operational help.',
  },
  {
    icon: DollarSign,
    title: 'Hidden Costs',
    desc: 'Essential integrations, premium support, and advanced reporting all carry extra fees.',
  },
];

const advantages = [
  {
    icon: Zap,
    title: 'Truly All-in-One',
    desc: 'One platform with 46 modules. No add-ons required for revenue management or guest portal.',
  },
  {
    icon: Users,
    title: 'White-Glove Support',
    desc: 'Dedicated onboarding specialist and 24/7 phone support on Professional and Enterprise.',
  },
  {
    icon: TrendingUp,
    title: 'AI Revenue Manager',
    desc: 'LSTM demand forecasting and automated pricing that Cloudbeds cannot offer natively.',
  },
  {
    icon: Shield,
    title: 'Enterprise-Ready',
    desc: 'Multi-property dashboards, advanced permissions, and custom integrations built-in.',
  },
];

const comparison = [
  { label: 'Starting Cost', cloudbeds: '$200/mo + add-ons', unified: '$199/mo all-in' },
  { label: 'Training Time', cloudbeds: '8 hours', unified: '4 hours' },
  { label: 'Revenue Management', cloudbeds: 'Add-on / third-party', unified: 'Built-in AI' },
  { label: 'Multi-Property', cloudbeds: 'Limited', unified: 'Full dashboard' },
  { label: 'Guest Portal', cloudbeds: 'Basic', unified: 'White-label + mobile app' },
  { label: 'Group Management', cloudbeds: 'Not available', unified: 'Full blocks & BEOs' },
  { label: 'Support', cloudbeds: 'Email + chat', unified: '24/7 phone (Enterprise)' },
  { label: 'API Access', cloudbeds: 'Limited', unified: 'Open REST + webhooks' },
];

export default function CloudbedsAlternativePage() {
  return (
    <div className="flex flex-col bg-background">
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Building2 className="mr-1.5 h-3 w-3" />
              Cloudbeds Alternative
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              The Enterprise Alternative to <span className="text-secondary">Cloudbeds</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Stop paying for fragmented tools. Get a unified platform with deeper operations, AI revenue management, and white-glove support.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/app" className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/demo" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated">
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Why hotels outgrow Cloudbeds</h2>
            <p className="mt-2 text-text-secondary">The pain of pieced-together hospitality software.</p>
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

      <section className="bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Head-to-head comparison</h2>
            <p className="mt-2 text-text-secondary">See what you get when you upgrade.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-3 bg-surface">
              <div className="px-6 py-4 text-sm font-semibold text-text-muted">Feature</div>
              <div className="px-6 py-4 text-sm font-semibold text-text-primary text-center">Cloudbeds</div>
              <div className="px-6 py-4 text-sm font-semibold text-secondary text-center bg-secondary/5">Unified PMS</div>
            </div>
            {comparison.map((row, i) => (
              <div key={row.label} className={cn('grid grid-cols-3', i % 2 === 0 ? 'bg-background' : 'bg-surface')}>
                <div className="px-6 py-3.5 text-sm font-medium text-text-primary">{row.label}</div>
                <div className="px-6 py-3.5 text-center text-sm text-text-secondary">{row.cloudbeds}</div>
                <div className="px-6 py-3.5 text-center text-sm font-medium text-secondary bg-secondary/5">{row.unified}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Built to scale with you</h2>
            <p className="mt-2 text-text-secondary">One platform. Every stage of growth.</p>
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

      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Ready to unify your stack?</h2>
          <p className="mt-4 text-text-secondary">
            Migrate your data, train your team, and go live in under two weeks.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/app" className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/features" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated">
              Explore All Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}