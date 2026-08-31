import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Users,
  Shield,
  Zap,
  Globe,
  Clock,
  Play,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ChevronDown,
  Mail,
  Building2,
  Hotel,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

/* ─── Animated Tape Chart Background ─── */
function AnimatedTapeChart() {
  const rooms = ['101', '102', '103', '104', '105', '106', '107', '108'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const bookings = [
    { room: 0, day: 0, span: 2, color: 'bg-secondary/60' },
    { room: 1, day: 1, span: 3, color: 'bg-accent/60' },
    { room: 2, day: 0, span: 1, color: 'bg-warning/60' },
    { room: 3, day: 2, span: 2, color: 'bg-info/60' },
    { room: 4, day: 1, span: 4, color: 'bg-secondary/50' },
    { room: 5, day: 3, span: 2, color: 'bg-accent/50' },
    { room: 6, day: 0, span: 3, color: 'bg-info/50' },
    { room: 7, day: 4, span: 2, color: 'bg-secondary/40' },
    { room: 0, day: 3, span: 2, color: 'bg-accent/40' },
    { room: 2, day: 2, span: 3, color: 'bg-secondary/70' },
    { room: 5, day: 0, span: 2, color: 'bg-warning/50' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.15] dark:opacity-[0.08] pointer-events-none select-none">
      <div className="absolute inset-0 flex items-center justify-center scale-110">
        <div className="w-full max-w-5xl p-8">
          {/* Header row */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
            <div />
            {days.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-text-primary uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Room rows */}
          {rooms.map((room, rIdx) => (
            <div key={room} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1.5">
              <div className="flex items-center text-xs font-mono text-text-secondary pr-2">
                {room}
              </div>
              {days.map((_, dIdx) => (
                <div
                  key={dIdx}
                  className="h-10 rounded border border-border/40 bg-surface/30 relative overflow-hidden"
                >
                  {bookings
                    .filter((b) => b.room === rIdx && b.day === dIdx)
                    .map((b, i) => (
                      <div
                        key={i}
                        className={cn(
                          'absolute inset-y-0.5 left-0.5 rounded animate-pulse',
                          b.color
                        )}
                        style={{
                          width: `calc(${b.span * 100}% + ${(b.span - 1) * 4}px)`,
                          animationDuration: '3s',
                          animationDelay: `${rIdx * 0.2 + dIdx * 0.1}s`,
                        }}
                      />
                    ))}
                </div>
              ))}
            </div>
          ))}

          {/* Floating particles */}
          <div
            className="absolute top-10 left-20 h-2 w-2 rounded-full bg-secondary/40 animate-bounce"
            style={{ animationDuration: '4s' }}
          />
          <div
            className="absolute top-32 right-32 h-3 w-3 rounded-full bg-accent/30 animate-bounce"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-20 left-1/3 h-2 w-2 rounded-full bg-info/30 animate-bounce"
            style={{ animationDuration: '6s', animationDelay: '2s' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Trust Bar ─── */
function TrustBar() {
  const logos = [
    { name: 'Grand Plaza', abbr: 'GP' },
    { name: 'Seaside Resort', abbr: 'SR' },
    { name: 'Mountain Lodge', abbr: 'ML' },
    { name: 'Urban Boutique', abbr: 'UB' },
    { name: 'Harbor Inn', abbr: 'HI' },
    { name: 'Royal Gardens', abbr: 'RG' },
  ];

  return (
    <section className="border-y border-border bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-text-secondary mb-6">
          Trusted by <span className="text-text-primary font-semibold">200+ hotels</span> across{' '}
          <span className="text-text-primary font-semibold">30 countries</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          {logos.map((logo) => (
            <div key={logo.abbr} className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-elevated border border-border text-xs font-bold text-text-muted group-hover:text-text-secondary group-hover:border-text-muted transition-colors">
                {logo.abbr}
              </div>
              <span className="text-sm font-medium text-text-muted group-hover:text-text-secondary transition-colors hidden sm:block">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Problem / Solution ─── */
function ProblemSolution() {
  const pains = [
    {
      icon: Clock,
      title: 'Training Burden',
      desc: 'Staff need 40+ hours to learn legacy PMS systems. Turnover becomes a nightmare.',
    },
    {
      icon: Globe,
      title: 'OTA Dependency',
      desc: 'Commission fees eat 15-25% of revenue. You own nothing about your guest relationships.',
    },
    {
      icon: Shield,
      title: 'IT Costs',
      desc: 'On-premise servers, VPNs, and manual backups drain budget and create security risks.',
    },
  ];

  const solutions = [
    {
      icon: Zap,
      title: '4-Hour Training',
      desc: 'Intuitive design means new hires are productive on day one. No certification courses required.',
    },
    {
      icon: BarChart3,
      title: 'AI Revenue Manager',
      desc: 'Automated pricing recommendations reduce OTA dependency and increase direct bookings by 23%.',
    },
    {
      icon: Cloud,
      title: 'Zero IT Footprint',
      desc: 'Cloud-native, PCI-DSS compliant, auto-updating. No servers. No maintenance. No worries.',
    },
  ];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Your PMS is costing you more than you think
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Legacy systems weren't built for modern hospitality. Here's what hoteliers struggle with
            every day — and how we fix it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Pain Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-danger mb-4 flex items-center gap-2">
              <X className="h-4 w-4" /> The Pain
            </h3>
            {pains.map((pain) => (
              <div
                key={pain.title}
                className="rounded-xl border border-danger/20 bg-danger/5 p-5 flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                  <pain.icon className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{pain.title}</h4>
                  <p className="mt-1 text-sm text-text-secondary leading-relaxed">{pain.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Solution Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4 flex items-center gap-2">
              <Check className="h-4 w-4" /> The Solution
            </h3>
            {solutions.map((sol) => (
              <div
                key={sol.title}
                className="rounded-xl border border-accent/20 bg-accent/5 p-5 flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <sol.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{sol.title}</h4>
                  <p className="mt-1 text-sm text-text-secondary leading-relaxed">{sol.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Cloud icon not imported from lucide in the original, adding inline
function Cloud({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" />
      <path d="M17.5 19H19c1.933 0 3.5-1.567 3.5-3.5S20.933 12 19 12c-.267 0-.526.03-.776.087C17.83 8.64 14.71 6 11 6c-3.866 0-7 3.134-7 7 0 .34.024.675.071 1.006C2.32 14.33 1 15.963 1 17.5 1 19.433 2.567 21 4.5 21h13" />
    </svg>
  );
}

/* ─── Product Screenshot Carousel ─── */
function ProductShowcase() {
  const [active, setActive] = useState(0);
  const screenshots = [
    {
      title: 'Command Center',
      desc: 'Real-time KPIs, alerts, and activity feed in one glance.',
      render: () => (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {[78, 189, 147, 142].map((v, i) => (
              <div key={i} className="rounded-lg bg-surface p-3 border border-border">
                <div className="text-xs text-text-muted mb-1">
                  {['Occupancy', 'ADR', 'RevPAR', 'Guests'][i]}
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {i === 0 ? `${v}%` : i === 3 ? v : `$${v}`}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-surface border border-border p-3">
            <div className="text-xs font-medium text-text-secondary mb-2">Recent Activity</div>
            {['Check-in • Room 204', 'Check-out • Room 312', 'New Booking • Room 105'].map(
              (a, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0"
                >
                  <span className="text-text-secondary">{a}</span>
                  <span className="text-text-muted text-xs">{['2m', '15m', '1h'][i]} ago</span>
                </div>
              )
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Tape Chart',
      desc: 'Drag-and-drop reservations with 7/30/90-day views.',
      render: () => (
        <div className="space-y-2">
          <div className="flex gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="flex-1 text-center text-[10px] text-text-muted uppercase">
                {d}
              </div>
            ))}
          </div>
          {['101', '102', '103', '104', '105'].map((room) => (
            <div key={room} className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 items-center">
              <span className="text-[10px] font-mono text-text-muted">{room}</span>
              {Array.from({ length: 7 }).map((_, i) => {
                const hasBooking =
                  (room === '101' && i < 3) ||
                  (room === '103' && i > 2 && i < 6) ||
                  (room === '105' && i === 1);
                const isStart =
                  (room === '101' && i === 0) ||
                  (room === '103' && i === 3) ||
                  (room === '105' && i === 1);
                return (
                  <div
                    key={i}
                    className="h-6 rounded-sm border border-border/40 bg-surface/50 relative"
                  >
                    {hasBooking && isStart && (
                      <div
                        className={cn(
                          'absolute inset-y-0.5 left-0.5 rounded-sm',
                          room === '101'
                            ? 'bg-secondary/70 w-[calc(300%+8px)]'
                            : room === '103'
                              ? 'bg-accent/70 w-[calc(200%+6px)]'
                              : 'bg-info/70 w-[calc(100%+2px)]'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Guest Portal',
      desc: 'White-label self-service check-in, folio, and messaging.',
      render: () => (
        <div className="space-y-3">
          <div className="rounded-lg bg-surface border border-border p-4 text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
              Upcoming Stay
            </div>
            <div className="text-lg font-bold text-text-primary">Grand Plaza Hotel</div>
            <div className="text-sm text-text-secondary mt-1">Aug 15 — Aug 18, 2026</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Check className="h-3 w-3" /> Confirmed
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Online Check-in', 'View Folio', 'Message Hotel', 'Room Upgrade'].map((action) => (
              <button
                key={action}
                className="rounded-lg border border-border bg-surface p-2 text-xs font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const next = () => setActive((a) => (a + 1) % screenshots.length);
  const prev = () => setActive((a) => (a - 1 + screenshots.length) % screenshots.length);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              See how <span className="text-secondary">Grand Plaza</span> increased RevPAR by 18%
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              From the front desk to the back office, every screen is designed for speed and
              clarity. Your staff will actually enjoy using their PMS.
            </p>

            <div className="mt-8 space-y-3">
              {screenshots.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => setActive(i)}
                  className={cn(
                    'w-full text-left rounded-lg border p-4 transition-all',
                    active === i
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-background hover:bg-surface-elevated'
                  )}
                >
                  <h4
                    className={cn(
                      'font-semibold',
                      active === i ? 'text-secondary' : 'text-text-primary'
                    )}
                  >
                    {s.title}
                  </h4>
                  <p className="mt-1 text-sm text-text-secondary">{s.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={prev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-surface-elevated"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-surface-elevated"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5 ml-2">
                {screenshots.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      active === i ? 'w-6 bg-secondary' : 'w-1.5 bg-border'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-secondary/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-xl border border-border bg-background shadow-xl p-6 min-h-[360px]">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <div className="h-3 w-3 rounded-full bg-danger/80" />
                <div className="h-3 w-3 rounded-full bg-warning/80" />
                <div className="h-3 w-3 rounded-full bg-accent/80" />
                <span className="ml-2 text-xs text-text-muted font-mono">unified-pms.app</span>
              </div>
              <div className="animate-fade-in">{screenshots[active].render()}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  const features = [
    {
      icon: Calendar,
      title: 'Reservations',
      desc: 'Intuitive booking management with drag-and-drop calendar and real-time availability.',
    },
    {
      icon: Users,
      title: 'Front Desk',
      desc: 'Lightning-fast check-in/out with guest profile cards and digital key integration.',
    },
    {
      icon: BarChart3,
      title: 'Revenue',
      desc: 'AI-powered pricing recommendations, demand forecasting, and competitor tracking.',
    },
    {
      icon: Shield,
      title: 'Security',
      desc: 'PCI DSS compliant with role-based access control and end-to-end encryption.',
    },
    {
      icon: Zap,
      title: 'Integrations',
      desc: 'Connect with 50+ OTAs, payment gateways, and accounting systems seamlessly.',
    },
    {
      icon: Globe,
      title: 'Guest Portal',
      desc: 'White-label self-service portal for online check-in, folio review, and messaging.',
    },
  ];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Everything you need to run a modern hotel
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            From reservations to revenue management, Unified PMS replaces your entire tech stack.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-surface p-6 hover:border-secondary/50 hover:shadow-md transition-all"
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
  );
}

/* ─── Video Testimonials ─── */
function Testimonials() {
  const testimonials = [
    {
      quote:
        'We switched from OPERA 5 and trained our entire front desk staff in a single afternoon. The tape chart alone saves us 2 hours every day.',
      author: 'Sarah Chen',
      role: 'General Manager',
      property: 'Seaside Resort & Spa',
      rating: 5,
    },
    {
      quote:
        'The AI revenue manager increased our ADR by 14% in the first quarter. It pays for itself.',
      author: 'Marcus Johnson',
      role: 'Revenue Director',
      property: 'Urban Boutique Collection',
      rating: 5,
    },
    {
      quote: 'Our guests love the self-service portal. Check-in lines disappeared overnight.',
      author: 'Elena Rodriguez',
      role: 'Front Desk Manager',
      property: 'Harbor Inn Downtown',
      rating: 5,
    },
  ];

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Loved by hoteliers worldwide
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Don't just take our word for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-background p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-text-primary leading-relaxed flex-1">"{t.quote}"</p>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-medium text-secondary">
                  {t.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{t.author}</p>
                  <p className="text-xs text-text-muted">
                    {t.role}, {t.property}
                  </p>
                </div>
                <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                  <Play className="h-3 w-3 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Preview ─── */
function PricingPreview() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: 'Starter',
      price: 199,
      annual: 165,
      limit: 'Up to 75 rooms',
      features: ['Core PMS', 'Reservations', 'Basic Reporting'],
    },
    {
      name: 'Professional',
      price: 499,
      annual: 414,
      limit: 'Up to 200 rooms',
      features: ['Everything in Starter', 'Booking Engine', 'Channel Manager', 'CRM & Loyalty'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 999,
      annual: 829,
      limit: 'Unlimited rooms',
      features: ['Everything in Pro', 'Multi-Property', 'AI Revenue Manager', 'Priority Support'],
    },
  ];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            No setup fees. No contracts. Cancel anytime.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-border bg-surface p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                !isAnnual
                  ? 'bg-secondary text-white'
                  : 'text-text-secondary hover:text-text-primary'
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-xl border bg-surface p-6 transition-all hover:shadow-lg',
                tier.popular ? 'border-secondary ring-1 ring-secondary' : 'border-border'
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
              <p className="text-xs text-text-muted mt-1">{tier.limit}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text-primary">
                  ${isAnnual ? tier.annual : tier.price}
                </span>
                <span className="text-sm text-text-muted">/mo</span>
              </div>
              {isAnnual && (
                <p className="text-xs text-text-muted mt-1 line-through">
                  ${tier.price}/mo billed monthly
                </p>
              )}
              <ul className="mt-6 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Check className="h-4 w-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className={cn(
                  'mt-6 inline-flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors',
                  tier.popular
                    ? 'bg-secondary text-white hover:bg-secondary/90'
                    : 'border border-border bg-background text-text-primary hover:bg-surface-elevated'
                )}
              >
                {tier.popular ? 'Start Free Trial' : 'Learn More'}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            Need White-Label or 50+ properties?{' '}
            <Link to="/pricing" className="text-secondary hover:underline">
              Contact Sales
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: 'How long does migration from OPERA 5 or OnQ take?',
      a: 'Most properties are fully migrated within 2-3 weeks. We handle data mapping, historical reservation import, and staff training as part of onboarding.',
    },
    {
      q: 'Is there a setup fee or long-term contract?',
      a: 'No setup fees, no contracts. You pay month-to-month and can cancel anytime. Annual plans get 2 months free (17% savings).',
    },
    {
      q: 'How does the 60-day free trial work?',
      a: 'You get full access to Starter or Professional features for 60 days with no credit card required. At the end, choose a plan or walk away.',
    },
    {
      q: 'Can we use our own branding for the guest portal?',
      a: 'Yes. Professional plans include basic white-labeling. Enterprise and White-Label plans offer full custom branding, domain mapping, and API access.',
    },
    {
      q: 'What integrations are available?',
      a: 'We connect with 50+ OTAs (Booking.com, Expedia, Airbnb), payment gateways (Stripe, Adyen), and accounting systems (QuickBooks, Xero).',
    },
    {
      q: 'Is my data secure and compliant?',
      a: 'Unified PMS is PCI DSS Level 1 compliant, GDPR ready, and SOC 2 Type II certified. All data is encrypted at rest and in transit.',
    },
    {
      q: 'Do you offer training and support?',
      a: 'All plans include email support. Professional adds live chat. Enterprise includes a dedicated account manager and 24/7 phone support.',
    },
    {
      q: 'What happens during night audit?',
      a: 'Our automated night audit runs end-of-day processing with exception alerts. It auto-switches to dark mode during night shifts.',
    },
  ];

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-text-secondary">
            Everything you need to know about switching to Unified PMS.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-border bg-background overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium text-text-primary">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-text-muted transition-transform',
                    open === i && 'rotate-180'
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Ready to modernize your hotel?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-text-secondary">
          Join hundreds of hotels already using Unified PMS. Get a personalized 30-minute demo — no
          pressure, no commitment.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
        >
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="email"
              required
              placeholder="you@property.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'success'}
              className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            type="submit"
            disabled={status === 'success'}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              'Get Demo'
            )}
          </Button>
        </form>

        <p className="mt-4 text-sm text-text-muted">
          Or call us:{' '}
          <a href="tel:+18005551234" className="text-secondary hover:underline">
            +1-800-555-1234
          </a>
        </p>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> PCI Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> GDPR Ready
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> SOC 2 Type II
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function MarketingHome() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-24 sm:py-32">
        <AnimatedTapeChart />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              The Modern PMS Built for{' '}
              <span className="text-secondary">Hotels That Want to Grow</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Replace OPERA 5 and OnQ with a cloud-native platform that trains staff in 4 hours —
              not 40.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/app"
                className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
              >
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated transition-colors">
                <Play className="mr-2 h-4 w-4" /> Watch 2-Min Video
              </button>
            </div>
            <p className="mt-4 text-xs text-text-muted">
              No setup fees. No contracts. 60-day free trial.
            </p>
          </div>
        </div>
      </section>

      <TrustBar />
      <ProblemSolution />
      <ProductShowcase />
      <Features />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
