import { randomUUID } from 'node:crypto';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';
import { PLATFORM_ROLES, type PlatformRole } from '../platform.middleware.js';

function audit(entry: {
  actorEmail: string;
  action: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  source?: string;
}) {
  return prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: entry.actorEmail,
      action: entry.action,
      entity: 'platform_operator',
      entityId: entry.entityId,
      before:
        entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before ?? null)),
      after:
        entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after ?? null)),
      reason: entry.reason,
      source: entry.source ?? 'console',
    },
  });
}

export async function listOperators() {
  return prisma.platformOperator.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      grantedBy: true,
      grantedAt: true,
      revokedAt: true,
      lastActiveAt: true,
      mfaEnrolled: true,
    },
    orderBy: { grantedAt: 'asc' },
  });
}

export async function grantOperator(input: {
  email: string;
  role: PlatformRole;
  reason: string;
  actorEmail: string;
}) {
  const email = input.email.toLowerCase();
  if (await prisma.platformOperator.findUnique({ where: { email } }))
    throw new AppError(409, 'Operator already exists', 'OPERATOR_EXISTS');
  if (!(PLATFORM_ROLES as readonly string[]).includes(input.role))
    throw new AppError(400, 'Unknown platform role', 'VALIDATION_ERROR');
  const operator = await prisma.platformOperator.create({
    data: {
      id: randomUUID(),
      email,
      role: input.role,
      status: 'active',
      grantedBy: input.actorEmail,
    },
  });
  await audit({
    actorEmail: input.actorEmail,
    action: 'platform.operator.granted',
    entityId: operator.id,
    after: { email, role: input.role },
    reason: input.reason,
  });
  return operator;
}

export async function updateOperatorRole(
  operatorId: string,
  role: PlatformRole,
  actorEmail: string,
  reason: string
) {
  const operator = await prisma.platformOperator.findUnique({ where: { id: operatorId } });
  if (!operator) throw new AppError(404, 'Operator not found', 'NOT_FOUND');
  if (!(PLATFORM_ROLES as readonly string[]).includes(role))
    throw new AppError(400, 'Unknown platform role', 'VALIDATION_ERROR');
  const updated = await prisma.platformOperator.update({
    where: { id: operatorId },
    data: { role },
  });
  await audit({
    actorEmail,
    action: 'platform.operator.role_changed',
    entityId: operatorId,
    before: { role: operator.role },
    after: { role },
    reason,
  });
  return updated;
}

export async function revokeOperator(operatorId: string, reason: string, actorEmail: string) {
  const operator = await prisma.platformOperator.findUnique({ where: { id: operatorId } });
  if (!operator) throw new AppError(404, 'Operator not found', 'NOT_FOUND');
  if (operator.status !== 'active')
    throw new AppError(409, 'Operator already revoked', 'INVALID_STATE');
  if (operator.email === actorEmail && operator.role === 'platform_super_admin') {
    const otherSupers = await prisma.platformOperator.count({
      where: { role: 'platform_super_admin', status: 'active', id: { not: operatorId } },
    });
    if (otherSupers === 0)
      throw new AppError(
        409,
        'Cannot revoke the last active super admin (self-lockout)',
        'SELF_LOCKOUT'
      );
  }
  const updated = await prisma.platformOperator.update({
    where: { id: operatorId },
    data: { status: 'revoked', revokedAt: new Date(), revokeReason: reason },
  });
  await audit({
    actorEmail,
    action: 'platform.operator.revoked',
    entityId: operatorId,
    before: { status: 'active' },
    after: { status: 'revoked' },
    reason,
  });
  return updated;
}

export async function reactivateOperator(operatorId: string, actorEmail: string, reason?: string) {
  const operator = await prisma.platformOperator.findUnique({ where: { id: operatorId } });
  if (!operator) throw new AppError(404, 'Operator not found', 'NOT_FOUND');
  if (operator.status === 'active')
    throw new AppError(409, 'Operator already active', 'INVALID_STATE');
  const updated = await prisma.platformOperator.update({
    where: { id: operatorId },
    data: { status: 'active', revokedAt: null, revokeReason: null },
  });
  await audit({
    actorEmail,
    action: 'platform.operator.reactivated',
    entityId: operatorId,
    before: { status: operator.status },
    after: { status: 'active' },
    reason,
  });
  return updated;
}
