import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock, Users, Star, Building2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

const caseStudies = [
  {
    property: 'Grand Plaza Hotel',
    location: 'Chicago, IL',
    type: 'Boutique Hotel · 120 Rooms',
    quote: "We switched from OPERA 5 and trained our entire front desk staff in a single afternoon. The tape chart alone saves us 2 hours every day.",
    author: 'Sarah Chen',
    role: 'General Manager',
    metrics: [
      { label: 'RevPAR Increase', value: '+18%', icon: TrendingUp },
      { label: 'Training Time', value: '4 hrs', icon: Clock },
      { label: 'OTA Dependency', value: '-23%', icon: Users },
    ],
    tags: ['Migration', 'Front Desk', 'Revenue'],
  },
  {
    property: 'Seaside Resort & Spa',
    location: 'Miami, FL',
    type: 'Resort · 250 Rooms',
    quote: "The AI revenue manager increased our ADR by 14% in the first quarter. It pays for itself.",
    author: 'Marcus Johnson',
    role: 'Revenue Director',
    metrics: [
      { label: 'ADR Increase', value: '+14%', icon: TrendingUp },
      { label: 'Direct Bookings', value: '+31%', icon: Users },
      { label: 'Labor Savings', value: '12 hrs/wk', icon: Clock },
    ],
    tags: ['AI Revenue', 'Direct Bookings'],
  },
  {
    property: 'Harbor Inn Downtown',
    location: 'Seattle, WA',
    type: 'Independent · 45 Rooms',
    quote: "Our guests love the self-service portal. Check-in lines disappeared overnight.",
    author: 'Elena Rodriguez',
    role: 'Front Desk Manager',
    metrics: [
      { label: 'Guest Satisfaction', value: '4.9/5', icon: Star },
      { label: 'Check-in Time', value: '-60%', icon: Clock },
      { label: 'Staff Hours Saved', value: '8 hrs/wk', icon: Users },
    ],
    tags: ['Guest Portal', 'Contactless'],
  },
  {
    property: 'Mountain Lodge Collection',
    location: 'Aspen, CO',
    type: 'Hotel Group · 4 Properties',
    quote: "Managing four properties from one dashboard changed everything. We finally have visibility across the portfolio.",
    author: 'David Park',
    role: 'VP of Operations',
    metrics: [
      { label: 'Portfolio RevPAR', value: '+12%', icon: TrendingUp },
      { label: 'Reporting Time', value: '-85%', icon: Clock },
      { label: 'Properties', value: '4 → 8', icon: Building2 },
    ],
    tags: ['Multi-Property', 'Reporting'],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="bg-background">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">
            Trusted by hoteliers <span className="text-secondary">worldwide</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Real results from real properties. See how Unified PMS transforms operations, revenue, and guest experience.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {caseStudies.map((study, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-secondary uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5" />
                    {study.type}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-text-primary">{study.property}</h2>
                  <p className="text-sm text-text-muted">{study.location}</p>

                  <blockquote className="mt-4 text-lg text-text-primary leading-relaxed border-l-2 border-secondary pl-4">
                    "{study.quote}"
                  </blockquote>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-sm font-medium text-secondary">
                      {study.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{study.author}</p>
                      <p className="text-xs text-text-muted">{study.role}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {study.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-64 space-y-3">
                  {study.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border border-border bg-surface p-4 text-center">
                      <m.icon className="mx-auto h-5 w-5 text-secondary mb-1" />
                      <p className="text-2xl font-bold text-text-primary">{m.value}</p>
                      <p className="text-xs text-text-muted">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold text-text-primary">Ready to write your success story?</h2>
          <p className="mt-2 text-text-secondary">Join hundreds of properties already using Unified PMS.</p>
          <Link to="/demo" className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90">
            Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}