/* apps/api/src/modules/folios/group-billing.service.ts — T3+ group billing
 * One view of every bill in a group, item moves across folios (audited),
 * bill closing rules (always / consumed / consumed half-day window),
 * supervised reopen with full audit trail.
 */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logAuditEvent } from '../audit/audit.service.js';

async function recompute(folioId: string) {
  const items = await prisma.folioItem.findMany({ where: { folioId } });
  const charges = items.reduce((s, i) => s + Number(i.amount) * i.quantity, 0);
  const folio = await prisma.folio.update({
    where: { id: folioId },
    data: { totalCharges: charges, balance: charges },
  });
  return folio;
}

export async function getGroupBillingView(tenantId: string, groupId: string) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) throw new AppError(404, 'Group not found', 'NOT_FOUND');
  const reservations = await prisma.reservation.findMany({
    where: { groupId, tenantId },
    select: {
      id: true,
      confirmationNumber: true,
      status: true,
      guest: { select: { firstName: true, lastName: true } },
      folio: {
        include: { items: { orderBy: { postedAt: 'asc' } } },
      },
    },
    orderBy: { confirmationNumber: 'asc' },
  });
  const masterFolio = await prisma.folio.findFirst({
    where: { groupId, isMaster: true },
    include: { items: { orderBy: { postedAt: 'asc' } } },
  });
  const property = await prisma.property.findFirst({
    where: { id: group.propertyId },
    select: { billClosingRule: true, billClosingWindowHours: true },
  });
  return {
    group: { id: group.id, name: group.name, code: group.code, status: group.status },
    rule: property ?? { billClosingRule: 'always', billClosingWindowHours: 12 },
    masterFolio,
    bills: reservations.map((r) => ({
      reservationId: r.id,
      confirmationNumber: r.confirmationNumber,
      reservationStatus: r.status,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      folio: r.folio,
    })),
  };
}

export async function moveFolioItem(
  tenantId: string,
  actorId: string,
  itemId: string,
  targetFolioId: string
) {
  const item = await prisma.folioItem.findFirst({
    where: { id: itemId, folio: { tenantId } },
    include: { folio: { select: { id: true, groupId: true } } },
  });
  if (!item) throw new AppError(404, 'Folio item not found', 'NOT_FOUND');
  const target = await prisma.folio.findFirst({ where: { id: targetFolioId, tenantId } });
  if (!target) throw new AppError(404, 'Target folio not found', 'NOT_FOUND');
  if (target.id === item.folioId)
    throw new AppError(400, 'Item already on that folio', 'VALIDATION_ERROR');
  if ((target.groupId ?? null) !== (item.folio.groupId ?? null)) {
    throw new AppError(400, 'Cannot move items across different groups', 'VALIDATION_ERROR');
  }
  await prisma.folioItem.update({
    where: { id: itemId },
    data: {
      folioId: target.id,
      movedFromFolioId: item.folioId,
      movedAt: new Date(),
      movedBy: actorId,
    },
  });
  await recompute(item.folioId);
  await recompute(target.id);
  await logAuditEvent({
    tenantId,
    action: 'folio.item_move',
    category: 'billing',
    label: `Folio item moved`,
    description: item.description,
    entityType: 'folio_item',
    entityId: itemId,
    metadata: { from: item.folioId, to: target.id, actorId },
    severity: 'info',
  });
  return { moved: true };
}

export async function closeBill(tenantId: string, actorId: string, folioId: string) {
  const folio = await prisma.folio.findFirst({
    where: { id: folioId, tenantId },
    include: { reservation: { select: { status: true, checkedOutAt: true, propertyId: true } } },
  });
  if (!folio) throw new AppError(404, 'Folio not found', 'NOT_FOUND');
  if (folio.status === 'closed') return { closed: true, already: true };
  const property = folio.reservation
    ? await prisma.property.findFirst({
        where: { id: folio.reservation.propertyId },
        select: { billClosingRule: true, billClosingWindowHours: true },
      })
    : null;
  const rule = property?.billClosingRule ?? 'always';
  const windowH = property?.billClosingWindowHours ?? 12;
  const checkedOutAt = folio.reservation?.checkedOutAt ?? null;
  if (rule === 'consumed' && !checkedOutAt) {
    throw new AppError(
      403,
      'Bill closing rule "consumed": guest must be checked out first',
      'BILL_RULE_CONSUMED'
    );
  }
  if (rule === 'halfday') {
    if (!checkedOutAt) {
      throw new AppError(
        403,
        'Bill closing rule "halfday": guest must be checked out first',
        'BILL_RULE_CONSUMED'
      );
    }
    if (Date.now() > checkedOutAt.getTime() + windowH * 3600_000) {
      throw new AppError(
        403,
        `Bill closing window expired (${windowH}h after checkout)`,
        'BILL_RULE_WINDOW'
      );
    }
  }
  await prisma.folio.update({
    where: { id: folioId },
    data: { status: 'closed', closedAt: new Date(), closedBy: actorId },
  });
  await logAuditEvent({
    tenantId,
    action: 'folio.bill_closed',
    category: 'billing',
    label: `Bill closed (rule: ${rule})`,
    description: `Folio ${folioId} closed`,
    entityType: 'folio',
    entityId: folioId,
    metadata: { actorId, rule },
    severity: 'info',
  });
  return { closed: true, rule };
}

export async function reopenBill(
  tenantId: string,
  actorId: string,
  folioId: string,
  reason: string
) {
  if (!reason || reason.trim().length < 2) {
    throw new AppError(400, 'reason is mandatory to modify a closed bill', 'REASON_REQUIRED');
  }
  const folio = await prisma.folio.findFirst({ where: { id: folioId, tenantId } });
  if (!folio) throw new AppError(404, 'Folio not found', 'NOT_FOUND');
  await prisma.folio.update({
    where: { id: folioId },
    data: { status: 'open', closedAt: null, closedBy: null },
  });
  await logAuditEvent({
    tenantId,
    action: 'folio.bill_reopened',
    category: 'billing',
    label: 'Closed bill modified/reopened',
    description: reason,
    entityType: 'folio',
    entityId: folioId,
    metadata: { actorId },
    severity: 'medium',
  });
  return { reopened: true };
}

export async function getBillRules(tenantId: string, propertyId: string) {
  const p = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    select: { billClosingRule: true, billClosingWindowHours: true },
  });
  if (!p) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  return p;
}

export async function setBillRules(
  tenantId: string,
  propertyId: string,
  rule: string,
  windowHours: number
) {
  if (!['always', 'consumed', 'halfday'].includes(rule))
    throw new AppError(400, 'rule must be always|consumed|halfday', 'VALIDATION_ERROR');
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property)
    throw new AppError(404, `Property not found: ${propertyId} (tenant ${tenantId})`, 'NOT_FOUND');
  await prisma.property.update({
    where: { id: propertyId },
    data: { billClosingRule: rule, billClosingWindowHours: windowHours },
  });
  return { billClosingRule: rule, billClosingWindowHours: windowHours };
}

/* Auto close-and-send on group checkout: scans reservations checked out in
 * the last hour whose folio is still open, closes it and queues the bill
 * email on the existing email pipeline (email_logs → email worker). */
export async function runAutoSend(windowMinutes = 60): Promise<{ processed: number }> {
  const since = new Date(Date.now() - windowMinutes * 60_000);
  const reservations = await prisma.reservation.findMany({
    where: { checkedOutAt: { gte: since }, groupId: { not: null }, folio: { status: 'open' } },
    select: {
      id: true,
      tenantId: true,
      guestId: true,
      confirmationNumber: true,
      folio: { select: { id: true, balance: true } },
      guest: { select: { email: true, firstName: true } },
    },
    take: 100,
  });
  let processed = 0;
  for (const r of reservations) {
    if (!r.folio) continue;
    try {
      await closeBill(r.tenantId, 'system:auto-send', r.folio.id);
      if (r.guest.email) {
        await prisma.emailLog.create({
          data: {
            tenantId: r.tenantId,
            to: r.guest.email,
            subject: `Your bill — ${r.confirmationNumber}`,
            template: 'bill_closed',
            status: 'queued',
            relatedType: 'folio',
            relatedId: r.folio.id,
          },
        });
      }
      processed++;
    } catch {
      // rule-blocked folios stay open for the desk
    }
  }
  return { processed };
}
