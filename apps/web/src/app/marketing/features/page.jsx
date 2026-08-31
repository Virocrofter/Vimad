import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  X,
  Calendar,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  BedDouble,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Plug,
  Clock,
  Building2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const categories = [
  {
    id: 'operations',
    label: 'Operations',
    icon: Building2,
    features: [
      {
        title: 'Command Center Dashboard',
        desc: 'Real-time KPIs, alerts, and activity feed with WebSocket-powered live updates.',
        icon: BarChart3,
      },
      {
        title: 'Reservation Management',
        desc: 'Intuitive booking wizard with auto-suggest rooms, upsell prompts, and OTA cross-reference.',
        icon: Calendar,
      },
      {
        title: 'Front Desk Operations',
        desc: 'One-stroke check-in for returning guests, digital key issuance, and ID OCR auto-fill.',
        icon: Users,
      },
      {
        title: 'Cashiering & Billing',
        desc: 'Multi-window folios, split payments, PCI-compliant tokenization, and automatic gratuity.',
        icon: CreditCard,
      },
      {
        title: 'Room & Housekeeping',
        desc: 'Drag-and-drop tape chart, attendant mobile app, and auto-release OOO rooms.',
        icon: BedDouble,
      },
      {
        title: 'Night Audit',
        desc: 'Guided audit wizard with pre-audit error detection and scheduled auto-audit.',
        icon: Clock,
      },
    ],
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: TrendingUp,
    features: [
      {
        title: 'AI Revenue Manager',
        desc: 'LSTM demand forecasting, Bayesian price elasticity, and auto-yield rules with confidence scores.',
        icon: Zap,
      },
      {
        title: 'Rate & Inventory',
        desc: 'Visual rate calendar, dynamic pricing rules, LOS restrictions, and rate parity monitor.',
        icon: BarChart3,
      },
      {
        title: 'Upsell Engine',
        desc: 'AI-suggested room upgrades, late checkout, and add-ons with dynamic pricing.',
        icon: TrendingUp,
      },
      {
        title: 'Channel Management',
        desc: 'Two-way real-time sync with Booking.com, Expedia, Airbnb, and GDS connectivity.',
        icon: Globe,
      },
      {
        title: 'Commission Processing',
        desc: 'Automated travel agent and OTA commission accrual, payment batches, and reconciliation.',
        icon: CreditCard,
      },
      {
        title: 'Groups & Blocks',
        desc: 'Rooming list drag-and-drop, group billing accounts, and pickup forecasting.',
        icon: Users,
      },
    ],
  },
  {
    id: 'guest',
    label: 'Guest Experience',
    icon: MessageSquare,
    features: [
      {
        title: 'Booking Engine',
        desc: 'White-label, multi-language, multi-currency direct booking with abandoned cart recovery.',
        icon: Globe,
      },
      {
        title: 'Guest Portal',
        desc: 'Online check-in/out, folio viewer, room upgrades, and messaging center.',
        icon: Users,
      },
      {
        title: 'Mobile App',
        desc: 'PWA with digital key, offline mode, biometric login, and geofencing auto check-in.',
        icon: Zap,
      },
      {
        title: 'AI Concierge',
        desc: '24/7 multilingual chatbot with context awareness and proactive guest messaging.',
        icon: MessageSquare,
      },
      {
        title: 'Loyalty & Membership',
        desc: 'Configurable tiers, points accrual, redemption, and partner airline miles integration.',
        icon: Shield,
      },
      {
        title: 'Unified Communication',
        desc: 'Single inbox for email, SMS, WhatsApp, and in-app chat with SLA monitoring.',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    features: [
      {
        title: 'Predictive Maintenance',
        desc: 'IoT sensor integration and ML failure prediction with auto-generated work orders.',
        icon: Zap,
      },
      {
        title: 'Sentiment Analysis',
        desc: 'Review aggregation from TripAdvisor, Google, Booking.com with AI-drafted responses.',
        icon: MessageSquare,
      },
      {
        title: 'Fraud Detection',
        desc: 'ML risk scoring, chargeback tracking, and fake booking pattern detection.',
        icon: Shield,
      },
      {
        title: 'Guest Journey Analytics',
        desc: 'End-to-end touchpoint tracking, drop-off analysis, and churn prediction.',
        icon: Users,
      },
      {
        title: 'Housekeeping AI',
        desc: 'Optimal route generation, task priority matrix, and linen supply forecasting.',
        icon: BedDouble,
      },
      {
        title: 'Labor Optimization',
        desc: 'Occupancy-based staffing recommendations and F&B demand forecasting.',
        icon: TrendingUp,
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    features: [
      {
        title: 'Payment Gateways',
        desc: 'Pre-built connectors for Stripe, Adyen, Square, and Worldpay with tokenized vault.',
        icon: CreditCard,
      },
      {
        title: 'POS Systems',
        desc: 'Oracle MICROS, Toast, Lightspeed, and Square integration for seamless incidental posting.',
        icon: Zap,
      },
      {
        title: 'Door Locks',
        desc: 'Assa Abloy, SALTO, and Dormakaba digital key issuance from the front desk.',
        icon: Shield,
      },
      {
        title: 'Accounting',
        desc: 'Daily revenue export to QuickBooks, Xero, and Sage with GL mapping.',
        icon: BarChart3,
      },
      {
        title: 'CRM & Sales',
        desc: 'Salesforce and HubSpot bidirectional sync for guest profiles and lead tracking.',
        icon: Users,
      },
      {
        title: 'Open API',
        desc: 'RESTful API, webhooks, and sandbox environment for custom integrations.',
        icon: Plug,
      },
    ],
  },
];

const competitors = ['Oracle OPERA 5', 'Hilton OnQ', 'Cloudbeds', 'Unified PMS'];

const comparisonRows = [
  { feature: 'Cloud-Native SaaS', opera: false, onq: false, cloudbeds: true, unified: true },
  { feature: 'Modern Web UI', opera: false, onq: false, cloudbeds: true, unified: true },
  { feature: 'Mobile-First Design', opera: false, onq: false, cloudbeds: 'Partial', unified: true },
  { feature: 'AI Revenue Management', opera: false, onq: false, cloudbeds: false, unified: true },
  { feature: 'Real-Time Sync', opera: false, onq: false, cloudbeds: 'Partial', unified: true },
  { feature: 'Open API & Webhooks', opera: 'Partial', onq: false, cloudbeds: true, unified: true },
  {
    feature: 'Built-in Guest Portal',
    opera: 'Add-on',
    onq: 'Add-on',
    cloudbeds: true,
    unified: true,
  },
  { feature: 'Contactless Check-In', opera: false, onq: false, cloudbeds: true, unified: true },
  { feature: 'Service Recovery Center', opera: false, onq: true, cloudbeds: false, unified: true },
  { feature: 'House Account Manager', opera: false, onq: false, cloudbeds: false, unified: true },
  {
    feature: 'No-Show Automation',
    opera: 'Partial',
    onq: 'Partial',
    cloudbeds: false,
    unified: true,
  },
  { feature: 'Vacation Ownership', opera: 'Add-on', onq: false, cloudbeds: false, unified: true },
  { feature: 'Sales & Catering', opera: 'Add-on', onq: false, cloudbeds: false, unified: true },
  { feature: 'Predictive Maintenance', opera: false, onq: false, cloudbeds: false, unified: true },
  { feature: 'Sentiment Analysis', opera: false, onq: false, cloudbeds: false, unified: true },
  { feature: 'Fraud Detection', opera: false, onq: false, cloudbeds: false, unified: true },
  {
    feature: 'Training Time',
    opera: '40 hours',
    onq: '40 hours',
    cloudbeds: '8 hours',
    unified: '4 hours',
  },
  {
    feature: 'Starting Price',
    opera: '$50K+',
    onq: 'Proprietary',
    cloudbeds: '$200/mo',
    unified: '$199/mo',
  },
];

function ComparisonCell({ value }) {
  if (value === true) return <Check className="h-5 w-5 text-accent mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-danger mx-auto" />;
  return <span className="text-sm text-text-secondary">{value}</span>;
}

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('operations');
  const activeCategory = categories.find((c) => c.id === activeTab);

  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Zap className="mr-1.5 h-3 w-3" />
              46 Core Modules
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Everything you need to <span className="text-secondary">run a modern hotel</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              From reservations to revenue management, Unified PMS replaces your entire tech stack
              with one intelligent platform.
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
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-y border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-secondary text-white'
                      : 'border border-border bg-background text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">
              {activeCategory?.label} Features
            </h2>
            <p className="mt-2 text-text-secondary">
              Deep operational tools designed for speed and clarity.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory?.features.map((f) => (
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

      {/* Comparison Table */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">How we compare</h2>
            <p className="mt-2 text-text-secondary">
              See why hotels are switching from legacy systems to Unified PMS.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background">
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">Feature</th>
                  {competitors.map((c) => (
                    <th
                      key={c}
                      className={cn(
                        'px-6 py-4 text-center font-semibold',
                        c === 'Unified PMS' ? 'text-secondary' : 'text-text-primary'
                      )}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="bg-surface hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-text-primary">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell value={row.opera} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell value={row.onq} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell value={row.cloudbeds} />
                    </td>
                    <td className="px-6 py-3.5 text-center bg-secondary/5">
                      <ComparisonCell value={row.unified} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              View Pricing <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
