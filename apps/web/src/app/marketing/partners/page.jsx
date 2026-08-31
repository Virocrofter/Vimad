import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Handshake,
  Zap,
  Globe,
  Award,
  Check,
  Code,
  Building2,
  TrendingUp,
} from 'lucide-react';

const partnerTypes = [
  {
    icon: Code,
    title: 'Technology Partners',
    desc: 'Integrate your app with Unified PMS. Get listed in our marketplace and reach 200+ hotels.',
    benefits: ['Open REST API', 'Sandbox environment', 'Co-marketing', 'Technical support'],
  },
  {
    icon: Building2,
    title: 'Reseller Partners',
    desc: 'Sell Unified PMS to your hospitality clients. Earn recurring commissions on every deal.',
    benefits: [
      '20% recurring commission',
      'Sales enablement kit',
      'Partner portal',
      'Deal registration',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Referral Partners',
    desc: 'Refer properties to Unified PMS and earn rewards for every successful signup.',
    benefits: [
      '1 free month per referral',
      'No commitment',
      'Tracking dashboard',
      'Instant payout',
    ],
  },
];

const existing = [
  'Stripe',
  'Adyen',
  'Booking.com',
  'Expedia',
  'Airbnb',
  'Salesforce',
  'HubSpot',
  'QuickBooks',
  'Toast',
  'Oracle MICROS',
];

export default function PartnersPage() {
  return (
    <div className="bg-background">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Handshake className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-4xl font-bold text-text-primary sm:text-5xl">
            Partner with <span className="text-secondary">Unified PMS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Join our ecosystem of technology providers, resellers, and hospitality consultants.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {partnerTypes.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <p.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{p.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="h-4 w-4 text-accent shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary">Already integrated</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {existing.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Award className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-text-primary">Ready to partner?</h2>
          <p className="mt-2 text-text-secondary">
            Apply to our partner program and start growing together.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
          >
            Apply Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
