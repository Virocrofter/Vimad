/* src/router.tsx */
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import GuestAuthGuard from './components/router/GuestAuthGuard';
import { RouterError } from './components/router/RouterError';

// Layouts stay eager — they are the shared shell every route renders inside.
import MarketingLayout from './app/marketing/layout';
import AuthLayout from './app/auth/layout';
import AppLayout from './app/app/layout';
import GuestLayout from './app/guest-portal/layout';
import GuestAuthLayout from './app/guest-portal/auth/layout';
import AdminLayout from './app/admin/layout';
import ChainLoyaltyPage from './app/app/chain-loyalty/page';

/**
 * Route-level code splitting. Every leaf page loads as its own chunk on
 * first navigation instead of inflating the entry bundle (was ~3.9 MB).
 * Same mechanism the A4 booking routes already used.
 */
const page = (loader: () => Promise<any>) => ({
  lazy: async () => ({ Component: (await loader()).default }),
});

// ─── Debug 404 (temporary — prints the missed path so we can diagnose
// the Back-Forward Cache redirect; revert to <Navigate to="/" replace /> once fixed)
function NotFoundDebug() {
  const { pathname, search } = useLocation();
  return (
    <div style={{ padding: 48, fontFamily: 'monospace', color: '#fff' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>No route matched (debug)</h1>
      <p style={{ marginTop: 12 }}>
        pathname: <strong>{pathname}</strong>
      </p>
      <p>
        search: <strong>{search || '(none)'}</strong>
      </p>
      <p style={{ marginTop: 16 }}>
        <a href="/app/dashboard" style={{ color: '#7c8cf8' }}>
          → Go to dashboard
        </a>
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  /* ─── Marketing Website ─── */
  {
    path: '/',
    element: <MarketingLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, ...page(() => import('./app/marketing/page')) },
      { path: 'about', ...page(() => import('./app/marketing/about/page')) },
      { path: 'features', ...page(() => import('./app/marketing/features/page')) },
      { path: 'pricing', ...page(() => import('./app/marketing/pricing/page')) },
      { path: 'contact', ...page(() => import('./app/marketing/contact/page')) },
      { path: 'demo', ...page(() => import('./app/marketing/demo/page')) },
      { path: 'blog', ...page(() => import('./app/marketing/blog/page')) },
      { path: 'case-studies', ...page(() => import('./app/marketing/case-studies/page')) },
      { path: 'integrations', ...page(() => import('./app/marketing/integrations/page')) },
      { path: 'partners', ...page(() => import('./app/marketing/partners/page')) },
      { path: 'api-docs', ...page(() => import('./app/marketing/api-docs/page')) },
      { path: 'help', ...page(() => import('./app/marketing/help/page')) },
      { path: 'status', ...page(() => import('./app/marketing/status/page')) },
      { path: 'security', ...page(() => import('./app/marketing/security/page')) },
      { path: 'privacy', ...page(() => import('./app/marketing/privacy/page')) },
      { path: 'terms', ...page(() => import('./app/marketing/terms/page')) },
      { path: 'gdpr', ...page(() => import('./app/marketing/gdpr/page')) },
      { path: 'pci-dss', ...page(() => import('./app/marketing/pci-dss/page')) },
      {
        path: 'system-requirements',
        ...page(() => import('./app/marketing/system-requirements/page')),
      },
      {
        path: 'alternative/cloudbeds',
        ...page(() => import('./app/marketing/alternatives/cloudbeds/page')),
      },
      {
        path: 'alternative/hilton-onq',
        ...page(() => import('./app/marketing/alternatives/hilton-onq/page')),
      },
      {
        path: 'alternative/opera-5',
        ...page(() => import('./app/marketing/alternatives/opera-5/page')),
      },
      {
        path: 'solutions/boutique-hotels',
        ...page(() => import('./app/marketing/solutions/boutique-hotels/page')),
      },
      {
        path: 'solutions/hotel-chains',
        ...page(() => import('./app/marketing/solutions/hotel-chains/page')),
      },
      {
        path: 'solutions/contactless-checkin',
        ...page(() => import('./app/marketing/solutions/contactless-checkin/page')),
      },
      {
        path: 'solutions/ai-revenue-management',
        ...page(() => import('./app/marketing/solutions/ai-revenue-management/page')),
      },
    ],
  },

  /* ─── Public Booking Engine (A4) — standalone, no site layout ─── */
  {
    path: '/book/:code',
    lazy: async () => ({ Component: (await import('./app/booking/page')).default }),
    errorElement: <RouterError />,
  },
  {
    path: '/booking/cancel',
    lazy: async () => ({ Component: (await import('./app/booking/cancel/page')).default }),
    errorElement: <RouterError />,
  },

  /* ─── Auth ─── */
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <RouterError />,
    children: [
      { path: 'login', ...page(() => import('./app/auth/login/page')) },
      { path: 'register', ...page(() => import('./app/auth/register/page')) },
      { path: 'forgot-password', ...page(() => import('./app/auth/forgot-password/page')) },
    ],
  },

  /* ─── Main PMS App ─── */
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', ...page(() => import('./app/app/dashboard/page')) },
      {
        path: 'reservations',
        children: [
          { index: true, ...page(() => import('./app/app/reservations/page')) },
          { path: 'front-desk', ...page(() => import('./app/app/reservations/front-desk/page')) },
          { path: 'new', ...page(() => import('./app/app/reservations/new/page')) },
          { path: 'detail', ...page(() => import('./app/app/reservations/detail/page')) },
          { path: ':id', ...page(() => import('./app/app/reservations/detail/page')) },
        ],
      },
      { path: 'room-plan', ...page(() => import('./app/app/room-plan/page')) },
      { path: 'chain-dashboard', ...page(() => import('./app/app/chain-dashboard/page')) },
      { path: 'guest-identity', ...page(() => import('./app/app/guest-identity/page')) },
      {
        path: 'central-reservations',
        ...page(() => import('./app/app/central-reservations/page')),
      },
      { path: 'chain-billing', ...page(() => import('./app/app/chain-billing/page')) },
      {
        path: 'billing',
        children: [
          { index: true, ...page(() => import('./app/app/billing/page')) },
          { path: 'dashboard', ...page(() => import('./app/app/billing/dashboard/page')) },
          { path: 'payments', ...page(() => import('./app/app/billing/payments/page')) },
          {
            path: 'payment-requests',
            ...page(() => import('./app/app/billing/payment-requests/page')),
          },
          { path: 'invoices', ...page(() => import('./app/app/billing/invoices/page')) },
        ],
      },
      { path: 'rates', ...page(() => import('./app/app/rates/page')) },
      { path: 'inventory', ...page(() => import('./app/app/inventory/page')) },
      { path: 'guests', ...page(() => import('./app/app/guests/page')) },
      { path: 'guests/:id', ...page(() => import('./app/app/guests/detail/page')) },
      // [CRM] Guest 360, segments, follow-ups, corporate accounts
      {
        path: 'crm',
        children: [
          { index: true, ...page(() => import('./app/app/crm/page')) },
          { path: 'guests/:id', ...page(() => import('./app/app/crm/guests/[id]/page')) },
          { path: 'segments', ...page(() => import('./app/app/crm/segments/page')) },
          { path: 'corporate', ...page(() => import('./app/app/crm/corporate/page')) },
        ],
      },
      { path: 'housekeeping', ...page(() => import('./app/app/housekeeping/page')) },
      {
        path: 'housekeeping/space-status',
        ...page(() => import('./app/app/housekeeping/space-status/page')),
      },
      { path: 'housekeeping/rules', ...page(() => import('./app/app/housekeeping/rules/page')) },
      {
        path: 'housekeeping/activity',
        ...page(() => import('./app/app/housekeeping/activity/page')),
      },
      { path: 'housekeeping/mobile', ...page(() => import('./app/app/housekeeping/mobile/page')) },
      { path: 'tasks', ...page(() => import('./app/app/tasks/page')) },
      // [T3] Concierge board — transfers, wake-up calls, bookings, upsells
      { path: 'concierge', ...page(() => import('./app/app/concierge/page')) },
      { path: 'night-audit', ...page(() => import('./app/app/night-audit/page')) },
      { path: 'reports', ...page(() => import('./app/app/reports/page')) },
      { path: 'onboarding', ...page(() => import('./app/app/onboarding/page')) },
      { path: 'chain-loyalty', element: <ChainLoyaltyPage /> },
      { path: 'channel-manager', ...page(() => import('./app/app/channel-manager/page')) },
      { path: 'loyalty', ...page(() => import('./app/app/loyalty/page')) },
      { path: 'settings', ...page(() => import('./app/app/settings/page')) },
      { path: 'settings/email', ...page(() => import('./app/app/settings/email/page')) },
      { path: 'support', ...page(() => import('./app/app/support/page')) },
      {
        path: 'sales-catering',
        children: [
          { index: true, ...page(() => import('./app/app/sales-catering/page')) },
          { path: 'beos', ...page(() => import('./app/app/sales-catering/beos/page')) },
          { path: 'clients', ...page(() => import('./app/app/sales-catering/clients/page')) },
          { path: 'events', ...page(() => import('./app/app/sales-catering/events/page')) },
        ],
      },
      { path: 'audit-trail', ...page(() => import('./app/app/audit-trail/page')) },
      // [C1] Administration → Properties (chains + switcher dashboard)
      { path: 'properties', ...page(() => import('./app/app/properties/Page')) },
      { path: 'users', ...page(() => import('./app/app/users/page')) },
      { path: 'users/details', ...page(() => import('./app/app/users/details/page')) },
      { path: 'users/roles', ...page(() => import('./app/app/users/roles/page')) },
      { path: 'ar', ...page(() => import('./app/app/ar/page')) },
      { path: 'vcc', ...page(() => import('./app/app/vcc/page')) },
      { path: 'meal-plans', ...page(() => import('./app/app/meal-plans/page')) },
      {
        path: 'groups',
        children: [
          { index: true, ...page(() => import('./app/app/groups/page')) },
          { path: 'new', ...page(() => import('./app/app/groups/new/page')) },
          { path: 'detail', ...page(() => import('./app/app/groups/details/page')) },
        ],
      },
      {
        path: 'keys',
        children: [
          { index: true, ...page(() => import('./app/app/keys/page')) },
          { path: 'rack', ...page(() => import('./app/app/keys/rack/page')) },
          { path: 'digital', ...page(() => import('./app/app/keys/digital/page')) },
          { path: 'master', ...page(() => import('./app/app/keys/master/page')) },
        ],
      },
      {
        path: 'parking',
        children: [
          { index: true, ...page(() => import('./app/app/parking/page')) },
          { path: 'spots', ...page(() => import('./app/app/parking/spots/page')) },
          { path: 'valet', ...page(() => import('./app/app/parking/valet/page')) },
          { path: 'vehicles', ...page(() => import('./app/app/parking/vehicles/page')) },
          { path: 'ev-charging', ...page(() => import('./app/app/parking/ev-charging/page')) },
        ],
      },
      {
        path: 'marketing',
        children: [
          { index: true, element: <Navigate to="analytics" replace /> },
          { path: 'analytics', ...page(() => import('./app/app/marketing/analytics')) },
          { path: 'automation', ...page(() => import('./app/app/marketing/automation')) },
          { path: 'automation-list', ...page(() => import('./app/app/marketing/automation-list')) },
          { path: 'templates', ...page(() => import('./app/app/marketing/templates')) },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════
     GUEST PORTAL — NEW (/guest-portal/*)
     ═══════════════════════════════════════════════════ */

  /* ─── Public Status Pages (no auth required) ─── */
  {
    path: '/guest-portal/status',
    ...page(() => import('./app/guest-portal/status/page')),
    errorElement: <RouterError />,
  },
  {
    path: '/guest-portal/status/announcements',
    ...page(() => import('./app/guest-portal/status/announcements/page')),
    errorElement: <RouterError />,
  },

  /* ─── Auth Pages (no sidebar, public) ─── */
  {
    path: '/guest-portal/auth',
    element: <GuestAuthLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', ...page(() => import('./app/guest-portal/auth/login/page')) },
      { path: 'register', ...page(() => import('./app/guest-portal/auth/register/page')) },
      { path: 'verify', ...page(() => import('./app/guest-portal/auth/verify/page')) },
      { path: 'forgot-password', element: <Navigate to="/auth/forgot-password" replace /> },
    ],
  },

  /* ─── Protected Guest Portal (auth required) ─── */
  {
    path: '/guest-portal',
    element: (
      <GuestAuthGuard>
        <Outlet />
      </GuestAuthGuard>
    ),
    errorElement: <RouterError />,
    children: [
      {
        element: <GuestLayout />,
        children: [
          /* Dashboard */
          { index: true, ...page(() => import('./app/guest-portal/page')) },

          /* Booking */
          { path: 'booking', ...page(() => import('./app/guest-portal/booking/page')) },
          {
            path: 'booking/modify',
            ...page(() => import('./app/guest-portal/booking/modify/page')),
          },
          {
            path: 'booking/cancel',
            ...page(() => import('./app/guest-portal/booking/cancel/page')),
          },

          /* Check-in */
          { path: 'check-in', ...page(() => import('./app/guest-portal/check-in/page')) },
          {
            path: 'check-in/digital-key',
            ...page(() => import('./app/guest-portal/check-in/digital-key/page')),
          },

          /* Stay Services */
          { path: 'stay', ...page(() => import('./app/guest-portal/stay/page')) },
          { path: 'my-stays', ...page(() => import('./app/guest-portal/my-stays/page')) },
          {
            path: 'stay/room-service',
            ...page(() => import('./app/guest-portal/stay/room-service/page')),
          },
          {
            path: 'stay/housekeeping',
            ...page(() => import('./app/guest-portal/stay/housekeeping/page')),
          },
          {
            path: 'stay/concierge',
            ...page(() => import('./app/guest-portal/stay/concierge/page')),
          },
          { path: 'stay/issues', ...page(() => import('./app/guest-portal/stay/issues/page')) },

          /* Keys */
          { path: 'keys', ...page(() => import('./app/guest-portal/keys/page')) },

          /* Billing */
          { path: 'billing', ...page(() => import('./app/guest-portal/billing/page')) },
          {
            path: 'billing/invoice',
            ...page(() => import('./app/guest-portal/billing/invoice/page')),
          },
          { path: 'billing/split', ...page(() => import('./app/guest-portal/billing/split/page')) },

          /* Loyalty */
          { path: 'loyalty', ...page(() => import('./app/guest-portal/loyalty/page')) },
          {
            path: 'loyalty/rewards',
            ...page(() => import('./app/guest-portal/loyalty/rewards/page')),
          },
          {
            path: 'loyalty/history',
            ...page(() => import('./app/guest-portal/loyalty/history/page')),
          },

          /* Messages */
          { path: 'messages', ...page(() => import('./app/guest-portal/messages/page')) },
          {
            path: 'messages/notifications',
            ...page(() => import('./app/guest-portal/messages/notifications/page')),
          },

          /* Profile */
          { path: 'profile', ...page(() => import('./app/guest-portal/profile/page')) },
          {
            path: 'profile/preferences',
            ...page(() => import('./app/guest-portal/profile/preferences/page')),
          },
          {
            path: 'profile/documents',
            ...page(() => import('./app/guest-portal/profile/documents/page')),
          },

          /* Reviews */
          { path: 'reviews', ...page(() => import('./app/guest-portal/reviews/page')) },
          {
            path: 'reviews/history',
            ...page(() => import('./app/guest-portal/reviews/history/page')),
          },

          /* Support */
          { path: 'support', ...page(() => import('./app/guest-portal/support/page')) },
          {
            path: 'support/tickets',
            ...page(() => import('./app/guest-portal/support/tickets/page')),
          },
          {
            path: 'support/contact',
            ...page(() => import('./app/guest-portal/support/contact/page')),
          },
        ],
      },
    ],
  },

  /* ─── Legacy Guest Portal (/guest/*) ─── */
  {
    path: '/guest',
    element: <GuestLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, ...page(() => import('./app/guest-portal/page')) },
      { path: 'booking', ...page(() => import('./app/guest-portal/booking/page')) },
      { path: 'checkin', ...page(() => import('./app/guest-portal/check-in/page')) },
      { path: 'checkout', ...page(() => import('./app/guest-portal/check-out/page')) },
      { path: 'folio', ...page(() => import('./app/guest-portal/billing/page')) },
      { path: 'loyalty', ...page(() => import('./app/guest-portal/loyalty/page')) },
      { path: 'messaging', ...page(() => import('./app/guest-portal/messages/page')) },
      { path: 'reservation', ...page(() => import('./app/guest-portal/booking/page')) },
    ],
  },

  /* ─── Super Admin ─── */
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, ...page(() => import('./app/admin/page')) },
      { path: 'dashboard', ...page(() => import('./app/admin/dashboard/page')) },
      { path: 'analytics', ...page(() => import('./app/admin/analytics/page')) },
      { path: 'announcements', ...page(() => import('./app/admin/announcements/page')) },
      { path: 'audit', ...page(() => import('./app/admin/audit/page')) },
      { path: 'backups', ...page(() => import('./app/admin/backups/page')) },
      {
        path: 'billing',
        children: [
          { index: true, ...page(() => import('./app/admin/billing/page')) },
          { path: 'credit-notes', ...page(() => import('./app/admin/billing/credit-notes/page')) },
          { path: 'dunning', ...page(() => import('./app/admin/billing/dunning/page')) },
          { path: 'invoices', ...page(() => import('./app/admin/billing/invoices/page')) },
          { path: 'revenue', ...page(() => import('./app/admin/billing/revenue/page')) },
          {
            path: 'subscriptions',
            ...page(() => import('./app/admin/billing/subscriptions/page')),
          },
          { path: 'payments', ...page(() => import('./app/app/billing/payments/page')) },
          {
            path: 'payment-requests',
            ...page(() => import('./app/app/billing/payment-requests/page')),
          },
        ],
      },
      { path: 'data-export', ...page(() => import('./app/admin/data-export/page')) },
      { path: 'demo-access', ...page(() => import('./app/admin/demo-access/page')) },
      {
        path: 'feature-flags',
        ...page(() => import('./app/admin/feature-flags/FeatureFlagModal')),
      },
      { path: 'feedback', ...page(() => import('./app/admin/feedback/page')) },
      { path: 'finances', ...page(() => import('./app/admin/finances/page')) },
      { path: 'health', ...page(() => import('./app/admin/health/page')) },
      { path: 'integrations', ...page(() => import('./app/admin/integrations/page')) },
      { path: 'onboarding', ...page(() => import('./app/admin/onboarding/page')) },
      { path: 'profiler', ...page(() => import('./app/admin/profiler/page')) },
      { path: 'quotas', ...page(() => import('./app/admin/quotas/page')) },
      { path: 'rbac', ...page(() => import('./app/admin/rbac/page')) },
      { path: 'regions', ...page(() => import('./app/admin/regions/page')) },
      { path: 'reports', ...page(() => import('./app/admin/reports/page')) },
      { path: 'security', ...page(() => import('./app/admin/security/page')) },
      { path: 'settings', ...page(() => import('./app/admin/settings/page')) },
      { path: 'shadow', ...page(() => import('./app/admin/shadow/page')) },
      { path: 'ticket', ...page(() => import('./app/admin/ticket/page')) },
    ],
  },

  /* ─── 404 Catch-all (DEBUG — revert to <Navigate to="/" replace /> after diagnosis) ─── */
  { path: '*', element: <NotFoundDebug /> },
]);
