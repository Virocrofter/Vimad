/* apps/api/src/modules/auth/auth.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Mock prisma before importing the service ───
vi.mock('../../common/prisma.js', () => ({
  prisma: {
    tenant: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
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

  it('returns a signed token on success', async () => {
    mockTenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    mockUser.findUnique.mockResolvedValue(fakeUser());

    const result = await login(input);
    const payload = verifyToken(result.token);

    expect(payload.userId).toBe('user-1');
    expect(payload.tenantId).toBe('tenant-1');
    expect(payload.role).toBe('owner');
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

  it('refreshAccessToken rotates tokens for active users', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser());
    const refresh = generateRefreshToken('user-1');

    const result = await refreshAccessToken(refresh);
    expect(result.token).toBeTruthy();
    // The rotated refresh token is itself a valid refresh token for the same
    // user. (Don't assert token inequality: JWTs signed within the same
    // second from the same payload are byte-identical.)
    const rotated = jwt.decode(result.refreshToken) as { userId: string; type: string } | null;
    expect(rotated).toMatchObject({ userId: 'user-1', type: 'refresh' });
  });

  it('refreshAccessToken rejects access tokens used as refresh tokens', async () => {
    const accessToken = signToken({
      userId: 'user-1',
      tenantId: 't1',
      email: 'a@b.c',
      role: 'owner',
    });
    await expect(refreshAccessToken(accessToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('refreshAccessToken rejects tokens for deleted users', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser({ status: 'deleted' }));
    await expect(refreshAccessToken(generateRefreshToken('user-1'))).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
