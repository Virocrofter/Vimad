// apps/web/src/app/admin/announcements/components.jsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  Wrench,
  Bell,
  AlertTriangle,
  TrendingUp,
  Eye,
  Archive,
  Trash2,
  Edit3,
  Send,
  Clock,
  Users,
  Calendar,
  Server,
  CheckCircle,
  XCircle,
  ChevronRight,
  Search,
} from 'lucide-react';

export function AnnouncementStats({ stats }) {
  const statCards = [
    {
      label: 'Total Published',
      value: stats.totalPublished,
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Maintenance',
      value: stats.activeMaintenance,
      icon: Wrench,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Unread Alerts',
      value: stats.unreadAlerts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AnnouncementFilters({ filters, onFilterChange, activeTab }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {activeTab === 'announcements' && (
          <>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="feature">Feature</option>
              <option value="alert">Alert</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </>
        )}

        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          {activeTab === 'announcements' ? (
            <>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </>
          ) : (
            <>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
        </select>
      </div>
    </Card>
  );
}

export function AnnouncementList({
  announcements,
  onEdit,
  onDelete,
  onPublish,
  getPriorityColor,
  getStatusColor,
}) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{announcement.title}</h3>
                <Badge className={getPriorityColor(announcement.priority)}>
                  {announcement.priority}
                </Badge>
                <Badge className={getStatusColor(announcement.status)}>{announcement.status}</Badge>
              </div>

              <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                {announcement.message}
              </p>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {announcement.readCount}/{announcement.totalRecipients} read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {Math.round(
                    (announcement.readCount / Math.max(announcement.totalRecipients, 1)) * 100
                  )}
                  % engagement
                </span>
              </div>

              {expandedId === announcement.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {announcement.message}
                  </p>

                  {announcement.targetAudience?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Target Audience:</p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.targetAudience.map((audience) => (
                          <Badge key={audience} variant="outline">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {announcement.scheduledAt && (
                    <p className="mt-3 text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Scheduled for: {new Date(announcement.scheduledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {announcement.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublish(announcement.id);
                  }}
                  className="gap-1"
                >
                  <Send className="w-3 h-3" />
                  Publish
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(announcement);
                }}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(announcement.id);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === announcement.id ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MaintenanceList({ maintenanceWindows, onEdit, onCancel, getStatusColor }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-4">
      {maintenanceWindows.map((window) => (
        <Card
          key={window.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setExpandedId(expandedId === window.id ? null : window.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{window.title}</h3>
                <Badge className={getStatusColor(window.status)}>{window.status}</Badge>
              </div>

              <p className="text-gray-600 dark:text-gray-400">{window.description}</p>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(window.startTime).toLocaleString()} -{' '}
                  {new Date(window.endTime).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Server className="w-4 h-4" />
                  {window.affectedServices?.length || 0} services affected
                </span>
              </div>

              {expandedId === window.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-700 dark:text-gray-300">{window.description}</p>

                  {window.affectedServices?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Affected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {window.affectedServices.map((service) => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="text-orange-600 border-orange-200"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {['scheduled', 'in_progress'].includes(window.status) && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(window);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(window.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === window.id ? 'rotate-90' : ''}`}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
