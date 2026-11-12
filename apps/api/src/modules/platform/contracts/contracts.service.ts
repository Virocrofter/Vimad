import { randomUUID } from 'node:crypto';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';

export const DISCOUNT_THRESHOLD = 10;

async function recordEvent(contractId: string, type: string, actor: string, payload?: unknown) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  await prisma.contractEvent.create({
    data: {
      id: randomUUID(),
      contractId,
      type,
      actor,
      payload: payload === undefined ? undefined : JSON.parse(JSON.stringify(payload)),
    },
  });
  await prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: actor,
      action: 'platform.contract.' + type,
      entity: 'contract',
      entityId: contractId,
      tenantId: contract?.tenantId,
      after: payload === undefined ? undefined : JSON.parse(JSON.stringify(payload)),
      source: 'console',
    },
  });
}

export async function listContracts(status?: string) {
  return prisma.contract.findMany({
    where: status ? { status } : {},
    include: { tenant: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function contractDetail(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: 'desc' } },
      tenant: { select: { name: true, slug: true } },
    },
  });
  if (!contract) throw new AppError(404, 'Contract not found', 'NOT_FOUND');
  return contract;
}

export async function createContract(input: any) {
  const dup = await prisma.contract.findFirst({
    where: {
      tenantId: input.tenantId,
      status: { in: ['draft', 'pending_approval', 'approved', 'signed', 'active'] },
    },
  });
  if (dup)
    throw new AppError(409, 'An open contract already exists for this tenant', 'CONTRACT_EXISTS');
  const netFee = Number(input.netFee);
  const listFee = Number(input.listFee);
  const discountPct = listFee > 0 ? Number((((listFee - netFee) / listFee) * 100).toFixed(2)) : 0;
  if (discountPct > DISCOUNT_THRESHOLD && !input.discountApprovedBy) {
    throw new AppError(
      422,
      'Discount above ' + DISCOUNT_THRESHOLD + '% requires a second approver',
      'DISCOUNT_APPROVAL_REQUIRED'
    );
  }
  const contract = await prisma.contract.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      legalEntity: input.legalEntity,
      status: 'draft',
      modules: input.modules ?? [],
      roomBand: input.roomBand ?? null,
      currency: input.currency ?? 'ZAR',
      listFee,
      netFee,
      discountPct,
      discountApprovedBy: input.discountApprovedBy ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      renewalNoticeDays: input.renewalNoticeDays ?? 30,
      autoRenew: input.autoRenew ?? false,
      paymentMethod: input.paymentMethod ?? 'invoice',
      signatories: input.signatories ?? [],
      createdBy: input.actorEmail,
    },
    include: { tenant: { select: { name: true, slug: true } } },
  });
  await recordEvent(contract.id, 'created', input.actorEmail, {
    legalEntity: input.legalEntity,
    netFee,
  });
  return contract;
}

async function transition(
  id: string,
  from: string[],
  to: string,
  actor: string,
  payload?: unknown
) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new AppError(404, 'Contract not found', 'NOT_FOUND');
  if (!from.includes(contract.status))
    throw new AppError(409, 'Invalid transition from ' + contract.status, 'INVALID_STATE');
  const updated = await prisma.contract.update({ where: { id }, data: { status: to } });
  await recordEvent(id, to, actor, payload);
  return updated;
}

export async function submitContract(id: string, actor: string) {
  return transition(id, ['draft'], 'pending_approval', actor);
}
export async function approveContract(id: string, actor: string) {
  return transition(id, ['pending_approval'], 'approved', actor);
}
export async function signContract(id: string, documentUrl: string, actor: string) {
  if (!documentUrl) throw new AppError(400, 'Signed document URL is required', 'VALIDATION_ERROR');
  const updated = await transition(id, ['approved'], 'signed', actor, { documentUrl });
  await prisma.contract.update({ where: { id }, data: { documentUrl } });
  return updated;
}
export async function activateContract(id: string, actor: string) {
  return transition(id, ['signed'], 'active', actor);
}

export async function amendContract(id: string, patch: any, actor: string) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new AppError(404, 'Contract not found', 'NOT_FOUND');
  if (contract.status !== 'active')
    throw new AppError(409, 'Only active contracts can be amended', 'INVALID_STATE');
  const updated = await prisma.contract.update({
    where: { id },
    data: { ...patch, version: { increment: 1 } },
  });
  await recordEvent(id, 'amended', actor, { version: updated.version, patch });
  return updated;
}

export async function cancelContract(id: string, reason: string, actor: string) {
  return transition(
    id,
    ['draft', 'pending_approval', 'approved', 'signed', 'active'],
    'cancelled',
    actor,
    { reason }
  );
}

export async function contractExceptions() {
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 86400000);
  const expiring = await prisma.contract.findMany({
    where: { status: 'active', endDate: { lte: in90 }, autoRenew: false },
    include: { tenant: { select: { name: true } } },
    orderBy: { endDate: 'asc' },
  });
  return expiring.map((c: any) => ({
    contractId: c.id,
    tenant: c.tenant.name,
    legalEntity: c.legalEntity,
    endDate: c.endDate,
    daysLeft: Math.max(0, Math.floor((new Date(c.endDate).getTime() - now.getTime()) / 86400000)),
    renewalNoticeDays: c.renewalNoticeDays,
  }));
}
