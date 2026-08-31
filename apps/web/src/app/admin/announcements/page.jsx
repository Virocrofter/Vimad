/* src/app/admin/announcements/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  History,
  Wrench,
  Plus,
  Search,
  Filter,
  Pin,
  Sparkles,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  BarChart3,
  Zap,
  FileText,
  Server,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  initialAnnouncements,
  initialChangelog,
  initialMaintenanceWindows,
  announcementTypeMeta,
  priorityMeta,
  announcementStatusMeta,
  formatRelativeTime,
} from './data';
import {
  AnnouncementCard,
  ChangelogEntry,
  MaintenanceWindowCard,
  StatCard,
  EmptyState,
  TypeBadge,
  StatusBadge,
} from './components';
import AnnouncementModal from './AnnouncementModal';
import MaintenanceModal from './MaintenanceModal';

/* ─── Mock Tenants for Targeting ─── */
const mockTenants = [
  { id: 'TNT-001', name: 'Grand Hotel Boston' },
  { id: 'TNT-002', name: 'Seaside Resort Miami' },
  { id: 'TNT-003', name: 'Mountain Lodge Aspen' },
  { id: 'TNT-004', name: 'Downtown Suites Chicago' },
  { id: 'TNT-005', name: 'Coastal Inn San Diego' },
  { id: 'TNT-006', name: 'Lakeside Resort Tahoe' },
  { id: 'TNT-007', name: 'Urban Hotel NYC' },
  { id: 'TNT-008', name: 'Desert Oasis Phoenix' },
];

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('announcements');

  /* ── Announcements State ── */
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [annQuery, setAnnQuery] = useState('');
  const [annTypeFilter, setAnnTypeFilter] = useState('all');
  const [annStatusFilter, setAnnStatusFilter] = useState('all');
  const [annPriorityFilter, setAnnPriorityFilter] = useState('all');
  const [showAnnFilters, setShowAnnFilters] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnModal, setShowAnnModal] = useState(false);

  /* ── Changelog State ── */
  const [changelog, setChangelog] = useState(initialChangelog);
  const [clQuery, setClQuery] = useState('');
  const [selectedChangelog, setSelectedChangelog] = useState(null);
  const [showClModal, setShowClModal] = useState(false);

  /* ── Maintenance State ── */
  const [maintenanceWindows, setMaintenanceWindows] = useState(initialMaintenanceWindows);
  const [mwQuery, setMwQuery] = useState('');
  const [mwStatusFilter, setMwStatusFilter] = useState('all');
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showMwModal, setShowMwModal] = useState(false);

  /* ─── Filtered Announcements ─── */
  const filteredAnnouncements = useMemo(() => {
    let result = announcements.filter((a) => {
      const matchesQuery =
        !annQuery ||
        a.title.toLowerCase().includes(annQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(annQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(annQuery.toLowerCase());
      const matchesType = annTypeFilter === 'all' || a.type === annTypeFilter;
      const matchesStatus = annStatusFilter === 'all' || a.status === annStatusFilter;
      const matchesPriority = annPriorityFilter === 'all' || a.priority === annPriorityFilter;
      return matchesQuery && matchesType && matchesStatus && matchesPriority;
    });
    // Sort: pinned first, then by date desc
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return result;
  }, [announcements, annQuery, annTypeFilter, annStatusFilter, annPriorityFilter]);

  /* ─── Filtered Changelog ─── */
  const filteredChangelog = useMemo(() => {
    if (!clQuery) return changelog;
    return changelog.filter(
      (c) =>
        c.title.toLowerCase().includes(clQuery.toLowerCase()) ||
        c.version.toLowerCase().includes(clQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(clQuery.toLowerCase()) ||
        c.changes.some((ch) => ch.text.toLowerCase().includes(clQuery.toLowerCase()))
    );
  }, [changelog, clQuery]);

  /* ─── Filtered Maintenance ─── */
  const filteredMaintenance = useMemo(() => {
    let result = maintenanceWindows.filter((m) => {
      const matchesQuery =
        !mwQuery ||
        m.title.toLowerCase().includes(mwQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(mwQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(mwQuery.toLowerCase());
      const matchesStatus = mwStatusFilter === 'all' || m.status === mwStatusFilter;
      return matchesQuery && matchesStatus;
    });
    // Sort: ongoing first, then upcoming, then completed
    result.sort((a, b) => {
      const now = new Date();
      const aOngoing = new Date(a.startTime) <= now && new Date(a.endTime) >= now;
      const bOngoing = new Date(b.startTime) <= now && new Date(b.endTime) >= now;
      const aUpcoming = new Date(a.startTime) > now;
      const bUpcoming = new Date(b.startTime) > now;
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return new Date(b.startTime) - new Date(a.startTime);
    });
    return result;
  }, [maintenanceWindows, mwQuery, mwStatusFilter]);

  /* ─── Stats ─── */
  const annStats = useMemo(
    () => ({
      total: announcements.length,
      published: announcements.filter((a) => a.status === 'published').length,
      draft: announcements.filter((a) => a.status === 'draft').length,
      scheduled: announcements.filter((a) => a.status === 'scheduled').length,
      pinned: announcements.filter((a) => a.pinned).length,
      avgReadRate:
        announcements.filter((a) => a.status === 'published').length > 0
          ? Math.round(
              announcements
                .filter((a) => a.status === 'published')
                .reduce((s, a) => s + (a.readCount / a.totalRecipients) * 100, 0) /
                announcements.filter((a) => a.status === 'published').length
            )
          : 0,
    }),
    [announcements]
  );

  const mwStats = useMemo(
    () => ({
      total: maintenanceWindows.length,
      scheduled: maintenanceWindows.filter((m) => m.status === 'scheduled').length,
      inProgress: maintenanceWindows.filter((m) => m.status === 'in-progress').length,
      completed: maintenanceWindows.filter((m) => m.status === 'completed').length,
    }),
    [maintenanceWindows]
  );

  /* ─── Handlers ─── */
  const handleSaveAnnouncement = (payload) => {
    setAnnouncements((prev) => {
      const idx = prev.findIndex((a) => a.id === payload.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });
    setSelectedAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTogglePin = (id) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));
  };

  const handlePublish = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'published', publishedAt: new Date().toISOString() } : a
      )
    );
  };

  const handleSaveMaintenance = (payload) => {
    setMaintenanceWindows((prev) => {
      const idx = prev.findIndex((m) => m.id === payload.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });
    setSelectedMaintenance(null);
  };

  const handleDeleteMaintenance = (id) => {
    setMaintenanceWindows((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCancelMaintenance = (id) => {
    setMaintenanceWindows((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'cancelled' } : m))
    );
  };

  /* ─── Tabs ─── */
  const tabs = [
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      badge: annStats.draft + annStats.scheduled,
    },
    { id: 'changelog', label: 'Changelog', icon: History },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, badge: mwStats.inProgress },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Communications</h1>
          <p className="text-sm text-text-secondary">
            Announcements, release notes, and maintenance windows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {activeTab === 'announcements' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedAnnouncement(null);
                setShowAnnModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New Announcement
            </Button>
          )}
          {activeTab === 'maintenance' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedMaintenance(null);
                setShowMwModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Schedule Maintenance
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════
          ANNOUNCEMENTS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard
              label="Total"
              value={annStats.total}
              icon={Megaphone}
              color="text-text-primary"
              subtext="All announcements"
            />
            <StatCard
              label="Published"
              value={annStats.published}
              icon={Sparkles}
              color="text-accent"
              subtext="Live now"
            />
            <StatCard
              label="Drafts"
              value={annStats.draft}
              icon={FileText}
              color="text-text-muted"
              subtext="Pending review"
            />
            <StatCard
              label="Scheduled"
              value={annStats.scheduled}
              icon={Calendar}
              color="text-info"
              subtext="Auto-publish"
            />
            <StatCard
              label="Avg Read Rate"
              value={`${annStats.avgReadRate}%`}
              icon={BarChart3}
              color="text-secondary"
              subtext="Of published"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={annQuery}
                onChange={(e) => setAnnQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAnnFilters(!showAnnFilters)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
                  showAnnFilters
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                )}
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showAnnFilters && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Type</label>
                  <select
                    value={annTypeFilter}
                    onChange={(e) => setAnnTypeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Types</option>
                    <option value="feature">Feature</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="alert">Alert</option>
                    <option value="update">Update</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={annStatusFilter}
                    onChange={(e) => setAnnStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Priority</label>
                  <select
                    value={annPriorityFilter}
                    onChange={(e) => setAnnPriorityFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setAnnTypeFilter('all');
                    setAnnStatusFilter('all');
                    setAnnPriorityFilter('all');
                    setAnnQuery('');
                  }}
                  className="text-xs text-secondary hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredAnnouncements.length}</span> of{' '}
            {announcements.length} announcements
          </p>

          {/* Announcements Grid */}
          {filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={(a) => {
                    setSelectedAnnouncement(a);
                    setShowAnnModal(true);
                  }}
                  onDelete={handleDeleteAnnouncement}
                  onTogglePin={handleTogglePin}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No announcements found"
              description="Try adjusting your filters or create a new announcement."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAnnouncement(null);
                    setShowAnnModal(true);
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Create Announcement
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════
          CHANGELOG TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'changelog' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Releases"
              value={changelog.length}
              icon={History}
              color="text-text-primary"
              subtext="All versions"
            />
            <StatCard
              label="This Month"
              value={changelog.filter((c) => c.date.startsWith('2026-08')).length}
              icon={Calendar}
              color="text-accent"
              subtext="August 2026"
            />
            <StatCard
              label="Features"
              value={changelog.reduce(
                (s, c) => s + c.changes.filter((ch) => ch.type === 'feature').length,
                0
              )}
              icon={Sparkles}
              color="text-secondary"
              subtext="Across all releases"
            />
            <StatCard
              label="Fixes"
              value={changelog.reduce(
                (s, c) => s + c.changes.filter((ch) => ch.type === 'fix').length,
                0
              )}
              icon={Zap}
              color="text-warning"
              subtext="Across all releases"
            />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search releases, features, fixes..."
              value={clQuery}
              onChange={(e) => setClQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredChangelog.length}</span> of{' '}
            {changelog.length} releases
          </p>

          {/* Changelog Timeline */}
          {filteredChangelog.length > 0 ? (
            <div className="relative">
              {filteredChangelog.map((entry) => (
                <ChangelogEntry
                  key={entry.id}
                  entry={entry}
                  onEdit={(e) => {
                    setSelectedChangelog(e); /* TODO: changelog edit modal */
                  }}
                  onDelete={(id) => setChangelog((prev) => prev.filter((c) => c.id !== id))}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No releases found"
              description="Try a different search term."
            />
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════
          MAINTENANCE TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Scheduled"
              value={mwStats.scheduled}
              icon={Calendar}
              color="text-info"
              subtext="Upcoming"
            />
            <StatCard
              label="In Progress"
              value={mwStats.inProgress}
              icon={Server}
              color="text-warning"
              subtext="Active now"
            />
            <StatCard
              label="Completed"
              value={mwStats.completed}
              icon={Sparkles}
              color="text-accent"
              subtext="Past 30 days"
            />
            <StatCard
              label="Total"
              value={mwStats.total}
              icon={Wrench}
              color="text-text-primary"
              subtext="All windows"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search maintenance windows..."
                value={mwQuery}
                onChange={(e) => setMwQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={mwStatusFilter}
              onChange={(e) => setMwStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredMaintenance.length}</span> of{' '}
            {maintenanceWindows.length} windows
          </p>

          {/* Maintenance Grid */}
          {filteredMaintenance.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredMaintenance.map((mw) => (
                <MaintenanceWindowCard
                  key={mw.id}
                  window={mw}
                  onEdit={(m) => {
                    setSelectedMaintenance(m);
                    setShowMwModal(true);
                  }}
                  onDelete={handleDeleteMaintenance}
                  onCancel={handleCancelMaintenance}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wrench}
              title="No maintenance windows found"
              description="Schedule maintenance to communicate downtime to tenants."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedMaintenance(null);
                    setShowMwModal(true);
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Schedule Maintenance
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════
          MODALS
          ═════════════════════════════════════════ */}
      {showAnnModal && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => {
            setShowAnnModal(false);
            setSelectedAnnouncement(null);
          }}
          onSave={handleSaveAnnouncement}
          tenants={mockTenants}
        />
      )}

      {showMwModal && (
        <MaintenanceModal
          window={selectedMaintenance}
          onClose={() => {
            setShowMwModal(false);
            setSelectedMaintenance(null);
          }}
          onSave={handleSaveMaintenance}
        />
      )}
    </div>
  );
}
