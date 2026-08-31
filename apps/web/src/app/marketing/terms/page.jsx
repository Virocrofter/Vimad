import { Link } from 'react-router-dom';
import { FileText, Scale, AlertCircle, RefreshCw } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <Scale className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">Terms of Service</h1>
          <p className="mt-2 text-sm text-text-muted">Last updated: August 11, 2026</p>
        </div>

        <div className="space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary">1. Agreement to Terms</h2>
            <p className="mt-2 leading-relaxed">
              By accessing or using Unified PMS (&ldquo;the Platform&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree, you may not use our Services. These
              terms apply to all visitors, users, and others who access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">2. Description of Services</h2>
            <p className="mt-2 leading-relaxed">
              Unified PMS provides cloud-based property management software for hotels, resorts, and
              hospitality businesses. Services include reservation management, front desk
              operations, billing, reporting, channel management, and guest portal functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">3. Account Registration</h2>
            <p className="mt-2 leading-relaxed">
              To use certain features, you must register for an account. You agree to provide
              accurate, current, and complete information during registration and to update such
              information to keep it accurate. You are responsible for safeguarding your password
              and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">4. Subscription & Billing</h2>
            <div className="mt-3 rounded-lg border border-border bg-surface p-4">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>Subscriptions are billed in advance on a monthly or annual basis.</li>
                <li>All fees are exclusive of taxes unless stated otherwise.</li>
                <li>
                  You may upgrade or downgrade your plan at any time; changes take effect at the
                  next billing cycle.
                </li>
                <li>No refunds for partial months or unused features.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">5. Acceptable Use</h2>
            <p className="mt-2 leading-relaxed">
              You agree not to use the Platform to: (a) violate any applicable law or regulation;
              (b) infringe intellectual property rights; (c) transmit malicious software; (d)
              attempt to gain unauthorized access; or (e) interfere with the integrity or
              performance of the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">6. Data Ownership</h2>
            <p className="mt-2 leading-relaxed">
              You retain all rights to your property and guest data. We claim no ownership over your
              data. You grant us a limited license to host, process, and transmit your data solely
              to provide and improve the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">7. Termination</h2>
            <p className="mt-2 leading-relaxed">
              You may terminate your account at any time through the Settings page. We may suspend
              or terminate your access if you violate these terms. Upon termination, your data will
              be retained for 30 days, after which it will be permanently deleted from active
              systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">8. Limitation of Liability</h2>
            <p className="mt-2 leading-relaxed">
              To the maximum extent permitted by law, Unified PMS shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or
              relating to your use of the Services. Our total liability shall not exceed the amount
              you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary">9. Changes to Terms</h2>
            <p className="mt-2 leading-relaxed">
              We may modify these terms at any time. We will notify you of material changes via
              email or through the Platform. Continued use after changes constitutes acceptance of
              the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
