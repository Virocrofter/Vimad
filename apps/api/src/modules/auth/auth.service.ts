import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d' as const;

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export async function register(input: RegisterInput) {
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: input.tenantSlug },
  });
  if (existingTenant) {
    throw new AppError(409, 'Tenant slug already exists', 'CONFLICT');
  }

  const hashedPassword = await bcrypt.hash(input.ownerPassword, 10);

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
  const token = signToken({
    userId: owner.id,
    tenantId: tenant.id,
    email: owner.email,
    role: owner.role,
  });

  return {
    token,
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

  return {
    token,
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
