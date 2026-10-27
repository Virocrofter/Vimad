/* apps/api/src/modules/housekeeping/hk-rules.service.ts — T2+ auto-status rules
 * Evaluates housekeeping status rules stored as rows in task_rules
 * (key prefix 'hk-'). Two kinds on disk tonight:
 *   hk_status_stagnant — clean/ready rooms vacant ≥ N days, no open task → dirty
 *   hk_status_overnight — inspected rooms → clean (04:30 business roll)
 */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';

type RuleRow = {
  id: string;
  tenantId: string;
  key: string;
  conditions: { vacantGteDays?: number; fromStatuses?: string[] };
  action: { kind: string; to: string };
};

export async function runHkRule(tenantId: string, key: string): Promise<{ flipped: number }> {
  const rule = (await prisma.taskRule.findFirst({
    where: { tenantId, key },
  })) as RuleRow | null;
  if (!rule) throw new Error(`hk rule not found: ${key}`);

  const fromStatuses = rule.conditions.fromStatuses ?? [];
  const rooms = await prisma.room.findMany({
    where: { tenantId, housekeepingStatus: { in: fromStatuses } },
    select: {
      id: true,
      number: true,
      housekeepingStatus: true,
      statusChangedAt: true,
      propertyId: true,
      reservationStays: {
        where: { date: { gte: new Date(Date.now() - 60 * 86400_000) } },
        select: { date: true },
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    take: 500,
  });

  let flipped = 0;
  for (const room of rooms) {
    if (rule.action.kind === 'hk_status_stagnant') {
      const days = rule.conditions.vacantGteDays ?? 7;
      const lastStay = room.reservationStays[0]?.date?.getTime() ?? 0;
      const lastChange = room.statusChangedAt?.getTime() ?? 0;
      const vacantSince = Math.max(lastStay, lastChange);
      if (Date.now() - vacantSince < days * 86400_000) continue;
      const openTask = await prisma.housekeepingTask.count({
        where: { roomId: room.id, status: { in: ['pending', 'in_progress'] } },
      });
      if (openTask > 0) continue;
    }
    if (room.housekeepingStatus === rule.action.to) continue;
    await prisma.room.update({
      where: { id: room.id },
      data: {
        housekeepingStatus: rule.action.to,
        statusChangedAt: new Date(),
        statusChangedBy: null,
      },
    });
    await prisma.roomStatusEvent.create({
      data: {
        tenantId,
        propertyId: room.propertyId,
        roomId: room.id,
        field: 'housekeepingStatus',
        from: room.housekeepingStatus,
        to: rule.action.to,
        reason: `auto: ${rule.key}`,
        actorId: null,
      },
    });
    flipped++;
  }
  logger.info({ rule: rule.key, flipped }, 'hk auto-status rule executed');
  return { flipped };
}

export async function runAllStagnantRules(): Promise<void> {
  const rules = await prisma.taskRule.findMany({
    where: {
      key: { startsWith: 'hk-' },
      isActive: true,
      action: { path: ['kind'], equals: 'hk_status_stagnant' },
    },
    select: { tenantId: true, key: true },
  });
  for (const r of rules) {
    await runHkRule(r.tenantId, r.key).catch((err) =>
      logger.error({ err, key: r.key }, 'hk stagnant rule failed')
    );
  }
}

export async function runOvernightRules(): Promise<void> {
  const rules = await prisma.taskRule.findMany({
    where: {
      key: { startsWith: 'hk-' },
      isActive: true,
      action: { path: ['kind'], equals: 'hk_status_overnight' },
    },
    select: { tenantId: true, key: true },
  });
  for (const r of rules) {
    await runHkRule(r.tenantId, r.key).catch((err) =>
      logger.error({ err, key: r.key }, 'hk overnight rule failed')
    );
  }
}
