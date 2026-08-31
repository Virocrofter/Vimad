import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, MessageCircle, FileText, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const categories = [
  {
    name: 'Getting Started',
    icon: BookOpen,
    articles: [
      { title: 'Quick Start Guide', excerpt: 'Set up your property in under 30 minutes.' },
      { title: 'Importing Reservations', excerpt: 'Migrate from OPERA 5, OnQ, or spreadsheets.' },
      { title: 'Adding Room Types', excerpt: 'Configure rooms, rates, and availability.' },
      { title: 'Inviting Your Team', excerpt: 'Add staff members with role-based access.' },
    ],
  },
  {
    name: 'Reservations & Front Desk',
    icon: FileText,
    articles: [
      { title: 'Creating a Reservation', excerpt: 'Walk-in, phone, OTA, and direct bookings.' },
      { title: 'Check-In & Check-Out', excerpt: 'Streamline arrival and departure workflows.' },
      { title: 'Managing No-Shows', excerpt: 'Automated policies and charge rules.' },
      { title: 'Guest Profiles', excerpt: 'CRM, preferences, and stay history.' },
    ],
  },
  {
    name: 'Billing & Payments',
    icon: FileText,
    articles: [
      { title: 'Posting Charges', excerpt: 'Room, incidental, and package charges.' },
      { title: 'Processing Payments', excerpt: 'Stripe, Adyen, and manual card entry.' },
      { title: 'Night Audit', excerpt: 'End-of-day procedures and reconciliation.' },
      { title: 'Invoicing', excerpt: 'Generate and email guest folios.' },
    ],
  },
  {
    name: 'Integrations',
    icon: MessageCircle,
    articles: [
      { title: 'Channel Manager Setup', excerpt: 'Connect Booking.com, Expedia, Airbnb.' },
      { title: 'Booking Engine', excerpt: 'Accept direct bookings on your website.' },
      { title: 'API & Webhooks', excerpt: 'Build custom integrations with our REST API.' },
      { title: 'Accounting Sync', excerpt: 'QuickBooks, Xero, and Sage connections.' },
    ],
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const allArticles = categories.flatMap((c) =>
    c.articles.map((a) => ({ ...a, category: c.name }))
  );
  const filtered =
    query.length > 1
      ? allArticles.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <BookOpen className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary">Help Center</h1>
          <p className="mt-2 text-text-secondary">Find answers, tutorials, and best practices.</p>
        </div>

        {/* Search */}
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {query.length > 1 && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-text-muted">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.length > 0 ? (
              <div className="space-y-2">
                {filtered.map((article, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-4 text-left hover:bg-surface-elevated transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{article.title}</p>
                      <p className="text-xs text-text-muted">
                        {article.category} · {article.excerpt}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-sm text-text-secondary">
                  No articles found for &ldquo;{query}&rdquo;.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Try a different keyword or{' '}
                  <Link to="/contact" className="text-secondary hover:underline">
                    contact support
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {!query && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {categories.map((cat) => (
              <div key={cat.name} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <cat.icon className="h-5 w-5 text-secondary" />
                  <h2 className="font-semibold text-text-primary">{cat.name}</h2>
                </div>
                <div className="mt-3 space-y-1">
                  {cat.articles.map((article) => (
                    <button
                      key={article.title}
                      className="group flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
                    >
                      <span>{article.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 rounded-xl border border-border bg-surface p-6 text-center">
          <h3 className="font-semibold text-text-primary">Still need help?</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Our support team is available 24/7 for Professional and Enterprise customers.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Start Live Chat
            </button>
            <Link
              to="/contact"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-text-primary hover:bg-surface-elevated"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
