/* src/app/admin/tickets/data.js */

/* ─── Mock Support Tickets ─── */
export const initialTickets = [
  {
    id: 'TKT-2026-0816-001',
    subject: 'Cannot process credit card payments',
    description:
      'When trying to charge a guest\'s card at checkout, the system returns "Payment gateway timeout". This started happening after the update this morning. We\'ve tried multiple cards and all fail.',
    status: 'open',
    priority: 'critical',
    category: 'billing',
    source: 'tenant',
    tenant: { id: 'TNT-001', name: 'Grand Hotel Boston' },
    requester: { name: 'Robert Chen', email: 'robert@grandhotel.com', role: 'admin' },
    assignee: { name: 'Sarah Johnson', email: 'sarah.j@vimad.io', avatar: 'SJ' },
    createdAt: '2026-08-16 09:15:00',
    updatedAt: '2026-08-16 14:32:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-16 09:22:00',
    slaDeadline: '2026-08-16 13:15:00',
    tags: ['payment', 'gateway', 'urgent'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Robert Chen',
        timestamp: '2026-08-16 09:15:00',
        body: 'Cannot process credit card payments. Getting timeout errors on all transactions.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Sarah Johnson',
        timestamp: '2026-08-16 09:22:00',
        body: "Hi Robert, I'm looking into this immediately. Can you confirm which payment processor you're using and if you see any specific error codes?",
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'Robert Chen',
        timestamp: '2026-08-16 10:05:00',
        body: 'We use Stripe. Error code is "gateway_timeout" — happens on every attempt.',
        internal: false,
      },
      {
        id: 4,
        from: 'agent',
        author: 'Sarah Johnson',
        timestamp: '2026-08-16 11:30:00',
        body: "Escalating to engineering. Stripe API had a partial outage this morning. We're implementing a fallback.",
        internal: false,
      },
      {
        id: 5,
        from: 'agent',
        author: 'Sarah Johnson',
        timestamp: '2026-08-16 11:31:00',
        body: 'Note: Stripe status page shows degraded performance on Charges API since 08:45 UTC.',
        internal: true,
      },
    ],
  },
  {
    id: 'TKT-2026-0816-002',
    subject: "Room 204 showing as available but it's occupied",
    description:
      'Guest checked in yesterday to room 204 but the system shows it as vacant and available for booking. We had a walk-in guest try to book it this morning.',
    status: 'in_progress',
    priority: 'high',
    category: 'reservations',
    source: 'tenant',
    tenant: { id: 'TNT-002', name: 'Seaside Resort Miami' },
    requester: { name: 'Maria Garcia', email: 'maria@seasideresort.com', role: 'manager' },
    assignee: { name: 'David Park', email: 'david.p@vimad.io', avatar: 'DP' },
    createdAt: '2026-08-16 08:45:00',
    updatedAt: '2026-08-16 12:10:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-16 09:00:00',
    slaDeadline: '2026-08-16 16:45:00',
    tags: ['room-status', 'sync', 'availability'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Maria Garcia',
        timestamp: '2026-08-16 08:45:00',
        body: 'Room 204 showing as available but guest checked in yesterday. System out of sync.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'David Park',
        timestamp: '2026-08-16 09:00:00',
        body: 'Thanks Maria. Checking the reservation sync logs now. Can you provide the reservation ID?',
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'Maria Garcia',
        timestamp: '2026-08-16 09:30:00',
        body: 'Reservation #R-20482. Guest: Michael Brown.',
        internal: false,
      },
      {
        id: 4,
        from: 'agent',
        author: 'David Park',
        timestamp: '2026-08-16 12:10:00',
        body: "Found the issue — the check-in webhook failed to update the room cache. I've manually corrected room 204 status and triggered a full cache rebuild.",
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0816-003',
    subject: 'Request: Add custom fields to guest profile',
    description:
      'We need to track dietary restrictions and accessibility needs for our guests. Can we add custom fields to the guest profile form?',
    status: 'pending',
    priority: 'medium',
    category: 'feature_request',
    source: 'tenant',
    tenant: { id: 'TNT-005', name: 'Coastal Inn San Diego' },
    requester: { name: 'David Park', email: 'david@coastalinn.com', role: 'admin' },
    assignee: { name: 'Lisa Wong', email: 'lisa.w@vimad.io', avatar: 'LW' },
    createdAt: '2026-08-15 16:20:00',
    updatedAt: '2026-08-16 10:00:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-15 17:00:00',
    slaDeadline: '2026-08-17 16:20:00',
    tags: ['customization', 'guest-profile', 'feature-request'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'David Park',
        timestamp: '2026-08-15 16:20:00',
        body: 'Would like to add custom fields for dietary restrictions and accessibility needs in guest profiles.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Lisa Wong',
        timestamp: '2026-08-15 17:00:00',
        body: "Hi David! This is on our Q3 roadmap. I'll add your vote to the feature request. Would you need these fields to sync to the guest portal as well?",
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'David Park',
        timestamp: '2026-08-16 10:00:00',
        body: 'Yes, guest portal would be great too. Also need them on the pre-arrival email.',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0816-004',
    subject: 'Channel manager sync failing for Booking.com',
    description:
      'Inventory updates are not pushing to Booking.com. Rate changes sync fine but room availability is stale. Last successful sync was 6 hours ago.',
    status: 'open',
    priority: 'high',
    category: 'integrations',
    source: 'tenant',
    tenant: { id: 'TNT-007', name: 'Urban Hotel NYC' },
    requester: { name: 'Kevin Lee', email: 'kevin@urbanhotel.com', role: 'admin' },
    assignee: { name: 'Sarah Johnson', email: 'sarah.j@vimad.io', avatar: 'SJ' },
    createdAt: '2026-08-16 07:30:00',
    updatedAt: '2026-08-16 07:30:00',
    resolvedAt: null,
    firstResponseAt: null,
    slaDeadline: '2026-08-16 15:30:00',
    tags: ['channel-manager', 'booking-com', 'sync'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Kevin Lee',
        timestamp: '2026-08-16 07:30:00',
        body: 'Channel manager not syncing inventory to Booking.com. Rate changes work but availability is 6 hours stale.',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0815-005',
    subject: 'Night audit report missing revenue breakdown',
    description:
      'The nightly audit report used to show a breakdown by room type and revenue source. Since last week it only shows totals.',
    status: 'resolved',
    priority: 'low',
    category: 'reports',
    source: 'tenant',
    tenant: { id: 'TNT-002', name: 'Seaside Resort Miami' },
    requester: { name: 'Maria Garcia', email: 'maria@seasideresort.com', role: 'manager' },
    assignee: { name: 'James Miller', email: 'james.m@vimad.io', avatar: 'JM' },
    createdAt: '2026-08-15 09:00:00',
    updatedAt: '2026-08-16 08:00:00',
    resolvedAt: '2026-08-16 08:00:00',
    firstResponseAt: '2026-08-15 10:15:00',
    slaDeadline: '2026-08-16 09:00:00',
    tags: ['reports', 'night-audit', 'regression'],
    satisfaction: 5,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Maria Garcia',
        timestamp: '2026-08-15 09:00:00',
        body: 'Night audit report missing the revenue breakdown by room type. Only showing totals now.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'James Miller',
        timestamp: '2026-08-15 10:15:00',
        body: "Thanks for reporting this. We had a template change last week that removed the breakdown. I'll restore it.",
        internal: false,
      },
      {
        id: 3,
        from: 'agent',
        author: 'James Miller',
        timestamp: '2026-08-16 08:00:00',
        body: "The revenue breakdown has been restored to the night audit report. You should see it in tonight's run. Let me know if anything looks off!",
        internal: false,
      },
      {
        id: 4,
        from: 'system',
        author: 'Maria Garcia',
        timestamp: '2026-08-16 08:30:00',
        body: 'Perfect, thank you James!',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0815-006',
    subject: 'Housekeeping mobile app crashes on Android',
    description:
      'Our housekeeping staff reports the mobile app crashes when they try to update room status. All devices are Samsung Galaxy A14 running Android 13.',
    status: 'in_progress',
    priority: 'high',
    category: 'mobile',
    source: 'tenant',
    tenant: { id: 'TNT-001', name: 'Grand Hotel Boston' },
    requester: { name: 'Robert Chen', email: 'robert@grandhotel.com', role: 'admin' },
    assignee: { name: 'Mike Chen', email: 'mike.c@vimad.io', avatar: 'MC' },
    createdAt: '2026-08-15 14:00:00',
    updatedAt: '2026-08-16 11:00:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-15 14:30:00',
    slaDeadline: '2026-08-16 14:00:00',
    tags: ['mobile', 'android', 'crash', 'housekeeping'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Robert Chen',
        timestamp: '2026-08-15 14:00:00',
        body: 'Housekeeping app crashes on Samsung Galaxy A14 / Android 13 when updating room status.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Mike Chen',
        timestamp: '2026-08-15 14:30:00',
        body: 'Thanks Robert. We identified a memory leak in the room status update on Android 13. A hotfix is being deployed now.',
        internal: false,
      },
      {
        id: 3,
        from: 'agent',
        author: 'Mike Chen',
        timestamp: '2026-08-16 11:00:00',
        body: 'Hotfix v2.4.2 is now available on the Play Store. Please have your team update and let me know if the crashes persist.',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0814-007',
    subject: 'Need to migrate historical data from old PMS',
    description:
      'We are switching from Opera PMS and need to migrate 3 years of guest history, reservations, and folio data. Looking for guidance on the migration process.',
    status: 'pending',
    priority: 'medium',
    category: 'migration',
    source: 'tenant',
    tenant: { id: 'TNT-006', name: 'Lakeside Resort Tahoe' },
    requester: { name: 'Amanda Wilson', email: 'amanda@lakesideresort.com', role: 'admin' },
    assignee: { name: 'Lisa Wong', email: 'lisa.w@vimad.io', avatar: 'LW' },
    createdAt: '2026-08-14 11:00:00',
    updatedAt: '2026-08-15 09:00:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-14 14:00:00',
    slaDeadline: '2026-08-17 11:00:00',
    tags: ['migration', 'opera', 'onboarding', 'data'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Amanda Wilson',
        timestamp: '2026-08-14 11:00:00',
        body: 'Need to migrate 3 years of data from Opera PMS. Looking for process guidance.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Lisa Wong',
        timestamp: '2026-08-14 14:00:00',
        body: "Hi Amanda! We have a dedicated migration team for Opera transitions. I'll schedule a kickoff call for next week. In the meantime, can you confirm the approximate volume? (reservations, guest records)",
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'Amanda Wilson',
        timestamp: '2026-08-15 09:00:00',
        body: "Approximately 45,000 reservations and 12,000 unique guest records. We also have folio PDFs we'd like to attach.",
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0814-008',
    subject: 'Rate plan not applying weekend surcharge',
    description:
      "We have a weekend surcharge of $50 configured in our Deluxe King rate plan, but it's not being applied to reservations checking in this Friday and Saturday.",
    status: 'resolved',
    priority: 'medium',
    category: 'rates',
    source: 'tenant',
    tenant: { id: 'TNT-003', name: 'Mountain Lodge Aspen' },
    requester: { name: 'James Miller', email: 'james@mountainlodge.com', role: 'admin' },
    assignee: { name: 'David Park', email: 'david.p@vimad.io', avatar: 'DP' },
    createdAt: '2026-08-14 10:30:00',
    updatedAt: '2026-08-15 16:00:00',
    resolvedAt: '2026-08-15 16:00:00',
    firstResponseAt: '2026-08-14 11:00:00',
    slaDeadline: '2026-08-15 10:30:00',
    tags: ['rates', 'weekend', 'surcharge', 'pricing'],
    satisfaction: 4,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'James Miller',
        timestamp: '2026-08-14 10:30:00',
        body: 'Weekend surcharge not applying to reservations. Rate plan shows $50 surcharge but not reflected in bookings.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'David Park',
        timestamp: '2026-08-14 11:00:00',
        body: 'Looking into this now. Can you share the rate plan ID?',
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'James Miller',
        timestamp: '2026-08-14 11:30:00',
        body: 'Rate plan: RP-DELUXE-001',
        internal: false,
      },
      {
        id: 4,
        from: 'agent',
        author: 'David Park',
        timestamp: '2026-08-15 16:00:00',
        body: 'Found the bug — the weekend surcharge rule had an incorrect day-of-week mapping (Saturday was mapped to Sunday). Fixed and verified on your upcoming reservations.',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0813-009',
    subject: 'Two-factor authentication not sending SMS',
    description:
      'Staff members with 2FA enabled via SMS are not receiving codes. Email 2FA works fine. This affects 5 users.',
    status: 'open',
    priority: 'high',
    category: 'auth',
    source: 'tenant',
    tenant: { id: 'TNT-004', name: 'Downtown Suites Chicago' },
    requester: { name: 'Lisa Wong', email: 'lisa@downtownsuites.com', role: 'admin' },
    assignee: null,
    createdAt: '2026-08-13 13:00:00',
    updatedAt: '2026-08-13 13:00:00',
    resolvedAt: null,
    firstResponseAt: null,
    slaDeadline: '2026-08-14 13:00:00',
    tags: ['2fa', 'sms', 'auth', 'notifications'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Lisa Wong',
        timestamp: '2026-08-13 13:00:00',
        body: 'SMS 2FA codes not being delivered. Email works. Affects 5 staff members.',
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0813-010',
    subject: 'Request: API access for custom dashboard',
    description:
      'Our IT team wants to build a custom executive dashboard pulling data from Vimad. Need API keys and documentation for read-only access to occupancy and revenue data.',
    status: 'pending',
    priority: 'low',
    category: 'api',
    source: 'tenant',
    tenant: { id: 'TNT-001', name: 'Grand Hotel Boston' },
    requester: { name: 'Robert Chen', email: 'robert@grandhotel.com', role: 'admin' },
    assignee: { name: 'James Miller', email: 'james.m@vimad.io', avatar: 'JM' },
    createdAt: '2026-08-13 09:00:00',
    updatedAt: '2026-08-13 11:00:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-13 11:00:00',
    slaDeadline: '2026-08-16 09:00:00',
    tags: ['api', 'integration', 'dashboard', 'developer'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Robert Chen',
        timestamp: '2026-08-13 09:00:00',
        body: 'Need API access for custom executive dashboard. Read-only access to occupancy and revenue data.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'James Miller',
        timestamp: '2026-08-13 11:00:00',
        body: "Hi Robert! I've generated API keys for your tenant and sent the documentation link. The read-only scope includes occupancy, revenue, and guest metrics. Let me know if you need webhook access too.",
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0812-011',
    subject: 'Guest portal booking engine showing wrong currency',
    description:
      'Our property is configured for USD but the guest portal is displaying prices in EUR. This started after the currency setting update on Monday.',
    status: 'resolved',
    priority: 'medium',
    category: 'guest_portal',
    source: 'tenant',
    tenant: { id: 'TNT-005', name: 'Coastal Inn San Diego' },
    requester: { name: 'David Park', email: 'david@coastalinn.com', role: 'admin' },
    assignee: { name: 'Sarah Johnson', email: 'sarah.j@vimad.io', avatar: 'SJ' },
    createdAt: '2026-08-12 15:00:00',
    updatedAt: '2026-08-13 10:00:00',
    resolvedAt: '2026-08-13 10:00:00',
    firstResponseAt: '2026-08-12 16:00:00',
    slaDeadline: '2026-08-13 15:00:00',
    tags: ['guest-portal', 'currency', 'booking-engine'],
    satisfaction: 5,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'David Park',
        timestamp: '2026-08-12 15:00:00',
        body: "Guest portal showing EUR instead of USD. Started after Monday's update.",
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Sarah Johnson',
        timestamp: '2026-08-12 16:00:00',
        body: "Thanks David. I see the issue — the currency cache wasn't invalidated after your settings change. Clearing now.",
        internal: false,
      },
      {
        id: 3,
        from: 'agent',
        author: 'Sarah Johnson',
        timestamp: '2026-08-13 10:00:00',
        body: "Cache cleared and guest portal is now showing USD. I've also added a fix to prevent this in future updates.",
        internal: false,
      },
    ],
  },
  {
    id: 'TKT-2026-0812-012',
    subject: 'Bulk reservation import failing with validation errors',
    description:
      'Trying to import 200 reservations via CSV for a group booking. Getting "Invalid date format" on every row even though dates are in yyyy-mm-dd format.',
    status: 'in_progress',
    priority: 'medium',
    category: 'data',
    source: 'tenant',
    tenant: { id: 'TNT-007', name: 'Urban Hotel NYC' },
    requester: { name: 'Kevin Lee', email: 'kevin@urbanhotel.com', role: 'admin' },
    assignee: { name: 'Mike Chen', email: 'mike.c@vimad.io', avatar: 'MC' },
    createdAt: '2026-08-12 11:00:00',
    updatedAt: '2026-08-16 09:00:00',
    resolvedAt: null,
    firstResponseAt: '2026-08-12 12:00:00',
    slaDeadline: '2026-08-14 11:00:00',
    tags: ['import', 'csv', 'bulk', 'reservations'],
    satisfaction: null,
    messages: [
      {
        id: 1,
        from: 'system',
        author: 'Kevin Lee',
        timestamp: '2026-08-12 11:00:00',
        body: 'CSV import failing with date validation errors. Dates are yyyy-mm-dd format.',
        internal: false,
      },
      {
        id: 2,
        from: 'agent',
        author: 'Mike Chen',
        timestamp: '2026-08-12 12:00:00',
        body: 'Hi Kevin. Can you share a sample of the CSV? The validator may be tripping on hidden characters or BOM.',
        internal: false,
      },
      {
        id: 3,
        from: 'tenant',
        author: 'Kevin Lee',
        timestamp: '2026-08-12 14:00:00',
        body: 'Attached sample CSV. I see the file has UTF-8 BOM — could that be it?',
        internal: false,
      },
      {
        id: 4,
        from: 'agent',
        author: 'Mike Chen',
        timestamp: '2026-08-16 09:00:00',
        body: "Exactly right — the BOM was causing the parser to misread the first column. I've updated the importer to strip BOM and added better error messages. Should be deployed today.",
        internal: false,
      },
    ],
  },
];

/* ─── Metadata ─── */
export const priorityMeta = {
  critical: {
    label: 'Critical',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    iconColor: 'text-danger',
  },
  high: {
    label: 'High',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    iconColor: 'text-warning',
  },
  medium: {
    label: 'Medium',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    iconColor: 'text-info',
  },
  low: {
    label: 'Low',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    iconColor: 'text-text-muted',
  },
};

export const statusMeta = {
  open: { label: 'Open', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  in_progress: {
    label: 'In Progress',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  resolved: {
    label: 'Resolved',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  closed: {
    label: 'Closed',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

export const categoryMeta = {
  billing: { label: 'Billing', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  reservations: { label: 'Reservations', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  feature_request: { label: 'Feature Request', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  integrations: { label: 'Integrations', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  reports: { label: 'Reports', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  mobile: { label: 'Mobile', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  migration: { label: 'Migration', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  rates: { label: 'Rates', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  auth: { label: 'Authentication', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  api: { label: 'API', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  guest_portal: { label: 'Guest Portal', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  data: { label: 'Data', color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export const sourceMeta = {
  tenant: { label: 'Tenant', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  system: { label: 'System', class: 'bg-neutral/10 text-text-muted border-border' },
  internal: { label: 'Internal', class: 'bg-accent/10 text-accent border-accent/20' },
};

/* ─── Helpers ─── */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T'));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T'));
  const now = new Date('2026-08-16T14:20:00');
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getSlaStatus(ticket) {
  if (ticket.status === 'resolved' || ticket.status === 'closed') return 'met';
  const deadline = new Date(ticket.slaDeadline.replace(' ', 'T'));
  const now = new Date('2026-08-16T14:20:00');
  if (now > deadline) return 'breached';
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  if (hoursLeft < 2) return 'at_risk';
  return 'on_track';
}

export function getResponseTime(ticket) {
  if (!ticket.firstResponseAt) return null;
  const created = new Date(ticket.createdAt.replace(' ', 'T'));
  const responded = new Date(ticket.firstResponseAt.replace(' ', 'T'));
  const diff = Math.floor((responded - created) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

/* ─── Team Members (for assignment) ─── */
export const teamMembers = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    email: 'sarah.j@vimad.io',
    avatar: 'SJ',
    role: 'Senior Support',
    activeTickets: 3,
  },
  {
    id: 'david',
    name: 'David Park',
    email: 'david.p@vimad.io',
    avatar: 'DP',
    role: 'Technical Support',
    activeTickets: 2,
  },
  {
    id: 'lisa',
    name: 'Lisa Wong',
    email: 'lisa.w@vimad.io',
    avatar: 'LW',
    role: 'Customer Success',
    activeTickets: 2,
  },
  {
    id: 'james',
    name: 'James Miller',
    email: 'james.m@vimad.io',
    avatar: 'JM',
    role: 'Platform Support',
    activeTickets: 2,
  },
  {
    id: 'mike',
    name: 'Mike Chen',
    email: 'mike.c@vimad.io',
    avatar: 'MC',
    role: 'Engineering Support',
    activeTickets: 2,
  },
];
