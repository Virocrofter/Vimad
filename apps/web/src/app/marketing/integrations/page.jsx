import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plug,
  CreditCard,
  Globe,
  Utensils,
  Lock,
  BarChart3,
  Users,
  Zap,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const categories = [
  {
    name: 'Payment Gateways',
    icon: CreditCard,
    integrations: [
      { name: 'Stripe', desc: 'Online payments & subscriptions' },
      { name: 'Adyen', desc: 'Global omnichannel payments' },
      { name: 'Square', desc: 'In-person POS & invoicing' },
      { name: 'Worldpay', desc: 'Enterprise card processing' },
    ],
  },
  {
    name: 'Online Travel Agencies',
    icon: Globe,
    integrations: [
      { name: 'Booking.com', desc: 'Two-way real-time sync' },
      { name: 'Expedia', desc: 'Automated inventory updates' },
      { name: 'Airbnb', desc: 'Multi-calendar management' },
      { name: 'Google Hotels', desc: 'Metasearch connectivity' },
    ],
  },
  {
    name: 'POS Systems',
    icon: Utensils,
    integrations: [
      { name: 'Oracle MICROS', desc: 'F&B posting to folio' },
      { name: 'Toast', desc: 'Restaurant & bar sync' },
      { name: 'Lightspeed', desc: 'Retail & hospitality POS' },
      { name: 'Square POS', desc: 'Small business favorite' },
    ],
  },
  {
    name: 'Door Locks',
    icon: Lock,
    integrations: [
      { name: 'Assa Abloy', desc: 'Digital key issuance' },
      { name: 'SALTO', desc: 'Mobile key & access' },
      { name: 'Dormakaba', desc: 'Enterprise lock management' },
      { name: 'Onity', desc: 'Hospitality hardware' },
    ],
  },
  {
    name: 'Accounting',
    icon: BarChart3,
    integrations: [
      { name: 'QuickBooks', desc: 'Daily revenue export' },
      { name: 'Xero', desc: 'Automated reconciliation' },
      { name: 'Sage', desc: 'Enterprise GL mapping' },
      { name: 'NetSuite', desc: 'ERP for hotel chains' },
    ],
  },
  {
    name: 'CRM & Sales',
    icon: Users,
    integrations: [
      { name: 'Salesforce', desc: 'Guest profile sync' },
      { name: 'HubSpot', desc: 'Marketing automation' },
      { name: 'Mailchimp', desc: 'Email campaigns' },
      { name: 'Zendesk', desc: 'Support ticketing' },
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Plug className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-4xl font-bold text-text-primary sm:text-5xl">
            Connect your entire <span className="text-secondary">tech stack</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            50+ pre-built integrations with the tools you already use. No middleware. No custom
            code.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/demo"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Request Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              View API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.name} className="rounded-xl border border-border bg-background p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <cat.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">{cat.name}</h3>
                </div>
                <div className="space-y-3">
                  {cat.integrations.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                      <Check className="h-4 w-4 text-accent" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-text-primary">Need a custom integration?</h2>
          <p className="mt-2 text-text-secondary">
            Our open REST API and webhook system let you build anything. Sandbox environment
            included.
          </p>
          <Link
            to="/api-docs"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
          >
            Explore API Docs <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
