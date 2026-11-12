/* apps/api/src/common/lifecycle.ts
 * Canonical lifecycle/status matrix (roadmap ticket #9) — the single source
 * of truth for state vocabularies and legal transitions across domains.
 *
 * Evidence anchors (do not loosen without code evidence):
 *  - reservation:    prisma/seed.ts roster (confirmed/checked_in/checked_out/
 *                    cancelled/no_show); P4 booking-engine suite
 *  - room.hk:        rooms defaults + 20261027193000_t2_hk_space_status rules
 *                    (clean/ready -> dirty stagnant; inspected -> clean 04:30)
 *  - room.service:   rooms.serviceStatus ('active' default; ooo/oos blocks)
 *  - payment:        src/jobs/payment.job.ts (success/refunded/
 *                    partially_refunded delta progression), P3-A suite
 *  - ticket:         20261017020000_add_support_tickets (status comment)
 *  - planned:        roadmap addendum UX-01 (Due Out / early check-out) and
 *                    UX-02 (Day Use) — vocabulary reserved, fields pending
 */
import { logger } from './logger.js';

export type Domain =
  | 'reservation'
  | 'roomHk'
  | 'roomService'
  | 'folio'
  | 'payment'
  | 'task'
  | 'housekeepingTask'
  | 'channelConnection'
  | 'channelSync'
  | 'ticket'
  | 'nightAudit'
  | 'bookingType';

export interface StateDef {
  label: string;
  terminal?: boolean;
  notes?: string;
}

export interface EdgeDef {
  from: string;
  to: string;
  action?: string;
  guard?: string;
  audit?: boolean;
  notes?: string;
}

export interface LifecycleDef {
  domain: Domain;
  description: string;
  states: Record<string, StateDef>;
  edges: EdgeDef[];
}

const L: LifecycleDef[] = [
  {
    domain: 'reservation',
    description: 'Stay lifecycle. Terminals: checked_out, cancelled, no_show.',
    states: {
      confirmed: { label: 'Confirmed' },
      checked_in: { label: 'In house' },
      checked_out: {
        label: 'Checked out',
        terminal: true,
        notes: 'actual checkedOutAt recorded; appears in Checked Out view (addendum UX-01)',
      },
      cancelled: {
        label: 'Cancelled',
        terminal: true,
        notes: 'cancelledAt/cancelledBy/cancelReason recorded',
      },
      no_show: { label: 'No-show', terminal: true, notes: 'noShowAt recorded' },
    },
    edges: [
      {
        from: 'confirmed',
        to: 'checked_in',
        action: 'check-in',
        guard: 'arrival date reached; room assignable; deposit policy per property',
        audit: true,
      },
      { from: 'confirmed', to: 'cancelled', action: 'cancel', audit: true },
      {
        from: 'confirmed',
        to: 'no_show',
        action: 'no-show',
        guard: 'arrival date passed without check-in',
        audit: true,
      },
      {
        from: 'checked_in',
        to: 'checked_out',
        action: 'check-out',
        guard:
          'idempotent; duplicate submissions safe; early departure recorded via checkoutReason, booked dates preserved',
        audit: true,
      },
    ],
  },
  {
    domain: 'roomHk',
    description: 'Housekeeping axis (rooms.housekeepingStatus).',
    states: {
      dirty: { label: 'Dirty' },
      clean: { label: 'Clean' },
      inspected: { label: 'Inspected' },
      ready: { label: 'Ready', notes: 'assignable for arrival' },
    },
    edges: [
      { from: 'dirty', to: 'clean', action: 'cleaning_completed' },
      { from: 'clean', to: 'inspected', action: 'inspection' },
      { from: 'clean', to: 'ready', action: 'verify' },
      { from: 'inspected', to: 'ready', action: 'verify' },
      {
        from: 'inspected',
        to: 'clean',
        action: 'overnight_reset',
        notes: 'hk-inspected-overnight rule (04:30)',
      },
      { from: 'clean', to: 'dirty', action: 'stagnant_refresh', notes: 'hk-stagnant-vacant rule' },
      { from: 'ready', to: 'dirty', action: 'stagnant_refresh' },
      { from: 'ready', to: 'clean', action: 'status_correction', audit: true },
    ],
  },
  {
    domain: 'roomService',
    description: 'Operability axis (rooms.serviceStatus). A blocked room must not be assignable.',
    states: {
      active: { label: 'Active' },
      ooo: { label: 'Out of order', notes: 'room_blocks type ooo' },
      oos: { label: 'Out of service' },
    },
    edges: [
      { from: 'active', to: 'ooo', action: 'block', audit: true },
      { from: 'active', to: 'oos', action: 'block', audit: true },
      { from: 'ooo', to: 'active', action: 'restore', audit: true },
      { from: 'oos', to: 'active', action: 'restore', audit: true },
    ],
  },
  {
    domain: 'folio',
    description: 'Folio lifecycle.',
    states: {
      open: { label: 'Open' },
      closed: { label: 'Closed', notes: 'closedAt/closedBy; property billClosingRule applies' },
    },
    edges: [
      {
        from: 'open',
        to: 'closed',
        action: 'close',
        guard: 'balance settled per property billClosingRule/window',
        audit: true,
      },
      { from: 'closed', to: 'open', action: 'reopen', audit: true },
    ],
  },
  {
    domain: 'payment',
    description: 'Payment lifecycle (payments.status). Terminal: refunded.',
    states: {
      pending: { label: 'Pending' },
      success: { label: 'Success' },
      failed: { label: 'Failed' },
      partially_refunded: { label: 'Partially refunded' },
      refunded: { label: 'Refunded', terminal: true },
    },
    edges: [
      {
        from: 'pending',
        to: 'success',
        action: 'settlement',
        guard: 'provider webhook verified (HMAC); never inferred from browser redirect',
      },
      { from: 'pending', to: 'failed', action: 'decline' },
      { from: 'failed', to: 'pending', action: 'retry', guard: 'bounded retries; provider rules' },
      { from: 'failed', to: 'success', action: 'retry_capture' },
      {
        from: 'success',
        to: 'partially_refunded',
        action: 'partial_refund',
        guard: 'delta progression claimed atomically (P3-A fix)',
      },
      { from: 'success', to: 'refunded', action: 'full_refund', audit: true },
      {
        from: 'partially_refunded',
        to: 'partially_refunded',
        action: 'further_partial_refund',
        notes: 'self-loop: repeated partials are legal',
      },
      { from: 'partially_refunded', to: 'refunded', action: 'final_refund', audit: true },
    ],
  },
  {
    domain: 'task',
    description: 'Universal task model (tasks.status).',
    states: {
      open: { label: 'Open' },
      in_progress: { label: 'In progress' },
      completed: { label: 'Completed', terminal: true },
      cancelled: { label: 'Cancelled', terminal: true },
    },
    edges: [
      { from: 'open', to: 'in_progress', action: 'start' },
      { from: 'open', to: 'completed', action: 'complete', audit: true },
      { from: 'in_progress', to: 'completed', action: 'complete', audit: true },
      { from: 'open', to: 'cancelled', action: 'cancel', audit: true },
      { from: 'in_progress', to: 'cancelled', action: 'cancel', audit: true },
    ],
  },
  {
    domain: 'housekeepingTask',
    description: 'Housekeeping job board (housekeeping_tasks.status).',
    states: {
      pending: { label: 'Pending' },
      in_progress: { label: 'In progress' },
      completed: { label: 'Completed' },
      verified: { label: 'Verified', terminal: true },
      cancelled: { label: 'Cancelled', terminal: true },
    },
    edges: [
      { from: 'pending', to: 'in_progress', action: 'start' },
      { from: 'in_progress', to: 'completed', action: 'complete' },
      { from: 'completed', to: 'verified', action: 'inspect_pass' },
      { from: 'completed', to: 'in_progress', action: 'inspect_fail_reclean' },
      { from: 'pending', to: 'cancelled', action: 'cancel' },
    ],
  },
  {
    domain: 'channelConnection',
    description: 'Channel connection lifecycle (channel_connections.status).',
    states: {
      pending: { label: 'Pending setup' },
      connected: { label: 'Connected' },
      disconnected: { label: 'Disconnected' },
      error: { label: 'Error', notes: 'credential invalid / sync failing — exception queue' },
    },
    edges: [
      {
        from: 'pending',
        to: 'connected',
        action: 'connect',
        guard: 'credentials validated; property mapping present',
      },
      { from: 'pending', to: 'error', action: 'connect_failed' },
      {
        from: 'connected',
        to: 'error',
        action: 'sync_failure',
        guard: 'bounded retries before error state',
      },
      { from: 'connected', to: 'disconnected', action: 'disconnect', audit: true },
      { from: 'error', to: 'connected', action: 'recover' },
      { from: 'disconnected', to: 'connected', action: 'reconnect' },
    ],
  },
  {
    domain: 'channelSync',
    description: 'Last sync result axis (channel_connections.lastSyncStatus). Informational.',
    states: {
      never: { label: 'Never synced', notes: 'NULL lastSyncAt' },
      ok: { label: 'OK' },
      failed: { label: 'Failed', notes: 'paired with channel_push_log row + replay path (B1)' },
    },
    edges: [
      { from: 'never', to: 'ok', action: 'sync' },
      { from: 'never', to: 'failed', action: 'sync' },
      { from: 'ok', to: 'ok', action: 'sync' },
      { from: 'ok', to: 'failed', action: 'sync' },
      {
        from: 'failed',
        to: 'ok',
        action: 'sync',
        notes: 'recovery visible; recovery time is a roadmap metric',
      },
      { from: 'failed', to: 'failed', action: 'sync' },
    ],
  },
  {
    domain: 'ticket',
    description: 'Support tickets (tickets.status). Terminal: closed.',
    states: {
      open: { label: 'Open' },
      in_progress: { label: 'In progress' },
      waiting_guest: { label: 'Waiting on guest' },
      resolved: { label: 'Resolved' },
      closed: { label: 'Closed', terminal: true },
    },
    edges: [
      { from: 'open', to: 'in_progress', action: 'start' },
      { from: 'open', to: 'waiting_guest', action: 'request_info' },
      { from: 'open', to: 'resolved', action: 'resolve' },
      { from: 'open', to: 'closed', action: 'force_close', audit: true },
      { from: 'in_progress', to: 'waiting_guest', action: 'request_info' },
      { from: 'in_progress', to: 'resolved', action: 'resolve' },
      { from: 'in_progress', to: 'closed', action: 'force_close', audit: true },
      { from: 'waiting_guest', to: 'in_progress', action: 'guest_replied' },
      { from: 'resolved', to: 'closed', action: 'close' },
      { from: 'resolved', to: 'open', action: 'reopen', audit: true },
    ],
  },
  {
    domain: 'nightAudit',
    description: 'Night audit run (night_audits.status). Terminal: completed.',
    states: {
      in_progress: { label: 'In progress' },
      completed: { label: 'Completed', terminal: true },
      failed: { label: 'Failed' },
    },
    edges: [
      { from: 'in_progress', to: 'completed', action: 'finish' },
      { from: 'in_progress', to: 'failed', action: 'fail' },
      { from: 'failed', to: 'in_progress', action: 'rerun' },
    ],
  },
  {
    domain: 'bookingType',
    description:
      'Addendum UX-02: booking purpose. Set at creation; reserved vocabulary — schema field pending.',
    states: {
      overnight: { label: 'Overnight' },
      day_use: {
        label: 'Day use',
        notes: 'time-window booking; actual arrive/depart events recorded',
      },
    },
    edges: [
      {
        from: 'day_use',
        to: 'overnight',
        action: 'convert',
        guard:
          'availability + pricing revalidated; folio implications previewed; original booking preserved',
        audit: true,
      },
    ],
  },
];

export const LIFECYCLE: Record<Domain, LifecycleDef> = Object.fromEntries(
  L.map((d) => [d.domain, d])
) as Record<Domain, LifecycleDef>;

/* Addendum UX-01: check-out workflow reasons — flags, NOT competing statuses.
 * Every completed check-out lands in reservation.checked_out; the reason is
 * audit detail and booked dates are always preserved. */
export const CHECKOUT_REASONS = ['normal', 'early_departure', 'day_use_complete'] as const;

/* Addendum UX-01 view definitions (for the Today dashboard / exception
 * engine). dueOut is a view over checked_in stays — never equated with
 * completed check-out. */
export const STAY_VIEWS = {
  dueOutToday:
    'reservation.status = checked_in AND departureDate = property business date (view, not a state)',
  checkedOut:
    'reservation.status = checked_out — includes normal and early/mid-stay departures; actual checkedOutAt shown',
  departuresNeedingAttention:
    'dueOutToday AND (folio.balance > 0 OR unresolved payment exception OR unresolved task OR room handoff pending)',
} as const;

export function isKnownState(domain: Domain, state: string): boolean {
  return state in (LIFECYCLE[domain]?.states ?? {});
}

export function canTransition(domain: Domain, from: string, to: string): boolean {
  const def = LIFECYCLE[domain];
  if (!def) return false;
  if (!isKnownState(domain, from) || !isKnownState(domain, to)) return false;
  return def.edges.some((e) => e.from === from && e.to === to);
}

export function nextStates(domain: Domain, from: string): string[] {
  const def = LIFECYCLE[domain];
  if (!def || !isKnownState(domain, from)) return [];
  return def.edges.filter((e) => e.from === from).map((e) => e.to);
}

/* Runtime guard. Throws on a KNOWN-but-illegal transition. An unknown
 * from-state is a drift signal: warn and allow (forward-compatible), the
 * M1 drift test in p5-lifecycle-matrix.test.ts catches vocabulary additions
 * in review before enforcement tightens. */
export function assertTransition(
  domain: Domain,
  from: string,
  to: string,
  ctx?: Record<string, unknown>
): void {
  const def = LIFECYCLE[domain];
  if (!def) throw new Error('UNKNOWN_DOMAIN ' + domain);
  if (!isKnownState(domain, from)) {
    logger.warn({ domain, from, to, ...ctx }, 'lifecycle: unknown from-state (drift?) — allowing');
    return;
  }
  if (!isKnownState(domain, to)) throw new Error('UNKNOWN_STATE ' + domain + ':' + to);
  if (!canTransition(domain, from, to)) {
    throw new Error('INVALID_TRANSITION ' + domain + ' ' + from + ' -> ' + to);
  }
}
