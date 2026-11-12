/* apps/web/src/lib/navGroups.js
 * Job-based navigation groups (roadmap audit §5.1, Phase 3 nav restructure).
 * LINKS ONLY: every route here already exists in the app — this file decides
 * where users FIND it, nothing else. Group order = task frequency.
 * To add or move a destination: edit one line here. The sidebar renders
 * groups automatically; no component changes needed.
 */
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  Wallet,
  BarChart3,
  Settings,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    key: 'today',
    label: 'Today',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', to: '/app/dashboard' },
      { label: 'Needs Attention', to: '/app/exceptions' },
    ],
  },
  {
    key: 'reservations',
    label: 'Reservations',
    icon: CalendarDays,
    items: [
      { label: 'Reservations', to: '/app/reservations' },
      { label: 'Front Desk', to: '/app/reservations/front-desk' },
      { label: 'Room Plan', to: '/app/room-plan' },
      { label: 'Groups', to: '/app/groups' },
      { label: 'Central Reservations', to: '/app/central-reservations' },
      { label: 'Channel Manager', to: '/app/channel-manager' },
    ],
  },
  {
    key: 'rooms',
    label: 'Rooms & Operations',
    icon: BedDouble,
    items: [
      { label: 'Room Board', to: '/app/rooms' },
      { label: 'Housekeeping', to: '/app/housekeeping' },
      { label: 'Space Status', to: '/app/housekeeping/space-status' },
      { label: 'HK Activity', to: '/app/housekeeping/activity' },
      { label: 'Tasks', to: '/app/tasks' },
      { label: 'Concierge', to: '/app/concierge' },
      { label: 'Parking', to: '/app/parking' },
      { label: 'Keys', to: '/app/keys' },
      { label: 'Night Audit', to: '/app/night-audit' },
    ],
  },
  {
    key: 'guests',
    label: 'Guests & Experience',
    icon: Users,
    items: [
      { label: 'Guests', to: '/app/guests' },
      { label: 'CRM', to: '/app/crm' },
      { label: 'Guest Identity', to: '/app/guest-identity' },
      { label: 'Loyalty', to: '/app/loyalty' },
      { label: 'Comms', to: '/app/comms' },
      { label: 'Marketing', to: '/app/marketing' },
      { label: 'Support', to: '/app/support' },
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue & Finance',
    icon: Wallet,
    items: [
      { label: 'Rates', to: '/app/rates' },
      { label: 'Pricing', to: '/app/rates/pricing' },
      { label: 'Inventory', to: '/app/inventory' },
      { label: 'Billing', to: '/app/billing' },
      { label: 'Invoices', to: '/app/billing/invoices' },
      { label: 'Payments', to: '/app/billing/payments' },
      { label: 'Payment Requests', to: '/app/billing/payment-requests' },
      { label: 'AR', to: '/app/ar' },
      { label: 'VCC', to: '/app/vcc' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: BarChart3,
    items: [{ label: 'Reports', to: '/app/reports' }],
  },
  {
    key: 'setup',
    label: 'More / Setup',
    icon: Settings,
    items: [
      { label: 'Properties', to: '/app/properties' },
      { label: 'Users', to: '/app/users' },
      { label: 'Onboarding', to: '/app/onboarding' },
      { label: 'Meal Plans', to: '/app/meal-plans' },
      { label: 'Sales & Catering', to: '/app/sales-catering' },
      { label: 'Chain Dashboard', to: '/app/chain-dashboard' },
      { label: 'Chain Billing', to: '/app/chain-billing' },
      { label: 'Chain Loyalty', to: '/app/chain-loyalty' },
      { label: 'Settings', to: '/app/settings' },
      { label: 'Email Settings', to: '/app/settings/email' },
      { label: 'Audit Trail', to: '/app/audit-trail' },
    ],
  },
];
