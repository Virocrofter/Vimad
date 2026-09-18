// apps/web/src/api/analytics.ts
import { getApiClient } from './client';

export interface RevenueAnalytics {
  total: number;
  growth: number;
  trend: { date: string; revenue: number }[];
}

export interface OccupancyAnalytics {
  average: number;
  peak: number;
  trend: { date: string; occupancy: number }[];
}

export interface GuestAnalytics {
  total: number;
  new: number;
  growth: number;
  returning: number;
}

export interface ConversionFunnel {
  conversionRate: number;
  abandoned: number;
  stages: { stage: string; value: number }[];
}

export interface ChannelPerformance {
  channel: string;
  bookings: number;
  revenue: number;
}

export interface RoomTypeRevenue {
  roomType: string;
  revenue: number;
  bookings: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  cancellations: number;
}

const client = getApiClient();

export async function getRevenueAnalytics(params?: {
  dateRange?: string;
}): Promise<RevenueAnalytics> {
  return client.get('/admin/analytics/revenue', { params });
}

export async function getOccupancyAnalytics(params?: {
  dateRange?: string;
}): Promise<OccupancyAnalytics> {
  return client.get('/admin/analytics/occupancy', { params });
}

export async function getGuestAnalytics(params?: { dateRange?: string }): Promise<GuestAnalytics> {
  return client.get('/admin/analytics/guests', { params });
}

export async function getConversionFunnel(params?: {
  dateRange?: string;
}): Promise<ConversionFunnel> {
  return client.get('/admin/analytics/funnel', { params });
}

export async function getChannelPerformance(params?: {
  dateRange?: string;
}): Promise<ChannelPerformance[]> {
  return client.get('/admin/analytics/channels', { params });
}

export async function getRevenueByRoomType(params?: {
  dateRange?: string;
}): Promise<RoomTypeRevenue[]> {
  return client.get('/admin/analytics/room-types', { params });
}

export async function getBookingTrends(params?: {
  dateRange?: string;
}): Promise<{ trend: BookingTrend[] }> {
  return client.get('/admin/analytics/bookings', { params });
}

export async function exportAnalyticsReport(
  format: 'csv' | 'pdf',
  filters?: Record<string, unknown>
): Promise<{ downloadUrl: string }> {
  return client.post('/admin/analytics/export', { format, ...filters });
}
