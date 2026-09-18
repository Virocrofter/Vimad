// apps/web/src/app/admin/announcements/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/tabs';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Wrench,
  Bell,
  TrendingUp,
  Eye,
  Archive,
  Trash2,
  Edit3,
  Send,
  Clock,
  Users,
} from 'lucide-react';
import {
  AnnouncementList,
  MaintenanceList,
  AnnouncementStats,
  AnnouncementFilters,
} from './components';
import AnnouncementModal from './AnnouncementModal';
import MaintenanceModal from './MaintenanceModal';
import {
  getAnnouncements,
  getMaintenanceWindows,
  getAnnouncementStats,
  deleteAnnouncement,
  publishAnnouncement,
  cancelMaintenanceWindow,
} from '@/api/announcements';

export default function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
  });
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(() => {
    return Promise.all([
      getAnnouncements({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      }),
      getMaintenanceWindows({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status,
      }),
      getAnnouncementStats(),
    ])
      .then(([announcementsRes, maintenanceRes, statsRes]) => {
        setAnnouncements(announcementsRes.data || []);
        setMaintenanceWindows(maintenanceRes.data || []);
        setStats(statsRes);
        setPagination((prev) => ({
          ...prev,
          total: announcementsRes.meta?.total || 0,
          totalPages: announcementsRes.meta?.totalPages || 0,
        }));
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Failed to load announcements',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters, pagination.page, pagination.pageSize, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const syncUrlParams = (nextFilters, nextPage, nextTab) => {
    const params = new URLSearchParams();
    if (nextFilters.search) params.set('search', nextFilters.search);
    if (nextFilters.type) params.set('type', nextFilters.type);
    if (nextFilters.status) params.set('status', nextFilters.status);
    if (nextFilters.priority) params.set('priority', nextFilters.priority);
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextTab !== 'announcements') params.set('tab', nextTab);
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    syncUrlParams(nextFilters, 1, activeTab);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      toast({ title: 'Deleted', description: 'Announcement removed successfully' });
      setLoading(true);
      fetchData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishAnnouncement(id);
      toast({ title: 'Published', description: 'Announcement is now live' });
      setLoading(true);
      fetchData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to publish announcement',
        variant: 'destructive',
      });
    }
  };

  const handleCancelMaintenance = async (id) => {
    if (!window.confirm('Cancel this maintenance window?')) return;
    try {
      await cancelMaintenanceWindow(id);
      toast({ title: 'Cancelled', description: 'Maintenance window cancelled' });
      setLoading(true);
      fetchData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel maintenance',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'announcements') {
      setShowAnnouncementModal(true);
    } else {
      setShowMaintenanceModal(true);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    if (activeTab === 'announcements') {
      setShowAnnouncementModal(true);
    } else {
      setShowMaintenanceModal(true);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Announcements & Communications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage system announcements, maintenance windows, and tenant communications
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          {activeTab === 'announcements' ? 'New Announcement' : 'Schedule Maintenance'}
        </Button>
      </div>

      {/* Stats */}
      {stats && <AnnouncementStats stats={stats} />}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'maintenance', label: 'Maintenance Windows', icon: Wrench },
        ]}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          syncUrlParams(filters, pagination.page, tab);
        }}
      />

      {/* Filters */}
      <AnnouncementFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        activeTab={activeTab}
      />

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : activeTab === 'announcements' ? (
        announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Create your first announcement to communicate with tenants"
            action={{ label: 'Create Announcement', onClick: handleCreate }}
          />
        ) : (
          <AnnouncementList
            announcements={announcements}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublish={handlePublish}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )
      ) : maintenanceWindows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance windows"
          description="Schedule maintenance windows to notify tenants of planned downtime"
          action={{ label: 'Schedule Maintenance', onClick: handleCreate }}
        />
      ) : (
        <MaintenanceList
          maintenanceWindows={maintenanceWindows}
          onEdit={handleEdit}
          onCancel={handleCancelMaintenance}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => {
                const nextPage = pagination.page - 1;
                setPagination((prev) => ({ ...prev, page: nextPage }));
                syncUrlParams(filters, nextPage, activeTab);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => {
                const nextPage = pagination.page + 1;
                setPagination((prev) => ({ ...prev, page: nextPage }));
                syncUrlParams(filters, nextPage, activeTab);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAnnouncementModal && (
        <AnnouncementModal
          announcement={editingItem}
          onClose={() => {
            setShowAnnouncementModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowAnnouncementModal(false);
            setEditingItem(null);
            setLoading(true);
            fetchData();
          }}
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceModal
          maintenanceWindow={editingItem}
          onClose={() => {
            setShowMaintenanceModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowMaintenanceModal(false);
            setEditingItem(null);
            setLoading(true);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
