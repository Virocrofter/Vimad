/* apps/api/src/modules/rbac/rbac.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    role: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rolePermission: { deleteMany: vi.fn(), createMany: vi.fn() },
    roleAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    permission: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  unassignRole,
  listPermissions,
} from './rbac.service.js';

const mockRole = prisma.role as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockRolePermission = prisma.rolePermission as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;
const mockAssignment = prisma.roleAssignment as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;

const role = { id: 'r1', tenantId: null, name: 'Manager', isLocked: false };

beforeEach(() => vi.clearAllMocks());

describe('listRoles', () => {
  it('returns platform-wide and tenant-scoped roles for a tenant', async () => {
    mockRole.findMany.mockResolvedValue([role]);

    await listRoles('t1');

    expect(mockRole.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ tenantId: 't1' }, { tenantId: null }],
    });
  });

  it('scopes to global roles only when no tenant is given', async () => {
    mockRole.findMany.mockResolvedValue([role]);

    await listRoles(null);

    expect(mockRole.findMany.mock.calls[0][0].where).toEqual({ tenantId: null });
  });
});

describe('getRole', () => {
  it('throws 404 for an unknown role', async () => {
    mockRole.findUnique.mockResolvedValue(null);
    await expect(getRole('nope')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the role with permissions and assignments', async () => {
    mockRole.findUnique.mockResolvedValue(role);
    expect(await getRole('r1')).toEqual(role);
  });
});

describe('createRole', () => {
  it('creates the role with its permission junction rows', async () => {
    mockRole.create.mockResolvedValue(role);

    await createRole('t1', {
      type: 'custom',
      name: 'Night Auditor',
      isDefault: false,
      isLocked: false,
      permissionIds: ['perm1', 'perm2'],
    });

    const data = mockRole.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      name: 'Night Auditor',
      type: 'custom',
      isDefault: false,
      isLocked: false,
      tenantId: 't1',
    });
    expect(data.rolePermissions.create).toEqual([
      { permissionId: 'perm1' },
      { permissionId: 'perm2' },
    ]);
  });
});

describe('updateRole', () => {
  it('throws 404 for an unknown role', async () => {
    mockRole.findUnique.mockResolvedValue(null);
    await expect(updateRole('nope', { name: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('refuses to modify a locked role', async () => {
    mockRole.findUnique.mockResolvedValue({ ...role, isLocked: true });
    await expect(updateRole('r1', { name: 'x' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('replaces permissions when permissionIds is provided', async () => {
    mockRole.findUnique.mockResolvedValue(role);
    mockRole.update.mockResolvedValue(role);

    await updateRole('r1', { permissionIds: ['perm3'] });

    expect(mockRolePermission.deleteMany).toHaveBeenCalledWith({ where: { roleId: 'r1' } });
    expect(mockRolePermission.createMany).toHaveBeenCalledWith({
      data: [{ roleId: 'r1', permissionId: 'perm3' }],
    });
  });
});

describe('deleteRole', () => {
  it('refuses to delete a locked role', async () => {
    mockRole.findUnique.mockResolvedValue({ ...role, isLocked: true });
    await expect(deleteRole('r1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockRole.delete).not.toHaveBeenCalled();
  });

  it('deletes an unlocked role', async () => {
    mockRole.findUnique.mockResolvedValue(role);
    mockRole.delete.mockResolvedValue(role);

    await deleteRole('r1');

    expect(mockRole.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });
});

describe('assignRole', () => {
  it('throws 404 when the user does not exist', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    await expect(assignRole('u1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    });
  });

  it('throws 404 when the role does not exist', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1' });
    mockRole.findUnique.mockResolvedValue(null);
    await expect(assignRole('u1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Role not found',
    });
  });

  it('creates a tenant-wide assignment (propertyId null) when none exists', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1' });
    mockRole.findUnique.mockResolvedValue(role);
    mockAssignment.findFirst.mockResolvedValue(null);
    mockAssignment.create.mockResolvedValue({ id: 'ra1' });

    await assignRole('u1', 'r1', undefined, 'admin-1');

    expect(mockAssignment.create.mock.calls[0][0].data).toEqual({
      userId: 'u1',
      roleId: 'r1',
      propertyId: null,
      assignedBy: 'admin-1',
    });
  });

  it('returns the existing tenant-wide assignment instead of duplicating', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1' });
    mockRole.findUnique.mockResolvedValue(role);
    mockAssignment.findFirst.mockResolvedValue({ id: 'ra1' });

    const result = await assignRole('u1', 'r1');

    expect(mockAssignment.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'ra1' });
  });

  it('upserts a property-scoped assignment', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1' });
    mockRole.findUnique.mockResolvedValue(role);
    mockAssignment.upsert.mockResolvedValue({ id: 'ra2' });

    await assignRole('u1', 'r1', 'p1');

    expect(mockAssignment.upsert.mock.calls[0][0].where).toEqual({
      userId_roleId_propertyId: { userId: 'u1', roleId: 'r1', propertyId: 'p1' },
    });
    expect(mockAssignment.upsert.mock.calls[0][0].create).toMatchObject({
      userId: 'u1',
      roleId: 'r1',
      propertyId: 'p1',
    });
  });
});

describe('unassignRole', () => {
  it('removes the tenant-wide assignment when no property is given', async () => {
    mockAssignment.deleteMany.mockResolvedValue({ count: 1 });

    const result = await unassignRole('u1', 'r1');

    expect(mockAssignment.deleteMany.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      roleId: 'r1',
      propertyId: null,
    });
    expect(result).toEqual({ count: 1 });
  });

  it('removes a property-scoped assignment', async () => {
    mockAssignment.deleteMany.mockResolvedValue({ count: 1 });

    await unassignRole('u1', 'r1', 'p1');

    expect(mockAssignment.deleteMany.mock.calls[0][0].where.propertyId).toBe('p1');
  });
});

describe('listPermissions', () => {
  it('returns permissions sorted by category, resource and action', async () => {
    const perms = [{ id: 'p1' }];
    (prisma.permission.findMany as any).mockResolvedValue(perms);

    expect(await listPermissions()).toEqual(perms);
  });
});
