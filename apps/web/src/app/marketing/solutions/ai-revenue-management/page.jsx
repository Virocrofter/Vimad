import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Globe,
  Clock,
  Shield,
  Check,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

const models = [
  {
    icon: Brain,
    title: 'LSTM Demand Forecasting',
    desc: 'Neural network predicts occupancy 30/60/90 days out with confidence intervals based on historical patterns, seasonality, and local events.',
  },
  {
    icon: Target,
    title: 'Bayesian Price Elasticity',
    desc: 'Understands how price changes affect booking probability per room type, channel, and guest segment.',
  },
  {
    icon: Zap,
    title: 'Auto-Yield Rules',
    desc: 'Set automation level from "suggest" to "fully auto." The system adjusts rates in real-time based on your guardrails.',
  },
  {
    icon: Globe,
    title: 'Competitor Rate Tracking',
    desc: "Monitors up to 10 competitors per property. Alerts when you're underpriced or when parity is broken.",
  },
];

const results = [
  {
    property: 'Seaside Resort & Spa',
    rooms: 87,
    lift: '+18%',
    adr: '$189 → $223',
    period: '90 days',
  },
  {
    property: 'Urban Boutique Collection',
    rooms: 42,
    lift: '+14%',
    adr: '$156 → $178',
    period: '90 days',
  },
  {
    property: 'Harbor Inn Downtown',
    rooms: 120,
    lift: '+22%',
    adr: '$134 → $163',
    period: '90 days',
  },
  { property: 'Mountain Lodge', rooms: 35, lift: '+11%', adr: '$210 → $233', period: '90 days' },
];

const safeguards = [
  {
    icon: Shield,
    title: 'Confidence Scores',
    desc: 'Every recommendation shows a confidence percentage. Low confidence? The system suggests rather than acts.',
  },
  {
    icon: AlertTriangle,
    title: 'Override in One Click',
    desc: 'Revenue managers can override any AI decision instantly. The system learns from overrides.',
  },
  {
    icon: Clock,
    title: 'What-If Simulator',
    desc: 'Test rate changes before applying them. See predicted impact on occupancy and revenue.',
  },
  {
    icon: DollarSign,
    title: 'Floor & Ceiling Guardrails',
    desc: 'Set absolute min/max rates per room type. The AI never violates your business rules.',
  },
];

export default function AIRevenueManagementPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Brain className="mr-1.5 h-3 w-3" />
              AI-Powered Revenue Optimization
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Stop Guessing. <span className="text-secondary">Start Optimizing.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Machine learning models analyze demand patterns, competitor rates, and booking pace to
              recommend the optimal price for every room, every night.
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
                See AI in Action
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Models */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Four AI models. One revenue engine.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              Each model specializes in a different dimension of revenue optimization. Together,
              they deliver recommendations no human analyst could calculate.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((m) => (
              <div
                key={m.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-secondary/50 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <m.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Real results from real hotels</h2>
            <p className="mt-2 text-text-secondary">
              Average RevPAR lift within 90 days of enabling AI Revenue Manager.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">Property</th>
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">Rooms</th>
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">
                    RevPAR Lift
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">
                    ADR Change
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-text-primary">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r) => (
                  <tr
                    key={r.property}
                    className="bg-background hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-primary">{r.property}</td>
                    <td className="px-6 py-4 text-text-secondary">{r.rooms}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        <TrendingUp className="mr-1 h-3 w-3" /> {r.lift}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{r.adr}</td>
                    <td className="px-6 py-4 text-text-muted">{r.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Safeguards */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-text-primary">You stay in control</h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              AI recommendations are powerful — but you're always the final decision maker.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {safeguards.map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-background p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <s.icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="mt-3 font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Let AI find your optimal rate</h2>
          <p className="mt-4 text-text-secondary">
            Included in Professional and Enterprise plans. Start optimizing your revenue in minutes,
            not months.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> No data scientist required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> Setup in 10 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-accent" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
