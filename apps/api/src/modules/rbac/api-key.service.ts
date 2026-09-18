import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  expiresInDays: z.number().int().min(1).optional(),
});

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>;

export interface ApiKeyContext {
  id: string;
  tenantId: string;
  name: string;
  scopes: string[];
}

const KEY_PREFIX_LENGTH = 8;

function hashKey(key: string): string {
  return createHmac('sha256', process.env.JWT_SECRET ?? 'dev-secret')
    .update(key)
    .digest('hex');
}

export async function validateApiKey(apiKeyHeader: string): Promise<ApiKeyContext> {
  const [prefix, secret] = apiKeyHeader.split('.');
  if (!prefix || !secret) {
    throw new AppError(401, 'Invalid API key format', 'UNAUTHORIZED');
  }

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyPrefix: prefix,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!apiKey) {
    throw new AppError(401, 'Invalid or revoked API key', 'UNAUTHORIZED');
  }

  const hashed = hashKey(apiKeyHeader);
  const expected = Buffer.from(apiKey.keyHash);
  const given = Buffer.from(hashed);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new AppError(401, 'Invalid API key', 'UNAUTHORIZED');
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return {
    id: apiKey.id,
    tenantId: apiKey.tenantId,
    name: apiKey.name,
    scopes: apiKey.scopes,
  };
}

export async function createApiKey(tenantId: string, input: ApiKeyCreateInput) {
  const rawKey = `${randomBytes(4).toString('hex')}.${randomBytes(16).toString('hex')}`;
  const prefix = rawKey.slice(0, KEY_PREFIX_LENGTH);
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name: input.name,
      keyHash,
      keyPrefix: prefix,
      scopes: input.scopes,
      status: 'active',
      environment: 'production',
      expiresAt: input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  return { apiKey, rawKey: `${prefix}.${rawKey.split('.')[1]}` };
}

export async function listApiKeys(tenantId: string) {
  return prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      status: true,
      environment: true,
      rateLimit: true,
      expiresAt: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function revokeApiKey(tenantId: string, id: string, reason?: string) {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id, tenantId },
  });
  if (!apiKey) {
    throw new AppError(404, 'API key not found', 'NOT_FOUND');
  }

  return prisma.apiKey.update({
    where: { id },
    data: {
      status: 'revoked',
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
}
