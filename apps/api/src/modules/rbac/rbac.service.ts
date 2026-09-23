import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const roleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['system', 'custom']).default('custom'),
  isDefault: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  permissionIds: z.array(z.string()).default([]),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

export async function listRoles(tenantId: string | null) {
  const where = tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : { tenantId: null };

  return prisma.role.findMany({
    where,
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: {
        select: { roleAssignments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      roleAssignments: {
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!role) {
    throw new AppError(404, 'Role not found', 'NOT_FOUND');
  }

  return role;
}

export async function createRole(tenantId: string | null, input: RoleCreateInput) {
  const { permissionIds, ...roleData } = input;

  return prisma.role.create({
    data: {
      ...roleData,
      tenantId,
      rolePermissions: {
        create: permissionIds.map((permissionId) => ({
          permissionId,
        })),
      },
    },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
}

export async function updateRole(id: string, input: RoleUpdateInput) {
  const { permissionIds, ...roleData } = input;

  const _existing = await prisma.role.findUnique({ where: { id } });
  if (!_existing) {
    throw new AppError(404, 'Role not found', 'NOT_FOUND');
  }

  if (_existing.isLocked) {
    throw new AppError(409, 'Cannot modify a locked role', 'CONFLICT');
  }

  // If permissionIds provided, replace all role permissions
  if (permissionIds) {
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      })),
    });
  }

  return prisma.role.update({
    where: { id },
    data: roleData,
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
}

export async function deleteRole(id: string) {
  const _existing = await prisma.role.findUnique({ where: { id } });
  if (!_existing) {
    throw new AppError(404, 'Role not found', 'NOT_FOUND');
  }

  if (_existing.isLocked) {
    throw new AppError(409, 'Cannot delete a locked role', 'CONFLICT');
  }

  return prisma.role.delete({ where: { id } });
}

export async function assignRole(
  userId: string,
  roleId: string,
  propertyId?: string,
  assignedBy?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found', 'NOT_FOUND');
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new AppError(404, 'Role not found', 'NOT_FOUND');
  }

  if (propertyId === undefined) {
    const existingAssignment = await prisma.roleAssignment.findFirst({
      where: { userId, roleId, propertyId: null },
    });

    return (
      existingAssignment ??
      prisma.roleAssignment.create({
        data: {
          userId,
          roleId,
          propertyId: null,
          assignedBy: assignedBy ?? null,
        },
      })
    );
  }

  return prisma.roleAssignment.upsert({
    where: {
      userId_roleId_propertyId: {
        userId,
        roleId,
        propertyId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
      propertyId,
      assignedBy: assignedBy ?? null,
    },
  });
}

export async function unassignRole(userId: string, roleId: string, propertyId?: string) {
  return prisma.roleAssignment.deleteMany({
    where: {
      userId,
      roleId,
      propertyId: propertyId ?? null,
    },
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ category: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
  });
}
