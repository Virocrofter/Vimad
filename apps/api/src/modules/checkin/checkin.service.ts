/* apps/api/src/modules/checkin/checkin.service.ts — C4'b online check-in depth */
import PDFDocument from 'pdfkit';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { putFile, getSignedDownloadUrl } from '../../common/storage.js';

const sod = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

async function loadSession(tenantId: string, sessionId: string) {
  const s = await prisma.guestCheckinSession.findFirst({ where: { id: sessionId, tenantId } });
  if (!s) throw new AppError(404, 'Check-in session not found', 'NOT_FOUND');
  return s;
}

export async function startSession(tenantId: string, guestId: string, confirmationNumber: string) {
  const r = await prisma.reservation.findFirst({
    where: { tenantId, guestId, confirmationNumber },
  });
  if (!r) throw new AppError(404, 'Reservation not found for this guest', 'NOT_FOUND');
  if (r.status !== 'confirmed') {
    throw new AppError(
      409,
      'Reservation is ' + r.status + ' — online check-in needs a confirmed stay',
      'NOT_CONFIRMED'
    );
  }
  const min = sod(new Date());
  min.setDate(min.getDate() - 1);
  const max = sod(new Date());
  max.setDate(max.getDate() + 15);
  const arr = sod(new Date(r.arrivalDate));
  if (arr < min || arr > max) {
    throw new AppError(409, 'Online check-in opens 14 days before arrival', 'TOO_EARLY');
  }
  const existing = await prisma.guestCheckinSession.findUnique({ where: { reservationId: r.id } });
  if (existing) return existing;
  return prisma.guestCheckinSession.create({
    data: { tenantId, propertyId: r.propertyId, reservationId: r.id, guestId },
  });
}

export async function uploadScan(
  tenantId: string,
  sessionId: string,
  kind: string,
  dataBase64: string
) {
  if (!['id', 'selfie'].includes(kind))
    throw new AppError(400, 'kind must be id|selfie', 'VALIDATION_ERROR');
  const s = await loadSession(tenantId, sessionId);
  const buf = Buffer.from(String(dataBase64), 'base64');
  if (!buf.length || buf.length > 8 * 1024 * 1024) {
    throw new AppError(400, 'invalid or oversized image', 'VALIDATION_ERROR');
  }
  const uploaded = await putFile('checkin/' + s.id + '/' + kind + '.png', buf, 'image/png');
  const url = await getSignedDownloadUrl(uploaded.key);
  await prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: kind === 'id' ? { idDocKey: uploaded.key } : { selfieKey: uploaded.key },
  });
  return { key: uploaded.key, url };
}

export async function setDocuments(
  tenantId: string,
  sessionId: string,
  idDocType: string,
  idDocNumber: string
) {
  const s = await loadSession(tenantId, sessionId);
  if (!s.idDocKey || !s.selfieKey) {
    throw new AppError(400, 'upload ID document and selfie first', 'DOCS_REQUIRED');
  }
  return prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: { idDocType, idDocNumber, status: 'documents_uploaded' },
  });
}

export async function setSignature(tenantId: string, sessionId: string, dataBase64: string) {
  const s = await loadSession(tenantId, sessionId);
  if (s.status !== 'documents_uploaded') {
    throw new AppError(409, 'documents must be verified before signing', 'NOT_READY');
  }
  const buf = Buffer.from(String(dataBase64), 'base64');
  if (!buf.length) throw new AppError(400, 'empty signature', 'VALIDATION_ERROR');
  const uploaded = await putFile('checkin/' + s.id + '/signature.png', buf, 'image/png');
  return prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: { signatureKey: uploaded.key, status: 'signed' },
  });
}

export async function createDeposit(tenantId: string, sessionId: string, amount?: number) {
  const s = await loadSession(tenantId, sessionId);
  if (s.status !== 'signed')
    throw new AppError(409, 'sign the registration card first', 'NOT_READY');
  if (s.depositReference)
    return {
      hostedUrl: 'https://paystack.com/pay/' + s.depositReference,
      reference: s.depositReference,
      already: true,
    };
  const amt = Math.max(50, Math.min(50000, Number(amount ?? 500)));
  const reference = 'DEP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const due = new Date();
  due.setDate(due.getDate() + 3);
  await prisma.paymentRequest.create({
    data: {
      tenantId,
      reservationId: s.reservationId,
      guestId: s.guestId,
      reference,
      amountMinor: Math.round(amt * 100),
      currency: 'ZAR',
      status: 'pending',
      description: 'Online check-in deposit',
      depositPercent: 100,
      dueDate: due,
    },
  });
  await prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: {
      depositRequired: true,
      depositAmount: amt,
      depositReference: reference,
      status: 'deposit_pending',
    },
  });
  return { hostedUrl: 'https://paystack.com/pay/' + reference, reference };
}

/* Webhook-shaped: the real Paystack callback lands here and marks the deposit paid. */
export async function confirmDeposit(tenantId: string, reference: string) {
  const pr = await prisma.paymentRequest.findFirst({ where: { tenantId, reference } });
  if (!pr) throw new AppError(404, 'Payment request not found', 'NOT_FOUND');
  if (pr.status === 'paid') return { confirmed: true, already: true };
  await prisma.paymentRequest.update({
    where: { id: pr.id },
    data: { status: 'paid', paidAt: new Date() },
  });
  await prisma.guestCheckinSession.updateMany({
    where: { tenantId, depositReference: reference },
    data: { depositRequired: false, status: 'signed' },
  });
  return { confirmed: true };
}

export async function completeSession(tenantId: string, sessionId: string) {
  const s = await loadSession(tenantId, sessionId);
  if (s.status !== 'signed' || s.depositRequired) {
    throw new AppError(
      409,
      'documents, signature and deposit must all be settled first',
      'NOT_READY'
    );
  }
  return prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: { status: 'completed', completedAt: new Date() },
  });
}

async function renderCard(sessionId: string): Promise<Buffer> {
  const s = await prisma.guestCheckinSession.findFirstOrThrow({ where: { id: sessionId } });
  const r = await prisma.reservation.findFirstOrThrow({
    where: { id: s.reservationId },
    include: { guest: true, property: true, roomType: { select: { name: true } } },
  });
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  doc.fontSize(20).text('Registration Card', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text(r.property.name, { align: 'center' });
  doc.moveDown(1.5).fillColor('#000');
  doc.fontSize(12);
  doc.text('Guest: ' + r.guest.firstName + ' ' + r.guest.lastName);
  doc.text('Confirmation: ' + r.confirmationNumber);
  doc.text('Room type: ' + (r.roomType?.name ?? 'Assigned at check-in'));
  doc.text(
    'Arrival: ' +
      new Date(r.arrivalDate).toISOString().slice(0, 10) +
      '   Departure: ' +
      new Date(r.departureDate).toISOString().slice(0, 10)
  );
  doc.text('Guests: ' + (r.adults + r.children) + '   Nights: ' + r.nights);
  doc.moveDown();
  doc.text('ID: ' + (s.idDocType ?? '-') + ' ' + (s.idDocNumber ?? '-'));
  doc.moveDown(2);
  if (s.signatureKey) {
    try {
      const { env } = await import('../../common/env.js');
      const sigPath = (env.STORAGE_LOCAL_DIR ?? 'storage') + '/uploads/' + s.signatureKey;
      doc.text('Signature:');
      doc.image(sigPath, { width: 200 });
    } catch {
      doc.text('Signature: on file');
    }
  }
  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor('#888')
    .text('Generated by online check-in at ' + new Date().toISOString(), { align: 'center' });
  doc.end();
  await new Promise<void>((res) => doc.on('end', () => res()));
  return Buffer.concat(chunks);
}

export async function registrationCard(tenantId: string, sessionId: string) {
  const s = await loadSession(tenantId, sessionId);
  const pdf = await renderCard(s.id);
  const uploaded = await putFile(
    'checkin/' + s.id + '/registration-card.pdf',
    pdf,
    'application/pdf'
  );
  const url = await getSignedDownloadUrl(uploaded.key);
  return { url, status: s.status };
}

export async function keyStatus(tenantId: string, sessionId: string) {
  const s = await loadSession(tenantId, sessionId);
  if (s.status === 'approved') {
    return {
      eligible: true,
      key: 'PORTAL-' + s.id.slice(-6).toUpperCase(),
      sessionStatus: s.status,
    };
  }
  return { eligible: false, sessionStatus: s.status };
}

export async function myTimeline(tenantId: string, guestId: string) {
  const [reservations, loyalty, tickets] = await Promise.all([
    prisma.reservation.findMany({
      where: { tenantId, guestId },
      select: {
        confirmationNumber: true,
        status: true,
        arrivalDate: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.loyaltyTransaction.findMany({
      where: { tenantId, guestId },
      select: { type: true, amount: true, description: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.ticket.findMany({
      where: { tenantId, guestId },
      select: { number: true, subject: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);
  const events: { at: Date; kind: string; title: string }[] = [
    ...reservations.map((r) => ({
      at: r.createdAt,
      kind: 'stay',
      title: 'Booking ' + r.confirmationNumber + ' (' + r.status + ')',
    })),
    ...loyalty.map((l) => ({
      at: l.createdAt,
      kind: 'loyalty',
      title: l.description + ' (' + (l.amount > 0 ? '+' : '') + l.amount + ' pts)',
    })),
    ...tickets.map((t) => ({
      at: t.createdAt,
      kind: 'ticket',
      title: t.number + ' — ' + t.subject,
    })),
  ];
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events.slice(0, 25);
}

/* ── staff review queue ── */
export async function reviewList(
  tenantId: string,
  propertyId: string | undefined,
  status: string | undefined
) {
  return prisma.guestCheckinSession.findMany({
    where: {
      tenantId,
      ...(propertyId ? { propertyId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function approveSession(tenantId: string, actorId: string, sessionId: string) {
  const s = await loadSession(tenantId, sessionId);
  if (s.status !== 'completed')
    throw new AppError(
      409,
      'session is ' + s.status + ' — only completed sessions need approval',
      'NOT_READY'
    );
  const updated = await prisma.guestCheckinSession.update({
    where: { id: s.id },
    data: { status: 'approved', reviewedById: actorId, reviewedAt: new Date() },
  });
  const { logAuditEvent } = await import('../audit/audit.service.js');
  await logAuditEvent({
    tenantId,
    action: 'checkin.session_approved',
    category: 'reservations',
    label: 'Online check-in approved',
    description: 'Session ' + s.id + ' approved by staff',
    entityType: 'guest_checkin_session',
    entityId: s.id,
    metadata: { actorId },
    severity: 'info',
  }).catch(() => undefined);
  return updated;
}
