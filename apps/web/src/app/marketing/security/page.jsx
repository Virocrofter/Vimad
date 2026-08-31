import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Key,
  Eye,
  Server,
  Zap,
  Globe,
  Clock,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

export default function SecurityOverviewPage() {
  // Security pages feel better in dark mode — respect user choice but default dark on mount
  useEffect(() => {
    const html = document.documentElement;
    const wasLight = html.classList.contains('light');
    if (wasLight) {
      // Only switch if user hasn't explicitly chosen light in this session
      const stored = localStorage.getItem('pms-theme-storage');
      const parsed = stored ? JSON.parse(stored) : null;
      if (!parsed?.state?.theme || parsed.state.theme === 'system') {
        html.classList.remove('light');
        html.classList.add('dark');
      }
    }
  }, []);

  const pillars = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      desc: 'All data is encrypted in transit with TLS 1.3 and at rest with AES-256. Customer data is logically isolated using row-level security.',
    },
    {
      icon: Key,
      title: 'Identity & Access',
      desc: 'SSO via SAML 2.0 / OIDC, multi-factor authentication (TOTP/WebAuthn), and role-based access control (RBAC) with principle of least privilege.',
    },
    {
      icon: Eye,
      title: 'Threat Detection',
      desc: '24/7 SOC monitoring with automated anomaly detection, DDoS mitigation via Cloudflare, and real-time vulnerability scanning.',
    },
    {
      icon: Server,
      title: 'Infrastructure',
      desc: 'Cloud-native architecture on AWS & GCP with auto-scaling, multi-region failover, and daily encrypted backups with 30-day retention.',
    },
    {
      icon: Zap,
      title: 'Incident Response',
      desc: 'Defined IR playbook with 15-minute response SLA for critical issues. Automated containment and customer notification within 1 hour.',
    },
    {
      icon: Globe,
      title: 'Compliance',
      desc: 'SOC 2 Type II, PCI DSS Level 1, GDPR, and CCPA compliant. Regular third-party penetration testing and continuous compliance monitoring.',
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-surface py-20">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
            <Shield className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Security at Unified PMS
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Trust is the foundation of hospitality technology. We protect your property and guest
            data with enterprise-grade security at every layer.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary">
              <FileCheck className="h-3.5 w-3.5 text-accent" /> SOC 2 Type II
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary">
              <FileCheck className="h-3.5 w-3.5 text-accent" /> PCI DSS Level 1
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary">
              <FileCheck className="h-3.5 w-3.5 text-accent" /> GDPR Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary">
              <FileCheck className="h-3.5 w-3.5 text-accent" /> ISO 27001
            </span>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-secondary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <p.icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Uptime SLA', value: '99.99%' },
              { label: 'Data Encryption', value: 'AES-256' },
              { label: 'RTO', value: '< 1 hour' },
              { label: 'Pen Tests / Year', value: '4+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-secondary">{stat.value}</p>
                <p className="mt-1 text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h2 className="mt-4 text-2xl font-bold text-text-primary">Report a Security Issue</h2>
          <p className="mt-2 text-text-secondary">
            We operate a responsible disclosure program. If you discover a vulnerability, please
            report it to{' '}
            <a href="mailto:security@unifiedpms.com" className="text-secondary hover:underline">
              security@unifiedpms.com
            </a>
            . We commit to acknowledging reports within 24 hours and resolving critical issues
            within 72 hours.
          </p>
        </div>
      </section>
    </div>
  );
}
