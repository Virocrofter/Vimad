/* apps/api/src/modules/chains/chains.service.ts — C1
 * Chain model + property switcher. A chain groups a tenant's properties;
 * the switcher choice is sticky per user (User.lastPropertyId) and rides
 * the x-property-id header from the app shell.
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const chainCreateSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, dashes'),
  status: z.enum(['active', 'archived']).default('active'),
});

export const chainUpdateSchema = chainCreateSchema.partial();

export type ChainCreateInput = z.infer<typeof chainCreateSchema>;
export type ChainUpdateInput = z.infer<typeof chainUpdateSchema>;

// Roles that can see every property in the tenant without assignments.
const ELEVATED_ROLES = ['owner', 'admin', 'manager', 'chain_admin'];

/**
 * Property access for the switcher.
 * Returns null = unrestricted (all tenant properties), or an allow-list.
 * Non-elevated users see only properties from their role assignments;
 * with no assignments they fall through to all (safe legacy behaviour).
 */
export async function accessiblePropertyIds(
  _tenantId: string,
  userId: string,
  role: string
): Promise<string[] | null> {
  if (ELEVATED_ROLES.includes(role)) return null;

  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, propertyId: { not: null } },
    select: { propertyId: true },
  });
  const ids = [...new Set(assignments.map((a) => a.propertyId!))];
  return ids.length > 0 ? ids : null;
}

async function assertPropertyAccess(
  tenantId: string,
  userId: string,
  role: string,
  propertyId: string
): Promise<void> {
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');

  const allowed = await accessiblePropertyIds(tenantId, userId, role);
  if (allowed !== null && !allowed.includes(propertyId)) {
    throw new AppError(403, 'You do not have access to this property', 'FORBIDDEN');
  }
}

// ─── Chains CRUD ───

export async function listChains(tenantId: string) {
  return prisma.chain.findMany({
    where: { tenantId },
    include: {
      _count: { select: { properties: true } },
      properties: { select: { id: true, name: true, code: true, city: true, status: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createChain(tenantId: string, input: ChainCreateInput) {
  const existing = await prisma.chain.findFirst({
    where: { tenantId, slug: input.slug },
  });
  if (existing) throw new AppError(409, 'Chain slug already exists', 'CONFLICT');
  return prisma.chain.create({ data: { tenantId, ...input } });
}

export async function updateChain(tenantId: string, id: string, input: ChainUpdateInput) {
  const existing = await prisma.chain.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Chain not found', 'NOT_FOUND');
  return prisma.chain.update({ where: { id }, data: input });
}

export async function attachProperty(tenantId: string, chainId: string, propertyId: string) {
  const chain = await prisma.chain.findFirst({ where: { id: chainId, tenantId } });
  if (!chain) throw new AppError(404, 'Chain not found', 'NOT_FOUND');
  await assertPropertyAccess(tenantId, '', 'owner', propertyId); // tenant-existence check
  return prisma.property.update({
    where: { id: propertyId },
    data: { chainId },
  });
}

export async function detachProperty(tenantId: string, propertyId: string) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  return prisma.property.update({ where: { id: propertyId }, data: { chainId: null } });
}

// ─── Switcher scope ───

export async function getScope(tenantId: string, userId: string, role: string) {
  const allowed = await accessiblePropertyIds(tenantId, userId, role);

  const properties = await prisma.property.findMany({
    where: { tenantId, ...(allowed !== null ? { id: { in: allowed } } : {}) },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      status: true,
      chainId: true,
      _count: { select: { rooms: true, reservations: true } },
    },
    orderBy: { code: 'asc' },
  });

  const chains = await prisma.chain.findMany({
    where: { tenantId },
    include: { _count: { select: { properties: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  const currentPropertyId =
    user?.lastPropertyId && properties.some((p) => p.id === user.lastPropertyId)
      ? user.lastPropertyId
      : null;

  return { properties, chains, currentPropertyId };
}

export async function setCurrentProperty(
  tenantId: string,
  userId: string,
  role: string,
  propertyId: string | null
) {
  if (propertyId !== null) {
    await assertPropertyAccess(tenantId, userId, role, propertyId);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { lastPropertyId: propertyId },
  });
  return { currentPropertyId: propertyId };
}
