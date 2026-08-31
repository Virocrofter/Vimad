import { Link } from 'react-router-dom';
import { CreditCard, Lock, Fingerprint, Server, FileCheck, RefreshCw } from 'lucide-react';

export default function PCIDSSPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
            <CreditCard className="h-6 w-6 text-info" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">PCI DSS Compliance</h1>
          <p className="mt-2 text-sm text-text-muted">
            Unified PMS maintains PCI DSS Level 1 Service Provider certification — the highest level of payment card security.
          </p>
        </div>

        <div className="space-y-8 text-text-secondary">
          <section className="rounded-xl border border-info/20 bg-info/5 p-6">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-info" />
              <h2 className="text-lg font-semibold text-text-primary">Certification Status</h2>
            </div>
            <p className="mt-2 leading-relaxed">
              Unified PMS is certified as a <strong className="text-text-primary">PCI DSS Level 1 Service Provider</strong>. This certification is validated annually by an independent Qualified Security Assessor (QSA) and covers all cardholder data environments (CDEs) within our platform.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">Level 1 Service Provider</span>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Annual QSA Audit</span>
              <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">SAQ-D Validated</span>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Security Controls</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lock, title: 'Encryption', desc: 'AES-256 encryption at rest and TLS 1.3 in transit for all cardholder data.' },
                { icon: Fingerprint, title: 'Tokenization', desc: 'Primary account numbers (PANs) are replaced with non-sensitive tokens.' },
                { icon: Server, title: 'Network Segmentation', desc: 'Cardholder data environments are isolated with strict access controls.' },
                { icon: RefreshCw, title: 'Continuous Monitoring', desc: '24/7 intrusion detection, vulnerability scanning, and log analysis.' },
              ].map((control) => (
                <div key={control.title} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <control.icon className="h-4 w-4 text-secondary" />
                    <h3 className="font-medium text-text-primary">{control.title}</h3>
                  </div>
                  <p className="mt-1 text-sm">{control.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Shared Responsibility</h2>
            <p className="mt-2 leading-relaxed">
              While Unified PMS secures the platform infrastructure, our customers are responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Maintaining secure endpoint devices (front desk computers, tablets)</li>
              <li>Restricting physical access to payment terminals</li>
              <li>Training staff on cardholder data handling procedures</li>
              <li>Never storing CVV codes, PINs, or magnetic stripe data</li>
              <li>Using only PCI-compliant payment integrations provided through our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">Attestation of Compliance</h2>
            <p className="mt-2 leading-relaxed">
              A copy of our current Attestation of Compliance (AOC) and Responsibility Matrix is available to active customers upon request through your account manager or by emailing <a href="mailto:security@unifiedpms.com" className="text-secondary hover:underline">security@unifiedpms.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}