/* src/app/guest-portal/support/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  MessageSquare,
  ChevronRight,
  CreditCard,
  KeyRound,
  Wifi,
  Utensils,
  Sparkles,
  FileText,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Help Center. FAQ copy is static content (real information, not mock data).
 * Contact paths route to real features: in-app messaging (delivered to the
 * front desk) and ticket creation. Property-specific details (Wi-Fi name,
 * phone numbers) intentionally generic — the property surfaces those at
 * check-in / in-room.
 */

const faqCategories = [
  {
    id: 'checkin',
    label: 'Check-in & Keys',
    icon: KeyRound,
    articles: [
      {
        q: 'What time is check-in and check-out?',
        a: 'Standard check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in and late check-out may be available upon request, subject to availability.',
      },
      {
        q: 'How do I use my digital key?',
        a: 'Your digital key is in the Keys section of this app. Once it activates on arrival day, show the key code at the door reader or to the front desk.',
      },
      {
        q: 'I forgot my room number',
        a: 'Your room number is displayed on your stay dashboard. You can also find it in your booking confirmation or ask the front desk.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Payments',
    icon: CreditCard,
    articles: [
      {
        q: 'When will my card be charged?',
        a: 'A hold may be placed on your card at check-in. Final charges are typically processed at check-out, though this may vary by rate type.',
      },
      {
        q: 'How do I split the bill?',
        a: 'Use the Bill Splitting feature in the Billing section to divide charges among multiple guests. Each guest can pay their portion separately.',
      },
      {
        q: 'Are resort fees included?',
        a: 'Resort fees, if applicable, are clearly displayed during booking and on your folio. They are typically charged per night.',
      },
    ],
  },
  {
    id: 'wifi',
    label: 'WiFi & Tech',
    icon: Wifi,
    articles: [
      {
        q: 'How do I connect to WiFi?',
        a: 'Guest Wi-Fi details are provided at check-in and displayed in your room. If you can’t find them, message the front desk from the Messages section.',
      },
      {
        q: 'The WiFi is slow',
        a: 'Try disconnecting and reconnecting. If issues persist, report it through the Issues section or message the front desk.',
      },
    ],
  },
  {
    id: 'dining',
    label: 'Dining & Room Service',
    icon: Utensils,
    articles: [
      {
        q: 'What are the room service hours?',
        a: 'Room service hours are shown on the menu in the Room Service section. Breakfast and all-day dining windows are listed per category.',
      },
      {
        q: 'Can you accommodate dietary restrictions?',
        a: 'Absolutely. Note dietary requirements in your profile preferences or when ordering. The kitchen can accommodate vegetarian, vegan, gluten-free, and most allergen requests.',
      },
    ],
  },
  {
    id: 'amenities',
    label: 'Amenities & Services',
    icon: Sparkles,
    articles: [
      {
        q: 'What time are the gym and pool open?',
        a: 'Current amenity hours are listed in the Status section of the app, which reflects any maintenance closures.',
      },
      {
        q: 'Is parking included?',
        a: 'Parking fees vary by property and room type. Check your booking details or ask the front desk for current rates.',
      },
    ],
  },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedArticle, setExpandedArticle] = useState(null);

  const quickLinks = [
    {
      label: 'Message Front Desk',
      icon: MessageSquare,
      href: '/guest-portal/messages',
      desc: 'Delivered directly to staff',
    },
    {
      label: 'Create Ticket',
      icon: FileText,
      href: '/guest-portal/support/tickets',
      desc: 'Track your requests',
    },
  ];

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter(
        (a) =>
          a.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.articles.length > 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Help Center</h1>
        <p className="text-sm text-text-secondary mt-1">
          Find answers or get in touch with our team
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.label}
              onClick={() => navigate(link.href)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:shadow-md hover:border-secondary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Icon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{link.label}</p>
                <p className="text-xs text-text-muted">{link.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
        </h2>

        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const Icon = cat.icon;
            const isExpanded = expandedCategory === cat.id;

            return (
              <div
                key={cat.id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated">
                      <Icon className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{cat.label}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-text-muted transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {cat.articles.map((article, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'px-5 py-3',
                          idx < cat.articles.length - 1 && 'border-b border-border'
                        )}
                      >
                        <button
                          onClick={() =>
                            setExpandedArticle(
                              expandedArticle === `${cat.id}-${idx}` ? null : `${cat.id}-${idx}`
                            )
                          }
                          className="flex items-start justify-between w-full text-left gap-3"
                        >
                          <span className="text-sm text-text-primary font-medium">{article.q}</span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 text-text-muted shrink-0 mt-0.5 transition-transform',
                              expandedArticle === `${cat.id}-${idx}` && 'rotate-90'
                            )}
                          />
                        </button>
                        {expandedArticle === `${cat.id}-${idx}` && (
                          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                            {article.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 rounded-xl border border-border bg-surface">
            <HelpCircle className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No results found for "{searchQuery}"</p>
            <p className="text-xs text-text-muted mt-1">
              Try a different search or contact support
            </p>
          </div>
        )}
      </div>

      {/* Still Need Help */}
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h3 className="text-sm font-semibold text-text-primary mb-2">Still need help?</h3>
        <p className="text-xs text-text-secondary mb-4">
          Our guest services team is available around the clock
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/guest-portal/messages')}>
            <MessageSquare className="mr-1.5 h-4 w-4" /> Message Front Desk
          </Button>
          <Button size="sm" onClick={() => navigate('/guest-portal/support/tickets')}>
            <FileText className="mr-1.5 h-4 w-4" /> Create Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
