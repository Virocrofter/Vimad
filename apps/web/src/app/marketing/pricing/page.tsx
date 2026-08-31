import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Building2, Hotel, Crown, Globe, ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const tiers = [
  {
    name: 'Starter',
    icon: Hotel,
    monthlyPrice: 199,
    annualPrice: 165,
    roomLimit: 'Up to 75 rooms',
    description: 'Independent hotels, B&Bs',
    features: ['Core PMS', 'Reservations & Front Desk', 'Basic Housekeeping', 'Billing & Folios', 'Basic Reporting'],
    cta: 'Start Free Trial',
    popular: false,
    included: ['Unlimited users', 'Email support', 'Standard onboarding', 'API access (read-only)', 'Mobile app access'],
  },
  {
    name: 'Professional',
    icon: Building2,
    monthlyPrice: 499,
    annualPrice: 414,
    roomLimit: 'Up to 200 rooms',
    description: 'Boutique hotels',
    features: ['Everything in Starter', 'Booking Engine', 'Channel Manager', 'CRM & Loyalty', 'Marketing Automation', 'Guest Portal'],
    cta: 'Start Free Trial',
    popular: true,
    included: ['Everything in Starter', 'Priority email + chat support', 'Dedicated onboarding specialist', 'Full API access', 'Custom reports', 'Revenue management basics'],
  },
  {
    name: 'Enterprise',
    icon: Crown,
    monthlyPrice: 999,
    annualPrice: 829,
    roomLimit: 'Unlimited rooms',
    description: 'Hotel chains & resorts',
    features: ['Everything in Professional', 'Multi-Property Dashboard', 'AI Revenue Manager', 'Sales & Catering', 'Advanced Analytics', 'Priority Support'],
    cta: 'Contact Sales',
    popular: false,
    included: ['Everything in Professional', '24/7 phone support', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'Advanced user permissions', 'On-site training available'],
  },
  {
    name: 'White-Label',
    icon: Globe,
    monthlyPrice: 2499,
    annualPrice: 2074,
    roomLimit: '50+ properties',
    description: 'Branded guest experience',
    features: ['Everything in Enterprise', 'Custom Branding', 'Dedicated Infrastructure', 'API Access', 'SLA Guarantee', 'Account Manager'],
    cta: 'Contact Sales',
    popular: false,
    accentColor: 'border-accent',
    included: ['Everything in Enterprise', 'White-glove setup', 'Custom domain & SSL', 'Dedicated success team', 'Quarterly business reviews', 'Co-marketing opportunities'],
  },
];

const faqs = [
  { q: 'Can I change plans later?', a: 'Absolutely. Upgrade or downgrade anytime. Prorated charges are calculated automatically.' },
  { q: 'What payment methods do you accept?', a: 'All major credit cards, ACH bank transfer, and wire for annual Enterprise plans.' },
  { q: 'Is there a discount for annual billing?', a: 'Yes. Annual plans include 2 months free — that\'s a 17% discount compared to monthly.' },
  { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee on all plans. No questions asked.' },
  { q: 'What happens after the 60-day trial?', a: 'Choose a plan and add your billing details, or export your data and walk away. No automatic charges.' },
  { q: 'Is there a limit on reservations or users?', a: 'No. All plans include unlimited reservations and user accounts. Pricing is based on room count only.' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">Simple, transparent pricing</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">No setup fees. No contracts. Cancel anytime.</p>
            
            <div className="mt-8 inline-flex items-center rounded-full border border-border bg-surface p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  !isAnnual ? 'bg-secondary text-white' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  isAnnual ? 'bg-secondary text-white' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Annual <span className="ml-1 text-xs opacity-90">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-surface p-6 transition-all hover:shadow-lg',
                  tier.popular ? 'border-secondary ring-1 ring-secondary' : tier.accentColor ? 'border-accent ring-1 ring-accent' : 'border-border'
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                {tier.name === 'White-Label' && !tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Premium
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated">
                    <tier.icon className={cn('h-5 w-5', tier.popular ? 'text-secondary' : 'text-text-secondary')} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
                    <p className="text-xs text-text-muted">{tier.description}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">
                      ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-sm text-text-muted">/mo</span>
                  </div>
                  {isAnnual ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-text-muted">
                        Billed annually (${tier.monthlyPrice * 12}/yr)
                      </p>
                      <p className="text-xs text-accent font-medium">
                        You save ${(tier.monthlyPrice - tier.annualPrice) * 12}/year
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-text-muted">
                      ${tier.annualPrice}/mo when billed annually
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-text-secondary">{tier.roomLimit}</p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={cn(
                    'mt-8 w-full rounded-md py-2.5 text-sm font-medium transition-colors',
                    tier.popular
                      ? 'bg-secondary text-white hover:bg-secondary/90'
                      : tier.name === 'White-Label'
                      ? 'border border-accent bg-accent/5 text-accent hover:bg-accent/10'
                      : 'border border-border bg-background text-text-primary hover:bg-surface-elevated'
                  )}
                >
                  {tier.cta}
                </button>

                {/* Expandable What's Included */}
                <div className="mt-4 border-t border-border pt-4">
                  <button
                    onClick={() => setExpandedTier(expandedTier === tier.name ? null : tier.name)}
                    className="flex w-full items-center justify-between text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" /> What's included
                    </span>
                    {expandedTier === tier.name ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {expandedTier === tier.name && (
                    <ul className="mt-3 space-y-2">
                      {tier.included.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-text-secondary">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise CTA Banner */}
          <div className="mt-12 rounded-xl border border-border bg-surface p-8 text-center">
            <h3 className="text-lg font-semibold text-text-primary">Need a custom plan for 500+ rooms or multiple brands?</h3>
            <p className="mt-2 text-sm text-text-secondary">Our solutions team will design a package tailored to your portfolio.</p>
            <button className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-6 text-sm font-medium text-white hover:bg-secondary/90 transition-colors">
              Talk to Sales <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">Pricing FAQ</h2>
            <p className="mt-4 text-text-secondary">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-border bg-background overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-text-primary">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-text-muted">
              Still have questions?{' '}
              <Link to="/" className="text-secondary hover:underline font-medium">Chat with our team</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}