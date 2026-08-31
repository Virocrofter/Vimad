
/* src/router.jsx */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useGuestStore } from './app/guest-portal/store';

// Layouts
import MarketingLayout from './app/marketing/layout';
import AuthLayout from './app/auth/layout';
import AppLayout from './app/app/layout';
import GuestLayout from './app/guest-portal/layout';
import AdminLayout from './app/admin/layout';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Layouts
// ═══════════════════════════════════════════════════
import GuestPortalLayout from './app/guest-portal/layout';
import GuestAuthLayout from './app/guest-portal/auth/layout';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Auth)
// ═══════════════════════════════════════════════════
import GuestLogin from './app/guest-portal/auth/login/page';
import GuestRegister from './app/guest-portal/auth/register/page';
import GuestVerify from './app/guest-portal/auth/verify/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Dashboard & Booking)
// ═══════════════════════════════════════════════════
import GuestDashboard from './app/guest-portal/page';
import GuestBooking from './app/guest-portal/booking/page';
import GuestBookingModify from './app/guest-portal/booking/modify/page';
import GuestBookingCancel from './app/guest-portal/booking/cancel/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Check-in & Keys)
// ═══════════════════════════════════════════════════
import GuestCheckIn from './app/guest-portal/check-in/page';
import GuestDigitalKeySetup from './app/guest-portal/check-in/digital-key/page';
import GuestKeys from './app/guest-portal/keys/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Stay Services)
// ═══════════════════════════════════════════════════
import GuestStay from './app/guest-portal/stay/page';
import GuestRoomService from './app/guest-portal/stay/room-service/page';
import GuestHousekeeping from './app/guest-portal/stay/housekeeping/page';
import GuestConcierge from './app/guest-portal/stay/concierge/page';
import GuestIssues from './app/guest-portal/stay/issues/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Billing)
// ═══════════════════════════════════════════════════
import GuestBilling from './app/guest-portal/billing/page';
import GuestInvoice from './app/guest-portal/billing/invoice/page';
import GuestSplitBill from './app/guest-portal/billing/split/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Loyalty)
// ═══════════════════════════════════════════════════
import GuestLoyalty from './app/guest-portal/loyalty/page';
import GuestRewards from './app/guest-portal/loyalty/rewards/page';
import GuestLoyaltyHistory from './app/guest-portal/loyalty/history/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Messages)
// ═══════════════════════════════════════════════════
import GuestMessages from './app/guest-portal/messages/page';
import GuestNotifications from './app/guest-portal/messages/notifications/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Profile)
// ═══════════════════════════════════════════════════
import GuestProfile from './app/guest-portal/profile/page';
import GuestPreferences from './app/guest-portal/profile/preferences/page';
import GuestDocuments from './app/guest-portal/profile/documents/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Reviews)
// ═══════════════════════════════════════════════════
import GuestReviews from './app/guest-portal/reviews/page';
import GuestReviewHistory from './app/guest-portal/reviews/history/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Support)
// ═══════════════════════════════════════════════════
import GuestSupport from './app/guest-portal/support/page';
import GuestTickets from './app/guest-portal/support/tickets/page';
import GuestContact from './app/guest-portal/support/contact/page';

// ═══════════════════════════════════════════════════
// GUEST PORTAL — Pages (Public Status)
// ═══════════════════════════════════════════════════
import GuestStatus from './app/guest-portal/status/page';
import GuestPublicAnnouncements from './app/guest-portal/status/announcements/page';

// Marketing pages
import MarketingHome from './app/marketing/page';
import AboutPage from './app/marketing/about/page';
import FeaturesPage from './app/marketing/features/page';
import PricingPage from './app/marketing/pricing/page';
import ContactPage from './app/marketing/contact/page';
import DemoPage from './app/marketing/demo/page';
import BlogPage from './app/marketing/blog/page';
import CaseStudiesPage from './app/marketing/case-studies/page';
import IntegrationsPage from './app/marketing/integrations/page';
import PartnersPage from './app/marketing/partners/page';
import ApiDocsPage from './app/marketing/api-docs/page';
import HelpPage from './app/marketing/help/page';
import StatusPage from './app/marketing/status/page';
import SecurityPage from './app/marketing/security/page';
import PrivacyPage from './app/marketing/privacy/page';
import TermsPage from './app/marketing/terms/page';
import GdprPage from './app/marketing/gdpr/page';
import PciDssPage from './app/marketing/pci-dss/page';
import SystemRequirementsPage from './app/marketing/system-requirements/page';
import CloudbedsAlt from './app/marketing/alternatives/cloudbeds/page';
import HiltonOnqAlt from './app/marketing/alternatives/hilton-onq/page';
import Opera5Alt from './app/marketing/alternatives/opera-5/page';
import BoutiqueHotels from './app/marketing/solutions/boutique-hotels/page';
import HotelChains from './app/marketing/solutions/hotel-chains/page';
import ContactlessCheckin from './app/marketing/solutions/contactless-checkin/page';
import AiRevenue from './app/marketing/solutions/ai-revenue-management/page';

// Auth pages
import LoginPage from './app/auth/login/page';
import RegisterPage from './app/auth/register/page';
import ForgotPasswordPage from './app/auth/forgot-password/page';

// App (PMS) pages
import AppDashboard from './app/app/dashboard/page';
import ReservationsPage from './app/app/reservations/page';
import ReservationDetailPage from './app/app/reservations/detail/page';
import FrontDeskPage from './app/app/reservations/front-desk/page';
import NewReservationPage from './app/app/reservations/new/page';
import RoomPlanPage from './app/app/room-plan/page';
import BillingPage from './app/app/billing/page';
import BillingDashboardPage from './app/app/billing/dashboard/page';
import RatesPage from './app/app/rates/page';
import InventoryPage from './app/app/inventory/page';
import GuestsPage from './app/app/guests/page';
import HousekeepingPage from './app/app/housekeeping/page';
import NightAuditPage from './app/app/night-audit/page';
import ReportsPage from './app/app/reports/page';
import OnboardingPage from './app/app/onboarding/page';
import ChannelManagerPage from './app/app/channel-manager/page';
import LoyaltyPage from './app/app/loyalty/page';
import SettingsPage from './app/app/settings/page';
import SupportPage from './app/app/support/page';

// Sales & Catering
import SalesCateringPage from './app/app/sales-catering/page';
import SalesCateringBeosPage from './app/app/sales-catering/beos/page';
import SalesCateringClientsPage from './app/app/sales-catering/clients/page';
import SalesCateringEventsPage from './app/app/sales-catering/events/page';

// AR, VCC, Meal Plans
import AccountsReceivablePage from './app/app/ar/page';
import VCCPage from './app/app/vcc/page';
import MealPlansPage from './app/app/meal-plans/page';

// Groups
import GroupsPage from './app/app/groups/page';
import GroupDetailPage from './app/app/groups/details/page';
import NewBlockPage from './app/app/groups/new/page';

// Keys
import KeysPage from './app/app/keys/page';
import KeysRackPage from './app/app/keys/rack/page';
import KeysDigitalPage from './app/app/keys/digital/page';
import KeysMasterPage from './app/app/keys/master/page';

// Parking
import ParkingPage from './app/app/parking/page';
import ParkingSpotsPage from './app/app/parking/spots/page';
import ParkingValetPage from './app/app/parking/valet/page';
import ParkingVehiclesPage from './app/app/parking/vehicles/page';
import ParkingEVChargingPage from './app/app/parking/ev-charging/page';

// Marketing app pages
import MarketingAnalyticsPage from './app/app/marketing/analytics';
import AutomationListPage from './app/app/marketing/automation-list';
import AutomationBuilderPage from './app/app/marketing/automation';
import TemplatesPage from './app/app/marketing/templates';

// Guest portal pages (legacy /guest/*)
import GuestPage from './app/guest-portal/page';
import GuestBookingLegacy from './app/guest-portal/booking/page';
import GuestCheckinLegacy from './app/guest-portal/check-in/page';
import GuestCheckoutLegacy from './app/guest-portal/check-out/page';
import GuestFolioLegacy from './app/guest-portal/billing/page';
import GuestLoyaltyLegacy from './app/guest-portal/loyalty/page';
import GuestMessagingLegacy from './app/guest-portal/messages/page';
import GuestReservationLegacy from './app/guest-portal/booking/page';

// Admin — Tenants / core
import AdminDashboard from './app/admin/page';
import AuditTrailPage from './app/app/audit-trail/page';
import UsersPage from './app/app/users/page';

// Admin — Super Admin console
import AdminOverviewDashboard from './app/admin/dashboard/page';
import AdminAnalyticsPage from './app/admin/analytics/page';
import AdminAnnouncementsPage from './app/admin/announcements/page';
import AdminAuditPage from './app/admin/audit/page';
import AdminBackupsPage from './app/admin/backups/page';
import AdminBillingDashboard from './app/admin/billing/page';
import AdminCreditNotesPage from './app/admin/billing/credit-notes/page';
import AdminDunningPage from './app/admin/billing/dunning/page';
import AdminInvoicesPage from './app/admin/billing/invoices/page';
import AdminRevenuePage from './app/admin/billing/revenue/page';
import AdminSubscriptionsPage from './app/admin/billing/subscriptions/page';
import AdminDataExportPage from './app/admin/data-export/page';
import AdminDemoAccessPage from './app/admin/demo-access/page';
import AdminFeatureFlagsPage from './app/admin/feature-flags/FeatureFlagModal';
import AdminFeedbackPage from './app/admin/feedback/page';
import AdminFinancesPage from './app/admin/finances/page';
import AdminHealthPage from './app/admin/health/page';
import AdminIntegrationsPage from './app/admin/integrations/page';
import AdminOnboardingPage from './app/admin/onboarding/page';
import AdminProfilerPage from './app/admin/profiler/page';
import AdminQuotasPage from './app/admin/quotas/page';
import AdminRbacPage from './app/admin/rbac/page';
import AdminRegionsPage from './app/admin/regions/page';
import AdminReportsPage from './app/admin/reports/page';
import AdminSecurityPage from './app/admin/security/page';
import AdminSettingsPage from './app/admin/settings/page';
import AdminShadowPage from './app/admin/shadow/page';
import AdminTicketsPage from './app/admin/ticket/page';

/* ─── Guest Portal Auth Guard ─── */
function GuestAuthGuard() {
  const { isAuthenticated, isLoading } = useGuestStore();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-text-muted">Loading your stay...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/guest-portal/auth/login" replace />;
  return <Outlet />;
}

/* ─── Simple Error Fallback ─── */
function RouterError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
      <p className="mt-2 text-text-secondary">This page failed to load. Check the console for details.</p>
      <a href="/app/dashboard" className="mt-6 inline-flex items-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90">
        Go to Dashboard
      </a>
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
      { index: true, element: <MarketingHome /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'case-studies', element: <CaseStudiesPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'partners', element: <PartnersPage /> },
      { path: 'api-docs', element: <ApiDocsPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'status', element: <StatusPage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'gdpr', element: <GdprPage /> },
      { path: 'pci-dss', element: <PciDssPage /> },
      { path: 'system-requirements', element: <SystemRequirementsPage /> },
      { path: 'alternative/cloudbeds', element: <CloudbedsAlt /> },
      { path: 'alternative/hilton-onq', element: <HiltonOnqAlt /> },
      { path: 'alternative/opera-5', element: <Opera5Alt /> },
      { path: 'solutions/boutique-hotels', element: <BoutiqueHotels /> },
      { path: 'solutions/hotel-chains', element: <HotelChains /> },
      { path: 'solutions/contactless-checkin', element: <ContactlessCheckin /> },
      { path: 'solutions/ai-revenue-management', element: <AiRevenue /> },
    ],
  },

  /* ─── Auth ─── */
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <RouterError />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  /* ─── Main PMS App ─── */
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AppDashboard /> },
      {
        path: 'reservations',
        children: [
          { index: true, element: <ReservationsPage /> },
          { path: 'front-desk', element: <FrontDeskPage /> },
          { path: 'new', element: <NewReservationPage /> },
          { path: 'detail', element: <ReservationDetailPage /> },
          { path: ':id', element: <ReservationDetailPage /> },
        ],
      },
      { path: 'room-plan', element: <RoomPlanPage /> },
      {
        path: 'billing',
        children: [
          { index: true, element: <BillingPage /> },
          { path: 'dashboard', element: <BillingDashboardPage /> },
        ],
      },
      { path: 'rates', element: <RatesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'guests', element: <GuestsPage /> },
      { path: 'housekeeping', element: <HousekeepingPage /> },
      { path: 'night-audit', element: <NightAuditPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'channel-manager', element: <ChannelManagerPage /> },
      { path: 'loyalty', element: <LoyaltyPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'support', element: <SupportPage /> },
      {
        path: 'sales-catering',
        children: [
          { index: true, element: <SalesCateringPage /> },
          { path: 'beos', element: <SalesCateringBeosPage /> },
          { path: 'clients', element: <SalesCateringClientsPage /> },
          { path: 'events', element: <SalesCateringEventsPage /> },
        ],
      },
      { path: 'audit-trail', element: <AuditTrailPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'ar', element: <AccountsReceivablePage /> },
      { path: 'vcc', element: <VCCPage /> },
      { path: 'meal-plans', element: <MealPlansPage /> },
      {
        path: 'groups',
        children: [
          { index: true, element: <GroupsPage /> },
          { path: 'new', element: <NewBlockPage /> },
          { path: 'detail', element: <GroupDetailPage /> },
        ],
      },
      {
        path: 'keys',
        children: [
          { index: true, element: <KeysPage /> },
          { path: 'rack', element: <KeysRackPage /> },
          { path: 'digital', element: <KeysDigitalPage /> },
          { path: 'master', element: <KeysMasterPage /> },
        ],
      },
      {
        path: 'parking',
        children: [
          { index: true, element: <ParkingPage /> },
          { path: 'spots', element: <ParkingSpotsPage /> },
          { path: 'valet', element: <ParkingValetPage /> },
          { path: 'vehicles', element: <ParkingVehiclesPage /> },
          { path: 'ev-charging', element: <ParkingEVChargingPage /> },
        ],
      },
      {
        path: 'marketing',
        children: [
          { index: true, element: <Navigate to="analytics" replace /> },
          { path: 'analytics', element: <MarketingAnalyticsPage /> },
          { path: 'automation', element: <AutomationBuilderPage /> },
          { path: 'automation-list', element: <AutomationListPage /> },
          { path: 'templates', element: <TemplatesPage /> },
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
    element: <GuestStatus />,
    errorElement: <RouterError />,
  },
  {
    path: '/guest-portal/status/announcements',
    element: <GuestPublicAnnouncements />,
    errorElement: <RouterError />,
  },

  /* ─── Auth Pages (no sidebar, public) ─── */
  {
    path: '/guest-portal/auth',
    element: <GuestAuthLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <GuestLogin /> },
      { path: 'register', element: <GuestRegister /> },
      { path: 'verify', element: <GuestVerify /> },
      { path: 'forgot-password', element: <Navigate to="/auth/forgot-password" replace /> },
    ],
  },

  /* ─── Protected Guest Portal (auth required) ─── */
  {
    path: '/guest-portal',
    element: <GuestAuthGuard />,
    errorElement: <RouterError />,
    children: [
      {
        element: <GuestPortalLayout />,
        children: [
          /* Dashboard */
          { index: true, element: <GuestDashboard /> },

          /* Booking */
          { path: 'booking', element: <GuestBooking /> },
          { path: 'booking/modify', element: <GuestBookingModify /> },
          { path: 'booking/cancel', element: <GuestBookingCancel /> },

          /* Check-in */
          { path: 'check-in', element: <GuestCheckIn /> },
          { path: 'check-in/digital-key', element: <GuestDigitalKeySetup /> },

          /* Stay Services */
          { path: 'stay', element: <GuestStay /> },
          { path: 'stay/room-service', element: <GuestRoomService /> },
          { path: 'stay/housekeeping', element: <GuestHousekeeping /> },
          { path: 'stay/concierge', element: <GuestConcierge /> },
          { path: 'stay/issues', element: <GuestIssues /> },

          /* Keys */
          { path: 'keys', element: <GuestKeys /> },

          /* Billing */
          { path: 'billing', element: <GuestBilling /> },
          { path: 'billing/invoice', element: <GuestInvoice /> },
          { path: 'billing/split', element: <GuestSplitBill /> },

          /* Loyalty */
          { path: 'loyalty', element: <GuestLoyalty /> },
          { path: 'loyalty/rewards', element: <GuestRewards /> },
          { path: 'loyalty/history', element: <GuestLoyaltyHistory /> },

          /* Messages */
          { path: 'messages', element: <GuestMessages /> },
          { path: 'messages/notifications', element: <GuestNotifications /> },

          /* Profile */
          { path: 'profile', element: <GuestProfile /> },
          { path: 'profile/preferences', element: <GuestPreferences /> },
          { path: 'profile/documents', element: <GuestDocuments /> },

          /* Reviews */
          { path: 'reviews', element: <GuestReviews /> },
          { path: 'reviews/history', element: <GuestReviewHistory /> },

          /* Support */
          { path: 'support', element: <GuestSupport /> },
          { path: 'support/tickets', element: <GuestTickets /> },
          { path: 'support/contact', element: <GuestContact /> },
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
      { index: true, element: <GuestPage /> },
      { path: 'booking', element: <GuestBookingLegacy /> },
      { path: 'checkin', element: <GuestCheckinLegacy /> },
      { path: 'checkout', element: <GuestCheckoutLegacy /> },
      { path: 'folio', element: <GuestFolioLegacy /> },
      { path: 'loyalty', element: <GuestLoyaltyLegacy /> },
      { path: 'messaging', element: <GuestMessagingLegacy /> },
      { path: 'reservation', element: <GuestReservationLegacy /> },
    ],
  },

  /* ─── Super Admin ─── */
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouterError />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminOverviewDashboard /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'announcements', element: <AdminAnnouncementsPage /> },
      { path: 'audit', element: <AdminAuditPage /> },
      { path: 'backups', element: <AdminBackupsPage /> },
      {
        path: 'billing',
        children: [
          { index: true, element: <AdminBillingDashboard /> },
          { path: 'credit-notes', element: <AdminCreditNotesPage /> },
          { path: 'dunning', element: <AdminDunningPage /> },
          { path: 'invoices', element: <AdminInvoicesPage /> },
          { path: 'revenue', element: <AdminRevenuePage /> },
          { path: 'subscriptions', element: <AdminSubscriptionsPage /> },
        ],
      },
      { path: 'data-export', element: <AdminDataExportPage /> },
      { path: 'demo-access', element: <AdminDemoAccessPage /> },
      { path: 'feature-flags', element: <AdminFeatureFlagsPage /> },
      { path: 'feedback', element: <AdminFeedbackPage /> },
      { path: 'finances', element: <AdminFinancesPage /> },
      { path: 'health', element: <AdminHealthPage /> },
      { path: 'integrations', element: <AdminIntegrationsPage /> },
      { path: 'onboarding', element: <AdminOnboardingPage /> },
      { path: 'profiler', element: <AdminProfilerPage /> },
      { path: 'quotas', element: <AdminQuotasPage /> },
      { path: 'rbac', element: <AdminRbacPage /> },
      { path: 'regions', element: <AdminRegionsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'security', element: <AdminSecurityPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'shadow', element: <AdminShadowPage /> },
      { path: 'ticket', element: <AdminTicketsPage /> },
    ],
  },

  /* ─── 404 Catch-all ─── */
  { path: '*', element: <Navigate to="/" replace /> },
]);