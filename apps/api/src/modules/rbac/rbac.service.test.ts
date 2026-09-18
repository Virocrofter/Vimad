/* apps/api/src/modules/rbac/rbac.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../common/prisma.js', () => ({
  prisma: {
    role: { findMany: vi.fn(), findFirst: vi.fn() },
    permission: { findMany: vi.fn() },
    user: { findFirst: vi.fn() },
    property: { findFirst: vi.fn() },
    roleAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  listRoles,
  listPermissions,
  listUserRoles,
  assignRole,
  removeRoleAssignment,
} from './rbac.service.js';

const mockRole = prisma.role as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockPermission = prisma.permission as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockProperty = prisma.property as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAssignment = prisma.roleAssignment as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => vi.clearAllMocks());

describe('listRoles', () => {
  it('returns platform-wide and tenant-scoped roles', async () => {
    mockRole.findMany.mockResolvedValue([{ id: 'r1' }]);

    await listRoles('t1');

    expect(mockRole.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ tenantId: null }, { tenantId: 't1' }],
    });
  });
});

describe('listPermissions', () => {
  it('orders permissions by category, resource, action', async () => {
    mockPermission.findMany.mockResolvedValue([]);

    await listPermissions();

    expect(mockPermission.findMany.mock.calls[0][0].orderBy).toEqual([
      { category: 'asc' },
      { resource: 'asc' },
      { action: 'asc' },
    ]);
  });
});

describe('listUserRoles', () => {
  it('throws 404 when the user is not in this tenant', async () => {
    mockUser.findFirst.mockResolvedValue(null);
    await expect(listUserRoles('u1', 't1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('returns the user role assignments with roles included', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockAssignment.findMany.mockResolvedValue([{ roleId: 'r1', role: { name: 'Manager' } }]);

    const result = await listUserRoles('u1', 't1');

    expect(mockAssignment.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 'u1' },
      include: { role: true },
    });
    expect(result).toHaveLength(1);
  });
});

describe('assignRole', () => {
  it('throws 404 when the user does not exist in the tenant', async () => {
    mockUser.findFirst.mockResolvedValue(null);
    await expect(assignRole('u1', 't1', { roleId: 'r1' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 when the role is not visible to the tenant', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockRole.findFirst.mockResolvedValue(null);

    await expect(assignRole('u1', 't1', { roleId: 'r1' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Role not found',
    });

    expect(mockRole.findFirst.mock.calls[0][0].where).toEqual({
      id: 'r1',
      OR: [{ tenantId: null }, { tenantId: 't1' }],
    });
  });

  it('throws 404 when the scoped property does not belong to the tenant', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockRole.findFirst.mockResolvedValue({ id: 'r1' });
    mockProperty.findFirst.mockResolvedValue(null);

    await expect(assignRole('u1', 't1', { roleId: 'r1', propertyId: 'p1' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Property not found',
    });
  });

  it('rejects a duplicate assignment for the same user, role and property', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockRole.findFirst.mockResolvedValue({ id: 'r1' });
    mockAssignment.findFirst.mockResolvedValue({ id: 'a1' });

    await expect(assignRole('u1', 't1', { roleId: 'r1' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockAssignment.findFirst.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      roleId: 'r1',
      propertyId: null,
    });
  });

  it('creates the assignment and records who assigned it', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockRole.findFirst.mockResolvedValue({ id: 'r1' });
    mockProperty.findFirst.mockResolvedValue({ id: 'p1' });
    mockAssignment.findFirst.mockResolvedValue(null);
    mockAssignment.create.mockResolvedValue({ id: 'a1', role: { id: 'r1' } });

    const result = await assignRole('u1', 't1', { roleId: 'r1', propertyId: 'p1' }, 'admin1');

    expect(mockAssignment.create.mock.calls[0][0].data).toEqual({
      userId: 'u1',
      roleId: 'r1',
      propertyId: 'p1',
      assignedBy: 'admin1',
    });
    expect(result.id).toBe('a1');
  });
});

describe('removeRoleAssignment', () => {
  it('throws 404 when the user does not exist in the tenant', async () => {
    mockUser.findFirst.mockResolvedValue(null);
    await expect(removeRoleAssignment('u1', 't1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 when no matching assignment was removed', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockAssignment.deleteMany.mockResolvedValue({ count: 0 });

    await expect(removeRoleAssignment('u1', 't1', 'r1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Role assignment not found',
    });
  });

  it('removes the tenant-wide assignment (propertyId null) and returns the count', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockAssignment.deleteMany.mockResolvedValue({ count: 1 });

    const result = await removeRoleAssignment('u1', 't1', 'r1');

    expect(mockAssignment.deleteMany.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      roleId: 'r1',
      propertyId: null,
    });
    expect(result).toEqual({ removed: 1 });
  });
});
