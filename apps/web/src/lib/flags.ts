/* apps/web/src/lib/flags.ts
 * Feature flags for v1. Flagged-off routes render a "not in v1" notice.
 * Set VITE_FLAG_*=true in apps/web/.env to re-enable.
 */

const env = (key: string): boolean =>
  (import.meta.env[`VITE_${key}`] as string | undefined) === 'true';

export const flags = {
  adminAnalytics: env('FLAG_ADMIN_ANALYTICS'),
  adminBilling: env('FLAG_ADMIN_BILLING'),
  adminFinances: env('FLAG_ADMIN_FINANCES'),
  adminRegions: env('FLAG_ADMIN_REGIONS'),
  adminQuotas: env('FLAG_ADMIN_QUOTAS'),
  adminProfiler: env('FLAG_ADMIN_PROFILER'),
  adminSecurity: env('FLAG_ADMIN_SECURITY'),
  adminFeatureFlags: env('FLAG_ADMIN_FEATURE_FLAGS'),
  adminDataExport: env('FLAG_ADMIN_DATA_EXPORT'),
  adminDemoAccess: env('FLAG_ADMIN_DEMO_ACCESS'),
  adminFeedback: env('FLAG_ADMIN_FEEDBACK'),
  adminIntegrations: env('FLAG_ADMIN_INTEGRATIONS'),
  adminOnboarding: env('FLAG_ADMIN_ONBOARDING'),
  adminTickets: env('FLAG_ADMIN_TICKETS'),
  adminReports: env('FLAG_ADMIN_REPORTS'),
  adminAnnouncements: env('FLAG_ADMIN_ANNOUNCEMENTS'),
  adminBackups: env('FLAG_ADMIN_BACKUPS'),

  loyalty: env('FLAG_LOYALTY'),
  groups: env('FLAG_GROUPS'),
  todayV2: env('FLAG_DASHBOARD_TODAY_V2'),
  reports: env('FLAG_REPORTS'),
  staffKeys: env('FLAG_STAFF_KEYS'),
  guestReviews: env('FLAG_GUEST_REVIEWS'),
  guestBilling: env('FLAG_GUEST_BILLING'),
} as const;

export type Flag = keyof typeof flags;
