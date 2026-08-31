import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Code,
  Webhook,
  Key,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const endpoints = [
  {
    category: 'Reservations',
    items: [
      {
        method: 'GET',
        path: '/v1/reservations',
        desc: 'List all reservations with filtering and pagination.',
      },
      { method: 'POST', path: '/v1/reservations', desc: 'Create a new reservation.' },
      {
        method: 'GET',
        path: '/v1/reservations/:id',
        desc: 'Retrieve a specific reservation by ID.',
      },
      { method: 'PATCH', path: '/v1/reservations/:id', desc: 'Update reservation details.' },
    ],
  },
  {
    category: 'Guests',
    items: [
      { method: 'GET', path: '/v1/guests', desc: 'Search guest profiles.' },
      { method: 'GET', path: '/v1/guests/:id', desc: 'Retrieve guest profile with stay history.' },
      { method: 'POST', path: '/v1/guests', desc: 'Create or merge a guest profile.' },
    ],
  },
  {
    category: 'Rooms & Inventory',
    items: [
      { method: 'GET', path: '/v1/rooms', desc: 'List rooms with status and housekeeping state.' },
      { method: 'GET', path: '/v1/inventory', desc: 'Availability grid for date range.' },
      {
        method: 'PATCH',
        path: '/v1/rooms/:id/status',
        desc: 'Update room status (clean, dirty, inspected).',
      },
    ],
  },
  {
    category: 'Rates & Pricing',
    items: [
      { method: 'GET', path: '/v1/rates', desc: 'Retrieve rate plans and derived rates.' },
      {
        method: 'POST',
        path: '/v1/rates/bulk-update',
        desc: 'Bulk update rates across date ranges.',
      },
      { method: 'GET', path: '/v1/rates/competitors', desc: 'Competitor rate snapshot.' },
    ],
  },
  {
    category: 'Folio & Billing',
    items: [
      { method: 'GET', path: '/v1/folios/:id', desc: 'Retrieve folio with transactions.' },
      { method: 'POST', path: '/v1/folios/:id/charges', desc: 'Post a charge or payment.' },
      { method: 'GET', path: '/v1/invoices', desc: 'List invoices with export options.' },
    ],
  },
  {
    category: 'Webhooks',
    items: [
      { method: 'POST', path: '/v1/webhooks', desc: 'Register a new webhook endpoint.' },
      { method: 'GET', path: '/v1/webhooks', desc: 'List registered webhooks.' },
      { method: 'DELETE', path: '/v1/webhooks/:id', desc: 'Remove a webhook subscription.' },
    ],
  },
];

const codeExample = `curl -X GET https://api.unifiedpms.com/v1/reservations \\
  -H "Authorization: Bearer {API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "checkIn": "2026-09-01",
    "checkOut": "2026-09-05",
    "status": "confirmed"
  }'`;

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(null);

  const copyCode = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary mb-6">
              <Terminal className="mr-1.5 h-3 w-3" />
              Developer Portal
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Build on the <span className="text-secondary">Unified PMS</span> platform
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              RESTful API, webhooks, and comprehensive SDKs. Integrate reservations, guest data,
              rates, and billing into your applications.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/demo"
                className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
              >
                Get API Access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#endpoints"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-8 text-sm font-medium text-text-primary hover:bg-surface-elevated"
              >
                Browse Endpoints
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Quick start</h2>
              <p className="mt-2 text-text-secondary">
                Authenticate with your API key and make your first request in under 5 minutes.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Generate an API key</p>
                    <p className="text-sm text-text-secondary">
                      Go to Settings → Integrations → API Keys in your dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Include your key in headers</p>
                    <p className="text-sm text-text-secondary">
                      Pass{' '}
                      <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-secondary">
                        Authorization: Bearer {'{key}'}
                      </code>{' '}
                      with every request.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Start building</p>
                    <p className="text-sm text-text-secondary">
                      Use our sandbox environment for safe testing before going live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-1">
              <div className="flex items-center justify-between rounded-lg bg-[#0f172a] px-4 py-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-text-muted" />
                  <span className="text-xs font-medium text-text-muted">cURL</span>
                </div>
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-b-lg bg-[#0f172a] p-4 text-sm font-mono text-[#e2e8f0]">
                <code>{codeExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Key,
                title: 'API Key Management',
                desc: 'Rotate, scope, and audit keys from your dashboard.',
              },
              {
                icon: Webhook,
                title: 'Webhooks',
                desc: 'Subscribe to 40+ events with automatic retry logic.',
              },
              {
                icon: Code,
                title: 'SDKs',
                desc: 'Official libraries for Node.js, Python, Ruby, and PHP.',
              },
              {
                icon: BookOpen,
                title: 'OpenAPI Spec',
                desc: 'Download our Swagger spec for auto-generated clients.',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <f.icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">API Reference</h2>
            <p className="mt-2 text-text-secondary">
              Core endpoints for building hospitality applications.
            </p>
          </div>
          <div className="space-y-8">
            {endpoints.map((group) => (
              <div key={group.category}>
                <h3 className="text-lg font-semibold text-text-primary mb-3">{group.category}</h3>
                <div className="rounded-xl border border-border bg-background overflow-hidden">
                  {group.items.map((ep, i) => (
                    <button
                      key={ep.path}
                      onClick={() => setActiveEndpoint(activeEndpoint === ep.path ? null : ep.path)}
                      className={cn(
                        'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-4',
                        i !== group.items.length - 1 && 'border-b border-border',
                        activeEndpoint === ep.path && 'bg-secondary/5'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 items-center rounded px-2 text-[10px] font-bold uppercase tracking-wider',
                          ep.method === 'GET' && 'bg-info/10 text-info',
                          ep.method === 'POST' && 'bg-accent/10 text-accent',
                          ep.method === 'PATCH' && 'bg-warning/10 text-warning',
                          ep.method === 'DELETE' && 'bg-danger/10 text-danger'
                        )}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-text-primary">{ep.path}</code>
                      <span className="text-xs text-text-secondary sm:ml-auto">{ep.desc}</span>
                      <ChevronRight
                        className={cn(
                          'hidden h-4 w-4 text-text-muted sm:block',
                          activeEndpoint === ep.path && 'rotate-90'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Ready to integrate?</h2>
          <p className="mt-4 text-text-secondary">Get sandbox access and start building today.</p>
          <Link
            to="/demo"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-secondary px-8 text-sm font-medium text-white hover:bg-secondary/90"
          >
            Request API Access <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
