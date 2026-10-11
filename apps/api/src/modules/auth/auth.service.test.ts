/* apps/api/src/modules/auth/auth.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// ─── Mock prisma before importing the service ───
vi.mock('../../common/prisma.js', () => ({
  prisma: {
    tenant: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    role: { findFirst: vi.fn() },
    roleAssignment: { create: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordReset: { updateMany: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../../common/prisma.js';
import {
  register,
  login,
  signToken,
  verifyToken,
  generateRefreshToken,
  refreshAccessToken,
} from './auth.service.js';

const mockTenant = prisma.tenant as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};
const mockUser = prisma.user as unknown as { findUnique: ReturnType<typeof vi.fn> };
const mockRole = prisma.role as unknown as { findFirst: ReturnType<typeof vi.fn> };
const mockRoleAssignment = prisma.roleAssignment as unknown as {
  create: ReturnType<typeof vi.fn>;
};
const mockRefreshToken = prisma.refreshToken as unknown as Record<string, ReturnType<typeof vi.fn>>;

const baseRegisterInput = {
  tenantName: 'Test Hotel Group',
  tenantSlug: 'test-hotel',
  ownerEmail: 'owner@test.com',
  ownerPassword: 'supersecret1',
  ownerFirstName: 'Ada',
  ownerLastName: 'Lovelace',
};

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'owner@test.com',
    passwordHash: bcrypt.hashSync('supersecret1', 4), // low rounds for test speed
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'owner',
    status: 'active',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('register', () => {
  it('rejects a duplicate tenant slug with 409', async () => {
    mockTenant.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(register(baseRegisterInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
    expect(mockTenant.create).not.toHaveBeenCalled();
  });

  it('creates tenant + owner and returns tokens', async () => {
    mockTenant.findUnique.mockResolvedValue(null);
    mockTenant.create.mockResolvedValue({
      id: 'tenant-1',
      name: 'Test Hotel Group',
      slug: 'test-hotel',
      users: [fakeUser()],
    });
    // No global 'Owner' role seeded in this mock → role assignment is skipped
    mockRole.findFirst.mockResolvedValue(null);
    mockRefreshToken.create.mockResolvedValue({ id: 'rt1' });

    const result = await register(baseRegisterInput);

    expect(result.tenant.slug).toBe('test-hotel');
    expect(result.user.role).toBe('owner');
    expect(result.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();

    // Password must be hashed, never stored raw
    const createArgs = mockTenant.create.mock.calls[0][0];
    expect(createArgs.data.users.create.passwordHash).not.toContain('supersecret1');
    expect(createArgs.data.users.create.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('assigns the global Owner role when it exists', async () => {
    mockTenant.findUnique.mockResolvedValue(null);
    mockTenant.create.mockResolvedValue({
      id: 'tenant-1',
      name: 'Test Hotel Group',
      slug: 'test-hotel',
      users: [fakeUser()],
    });
    mockRole.findFirst.mockResolvedValue({ id: 'role-owner' });
    mockRoleAssignment.create.mockResolvedValue({ id: 'ra1' });
    mockRefreshToken.create.mockResolvedValue({ id: 'rt1' });

    await register(baseRegisterInput);

    expect(mockRoleAssignment.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', roleId: 'role-owner', assignedBy: 'user-1' },
    });
  });
});

describe('login', () => {
  const input = { tenantSlug: 'test-hotel', email: 'owner@test.com', password: 'supersecret1' };

  it('rejects unknown tenant', async () => {
    mockTenant.findUnique.mockResolvedValue(null);
    await expect(login(input)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects inactive users', async () => {
    mockTenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    mockUser.findUnique.mockResolvedValue(fakeUser({ status: 'deleted' }));
    await expect(login(input)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects wrong password', async () => {
    mockTenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    mockUser.findUnique.mockResolvedValue(fakeUser());
    await expect(login({ ...input, password: 'wrong-password' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('returns a signed token and a persisted refresh token on success', async () => {
    mockTenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    mockUser.findUnique.mockResolvedValue(fakeUser());
    mockRefreshToken.create.mockResolvedValue({ id: 'rt1' });

    const result = await login(input);
    const payload = verifyToken(result.token);

    expect(payload.userId).toBe('user-1');
    expect(payload.tenantId).toBe('tenant-1');
    expect(payload.role).toBe('owner');
    expect(result.refreshToken).toBeTruthy();
    expect(mockRefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          expiresAt: expect.any(Date),
        }),
      })
    );
  });
});

describe('tokens', () => {
  it('signToken/verifyToken round-trips the payload', () => {
    const token = signToken({
      userId: 'u1',
      tenantId: 't1',
      email: 'a@b.c',
      role: 'owner',
    });
    expect(verifyToken(token)).toMatchObject({ userId: 'u1', tenantId: 't1' });
  });

  it('verifyToken rejects tampered tokens', () => {
    const token = signToken({ userId: 'u1', tenantId: 't1', email: 'a@b.c', role: 'owner' });
    expect(() => verifyToken(token.slice(0, -4) + 'xxxx')).toThrow();
  });

  it('generateRefreshToken persists a hashed token and returns the raw secret', async () => {
    mockRefreshToken.create.mockResolvedValue({ id: 'rt1' });

    const raw = await generateRefreshToken('user-1');

    expect(typeof raw).toBe('string');
    expect(raw.length).toBeGreaterThan(20);
    const { createHash } = await import('crypto');
    const stored = mockRefreshToken.create.mock.calls[0][0].data.tokenHash;
    expect(stored).toBe(createHash('sha256').update(raw).digest('hex'));
    expect(stored).not.toContain(raw);
  });

  it('refreshAccessToken rotates tokens for active users', async () => {
    mockRefreshToken.findFirst.mockResolvedValue({ id: 'rt1', user: fakeUser() });
    mockRefreshToken.update.mockResolvedValue({ id: 'rt1' });
    mockRefreshToken.create.mockResolvedValue({ id: 'rt2' });

    const result = await refreshAccessToken('any-raw-refresh-token');

    expect(result.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(verifyToken(result.token).userId).toBe('user-1');

    // Old token revoked, new one persisted
    expect(mockRefreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    );
    expect(mockRefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) })
    );
  });

  it('refreshAccessToken rejects access tokens used as refresh tokens', async () => {
    mockRefreshToken.findFirst.mockResolvedValue(null);
    const accessToken = signToken({
      userId: 'user-1',
      tenantId: 't1',
      email: 'a@b.c',
      role: 'owner',
    });
    await expect(refreshAccessToken(accessToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('refreshAccessToken rejects tokens for deleted users', async () => {
    mockRefreshToken.findFirst.mockResolvedValue({
      id: 'rt1',
      user: fakeUser({ status: 'deleted' }),
    });
    await expect(refreshAccessToken('any-raw-refresh-token')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
