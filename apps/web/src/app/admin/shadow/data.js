/* src/app/admin/shadow/data.js */

/* ─── Mock Users Available for Shadow ─── */
export const shadowableUsers = [
  {
    id: 'USR-001',
    name: 'Alex Morgan',
    email: 'alex@property.com',
    role: 'admin',
    property: 'Grand Plaza Hotel',
    propertyId: 'TNT-001',
    avatar: 'AM',
    status: 'online',
    lastActive: '2026-08-16 23:45:00',
    department: 'Management',
    permissions: ['full_access', 'billing', 'reports', 'settings'],
    defaultModule: 'dashboard',
    currentSession: {
      id: 'SESS-abc123',
      ip: '192.168.1.45',
      userAgent: 'Chrome 128 / macOS',
      startedAt: '2026-08-16 09:00:00',
      currentModule: 'reservations',
    },
  },
  {
    id: 'USR-002',
    name: 'Sarah Johnson',
    email: 'sarah@frontdesk.com',
    role: 'front_desk',
    property: 'Grand Plaza Hotel',
    propertyId: 'TNT-001',
    avatar: 'SJ',
    status: 'online',
    lastActive: '2026-08-16 23:50:00',
    department: 'Front Desk',
    permissions: ['reservations', 'checkin', 'checkout', 'guest_lookup'],
    defaultModule: 'front-desk',
    currentSession: {
      id: 'SESS-def456',
      ip: '192.168.1.12',
      userAgent: 'Chrome 128 / Windows 11',
      startedAt: '2026-08-16 14:30:00',
      currentModule: 'front-desk',
    },
  },
  {
    id: 'USR-003',
    name: 'David Park',
    email: 'david@revenue.com',
    role: 'manager',
    property: 'Seaside Resort',
    propertyId: 'TNT-002',
    avatar: 'DP',
    status: 'away',
    lastActive: '2026-08-16 22:15:00',
    department: 'Revenue Management',
    permissions: ['rates', 'reports', 'analytics', 'forecasts'],
    defaultModule: 'rates',
    currentSession: null,
  },
  {
    id: 'USR-004',
    name: 'Maria Garcia',
    email: 'maria@housekeeping.com',
    role: 'housekeeping',
    property: 'Grand Plaza Hotel',
    propertyId: 'TNT-001',
    avatar: 'MG',
    status: 'online',
    lastActive: '2026-08-16 23:48:00',
    department: 'Housekeeping',
    permissions: ['housekeeping', 'room_status', 'maintenance'],
    defaultModule: 'housekeeping',
    currentSession: {
      id: 'SESS-ghi789',
      ip: '192.168.1.78',
      userAgent: 'Safari / iPadOS',
      startedAt: '2026-08-16 06:00:00',
      currentModule: 'housekeeping',
    },
  },
  {
    id: 'USR-005',
    name: 'James Miller',
    email: 'james@nightaudit.com',
    role: 'manager',
    property: 'Mountain Lodge',
    propertyId: 'TNT-003',
    avatar: 'JM',
    status: 'offline',
    lastActive: '2026-08-16 08:00:00',
    department: 'Night Audit',
    permissions: ['night_audit', 'reports', 'end_of_day'],
    defaultModule: 'night-audit',
    currentSession: null,
  },
  {
    id: 'USR-006',
    name: 'Lisa Wong',
    email: 'lisa@sales.com',
    role: 'admin',
    property: 'Downtown Suites',
    propertyId: 'TNT-004',
    avatar: 'LW',
    status: 'online',
    lastActive: '2026-08-16 23:52:00',
    department: 'Sales & Catering',
    permissions: ['sales', 'events', 'beos', 'clients', 'groups'],
    defaultModule: 'sales-catering',
    currentSession: {
      id: 'SESS-jkl012',
      ip: '192.168.1.92',
      userAgent: 'Firefox 130 / macOS',
      startedAt: '2026-08-16 10:00:00',
      currentModule: 'sales-catering',
    },
  },
  {
    id: 'USR-007',
    name: 'Robert Chen',
    email: 'robert@it.com',
    role: 'readonly',
    property: 'Grand Plaza Hotel',
    propertyId: 'TNT-001',
    avatar: 'RC',
    status: 'online',
    lastActive: '2026-08-16 23:40:00',
    department: 'IT Support',
    permissions: ['view_only', 'reports', 'system_health'],
    defaultModule: 'dashboard',
    currentSession: {
      id: 'SESS-mno345',
      ip: '192.168.1.101',
      userAgent: 'Chrome 128 / Linux',
      startedAt: '2026-08-16 16:00:00',
      currentModule: 'support',
    },
  },
  {
    id: 'USR-008',
    name: 'Amanda Wilson',
    email: 'amanda@gm.com',
    role: 'admin',
    property: 'Lakeside Resort',
    propertyId: 'TNT-006',
    avatar: 'AW',
    status: 'away',
    lastActive: '2026-08-16 21:30:00',
    department: 'General Management',
    permissions: ['full_access', 'all_modules'],
    defaultModule: 'dashboard',
    currentSession: null,
  },
];

/* ─── Mock Shadow Session History ─── */
export const mockShadowHistory = [
  {
    id: 'SHD-8XJ2KP',
    shadowUser: { id: 'USR-002', name: 'Sarah Johnson', role: 'front_desk', email: 'sarah@frontdesk.com' },
    originalUser: { id: 'ADM-001', name: 'Super Admin', role: 'super_admin' },
    startTime: '2026-08-16 14:30:00',
    endTime: '2026-08-16 14:45:00',
    duration: 900,
    reason: 'manual',
    stealth: false,
    actionsTaken: [
      { action: 'SESSION_STARTED', timestamp: '2026-08-16 14:30:00' },
      { action: 'VIEWED_RESERVATION', details: { reservationId: 'R-4023' }, timestamp: '2026-08-16 14:32:00' },
      { action: 'MODIFIED_GUEST_PROFILE', details: { guestId: 'G-8891' }, timestamp: '2026-08-16 14:35:00' },
      { action: 'CONTEXT_SWITCHED', details: { to: 'admin' }, timestamp: '2026-08-16 14:38:00' },
      { action: 'SESSION_ENDED', timestamp: '2026-08-16 14:45:00' },
    ],
  },
  {
    id: 'SHD-9YKLQM',
    shadowUser: { id: 'USR-004', name: 'Maria Garcia', role: 'housekeeping', email: 'maria@housekeeping.com' },
    originalUser: { id: 'ADM-001', name: 'Super Admin', role: 'super_admin' },
    startTime: '2026-08-16 10:00:00',
    endTime: '2026-08-16 10:20:00',
    duration: 1200,
    reason: 'manual',
    stealth: true,
    actionsTaken: [
      { action: 'SESSION_STARTED', timestamp: '2026-08-16 10:00:00' },
      { action: 'STEALTH_ENABLED', timestamp: '2026-08-16 10:01:00' },
      { action: 'UPDATED_ROOM_STATUS', details: { roomId: '205', status: 'clean' }, timestamp: '2026-08-16 10:05:00' },
      { action: 'VIEWED_HOUSEKEEPING_REPORT', timestamp: '2026-08-16 10:12:00' },
      { action: 'STEALTH_DISABLED', timestamp: '2026-08-16 10:18:00' },
      { action: 'SESSION_ENDED', timestamp: '2026-08-16 10:20:00' },
    ],
  },
  {
    id: 'SHD-TAKEOVER-ABC123',
    shadowUser: { id: 'USR-006', name: 'Lisa Wong', role: 'admin', email: 'lisa@sales.com', takenOverSession: 'SESS-jkl012' },
    originalUser: { id: 'ADM-001', name: 'Super Admin', role: 'super_admin' },
    startTime: '2026-08-15 16:00:00',
    endTime: '2026-08-15 16:30:00',
    duration: 1800,
    reason: 'manual',
    stealth: false,
    actionsTaken: [
      { action: 'SESSION_TAKEOVER', timestamp: '2026-08-15 16:00:00' },
      { action: 'VIEWED_EVENT', details: { eventId: 'EVT-2024' }, timestamp: '2026-08-15 16:05:00' },
      { action: 'MODIFIED_BEO', details: { beoId: 'BEO-112' }, timestamp: '2026-08-15 16:15:00' },
      { action: 'SESSION_ENDED', timestamp: '2026-08-15 16:30:00' },
    ],
  },
  {
    id: 'SHD-7WHJNP',
    shadowUser: { id: 'USR-001', name: 'Alex Morgan', role: 'admin', email: 'alex@property.com' },
    originalUser: { id: 'ADM-001', name: 'Super Admin', role: 'super_admin' },
    startTime: '2026-08-14 09:00:00',
    endTime: '2026-08-14 09:10:00',
    duration: 600,
    reason: 'timeout',
    stealth: false,
    actionsTaken: [
      { action: 'SESSION_STARTED', timestamp: '2026-08-14 09:00:00' },
      { action: 'VIEWED_BILLING_DASHBOARD', timestamp: '2026-08-14 09:02:00' },
      { action: 'SESSION_ENDED', timestamp: '2026-08-14 09:10:00' },
    ],
  },
];

/* ─── Shadow Action Types ─── */
export const shadowActionLabels = {
  SESSION_STARTED: 'Session Started',
  SESSION_ENDED: 'Session Ended',
  SESSION_TAKEOVER: 'Session Takeover',
  STEALTH_ENABLED: 'Stealth Mode On',
  STEALTH_DISABLED: 'Stealth Mode Off',
  CONTEXT_SWITCHED: 'Context Switched',
  VIEWED_RESERVATION: 'Viewed Reservation',
  MODIFIED_GUEST_PROFILE: 'Modified Guest Profile',
  UPDATED_ROOM_STATUS: 'Updated Room Status',
  VIEWED_HOUSEKEEPING_REPORT: 'Viewed Housekeeping Report',
  VIEWED_EVENT: 'Viewed Event',
  MODIFIED_BEO: 'Modified BEO',
  VIEWED_BILLING_DASHBOARD: 'Viewed Billing Dashboard',
  RATE_OVERRIDE: 'Rate Override',
  POSTED_PAYMENT: 'Posted Payment',
  SENT_MESSAGE: 'Sent Message',
  EXPORTED_DATA: 'Exported Data',
  DELETED_RECORD: 'Deleted Record',
};

/* ─── Role Config for UI ─── */
export const roleConfig = {
  super_admin: { label: 'Super Admin', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  admin: { label: 'Admin', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  manager: { label: 'Manager', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  front_desk: { label: 'Front Desk', color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  housekeeping: { label: 'Housekeeping', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  readonly: { label: 'Read-only', color: 'text-text-muted', bg: 'bg-neutral/10', border: 'border-border' },
};

/* ─── Status Config ─── */
export const userStatusConfig = {
  online: { label: 'Online', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
  away: { label: 'Away', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20' },
  offline: { label: 'Offline', dot: 'bg-text-muted', class: 'bg-neutral/10 text-text-muted border-border' },
};

/* ─── Module Icons/Labels Map ─── */
export const moduleLabels = {
  dashboard: 'Dashboard',
  reservations: 'Reservations',
  'front-desk': 'Front Desk',
  'room-plan': 'Room Plan',
  billing: 'Billing',
  rates: 'Rates',
  inventory: 'Inventory',
  guests: 'Guests',
  housekeeping: 'Housekeeping',
  'night-audit': 'Night Audit',
  reports: 'Reports',
  'sales-catering': 'Sales & Catering',
  'channel-manager': 'Channel Manager',
  loyalty: 'Loyalty',
  settings: 'Settings',
  support: 'Support',
};

/* ─── Helpers ─── */
export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

export function formatShadowId(id) {
  return id?.toUpperCase() || '—';
}
