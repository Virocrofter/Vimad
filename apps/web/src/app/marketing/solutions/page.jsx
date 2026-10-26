import { Link } from 'react-router-dom';
import { ArrowRight, Hotel, Network, ScanFace, TrendingUp } from 'lucide-react';
import { Reveal, CTABand, PageHero, CheckItem } from '../../components/shared';

const solutions = [
  {
    icon: Hotel,
    title: 'Boutique hotels',
    desc: 'The operational muscle of a global chain for a 20-room property — without the enterprise clunk or price tag.',
    to: '/solutions/boutique-hotels',
  },
  {
    icon: Network,
    title: 'Hotel chains & groups',
    desc: 'One login across every property. Chain-wide dashboards, a shared guest profile and consolidated reporting.',
    to: '/solutions/hotel-chains',
  },
  {
    icon: ScanFace,
    title: 'Contactless check-in',
    desc: 'Pre-arrival registration, digital key handoff and a lobby that clears in minutes — not a queue.',
    to: '/solutions/contactless-checkin',
  },
  {
    icon: TrendingUp,
    title: 'AI revenue management',
    desc: 'Rate recommendations per room per day, reading your pace and local demand. Approve with one tap.',
    to: '/solutions/ai-revenue-management',
  },
];

const outcomes = [
  'Live in one week, not one quarter',
  'Full data migration handled by us — reservations, guests, history',
  'Front-desk training reduced to a single morning',
  'One subscription replaces PMS, channel manager, booking engine and CRM',
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="One platform, every kind of property."
        lede="Whether you run a design-led boutique, a multi-property group or anything in between — Vimad adapts to how you operate instead of forcing you into a template."
      >
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link to="/demo" className="mkt-btn mkt-btn-gold">
            Book a demo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/features" className="mkt-btn mkt-btn-ghost">
            Explore all features
          </Link>
        </div>
      </PageHero>

      <section className="mkt-section">
        <div className="mkt-container grid gap-4 md:grid-cols-2">
          {solutions.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <Link to={s.to} className="group block h-full">
                <div className="mkt-card h-full p-8 transition-colors group-hover:border-[color:var(--gold)]">
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ background: 'var(--gold-soft)' }}
                  >
                    <s.icon className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                  </div>
                  <h2 className="mkt-display mkt-h3">{s.title}</h2>
                  <p className="mt-3 leading-relaxed" style={{ color: 'var(--ivory-dim)' }}>
                    {s.desc}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: 'var(--gold)' }}
                  >
                    Learn more{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        className="mkt-section border-t border-[color:var(--line)]"
        style={{ background: 'var(--ink-2)' }}
      >
        <div className="mkt-container grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-5">
            <span className="mkt-eyebrow">Why hotels switch</span>
            <h2 className="mkt-display mkt-h2">The switch is easier than the staying</h2>
            <p className="mkt-lede">
              The biggest reason hotels delay replacing their PMS is fear of the migration. Vimad
              was built so that fear is unnecessary.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ul className="flex flex-col gap-4">
              {outcomes.map((o) => (
                <CheckItem key={o}>
                  <span className="text-base">{o}</span>
                </CheckItem>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <CTABand
        title="See your property on Vimad"
        lede="Tell us about your hotel and we'll show you exactly what week one looks like."
      />
    </>
  );
}
