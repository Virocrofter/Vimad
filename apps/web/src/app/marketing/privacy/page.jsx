import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Server, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Shield className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">Privacy Policy</h1>
          <p className="mt-2 text-sm text-text-muted">Last updated: August 11, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-xl font-semibold text-text-primary">1. Introduction</h2>
              <p className="mt-2 leading-relaxed">
                Unified PMS (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed
                to protecting your privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our property management
                platform, websites, and related services (collectively, the &ldquo;Services&rdquo;).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">2. Information We Collect</h2>
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="flex items-center gap-2 font-medium text-text-primary">
                    <Eye className="h-4 w-4 text-secondary" /> Personal Information
                  </h3>
                  <p className="mt-1 text-sm">
                    Name, email address, phone number, billing information, and property details
                    provided during account registration.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="flex items-center gap-2 font-medium text-text-primary">
                    <Server className="h-4 w-4 text-secondary" /> Usage Data
                  </h3>
                  <p className="mt-1 text-sm">
                    Log data, device information, IP addresses, browser type, and pages visited
                    within our platform.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="flex items-center gap-2 font-medium text-text-primary">
                    <Lock className="h-4 w-4 text-secondary" /> Guest Data
                  </h3>
                  <p className="mt-1 text-sm">
                    As a data processor, we handle guest reservation data, preferences, and stay
                    history on behalf of your property.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">
                3. How We Use Your Information
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Provide, operate, and maintain our Services</li>
                <li>Process transactions and send related information</li>
                <li>Improve, personalize, and expand our platform</li>
                <li>Communicate with you about updates, security alerts, and support</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">
                4. Data Sharing & Disclosure
              </h2>
              <p className="mt-2 leading-relaxed">
                We do not sell your personal information. We may share data with trusted third-party
                service providers (cloud hosting, payment processing, analytics) under strict
                confidentiality agreements. We may also disclose information if required by law or
                to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">5. Data Security</h2>
              <p className="mt-2 leading-relaxed">
                We implement industry-standard security measures including AES-256 encryption at
                rest, TLS 1.3 in transit, and SOC 2 Type II certified infrastructure. Access to data
                is restricted to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">6. Your Rights</h2>
              <p className="mt-2 leading-relaxed">
                Depending on your jurisdiction, you may have the right to access, correct, delete,
                or port your personal data. To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@unifiedpms.com" className="text-secondary hover:underline">
                  privacy@unifiedpms.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary">7. Contact Us</h2>
              <p className="mt-2 leading-relaxed">
                If you have questions about this Privacy Policy, please contact our Data Protection
                Officer:
              </p>
              <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                <p className="text-sm text-text-secondary">Unified PMS Data Protection Officer</p>
                <p className="text-sm text-text-secondary">123 Hospitality Way, Suite 400</p>
                <p className="text-sm text-text-secondary">San Francisco, CA 94105</p>
                <a
                  href="mailto:privacy@unifiedpms.com"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-secondary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> privacy@unifiedpms.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
