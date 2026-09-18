// apps/web/src/api/announcements.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'maintenance' | 'feature' | 'alert';
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'draft' | 'published' | 'archived';
  targetAudience: string[];
  scheduledAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  readCount: number;
  totalRecipients: number;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const client = getApiClient();

export async function getAnnouncements(
  params?: PaginationParams & {
    type?: string;
    status?: string;
    priority?: string;
    search?: string;
  }
): Promise<PaginatedResponse<Announcement>> {
  return client.get('/admin/announcements', { params });
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  return client.get(`/admin/announcements/${id}`);
}

export async function createAnnouncement(
  data: Omit<
    Announcement,
    'id' | 'createdAt' | 'updatedAt' | 'readCount' | 'totalRecipients' | 'createdBy'
  >
): Promise<Announcement> {
  return client.post('/admin/announcements', data);
}

export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<Announcement> {
  return client.patch(`/admin/announcements/${id}`, data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return client.delete(`/admin/announcements/${id}`);
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  return client.post(`/admin/announcements/${id}/publish`);
}

export async function getMaintenanceWindows(
  params?: PaginationParams & {
    status?: string;
  }
): Promise<PaginatedResponse<MaintenanceWindow>> {
  return client.get('/admin/announcements/maintenance', { params });
}

export async function createMaintenanceWindow(
  data: Omit<MaintenanceWindow, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceWindow> {
  return client.post('/admin/announcements/maintenance', data);
}

export async function updateMaintenanceWindow(
  id: string,
  data: Partial<MaintenanceWindow>
): Promise<MaintenanceWindow> {
  return client.patch(`/admin/announcements/maintenance/${id}`, data);
}

export async function cancelMaintenanceWindow(id: string): Promise<MaintenanceWindow> {
  return client.post(`/admin/announcements/maintenance/${id}/cancel`);
}

export async function getAnnouncementStats(): Promise<{
  totalPublished: number;
  activeMaintenance: number;
  unreadAlerts: number;
  engagementRate: number;
}> {
  return client.get('/admin/announcements/stats');
}
