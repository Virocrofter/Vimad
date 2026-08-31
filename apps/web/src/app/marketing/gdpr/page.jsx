import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, Trash2, Download, Clock, MapPin } from 'lucide-react';

export default function GDPRPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <ShieldCheck className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">GDPR Compliance</h1>
          <p className="mt-2 text-sm text-text-muted">
            Unified PMS is fully committed to compliance with the EU General Data Protection Regulation (Regulation 2016/679).
          </p>
        </div>

        <div className="space-y-8 text-text-secondary">
          <section className="rounded-xl border border-accent/20 bg-accent/5 p-6">
            <h2 className="text-lg font-semibold text-text-primary">Our Role Under GDPR</h2>
            <p className="mt-2 leading-relaxed">
              Unified PMS acts as a <strong className="text-text-primary">Data Processor</strong> for guest data managed through our platform on behalf of our hotel customers (Data Controllers). For account and billing data, we act as a <strong className="text-text-primary">Data Controller</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Data Subject Rights</h2>
            <p className="mt-2">We have built tools and processes to help you fulfill data subject requests:</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { icon: UserCheck, title: 'Right to Access', desc: 'Export all personal data we hold about a data subject within 30 days.' },
                { icon: Trash2, title: 'Right to Erasure', desc: 'Permanently delete personal data across all systems and backups.' },
                { icon: Download, title: 'Right to Portability', desc: 'Download structured, machine-readable exports in JSON or CSV format.' },
                { icon: Clock, title: 'Right to Rectification', desc: 'Update inaccurate personal data through the dashboard or API.' },
              ].map((right) => (
                <div key={right.title} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <right.icon className="h-4 w-4 text-secondary" />
                    <h3 className="font-medium text-text-primary">{right.title}</h3>
                  </div>
                  <p className="mt-1 text-sm">{right.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Legal Basis for Processing</h2>
            <div className="mt-3 space-y-3">
              <div className="flex gap-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">1</div>
                <div>
                  <h3 className="font-medium text-text-primary">Contractual Necessity</h3>
                  <p className="text-sm">Processing necessary to provide the PMS services under our Terms of Service.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">2</div>
                <div>
                  <h3 className="font-medium text-text-primary">Legitimate Interests</h3>
                  <p className="text-sm">Fraud prevention, network security, and service improvement where not overridden by user rights.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">3</div>
                <div>
                  <h3 className="font-medium text-text-primary">Consent</h3>
                  <p className="text-sm">Marketing communications and optional analytics where users have provided explicit opt-in consent.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Data Transfers</h2>
            <p className="mt-2 leading-relaxed">
              We host data primarily within the European Union (Frankfurt, Germany). For customers outside the EU, we utilize Standard Contractual Clauses (SCCs) approved by the European Commission for any necessary data transfers. We are actively monitoring regulatory developments regarding EU-US data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Data Protection Officer</h2>
            <div className="mt-3 rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span className="font-medium text-text-primary">Contact our DPO</span>
              </div>
              <p className="mt-1 text-sm">Email: <a href="mailto:dpo@unifiedpms.com" className="text-secondary hover:underline">dpo@unifiedpms.com</a></p>
              <p className="text-sm">Response time: Within 72 hours</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}