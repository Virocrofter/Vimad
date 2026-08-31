import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';

const posts = [
  {
    title: 'How AI Revenue Management Increased RevPAR by 18%',
    excerpt:
      'Grand Plaza Hotel switched to automated pricing and saw results within one quarter. Here is exactly how they did it.',
    category: 'Product',
    date: 'Aug 5, 2026',
    readTime: '6 min read',
    featured: true,
  },
  {
    title: 'Migrating from OPERA 5: A Complete Playbook',
    excerpt: 'Data mapping, staff training, and parallel-run strategies for a seamless transition.',
    category: 'Industry',
    date: 'Jul 28, 2026',
    readTime: '8 min read',
    featured: false,
  },
  {
    title: 'The Real Cost of OTA Commissions (And How to Reduce Them)',
    excerpt: 'Why direct bookings matter more than ever and the technology stack that drives them.',
    category: 'Tips',
    date: 'Jul 15, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    title: 'Building a Real-Time Tape Chart with WebSockets',
    excerpt: 'An engineering deep dive into how we built our drag-and-drop reservation grid.',
    category: 'Engineering',
    date: 'Jul 2, 2026',
    readTime: '10 min read',
    featured: false,
  },
  {
    title: 'Night Audit Automation: Save 2 Hours Every Day',
    excerpt: 'How automated end-of-day processing reduces errors and frees up your night manager.',
    category: 'Product',
    date: 'Jun 20, 2026',
    readTime: '4 min read',
    featured: false,
  },
  {
    title: 'PCI DSS Level 1: What It Means for Your Property',
    excerpt: 'A practical guide to payment security compliance for independent hotels.',
    category: 'Industry',
    date: 'Jun 10, 2026',
    readTime: '7 min read',
    featured: false,
  },
];

export default function BlogPage() {
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="bg-background">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">
              Hospitality Insights
            </h1>
            <p className="mt-4 text-text-secondary">
              Product updates, industry trends, and operational best practices.
            </p>
          </div>

          {featured && (
            <div className="mb-12 rounded-xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-medium text-secondary mb-3">
                <Tag className="h-3.5 w-3.5" /> Featured · {featured.category}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">{featured.title}</h2>
              <p className="mt-2 text-text-secondary max-w-2xl">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {featured.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {featured.readTime}
                </span>
              </div>
              <button className="mt-4 inline-flex items-center text-sm font-medium text-secondary hover:underline">
                Read article <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-surface p-5 hover:border-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-secondary mb-2">
                  <Tag className="h-3.5 w-3.5" /> {post.category}
                </div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-secondary transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
