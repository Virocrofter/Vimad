// Resolve the property scope of an audit row from the audited record itself.
// Tenant-global entities (guest, guest_consent, inventory) return null by design.
import { prisma } from '../../common/prisma.js';

export async function resolveAuditPropertyId(
  tenantId: string,
  entity: string,
  entityId: string | null | undefined
): Promise<string | null> {
  if (!entityId) return null;
  const id = String(entityId);
  try {
    switch (entity) {
      case 'reservation': {
        const r = await prisma.reservation.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'room': {
        const r = await prisma.room.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'task': {
        const r = await prisma.task.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'ticket': {
        const r = await prisma.ticket.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'payment': {
        const r = await prisma.payment.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'exception': {
        const r = await prisma.exception.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'night_audit': {
        const r = await prisma.nightAudit.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'minibar_check': {
        const r = await prisma.minibarCheck.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'concierge_item': {
        const r = await prisma.conciergeItem.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'guest_checkin_session': {
        const r = await prisma.guestCheckinSession.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'ar_invoice': {
        const r = await prisma.arInvoice.findFirst({
          where: { id, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'ar_payment': {
        const ap = await prisma.arPayment.findFirst({
          where: { id, tenantId },
          select: { invoiceId: true },
        });
        if (!ap?.invoiceId) return null;
        const inv = await prisma.arInvoice.findFirst({
          where: { id: ap.invoiceId, tenantId },
          select: { propertyId: true },
        });
        return inv?.propertyId ?? null;
      }
      case 'folio': {
        const f = await prisma.folio.findFirst({
          where: { id, tenantId },
          select: { reservationId: true },
        });
        if (!f?.reservationId) return null;
        const r = await prisma.reservation.findFirst({
          where: { id: f.reservationId, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      case 'folio_item': {
        const fi = await prisma.folioItem.findFirst({
          where: { id },
          select: { folioId: true },
        });
        if (!fi?.folioId) return null;
        const f = await prisma.folio.findFirst({
          where: { id: fi.folioId, tenantId },
          select: { reservationId: true },
        });
        if (!f?.reservationId) return null;
        const r = await prisma.reservation.findFirst({
          where: { id: f.reservationId, tenantId },
          select: { propertyId: true },
        });
        return r?.propertyId ?? null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
