import { randomUUID } from 'node:crypto';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';

async function audit(
  actor: string,
  action: string,
  entityId: string,
  after?: unknown,
  reason?: string
) {
  await prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: actor,
      action,
      entity: 'feature_flag',
      entityId,
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
      reason,
      source: 'console',
    },
  });
}

function cohortBucket(tenantId: string): number {
  let h = 0;
  for (const c of tenantId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100;
}

export async function evaluateFlag(
  key: string,
  tenantId?: string
): Promise<{ enabled: boolean; source: string }> {
  const flag = await prisma.featureFlag.findFirst({ where: { key, status: { not: 'killed' } } });
  if (!flag) return { enabled: false, source: 'default_off' };
  if (tenantId) {
    const override = await prisma.featureFlagOverride.findFirst({
      where: { flagId: flag.id, tenantId },
    });
    if (override) return { enabled: override.value, source: 'tenant_override' };
  }
  const strategy = (flag.rolloutStrategy ?? {}) as any;
  if (strategy.kind === 'percentage' && tenantId) {
    return {
      enabled: cohortBucket(tenantId) < Number(strategy.percentage ?? 0),
      source: 'percentage_rollout',
    };
  }
  return { enabled: flag.defaultValue, source: 'default' };
}

export async function listFlags() {
  const flags = await prisma.featureFlag.findMany({
    include: { overrides: true },
    orderBy: { key: 'asc' },
  });
  return flags.map((f: any) => ({ ...f, overrideCount: f.overrides.length }));
}

export async function createFlag(input: any) {
  const existing = await prisma.featureFlag.findFirst({
    where: { key: input.key, environment: input.environment ?? 'production' },
  });
  if (existing) throw new AppError(409, 'Flag already exists in this environment', 'FLAG_EXISTS');
  const flag = await prisma.featureFlag.create({
    data: {
      id: randomUUID(),
      key: input.key,
      description: input.description,
      owner: input.owner,
      defaultValue: input.defaultValue ?? false,
      environment: input.environment ?? 'production',
      rolloutStrategy: input.rolloutStrategy ?? {},
      status: 'active',
    },
  });
  await audit(input.actorEmail, 'platform.flag.created', flag.id, { key: flag.key });
  return flag;
}

export async function setFlagDefault(id: string, defaultValue: boolean, actor: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) throw new AppError(404, 'Flag not found', 'NOT_FOUND');
  if (flag.status === 'killed')
    throw new AppError(409, 'Killed flags are immutable', 'INVALID_STATE');
  const updated = await prisma.featureFlag.update({ where: { id }, data: { defaultValue } });
  await audit(actor, 'platform.flag.default_changed', id, { defaultValue });
  return updated;
}

export async function setOverride(flagId: string, input: any) {
  const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!flag) throw new AppError(404, 'Flag not found', 'NOT_FOUND');
  const override = await prisma.featureFlagOverride.upsert({
    where: { flagId_tenantId: { flagId, tenantId: input.tenantId } },
    update: { value: input.value, createdBy: input.actorEmail, reason: input.reason },
    create: {
      id: randomUUID(),
      flagId,
      tenantId: input.tenantId,
      value: input.value,
      createdBy: input.actorEmail,
      reason: input.reason,
    },
  });
  await audit(
    input.actorEmail,
    'platform.flag.override_set',
    flagId,
    { tenantId: input.tenantId, value: input.value },
    input.reason
  );
  return override;
}

export async function removeOverride(overrideId: string, actor: string) {
  const override = await prisma.featureFlagOverride.findUnique({ where: { id: overrideId } });
  if (!override) throw new AppError(404, 'Override not found', 'NOT_FOUND');
  await prisma.featureFlagOverride.delete({ where: { id: overrideId } });
  await audit(actor, 'platform.flag.override_removed', override.flagId, {
    tenantId: override.tenantId,
  });
}

export async function killFlag(id: string, actor: string, reason: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) throw new AppError(404, 'Flag not found', 'NOT_FOUND');
  const updated = await prisma.featureFlag.update({
    where: { id },
    data: { status: 'killed', defaultValue: false },
  });
  await audit(actor, 'platform.flag.killed', id, undefined, reason);
  return updated;
}
