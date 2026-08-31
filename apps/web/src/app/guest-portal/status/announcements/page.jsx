/* src/app/guest-portal/status/announcements/page.jsx */
import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Megaphone,
  Filter,
  Search,
  Sparkles,
  Wrench,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pin,
  Bell,
  BellOff,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestAnnouncements, formatDateTime, timeAgo } from '../../data';
import { GuestAnnouncementCard, EmptyState } from '../../components';

export default function PublicAnnouncementsPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const typeConfig = {
    feature: {
      label: 'Feature',
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      icon: Sparkles,
    },
    maintenance: {
      label: 'Maintenance',
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      icon: Wrench,
    },
    alert: {
      label: 'Alert',
      color: 'text-danger',
      bg: 'bg-danger/10',
      border: 'border-danger/20',
      icon: AlertTriangle,
    },
    update: {
      label: 'Update',
      color: 'text-info',
      bg: 'bg-info/10',
      border: 'border-info/20',
      icon: Info,
    },
  };

  const filtered = useMemo(() => {
    let result = guestAnnouncements.filter((a) => {
      const matchesQuery =
        !query ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.content.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      const isActive = a.status === 'published' && new Date(a.expiresAt) > new Date();
      return matchesQuery && matchesType && isActive;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.publishedAt) - new Date(a.publishedAt);
      if (sortBy === 'oldest') return new Date(a.publishedAt) - new Date(b.publishedAt);
      if (sortBy === 'priority') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [query, typeFilter, sortBy]);

  const stats = useMemo(
    () => ({
      total: guestAnnouncements.filter(
        (a) => a.status === 'published' && new Date(a.expiresAt) > new Date()
      ).length,
      feature: guestAnnouncements.filter((a) => a.type === 'feature' && a.status === 'published')
        .length,
      maintenance: guestAnnouncements.filter(
        (a) => a.type === 'maintenance' && a.status === 'published'
      ).length,
      alert: guestAnnouncements.filter((a) => a.type === 'alert' && a.status === 'published')
        .length,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/guest-portal/status"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
            <p className="text-sm text-text-secondary">
              Stay informed about hotel news and updates
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSubscribed(!subscribed)}
          className={subscribed ? 'border-accent text-accent' : ''}
        >
          {subscribed ? (
            <BellOff className="mr-1.5 h-4 w-4" />
          ) : (
            <Bell className="mr-1.5 h-4 w-4" />
          )}
          {subscribed ? 'Subscribed' : 'Get Updates'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{stats.total}</p>
          <p className="text-xs text-text-muted">Active</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-accent">{stats.feature}</p>
          <p className="text-xs text-text-muted">Features</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-warning">{stats.maintenance}</p>
          <p className="text-xs text-text-muted">Maintenance</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-danger">{stats.alert}</p>
          <p className="text-xs text-text-muted">Alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="feature">Features</option>
            <option value="maintenance">Maintenance</option>
            <option value="alert">Alerts</option>
            <option value="update">Updates</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filtered.length}</span> of{' '}
        {stats.total} active announcements
      </p>

      {/* Announcements */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((ann) => (
            <GuestAnnouncementCard key={ann.id} announcement={ann} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description="Try adjusting your filters or check back later for updates."
        />
      )}

      {/* Subscribe CTA */}
      <div className="rounded-xl border border-border bg-surface p-5 text-center">
        <Bell className="h-8 w-8 text-secondary mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-text-primary">Stay in the Loop</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
          Subscribe to get notified about new features, maintenance windows, and important alerts.
        </p>
        <Button
          size="sm"
          className="mt-3"
          variant={subscribed ? 'outline' : 'secondary'}
          onClick={() => setSubscribed(!subscribed)}
        >
          {subscribed ? (
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
          ) : (
            <Bell className="mr-1.5 h-4 w-4" />
          )}
          {subscribed ? "You're Subscribed" : 'Subscribe to Updates'}
        </Button>
      </div>
    </div>
  );
}
