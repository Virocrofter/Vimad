import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, Globe, BarChart3, Users, Shield, Layers,
  Repeat, FileText, Settings, TrendingUp, Check
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

const features = [
  {
    icon: Globe,
    title: 'Portfolio Dashboard',
    desc: 'See occupancy, ADR, and RevPAR across all properties in a single unified view with real-time alerts.',
  },
  {
    icon: Repeat,
    title: 'Cross-Property Reservations',
    desc: 'Book guests at sister properties, transfer folios, and manage group blocks across your entire portfolio.',
  },
  {
    icon: Settings,
    title: 'Centralized Rate Management',
    desc: 'Push corporate rate codes, packages, and promotions to all properties with one click.',
  },
  {
    icon: FileText,
    title: 'Consolidated Reporting',
    desc: 'Portfolio P&L, comparative analysis, and brand standards compliance scoring per property.',
  },
  {
    icon: Users,
    title: 'Corporate User Management',
    desc: 'SSO across all properties, role templates, and centralized staff permissions and audit trails.',
  },
  {
    icon: Shield,
    title: 'Brand Standards Monitor',
    desc: "Automated compliance scoring ensures every property meets your brand's operational standards.",
  },
];

const enterpriseFeatures = [
  'Multi-property command center',
  'Cross-property guest search & CRM',
  'Centralized AR & loyalty program',
  'Franchisee portal with reporting',
  'Master data management',
  'Custom integrations & SLA guarantee',
  'Dedicated account manager',
  '24/7 phone support',
];

export default function HotelChainsPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Building2 className="mr-1.5 h-3 w-3" />
              For Hotel Chains & Management Companies
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              One Platform. <span className="text-secondary">Every Property.</span> Complete Visibility.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Stop managing fragmented PMS instances. Unified PMS gives chains and management companies centralized control with property-level flexibility.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/demo"
                className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
              >
                Talk to Enterprise Sales <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
              >
                View Enterprise Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Built for scale</h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              Whether you manage 5 properties or 500, Unified PMS scales with your portfolio.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-secondary/50 hover:shadow-lg">
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

      {/* Enterprise checklist */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Enterprise-grade governance</h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Corporate-level controls with property-level autonomy. Set mandatory policies across your portfolio while letting each GM optimize for their market.
              </p>
              <ul className="mt-6 space-y-3">
                {enterpriseFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                    <Check className="h-4 w-4 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <Layers className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Portfolio Overview</p>
                  <p className="text-xs text-text-muted">Live across 12 properties</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Occupancy', value: '81%' },
                  { label: 'ADR', value: '$195' },
                  { label: 'RevPAR', value: '$158' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-border bg-background p-3 text-center">
                    <p className="text-xs text-text-muted">{kpi.label}</p>
                    <p className="text-lg font-bold text-text-primary">{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium text-text-secondary mb-2">Brand Compliance Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full w-[92%] rounded-full bg-accent" />
                  </div>
                  <span className="text-sm font-semibold text-accent">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Manage your portfolio like a pro</h2>
          <p className="mt-4 text-text-secondary">
            Join growing hotel chains that have replaced fragmented systems with one unified platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/demo"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Schedule Enterprise Demo <ArrowRight className="ml-2 h-4 w-4" />
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