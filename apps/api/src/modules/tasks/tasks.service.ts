/* apps/api/src/modules/tasks/tasks.service.ts
 * T1 — Universal task model + rules engine.
 * Every rule is a DB row polled on a schedule. The scanner runs each due
 * rule through a context provider (rule.key → candidates), evaluates the
 * rule's conditions against each candidate, and creates deduped tasks.
 * Adding a new rule ROW for an existing provider = zero deploy.
 *
 * T2 — lifecycle audit: create / update / reassign / complete / cancel all
 * write audit_log rows so the task lifecycle is auditable end to end,
 * including the acting user when the caller passes actorId.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { AppError } from '../../common/errors.js';
import { auditTask } from '../housekeeping/housekeeping.supervisor.routes.js';

// ─── Lifecycle audit (T2) — an audit failure never breaks the operation ───

function safeAudit(
  tenantId: string,
  userId: string | undefined,
  action: string,
  taskId: string,
  metadata: Record<string, unknown>
): void {
  auditTask(tenantId, userId, action, taskId, metadata).catch((err) =>
    logger.warn({ err, taskId, action }, 'task audit write failed')
  );
}

// ─── Rule shapes ───

export interface RuleCondition {
  field: string; // dotted path into candidate ctx, e.g. "guest.vipStatus"
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'truthy' | 'exists';
  value?: unknown;
}

export interface RuleTrigger {
  type: 'schedule' | 'manual';
  everyMinutes?: number;
}

export type DedupeScope = 'open' | 'daily' | 'once';

export interface RuleAction {
  title: string; // supports {{path}} interpolation from candidate ctx
  description?: string;
  department?: string; // overrides rule.department when set
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  slaMinutes?: number;
  dedupe?: DedupeScope; // open = one open task per entity (default) | daily | once
  metadata?: Record<string, unknown>;
}

// Structural row type — avoids generated-client payload generics.
interface RuleRow {
  id: string;
  tenantId: string;
  propertyId: string | null;
  key: string;
  name: string;
  department: string;
  description: string | null;
  trigger: unknown;
  conditions: unknown;
  action: unknown;
  config: unknown;
  isActive: boolean;
}

// ─── Time helpers (server local time; per-property TZ is a v2 item) ───

const startOfDay = (d: Date = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400_000);
const addHours = (d: Date, n: number) => new Date(d.getTime() + n * 3600_000);
const dayKey = (d: Date = new Date()) => d.toISOString().slice(0, 10);
const monthKey = (d: Date = new Date()) => d.toISOString().slice(0, 7);

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

function renderTemplate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, path: string) => {
    const v = getByPath(ctx, path);
    return v === null || v === undefined ? '' : String(v);
  });
}

function matchesCondition(cond: RuleCondition, ctx: Record<string, unknown>): boolean {
  const val = getByPath(ctx, cond.field);
  switch (cond.op) {
    case 'eq':
      return val === cond.value;
    case 'neq':
      return val !== cond.value;
    case 'gt':
      return Number(val) > Number(cond.value);
    case 'gte':
      return Number(val) >= Number(cond.value);
    case 'lt':
      return Number(val) < Number(cond.value);
    case 'lte':
      return Number(val) <= Number(cond.value);
    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(val);
    case 'contains':
      return String(val ?? '')
        .toLowerCase()
        .includes(String(cond.value ?? '').toLowerCase());
    case 'truthy':
      return Boolean(val);
    case 'exists':
      return val !== null && val !== undefined && val !== '';
    default:
      return true;
  }
}

function matchesConditions(
  conditions: { all?: RuleCondition[] } | null | undefined,
  ctx: Record<string, unknown>
): boolean {
  if (!conditions?.all?.length) return true;
  return conditions.all.every((c) => matchesCondition(c, ctx));
}

// ─── Candidates ───

interface TaskCandidate {
  entityType: string;
  entityId: string; // dedupe identity — provider controls the granularity
  propertyId: string;
  roomId?: string | null;
  guestId?: string | null;
  reservationId?: string | null;
  ctx: Record<string, unknown>;
}

function ruleScope(rule: RuleRow): { tenantId: string; propertyId?: string } {
  return { tenantId: rule.tenantId, ...(rule.propertyId ? { propertyId: rule.propertyId } : {}) };
}

// ─── Context providers: rule.key → candidate fetchers ───

const RULE_PROVIDERS: Record<string, (rule: RuleRow) => Promise<TaskCandidate[]>> = {
  // 1. Departure → dirty-room task (the headline zero-click case)
  'dirty-room-on-departure': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'checked_out',
        updatedAt: { gte: addDays(startOfDay(), -1) },
      },
      include: { guest: true, stays: { include: { room: true }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });
    return rsvs.map((r) => {
      const room = r.stays[0]?.room;
      return {
        entityType: 'reservation',
        entityId: r.id,
        propertyId: r.propertyId,
        roomId: room?.id ?? null,
        guestId: r.guestId,
        reservationId: r.id,
        ctx: {
          confirmationNumber: r.confirmationNumber,
          guestName: `${r.guest.firstName} ${r.guest.lastName}`,
          roomNumber: room?.number ?? 'unassigned',
          checkedOutAt: r.updatedAt.toISOString(),
        },
      };
    });
  },

  // 2. Arrival not inspected by 12:00
  'arrival-not-inspected-by-12': async (rule) => {
    if (new Date().getHours() < 12) return [];
    const rsvs = await prisma.reservation.findMany({
      where: { ...ruleScope(rule), status: 'checked_in', arrivalDate: startOfDay() },
      include: { guest: true, stays: { include: { room: true }, take: 1 } },
      take: 200,
    });
    return rsvs
      .filter((r) => r.stays[0]?.room?.housekeepingStatus !== 'inspected')
      .map((r) => ({
        entityType: 'reservation',
        entityId: r.id,
        propertyId: r.propertyId,
        roomId: r.stays[0]?.roomId ?? null,
        guestId: r.guestId,
        reservationId: r.id,
        ctx: {
          confirmationNumber: r.confirmationNumber,
          guestName: `${r.guest.firstName} ${r.guest.lastName}`,
          roomNumber: r.stays[0]?.room?.number ?? 'unassigned',
        },
      }));
  },

  // 3. DND room — decide service vs skip at 16:00
  'dnd-decision-16': async (rule) => {
    if (new Date().getHours() < 16) return [];
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'checked_in',
        arrivalDate: { lte: startOfDay() },
        departureDate: { gt: startOfDay() },
        guest: { doNotDisturb: true },
      },
      include: { guest: true, stays: { include: { room: true }, take: 1 } },
      take: 200,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      roomId: r.stays[0]?.roomId ?? null,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        roomNumber: r.stays[0]?.room?.number ?? 'unassigned',
      },
    }));
  },

  // 4. No-show → front desk call task
  'no-show-call': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'no_show',
        arrivalDate: { gte: addDays(startOfDay(), -2) },
      },
      include: { guest: true },
      take: 100,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        guestPhone: r.guest.phone ?? 'no phone on file',
      },
    }));
  },

  // 5. 16:00 — arrivals today still without a room assigned
  'unassigned-room-16': async (rule) => {
    if (new Date().getHours() < 16) return [];
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: { in: ['confirmed', 'checked_in'] },
        arrivalDate: startOfDay(),
        stays: { none: {} },
      },
      include: { guest: true },
      take: 100,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        arrivalTime: r.arrivalDate.toISOString(),
      },
    }));
  },

  // 6. T-3 deposit payment request (operationally ties to A2)
  'deposit-t3-payment-request': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'confirmed',
        arrivalDate: addDays(startOfDay(), 3),
        balance: { gt: 0 },
      },
      include: { guest: true },
      take: 100,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        balance: Number(r.balance).toFixed(2),
        arrivalDate: r.arrivalDate.toISOString().slice(0, 10),
      },
    }));
  },

  // 7. Departed with an unsettled folio
  'folio-settle-at-checkout': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'checked_out',
        updatedAt: { gte: startOfDay() },
        folio: { balance: { gt: 0 } },
      },
      include: { guest: true, folio: true, stays: { include: { room: true }, take: 1 } },
      take: 100,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        folioBalance: Number(r.folio?.balance ?? 0).toFixed(2),
      },
    }));
  },

  // 8. Complaint 30-min SLA — manual template
  'complaint-30min-sla': async () => [],

  // 9. Key/stay active but reservation never checked in
  'key-active-without-checkin': async (rule) => {
    const now = new Date();
    const stays = await prisma.reservationStay.findMany({
      where: {
        date: startOfDay(),
        reservation: { ...ruleScope(rule), status: 'confirmed' },
      },
      include: { room: true, reservation: { include: { guest: true } } },
      take: 300,
    });
    return stays
      .filter((s) => addHours(s.reservation.arrivalDate, 3) <= now)
      .map((s) => ({
        entityType: 'reservation',
        entityId: s.reservationId,
        propertyId: s.reservation.propertyId,
        roomId: s.roomId,
        guestId: s.reservation.guestId,
        reservationId: s.reservationId,
        ctx: {
          confirmationNumber: s.reservation.confirmationNumber,
          guestName: `${s.reservation.guest.firstName} ${s.reservation.guest.lastName}`,
          roomNumber: s.room.number,
        },
      }));
  },

  // 10. Preventive maintenance — daily 06:00, one round per property per month
  'preventive-maintenance': async (rule) => {
    if (new Date().getHours() < 6) return [];
    const properties = await prisma.property.findMany({
      where: {
        tenantId: rule.tenantId,
        status: 'active',
        ...(rule.propertyId && { id: rule.propertyId }),
      },
      select: { id: true, name: true },
    });
    return properties.map((p) => ({
      entityType: 'property',
      entityId: `${p.id}:${monthKey()}`,
      propertyId: p.id,
      ctx: { propertyName: p.name, month: monthKey() },
    }));
  },

  // 11. 04:00 — business date not rolled
  'night-audit-not-rolled-04': async (rule) => {
    if (new Date().getHours() < 4) return [];
    const properties = await prisma.property.findMany({
      where: {
        tenantId: rule.tenantId,
        status: 'active',
        ...(rule.propertyId && { id: rule.propertyId }),
      },
      select: { id: true, name: true },
    });
    const candidates: TaskCandidate[] = [];
    for (const p of properties) {
      const rolled = await prisma.nightAudit.findFirst({
        where: {
          tenantId: rule.tenantId,
          propertyId: p.id,
          auditDate: startOfDay(),
          status: 'completed',
        },
        select: { id: true },
      });
      if (!rolled) {
        candidates.push({
          entityType: 'property',
          entityId: p.id,
          propertyId: p.id,
          ctx: { propertyName: p.name, businessDate: dayKey() },
        });
      }
    }
    return candidates;
  },

  // 12. Compliance certificate expiries from rule config
  'compliance-cert-expiry': async (rule) => {
    const config = rule.config as { certs?: { name: string; expiryDate: string }[] };
    const horizon = addDays(new Date(), 30);
    return (config.certs ?? [])
      .filter((c) => new Date(c.expiryDate) <= horizon)
      .map((c) => ({
        entityType: 'compliance_cert',
        entityId: c.name,
        propertyId: rule.propertyId ?? '',
        ctx: { certName: c.name, expiryDate: c.expiryDate },
      }));
  },

  // 13. Overbooking — tonight's confirmed arrivals exceed room count
  'overbooking-decision': async (rule) => {
    const properties = await prisma.property.findMany({
      where: {
        tenantId: rule.tenantId,
        status: 'active',
        ...(rule.propertyId && { id: rule.propertyId }),
      },
      select: { id: true, name: true },
    });
    const candidates: TaskCandidate[] = [];
    for (const p of properties) {
      const [rooms, arrivals] = await Promise.all([
        prisma.room.count({ where: { propertyId: p.id } }),
        prisma.reservation.count({
          where: { propertyId: p.id, status: 'confirmed', arrivalDate: startOfDay() },
        }),
      ]);
      if (arrivals > rooms) {
        candidates.push({
          entityType: 'property',
          entityId: `${p.id}:${dayKey()}`,
          propertyId: p.id,
          ctx: { propertyName: p.name, arrivalsTonight: arrivals, roomsAvailable: rooms },
        });
      }
    }
    return candidates;
  },

  // 14. Special-request prep — tomorrow's arrivals with notes
  'special-request-prep': async (rule) => {
    const config = rule.config as { markers?: string[] };
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'confirmed',
        arrivalDate: addDays(startOfDay(), 1),
        notes: { not: null },
      },
      include: { guest: true, stays: { include: { room: true }, take: 1 } },
      take: 200,
    });
    return rsvs
      .filter((r) => {
        if (!config.markers?.length) return true;
        return config.markers.some((m) => (r.notes ?? '').toLowerCase().includes(m.toLowerCase()));
      })
      .map((r) => ({
        entityType: 'reservation',
        entityId: r.id,
        propertyId: r.propertyId,
        roomId: r.stays[0]?.roomId ?? null,
        guestId: r.guestId,
        reservationId: r.id,
        ctx: {
          confirmationNumber: r.confirmationNumber,
          guestName: `${r.guest.firstName} ${r.guest.lastName}`,
          specialRequest: r.notes ?? '',
        },
      }));
  },

  // 15. Repeat-VIP prep — tomorrow's VIP arrivals with 2+ past stays
  'repeat-vip-prep': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'confirmed',
        arrivalDate: addDays(startOfDay(), 1),
        guest: { vipStatus: { not: null } },
      },
      include: {
        guest: {
          include: {
            reservations: { where: { status: 'checked_out' }, select: { id: true } },
          },
        },
        stays: { include: { room: true }, take: 1 },
      },
      take: 200,
    });
    return rsvs
      .filter((r) => r.guest.reservations.length >= 2)
      .map((r) => ({
        entityType: 'reservation',
        entityId: r.id,
        propertyId: r.propertyId,
        roomId: r.stays[0]?.roomId ?? null,
        guestId: r.guestId,
        reservationId: r.id,
        ctx: {
          confirmationNumber: r.confirmationNumber,
          guestName: `${r.guest.firstName} ${r.guest.lastName}`,
          vipStatus: r.guest.vipStatus ?? '',
          previousStays: r.guest.reservations.length,
        },
      }));
  },

  // 16. Post-stay recovery — departed yesterday with complaint marker
  'post-stay-recovery': async (rule) => {
    const rsvs = await prisma.reservation.findMany({
      where: {
        ...ruleScope(rule),
        status: 'checked_out',
        departureDate: addDays(startOfDay(), -1),
        folio: {
          items: { some: { description: { contains: 'complaint', mode: 'insensitive' } } },
        },
      },
      include: { guest: true },
      take: 100,
    });
    return rsvs.map((r) => ({
      entityType: 'reservation',
      entityId: r.id,
      propertyId: r.propertyId,
      guestId: r.guestId,
      reservationId: r.id,
      ctx: {
        confirmationNumber: r.confirmationNumber,
        guestName: `${r.guest.firstName} ${r.guest.lastName}`,
        guestEmail: r.guest.email ?? 'no email on file',
      },
    }));
  },

  // 17. Corporate credit-limit review — weekly
  'corporate-credit-limit-review': async (rule) => {
    const guests = await prisma.guest.findMany({
      where: { tenantId: rule.tenantId, notes: { contains: 'Corporate', mode: 'insensitive' } },
      include: {
        reservations: {
          where: { balance: { gt: 0 } },
          select: { id: true, confirmationNumber: true, balance: true },
          take: 5,
        },
      },
      take: 100,
    });
    return guests
      .filter((g) => g.reservations.length > 0)
      .map((g) => ({
        entityType: 'guest',
        entityId: g.id,
        propertyId: rule.propertyId ?? '',
        guestId: g.id,
        ctx: {
          guestName: `${g.firstName} ${g.lastName}`,
          openBalances: g.reservations.length,
          outstandingTotal: g.reservations
            .reduce((sum, r) => sum + Number(r.balance), 0)
            .toFixed(2),
        },
      }));
  },

  // 18. Card retry failure — failed payments in the last 24h
  'card-retry-failure': async (rule) => {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: rule.tenantId,
        status: 'failed',
        createdAt: { gte: addHours(new Date(), -24) },
        ...(rule.propertyId ? { propertyId: rule.propertyId } : {}),
      },
      include: { guest: true, reservation: true },
      take: 100,
    });
    return payments.map((p) => ({
      entityType: 'payment',
      entityId: p.id,
      propertyId: p.propertyId ?? rule.propertyId ?? '',
      guestId: p.guestId,
      reservationId: p.reservationId,
      ctx: {
        reference: p.reference,
        guestName: p.guest ? `${p.guest.firstName} ${p.guest.lastName}` : 'unknown guest',
        confirmationNumber: p.reservation?.confirmationNumber ?? 'n/a',
        failureReason: p.failureReason ?? 'unknown',
      },
    }));
  },

  // 19. HK dirty-3h escalation
  'hk-dirty-3h-escalation': async (rule) => {
    const rooms = await prisma.room.findMany({
      where: {
        ...(rule.propertyId
          ? { propertyId: rule.propertyId }
          : { property: { tenantId: rule.tenantId } }),
        housekeepingStatus: 'dirty',
        updatedAt: { lte: addHours(new Date(), -3) },
      },
      include: { property: { select: { name: true } } },
      take: 200,
    });
    const candidates: TaskCandidate[] = [];
    for (const room of rooms) {
      const alreadyEscalated = await prisma.task.findFirst({
        where: {
          tenantId: rule.tenantId,
          ruleKey: 'hk-dirty-3h-escalation',
          entityType: 'room',
          entityId: room.id,
          status: { in: ['open', 'in_progress'] },
        },
        select: { id: true },
      });
      if (!alreadyEscalated) {
        candidates.push({
          entityType: 'room',
          entityId: room.id,
          propertyId: room.propertyId,
          roomId: room.id,
          ctx: { roomNumber: room.number, propertyName: room.property.name },
        });
      }
    }
    return candidates;
  },

  // 20. Inspection fail → re-clean (FAIL marker in inspection notes)
  'inspection-fail-reclean': async (rule) => {
    const inspections = await prisma.housekeepingTask.findMany({
      where: {
        tenantId: rule.tenantId,
        type: 'inspection',
        status: 'completed',
        completedAt: { gte: startOfDay() },
        notes: { contains: 'FAIL', mode: 'insensitive' },
        ...(rule.propertyId ? { propertyId: rule.propertyId } : {}),
      },
      include: { room: true },
      take: 100,
    });
    return inspections.map((t) => ({
      entityType: 'room',
      entityId: `${t.roomId}:${dayKey()}`,
      propertyId: t.propertyId,
      roomId: t.roomId,
      ctx: { roomNumber: t.room.number, inspectionNotes: t.notes ?? '' },
    }));
  },
};

// ─── Rule evaluation ───

export async function evaluateRule(ruleId: string): Promise<number> {
  const rule = (await prisma.taskRule.findUnique({ where: { id: ruleId } })) as RuleRow | null;
  if (!rule) return 0;

  let created = 0;
  try {
    const trigger = rule.trigger as RuleTrigger;
    if (rule.isActive && trigger.type === 'schedule') {
      const provider = RULE_PROVIDERS[rule.key];
      if (!provider) {
        logger.warn({ key: rule.key }, 'task rule has no provider — configure as manual');
      } else {
        const candidates = await provider(rule);
        const conditions = rule.conditions as { all?: RuleCondition[] } | null;
        const action = rule.action as RuleAction;
        const dedupe: DedupeScope = action.dedupe ?? 'open';

        for (const c of candidates) {
          const propertyId = c.propertyId || (await defaultPropertyId(rule.tenantId));
          if (!propertyId) continue;
          if (!matchesConditions(conditions, c.ctx)) continue;

          const title = renderTemplate(action.title, c.ctx).slice(0, 200);
          const description = action.description ? renderTemplate(action.description, c.ctx) : null;
          const slaMinutes = action.slaMinutes ?? null;

          if (dedupe === 'open') {
            const existing = await prisma.task.findFirst({
              where: {
                tenantId: rule.tenantId,
                ruleId: rule.id,
                entityType: c.entityType,
                entityId: c.entityId,
                status: { in: ['open', 'in_progress'] },
              },
              select: { id: true },
            });
            if (existing) continue;
          }

          const dedupeKey =
            dedupe === 'daily'
              ? `${rule.key}:${c.entityId}:${dayKey()}`
              : dedupe === 'once'
                ? `${rule.key}:${c.entityId}`
                : null;

          await prisma.task
            .create({
              data: {
                tenantId: rule.tenantId,
                propertyId,
                department: action.department ?? rule.department,
                title,
                description,
                priority: action.priority ?? 'normal',
                roomId: c.roomId ?? null,
                guestId: c.guestId ?? null,
                reservationId: c.reservationId ?? null,
                dueAt: slaMinutes ? addHours(new Date(), slaMinutes / 60) : null,
                slaMinutes,
                ruleId: rule.id,
                ruleKey: rule.key,
                ruleAudit: {
                  ruleId: rule.id,
                  key: rule.key,
                  name: rule.name,
                  trigger: rule.trigger,
                  conditions: rule.conditions,
                  action: rule.action,
                  firedAt: new Date().toISOString(),
                } as Prisma.InputJsonValue,
                entityType: c.entityType,
                entityId: c.entityId,
                dedupeKey,
                source: 'rule',
                metadata: (action.metadata ?? {}) as Prisma.InputJsonValue,
              },
            })
            .then(() => created++)
            .catch((err: unknown) => {
              if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                (err as { code: string }).code === 'P2002'
              ) {
                return; // another run beat us to it — that IS the dedupe
              }
              throw err;
            });
        }
      }
    }
  } catch (err) {
    logger.error({ err, ruleId }, 'task rule evaluation failed');
    throw err;
  } finally {
    await prisma.taskRule.update({
      where: { id: ruleId },
      data: { lastRunAt: new Date(), lastRunCount: created },
    });
  }
  return created;
}

async function defaultPropertyId(tenantId: string): Promise<string | null> {
  const p = await prisma.property.findFirst({
    where: { tenantId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return p?.id ?? null;
}

// ─── Task CRUD ───

export const DEPARTMENTS = [
  'housekeeping',
  'front_desk',
  'maintenance',
  'security',
  'management',
  'concierge',
] as const;
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const ACTIVE_STATUSES = ['open', 'in_progress'];

export interface ListTasksQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  department?: string;
  priority?: string;
  assigneeId?: string;
  ruleId?: string;
  ruleKey?: string;
  slaBreached?: string;
  openOnly?: string;
  q?: string;
  dueBefore?: string;
}

export async function listTasks(tenantId: string, query: ListTasksQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(query.pageSize) || 50));

  const statusList = query.status?.split(',').filter(Boolean);
  const where = {
    tenantId,
    ...(statusList?.length ? { status: { in: statusList } } : {}),
    ...(query.openOnly === 'true' ? { status: { in: ACTIVE_STATUSES } } : {}),
    ...(query.department ? { department: query.department } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    ...(query.ruleId ? { ruleId: query.ruleId } : {}),
    ...(query.ruleKey ? { ruleKey: query.ruleKey } : {}),
    ...(query.slaBreached === 'true' ? { slaBreached: true } : {}),
    ...(query.q ? { title: { contains: query.q, mode: 'insensitive' as const } } : {}),
    ...(query.dueBefore ? { dueAt: { lte: new Date(query.dueBefore) } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: {
        room: { select: { number: true } },
        guest: { select: { firstName: true, lastName: true } },
        reservation: { select: { confirmationNumber: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        rule: { select: { id: true, key: true, name: true } },
      },
      orderBy: [{ slaBreached: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data: items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getTask(tenantId: string, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, tenantId },
    include: {
      room: true,
      guest: true,
      reservation: true,
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      rule: { select: { id: true, key: true, name: true, description: true } },
    },
  });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  return task;
}

export interface CreateTaskInput {
  propertyId: string;
  department: string;
  title: string;
  description?: string;
  priority?: string;
  roomId?: string;
  guestId?: string;
  reservationId?: string;
  assigneeId?: string;
  slaMinutes?: number;
  metadata?: Record<string, unknown>;
}

export async function createTask(tenantId: string, input: CreateTaskInput, actorId?: string) {
  if (!(DEPARTMENTS as readonly string[]).includes(input.department)) {
    throw new AppError(
      400,
      `department must be one of: ${DEPARTMENTS.join(', ')}`,
      'VALIDATION_ERROR'
    );
  }
  if (input.priority && !(PRIORITIES as readonly string[]).includes(input.priority)) {
    throw new AppError(
      400,
      `priority must be one of: ${PRIORITIES.join(', ')}`,
      'VALIDATION_ERROR'
    );
  }
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
    select: { id: true },
  });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');

  const slaMinutes = input.slaMinutes ?? null;
  const task = await prisma.task.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      department: input.department,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'normal',
      roomId: input.roomId ?? null,
      guestId: input.guestId ?? null,
      reservationId: input.reservationId ?? null,
      assigneeId: input.assigneeId ?? null,
      slaMinutes,
      dueAt: slaMinutes ? addHours(new Date(), slaMinutes / 60) : null,
      source: 'manual',
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  safeAudit(tenantId, actorId, 'task.create', task.id, {
    title: task.title,
    department: task.department,
    priority: task.priority,
    assigneeId: task.assigneeId,
    source: 'manual',
  });

  return task;
}

export interface UpdateTaskInput {
  department?: string;
  title?: string;
  description?: string | null;
  priority?: string;
  assigneeId?: string | null;
  dueAt?: string | null;
  slaMinutes?: number | null;
  status?: 'open' | 'in_progress';
}

export async function updateTask(
  tenantId: string,
  id: string,
  input: UpdateTaskInput,
  actorId?: string
) {
  const existing = await prisma.task.findFirst({
    where: { id, tenantId },
    select: { id: true, assigneeId: true, status: true },
  });
  if (!existing) throw new AppError(404, 'Task not found', 'NOT_FOUND');

  const data: Prisma.TaskUpdateInput = {};
  if (input.department !== undefined) {
    if (!(DEPARTMENTS as readonly string[]).includes(input.department)) {
      throw new AppError(400, 'Invalid department', 'VALIDATION_ERROR');
    }
    data.department = input.department;
  }
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.assigneeId !== undefined) {
    data.assignee = input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true };
  }
  if (input.dueAt !== undefined) data.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.slaMinutes !== undefined) data.slaMinutes = input.slaMinutes;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.task.update({ where: { id }, data });

  if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
    safeAudit(tenantId, actorId, 'task.reassign', id, {
      from: existing.assigneeId,
      to: input.assigneeId,
    });
  }
  if (input.status !== undefined && input.status !== existing.status) {
    safeAudit(tenantId, actorId, `task.status_${input.status}`, id, {
      from: existing.status,
      to: input.status,
    });
  }

  return updated;
}

export async function completeTask(tenantId: string, id: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  if (task.status === 'done') return task;

  const updated = await prisma.task.update({
    where: { id },
    data: { status: 'done', completedAt: new Date(), completedBy: userId },
  });

  safeAudit(tenantId, userId, 'task.complete', id, {
    from: task.status,
    slaBreached: task.slaBreached,
  });

  return updated;
}

export async function cancelTask(tenantId: string, id: string, reason?: string, actorId?: string) {
  const task = await prisma.task.findFirst({ where: { id, tenantId } });
  if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: 'cancelled',
      metadata: {
        ...((task.metadata as Record<string, unknown>) ?? {}),
        cancelReason: reason ?? null,
      } as Prisma.InputJsonValue,
    },
  });

  safeAudit(tenantId, actorId, 'task.cancel', id, {
    from: task.status,
    reason: reason ?? null,
  });

  return updated;
}

export async function taskSummary(tenantId: string) {
  const now = new Date();
  const endOfToday = startOfDay();
  endOfToday.setHours(23, 59, 59, 999);

  const [byStatus, byDept, slaBreached, dueToday] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { tenantId }, _count: { status: true } }),
    prisma.task.groupBy({
      by: ['department'],
      where: { tenantId, status: { in: ACTIVE_STATUSES } },
      _count: { department: true },
    }),
    prisma.task.count({
      where: { tenantId, status: { in: ACTIVE_STATUSES }, slaBreached: true },
    }),
    prisma.task.count({
      where: {
        tenantId,
        status: { in: ACTIVE_STATUSES },
        dueAt: { lte: endOfToday, gte: now },
      },
    }),
  ]);

  return {
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
    openByDepartment: Object.fromEntries(byDept.map((d) => [d.department, d._count.department])),
    slaBreached,
    dueToday,
  };
}

// ─── Rule CRUD ───

export async function listRules(tenantId: string) {
  const rules = (await prisma.taskRule.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  })) as RuleRow[];
  const openCounts = await prisma.task.groupBy({
    by: ['ruleId'],
    where: { tenantId, status: { in: ACTIVE_STATUSES }, ruleId: { not: null } },
    _count: { ruleId: true },
  });
  const countMap = new Map(openCounts.map((c) => [c.ruleId, c._count.ruleId]));
  return rules.map((r) => ({ ...r, openTaskCount: countMap.get(r.id) ?? 0 }));
}

export interface CreateRuleInput {
  key: string;
  name: string;
  department: string;
  description?: string;
  propertyId?: string;
  trigger: RuleTrigger;
  conditions?: { all?: RuleCondition[] };
  action: RuleAction;
  config?: Record<string, unknown>;
}

export async function createRule(tenantId: string, input: CreateRuleInput) {
  if (!/^[a-z0-9-]+$/.test(input.key)) {
    throw new AppError(400, 'key must be lowercase slug (a-z, 0-9, -)', 'VALIDATION_ERROR');
  }
  if (!(DEPARTMENTS as readonly string[]).includes(input.department)) {
    throw new AppError(400, 'Invalid department', 'VALIDATION_ERROR');
  }
  if (input.trigger.type === 'schedule') {
    const every = Number(input.trigger.everyMinutes);
    if (!Number.isFinite(every) || every < 1) {
      throw new AppError(400, 'trigger.everyMinutes must be >= 1', 'VALIDATION_ERROR');
    }
  }
  const existing = await prisma.taskRule.findUnique({
    where: { tenantId_key: { tenantId, key: input.key } },
  });
  if (existing) throw new AppError(409, `Rule key "${input.key}" already exists`, 'CONFLICT');

  return prisma.taskRule.create({
    data: {
      tenantId,
      propertyId: input.propertyId ?? null,
      key: input.key,
      name: input.name,
      department: input.department,
      description: input.description ?? null,
      trigger: input.trigger as unknown as Prisma.InputJsonValue,
      conditions: (input.conditions ?? {}) as unknown as Prisma.InputJsonValue,
      action: input.action as unknown as Prisma.InputJsonValue,
      config: (input.config ?? {}) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function updateRule(
  tenantId: string,
  id: string,
  input: Partial<Pick<RuleRow, 'name' | 'description' | 'isActive'>> & {
    conditions?: { all?: RuleCondition[] };
    action?: RuleAction;
    config?: Record<string, unknown>;
    trigger?: RuleTrigger;
  }
) {
  const existing = await prisma.taskRule.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Rule not found', 'NOT_FOUND');

  return prisma.taskRule.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.trigger ? { trigger: input.trigger as unknown as Prisma.InputJsonValue } : {}),
      ...(input.conditions
        ? { conditions: input.conditions as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.action ? { action: input.action as unknown as Prisma.InputJsonValue } : {}),
      ...(input.config ? { config: input.config as unknown as Prisma.InputJsonValue } : {}),
    },
  });
}

export async function deleteRule(tenantId: string, id: string) {
  const existing = await prisma.taskRule.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Rule not found', 'NOT_FOUND');
  await prisma.taskRule.delete({ where: { id } });
  return { deleted: true, key: existing.key };
}

// ─── Scanner helpers (used by jobs/tasks.job.ts) ───

export async function dueRules(now: Date = new Date()) {
  const rules = (await prisma.taskRule.findMany({
    where: { isActive: true },
    select: { id: true, lastRunAt: true, trigger: true },
  })) as { id: string; lastRunAt: Date | null; trigger: unknown }[];
  return rules.filter((r) => {
    const trigger = r.trigger as RuleTrigger;
    if (trigger.type !== 'schedule' || !trigger.everyMinutes) return false;
    if (!r.lastRunAt) return true;
    return r.lastRunAt.getTime() + trigger.everyMinutes * 60_000 <= now.getTime();
  });
}

export async function flagSlaBreaches(): Promise<number> {
  const result = await prisma.task.updateMany({
    where: { status: { in: ACTIVE_STATUSES }, slaBreached: false, dueAt: { lt: new Date() } },
    data: { slaBreached: true },
  });
  if (result.count > 0) logger.warn({ count: result.count }, 'SLA breaches flagged');
  return result.count;
}
