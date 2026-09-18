/* apps/api/tests/e2e/auth-flow.test.ts
 * End-to-end tests for authentication flows:
 *   - Registration
 *   - Login
 *   - Token refresh
 *   - Permission-based access control
 *   - API key authentication
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { pushTestSchema, truncateAllTables } from '../helpers/prisma.js';
import { buildTestApp } from '../helpers/server.js';

const app = buildTestApp();

const RUN_DB_TESTS = !!(process.env.TEST_DATABASE_URL ?? process.env.RUN_DB_TESTS);

describe.skipIf(!RUN_DB_TESTS)('Authentication Flow E2E', () => {
  beforeAll(() => {
    pushTestSchema();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it('registers a new tenant with owner user', async () => {
    const res = await request(app).post('/auth/register').send({
      tenantName: 'Test Hotel Chain',
      tenantSlug: 'test-hotel-chain',
      ownerEmail: 'owner@hotel.test',
      ownerPassword: 'SecurePass123!',
      ownerFirstName: 'John',
      ownerLastName: 'Owner',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      token: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email: 'owner@hotel.test',
        role: 'owner',
        firstName: 'John',
        lastName: 'Owner',
      },
      tenant: {
        name: 'Test Hotel Chain',
        slug: 'test-hotel-chain',
      },
    });
    expect(res.body.data.token).toMatch(/^eyJ/); // JWT format
  });

  it('rejects duplicate tenant slug', async () => {
    await request(app).post('/auth/register').send({
      tenantName: 'First Hotel',
      tenantSlug: 'duplicate-slug',
      ownerEmail: 'first@hotel.test',
      ownerPassword: 'SecurePass123!',
    });

    const res = await request(app).post('/auth/register').send({
      tenantName: 'Second Hotel',
      tenantSlug: 'duplicate-slug',
      ownerEmail: 'second@hotel.test',
      ownerPassword: 'SecurePass123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('logs in with valid credentials', async () => {
    // Register first
    await request(app).post('/auth/register').send({
      tenantName: 'Login Test Hotel',
      tenantSlug: 'login-test',
      ownerEmail: 'login@hotel.test',
      ownerPassword: 'MyPassword456!',
    });

    const res = await request(app).post('/auth/login').send({
      tenantSlug: 'login-test',
      email: 'login@hotel.test',
      password: 'MyPassword456!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe('login@hotel.test');
    expect(res.body.data.user.role).toBe('owner');
  });

  it('rejects invalid login credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      tenantSlug: 'nonexistent',
      email: 'nobody@nowhere.test',
      password: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects wrong password', async () => {
    await request(app).post('/auth/register').send({
      tenantName: 'Wrong Pass Hotel',
      tenantSlug: 'wrong-pass',
      ownerEmail: 'wrong@hotel.test',
      ownerPassword: 'CorrectPass789!',
    });

    const res = await request(app).post('/auth/login').send({
      tenantSlug: 'wrong-pass',
      email: 'wrong@hotel.test',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('refreshes access token with valid refresh token', async () => {
    const registerRes = await request(app).post('/auth/register').send({
      tenantName: 'Refresh Hotel',
      tenantSlug: 'refresh-test',
      ownerEmail: 'refresh@hotel.test',
      ownerPassword: 'RefreshPass123!',
    });

    const refreshToken = registerRes.body.data.refreshToken;

    const res = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.id).toBe(registerRes.body.data.user.id);
  });

  it('rejects invalid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects access token used as refresh token', async () => {
    const registerRes = await request(app).post('/auth/register').send({
      tenantName: 'Token Swap Hotel',
      tenantSlug: 'token-swap',
      ownerEmail: 'swap@hotel.test',
      ownerPassword: 'SwapPass123!',
    });

    const accessToken = registerRes.body.data.token;

    const res = await request(app).post('/auth/refresh').send({ refreshToken: accessToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('enforces tenant isolation — cannot access other tenant data', async () => {
    // Register two tenants
    const tenantA = await request(app).post('/auth/register').send({
      tenantName: 'Hotel A',
      tenantSlug: 'hotel-a',
      ownerEmail: 'a@hotel.test',
      ownerPassword: 'PassA123!',
    });

    const tenantB = await request(app).post('/auth/register').send({
      tenantName: 'Hotel B',
      tenantSlug: 'hotel-b',
      ownerEmail: 'b@hotel.test',
      ownerPassword: 'PassB123!',
    });

    // Tenant A creates a guest
    const guestRes = await request(app)
      .post('/v1/guests')
      .set('Authorization', `Bearer ${tenantA.body.data.token}`)
      .send({ firstName: 'Alice', lastName: 'TenantA' });
    const guestId = guestRes.body.data.id;

    // Tenant B tries to access Tenant A's guest
    const res = await request(app)
      .get(`/v1/guests/${guestId}`)
      .set('Authorization', `Bearer ${tenantB.body.data.token}`);

    expect(res.status).toBe(404); // Not found (tenant-scoped)
  });

  it('rate-limits login attempts', async () => {
    await request(app).post('/auth/register').send({
      tenantName: 'Rate Limit Hotel',
      tenantSlug: 'rate-limit',
      ownerEmail: 'rate@hotel.test',
      ownerPassword: 'RatePass123!',
    });

    // Make multiple failed login attempts
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request(app).post('/auth/login').send({
          tenantSlug: 'rate-limit',
          email: 'rate@hotel.test',
          password: 'wrong-password',
        })
      );
    }

    const results = await Promise.all(attempts);
    const rateLimited = results.some((r) => r.status === 429);
    expect(rateLimited).toBe(true);
  });
});
