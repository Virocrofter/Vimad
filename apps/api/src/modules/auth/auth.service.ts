/* apps/api/src/modules/auth/auth.service.ts */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { env } from '../../common/env.js';

const JWT_EXPIRES_IN = '15m' as const;

const JWT_SECRET = env.JWT_SECRET;

/* ─── Token hashing for DB storage ─── */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const registerSchema = z.object({
  tenantName: z.string().min(1),
  tenantSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  ownerFirstName: z.string().optional(),
  ownerLastName: z.string().optional(),
});

export const loginSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string().min(1),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

/* ─── REGISTER: Auto-create RoleAssignment for Owner role ─── */
export async function register(input: RegisterInput) {
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
  });
  if (existingTenant) {
    throw new AppError(409, 'Tenant slug already exists', 'CONFLICT');
  }

  const hashedPassword = await bcrypt.hash(input.ownerPassword, 10);

  // Create tenant + owner user in a transaction
  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenantName,
      slug: input.tenantSlug,
      users: {
        create: {
          email: input.ownerEmail,
          passwordHash: hashedPassword,
          firstName: input.ownerFirstName,
          lastName: input.ownerLastName,
          role: 'owner',
          status: 'active',
        },
      },
    },
    include: { users: true },
  });

  const owner = tenant.users[0];

  // ─── AUTO: Create RoleAssignment for Owner ───
  // Look up the system "Owner" role and assign it to the new user
  const ownerRole = await prisma.role.findFirst({
    where: { name: 'Owner', tenantId: null },
  });

  if (ownerRole) {
    await prisma.roleAssignment.create({
      data: {
        userId: owner.id,
        roleId: ownerRole.id,
        assignedBy: owner.id,
      },
    });
  }

  const token = signToken({
    userId: owner.id,
    tenantId: tenant.id,
    email: owner.email,
    role: owner.role,
  });
  const refreshToken = await generateRefreshToken(owner.id);

  return {
    token,
    refreshToken,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    user: {
      id: owner.id,
      email: owner.email,
      firstName: owner.firstName,
      lastName: owner.lastName,
      role: owner.role,
    },
  };
}

export async function login(input: LoginInput) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
  });
  if (!tenant) {
    throw new AppError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
  });

  if (!user || user.status !== 'active') {
    throw new AppError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash ?? '');
  if (!valid) {
    throw new AppError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken(user.id);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    },
  };
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/* ─── REFRESH TOKEN: DB-persisted with revocation support ─── */
export async function generateRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(raw);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return raw;
}

export async function refreshAccessToken(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!stored || !stored.user || stored.user.status !== 'active') {
    throw new AppError(401, 'Invalid or expired refresh token', 'UNAUTHORIZED');
  }

  // Rotate: revoke old, create new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), revokedReason: 'rotated' },
  });

  const token = signToken({
    userId: stored.user.id,
    tenantId: stored.user.tenantId,
    email: stored.user.email,
    role: stored.user.role,
  });

  const newRefreshToken = await generateRefreshToken(stored.user.id);

  return {
    token,
    refreshToken: newRefreshToken,
    user: {
      id: stored.user.id,
      email: stored.user.email,
      firstName: stored.user.firstName,
      lastName: stored.user.lastName,
      role: stored.user.role,
      tenantId: stored.user.tenantId,
    },
  };
}

export async function revokeRefreshToken(rawToken: string, reason?: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date(), revokedReason: reason ?? 'manual_revocation' },
  });
}

export async function revokeAllUserRefreshTokens(userId: string, reason?: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason ?? 'password_change' },
  });
}

/* ─── PASSWORD RESET ─── */
export async function requestPasswordReset(email: string, tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    // Silent fail: don't leak which tenants exist
    return { sent: false };
  }

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (!user || user.status !== 'active') {
    return { sent: false };
  }

  // Invalidate any existing unused reset tokens
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() }, // mark as used to invalidate
  });

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // TODO: Send email with reset link
  // await sendPasswordResetEmail(user.email, rawToken);

  return { sent: true, token: rawToken }; // Return token for testing; remove in production
}

export async function confirmPasswordReset(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);

  const reset = await prisma.passwordReset.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!reset) {
    throw new AppError(400, 'Invalid or expired reset token', 'RESET_TOKEN_INVALID');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all refresh tokens for this user
    prisma.refreshToken.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'password_reset' },
    }),
  ]);

  return { success: true };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Current password is incorrect', 'UNAUTHORIZED');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'password_change' },
    }),
  ]);

  return { success: true };
}
