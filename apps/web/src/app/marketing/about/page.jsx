import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Users, Globe, Award } from 'lucide-react';

const values = [
  { icon: Target, title: 'Mission-Driven', desc: 'We build technology that lets hoteliers focus on guests, not software.' },
  { icon: Eye, title: 'Transparent', desc: 'No hidden fees, no lock-in contracts, no surprise price hikes.' },
  { icon: Heart, title: 'Hospitality-First', desc: 'Designed by hoteliers, for hoteliers. Every feature starts with operational reality.' },
  { icon: Users, title: 'Customer-Obsessed', desc: 'White-glove onboarding and 24/7 support because your property never sleeps.' },
];

const stats = [
  { value: '200+', label: 'Hotels Powered' },
  { value: '30', label: 'Countries' },
  { value: '46', label: 'Core Modules' },
  { value: '99.99%', label: 'Uptime SLA' },
];

const team = [
  { name: 'Alex Morgan', role: 'CEO & Co-Founder', initials: 'AM' },
  { name: 'Jordan Lee', role: 'CTO & Co-Founder', initials: 'JL' },
  { name: 'Sarah Chen', role: 'Chief Product Officer', initials: 'SC' },
  { name: 'Marcus Johnson', role: 'VP of Revenue', initials: 'MJ' },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">
            Building the future of <span className="text-secondary">hospitality</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Unified PMS was founded by hoteliers who were tired of legacy software. Today we power properties across 30 countries.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-secondary">{s.value}</p>
                <p className="mt-1 text-sm text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Our Values</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-surface p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <v.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{v.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary">Leadership</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-background p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-lg font-bold text-secondary">
                  {t.initials}
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{t.name}</h3>
                <p className="text-sm text-text-muted">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold text-text-primary">Want to join the team?</h2>
          <p className="mt-2 text-text-secondary">We are always looking for hospitality-minded engineers and designers.</p>
          <Link to="/contact" className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90">
            Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}