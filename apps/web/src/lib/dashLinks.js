/* apps/web/src/lib/dashLinks.js
 * D1+D3 — central deep-link map for the hotel dashboard.
 */
export const LINKS = {
  roomPlan: '/app/room-plan',
  reservations: '/app/reservations',
  arrivalsBoard: '/app/reservations/front-desk',
  newReservation: '/app/reservations/new',
  tasks: '/app/tasks',
  tasksOpen: '/app/tasks?status=open',
  housekeeping: '/app/housekeeping',
  concierge: '/app/concierge',
  nightAudit: '/app/night-audit',
  reports: '/app/reports',
  auditTrail: '/app/audit-trail',
  billing: '/app/billing',
  billingPayments: '/app/billing/payments',
  paymentRequests: '/app/billing/payment-requests',
  loyalty: '/app/loyalty',
  channelManager: '/app/channel-manager',
  parking: '/app/parking',
  users: '/app/users',
  supportTicket: (id) => `/app/support?ticket=${id}`,
};

export const reservationUrl = (id) => `/app/reservations/${id}`;
export const guestUrl = (id) => `/app/guests/${id}`;

// ─── Activity feed → deep link ───────────────────────────────────────────
// audit_logs.entity values are dot/space-separated labels ("guest vehicle",
// "ar payment", "concierge item"). activityTarget normalizes to snake_case
// before lookup; unmapped entities return null and render non-clickable.
const ACTIVITY_ROUTES = {
  reservation: (id) => (id ? reservationUrl(id) : null),
  guest: (id) => (id ? guestUrl(id) : null),
  guest_vehicle: () => LINKS.parking,
  folio: () => LINKS.billing,
  payment: () => LINKS.billingPayments,
  ar_payment: () => LINKS.billingPayments,
  room: () => LINKS.roomPlan,
  housekeeping: () => LINKS.housekeeping,
  housekeeping_task: () => LINKS.housekeeping,
  task: () => LINKS.tasks,
  night_audit: () => LINKS.nightAudit,
  ticket: (id) => LINKS.supportTicket(id),
  invoice: () => '/app/billing/invoices',
  tax_invoice: () => '/app/billing/invoices',
  channel_connection: () => LINKS.channelManager,
  concierge: () => LINKS.concierge,
  concierge_item: () => LINKS.concierge,
  loyalty: () => LINKS.loyalty,
  user: () => LINKS.users,
  property: () => '/app/properties',
  rate_plan: () => '/app/rates',
  sc_event: () => '/app/sales-catering/events',
  group: () => '/app/groups',
};

export function activityTarget(item) {
  const raw = item?.entity;
  if (!raw) return null;
  const key = String(raw)
    .toLowerCase()
    .replace(/[.\s]+/g, '_');
  const resolver = ACTIVITY_ROUTES[key];
  if (!resolver) return null;
  return resolver(item.entityId);
}

// ─── Alert dismissal persistence ─────────────────────────────────────────
const DISMISS_KEY = 'vimad-dashboard-dismissed';
const KEEP_DAYS = 7;

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(store));
  } catch {
    // storage blocked — dismissal is best-effort, never crash the board
  }
}

function prune(store) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const date of Object.keys(store)) {
    if (date < cutoffStr) delete store[date];
  }
  return store;
}

export function getDismissed(businessDate) {
  if (!businessDate) return new Set();
  return new Set(readStore()[businessDate] || []);
}

export function dismissAlert(id, businessDate) {
  if (!id || !businessDate) return;
  const store = prune(readStore());
  const list = new Set(store[businessDate] || []);
  list.add(id);
  store[businessDate] = [...list];
  writeStore(store);
}

export function filterDismissed(alerts, businessDate) {
  const dismissed = getDismissed(businessDate);
  return (alerts || []).filter((a) => !a.acknowledged && !dismissed.has(a.id));
}
