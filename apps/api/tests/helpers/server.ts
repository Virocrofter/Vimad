/* apps/api/tests/helpers/server.ts */
import type { Express } from 'express';
import { app } from '../../src/index.js';
import request from 'supertest';

export interface TestTenant {
  token: string;
  refreshToken: string;
  tenantId: string;
  userId: string;
  email: string;
}

/**
 * Build the test app. In integration mode this is the real Express app.
 */
export function buildTestApp(): Express {
  return app;
}

/**
 * Register a test tenant and return auth credentials.
 * This creates a real tenant + owner user in the database.
 */
export async function registerTestAgent(appInstance: Express): Promise<TestTenant> {
  const slug = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const res = await request(appInstance)
    .post('/auth/register')
    .send({
      tenantName: 'Test Hotel',
      tenantSlug: slug,
      ownerEmail: `owner-${slug}@test.com`,
      ownerPassword: 'TestPass123!',
      ownerFirstName: 'Test',
      ownerLastName: 'Owner',
    });

  if (res.status !== 201) {
    throw new Error(`Failed to register test tenant: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    refreshToken: res.body.data.refreshToken,
    tenantId: res.body.data.tenant.id,
    userId: res.body.data.user.id,
    email: res.body.data.user.email,
  };
}

// Backward-compatible alias
export const registerTestTenant = registerTestAgent;

/**
 * Login an existing test user.
 */
export async function loginTestUser(
  appInstance: Express,
  tenantSlug: string,
  email: string,
  password: string
): Promise<{ token: string; userId: string }> {
  const res = await request(appInstance).post('/auth/login').send({ tenantSlug, email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    userId: res.body.data.user.id,
  };
}
