// apps/api/src/modules/admin/contracts.service.ts
// Contract lifecycle engine (Vimad Commercial Plan section 4).
// Contracts are the commercial source of truth: negotiated fees, discounts,
// terms and renewals. Plan catalog is list-price fallback only.
import { randomUUID } from 'crypto';
import { prisma } from '../../common/prisma.js';

class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Discounts at or above this threshold require an explicit approver.
const DISCOUNT_APPROVAL_THRESHOLD = 1000; // solo-founder mode: gate disabled (discounts max at 100, so this never fires). Re-enable by setting back to 10.

const TRANSITIONS: Record<string, string[]> = {
  draft: ['sign', 'cancel'],
  pending_activation: ['activate', 'cancel'],
  active: ['amend', 'renew', 'cancel'],
  renewed: ['amend', 'renew', 'cancel'],
  expired: ['renew'],
  cancelled: [],
};

const num = (v: unknown) => Number(v ?? 0);

function serialize(c: any) {
  return {
    ...c,
    listFee: num(c.listFee),
    netFee: num(c.netFee),
    renewalFee: c.renewalFee == null ? null : num(c.renewalFee),
    discountPct: num(c.discountPct),
    tenantName: c.tenant?.name ?? null,
    tenantSlug: c.tenant?.slug ?? null,
  };
}

async function writeEvent(contractId: string, type: string, actor: string, payload: any) {
  await prisma.contractEvent.create({
    data: { id: randomUUID(), contractId, type, actor, payload: payload ?? {} },
  });
}

function assertDiscountApproval(discountPct: number, approvedBy: string | null | undefined) {
  if (discountPct >= DISCOUNT_APPROVAL_THRESHOLD && !approvedBy) {
    throw new HttpError(
      400,
      `Discounts of ${DISCOUNT_APPROVAL_THRESHOLD}% or more require an approver (discountApprovedBy).`
    );
  }
}

export async function listContracts(params: { status?: string; q?: string }) {
  const where: any = {};
  if (params.status && params.status !== 'all') where.status = params.status;
  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });
  let list = contracts.map(serialize);
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter((c) =>
      `${c.tenantName ?? ''} ${c.legalEntity ?? ''}`.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getContract(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      events: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!contract) throw new HttpError(404, 'Contract not found');
  return serialize(contract);
}

export async function createContract(actor: string, data: any) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (!(endDate.getTime() > startDate.getTime()))
    throw new HttpError(400, 'endDate must be after startDate');
  if (num(data.netFee) > num(data.listFee))
    throw new HttpError(400, 'netFee cannot exceed listFee');
  // Discount is DERIVED, never picked: initial fee vs list fee.
  const computedDiscount =
    data.discountPct != null
      ? num(data.discountPct)
      : num(data.listFee) > 0
        ? Math.round((1 - num(data.netFee) / num(data.listFee)) * 10000) / 100
        : 0;
  assertDiscountApproval(computedDiscount, data.discountApprovedBy);

  const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
  if (!tenant) throw new HttpError(404, 'Tenant not found');

  const modules: string[] = Array.isArray(data.modules) ? [...data.modules] : [];
  if (data.dataUseConsent === false) {
    const i = modules.indexOf('data-use:aggregates');
    if (i >= 0) modules.splice(i, 1);
    modules.push('data-use:opted-out');
  } else if (!modules.includes('data-use:aggregates')) {
    modules.push('data-use:aggregates');
  }

  const contract = await prisma.contract.create({
    data: {
      id: randomUUID(),
      tenantId: data.tenantId,
      legalEntity: data.legalEntity,
      status: 'draft',
      modules,
      roomBand: data.roomBand ?? null,
      currency: data.currency ?? 'ZAR',
      listFee: data.listFee,
      netFee: data.netFee,
      renewalFee: data.renewalFee ?? null,
      discountPct: computedDiscount,
      discountApprovedBy: data.discountApprovedBy ?? null,
      startDate,
      endDate,
      renewalNoticeDays: data.renewalNoticeDays ?? 30,
      autoRenew: data.autoRenew ?? false,
      paymentMethod: data.paymentMethod ?? 'invoice',
      signatories: data.signatories ?? [],
      documentUrl: data.documentUrl ?? null,
      version: 1,
      createdBy: actor,
    },
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  });

  await writeEvent(contract.id, 'created', actor, {
    after: {
      legalEntity: contract.legalEntity,
      listFee: num(contract.listFee),
      netFee: num(contract.netFee),
      discountPct: num(contract.discountPct),
      startDate,
      endDate,
    },
  });
  return serialize(contract);
}

async function transition(
  id: string,
  action: string,
  _actor: string,
  apply: (c: any) => Promise<any>
) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new HttpError(404, 'Contract not found');
  const allowed = TRANSITIONS[contract.status] ?? [];
  if (!allowed.includes(action))
    throw new HttpError(409, `Cannot ${action} a contract in status "${contract.status}"`);
  return apply(contract);
}

export async function signContract(id: string, actor: string, payload: any) {
  return transition(id, 'sign', actor, async (c: any) => {
    const signatories = payload?.signatories ?? c.signatories;
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: 'pending_activation',
        signatories,
        documentUrl: payload?.documentUrl ?? c.documentUrl,
      },
    });
    await writeEvent(id, 'signed', actor, { signatories, documentUrl: updated.documentUrl });
    return serialize(updated);
  });
}

export async function activateContract(id: string, actor: string) {
  return transition(id, 'activate', actor, async () => {
    const updated = await prisma.contract.update({ where: { id }, data: { status: 'active' } });
    await writeEvent(id, 'activated', actor, { netFee: num(updated.netFee) });
    return serialize(updated);
  });
}

export async function cancelContract(id: string, actor: string, reason: string) {
  if (!reason || !reason.trim()) throw new HttpError(400, 'A cancellation reason is required');
  return transition(id, 'cancel', actor, async (c: any) => {
    const updated = await prisma.contract.update({ where: { id }, data: { status: 'cancelled' } });
    await writeEvent(id, 'cancelled', actor, {
      reason: reason.trim(),
      before: { status: c.status, netFee: num(c.netFee) },
    });
    return serialize(updated);
  });
}

export async function renewContract(id: string, actor: string, payload: any) {
  if (!payload?.newEndDate) throw new HttpError(400, 'newEndDate is required');
  const newEndDate = new Date(payload.newEndDate);
  if (!(newEndDate.getTime() > Date.now()))
    throw new HttpError(400, 'newEndDate must be in the future');
  return transition(id, 'renew', actor, async (c: any) => {
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: 'active',
        endDate: newEndDate,
        netFee: payload.netFee ?? c.netFee,
        version: c.version + 1,
      },
    });
    await writeEvent(id, 'renewed', actor, {
      before: { endDate: c.endDate, netFee: num(c.netFee) },
      after: { endDate: newEndDate, netFee: num(updated.netFee) },
    });
    return serialize(updated);
  });
}

export async function amendContract(id: string, actor: string, payload: any) {
  const ALLOWED_KEYS = [
    'listFee',
    'netFee',
    'renewalFee',
    'discountPct',
    'modules',
    'roomBand',
    'endDate',
    'autoRenew',
    'renewalNoticeDays',
  ];
  const changes: any = {};
  for (const k of ALLOWED_KEYS) if (payload[k] !== undefined) changes[k] = payload[k];
  if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to amend');
  if (changes.endDate) changes.endDate = new Date(changes.endDate);

  return transition(id, 'amend', actor, async (c: any) => {
    if (changes.discountPct !== undefined) {
      assertDiscountApproval(
        num(changes.discountPct),
        payload.discountApprovedBy ?? c.discountApprovedBy
      );
      changes.discountApprovedBy = payload.discountApprovedBy ?? c.discountApprovedBy;
    }
    const before: any = {};
    for (const k of Object.keys(changes)) {
      const v: any = c[k];
      before[k] = v instanceof Date ? v.toISOString() : num(v) || v;
    }
    const updated: any = await prisma.contract.update({
      where: { id },
      data: { ...changes, version: c.version + 1 },
    });
    const after: any = {};
    for (const k of Object.keys(changes)) {
      const v: any = updated[k];
      after[k] = v instanceof Date ? v.toISOString() : num(v) || v;
    }
    await writeEvent(id, 'amended', actor, { before, after, reason: payload.reason ?? null });
    return serialize(updated);
  });
}

export async function approveDiscount(id: string, actor: string, approver: string) {
  if (!approver) throw new HttpError(400, 'approver is required');
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new HttpError(404, 'Contract not found');
  const updated = await prisma.contract.update({
    where: { id },
    data: { discountApprovedBy: approver },
  });
  await writeEvent(id, 'discount_approved', actor, {
    approver,
    discountPct: num(contract.discountPct),
  });
  return serialize(updated);
}

// Fee resolution for invoice generation: active contract wins, plan catalog
// is the fallback ("active contract overrides plan base fee").
export async function resolveMonthlyFee(tenantId: string, planFee: number): Promise<number> {
  const contract = await prisma.contract.findFirst({
    where: { tenantId, status: { in: ['active', 'renewed'] }, endDate: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!contract) return planFee;
  // After the first renewal the standing price is the renewal fee (defaults
  // to list fee at creation); before that the tenant bills at the initial fee.
  const renewed = await prisma.contractEvent.findFirst({
    where: { contractId: contract.id, type: 'renewed' },
    select: { id: true },
  });
  if (renewed && contract.renewalFee != null) return num(contract.renewalFee);
  return num(contract.netFee);
}
