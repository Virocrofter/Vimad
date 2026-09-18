/* apps/api/tests/helpers/prisma.ts
 * Test database helpers for integration tests.
 *
 * Integration tests are skipped automatically when no database is reachable
 * (e.g. local dev without Postgres), so `npm test` always passes. CI provides
 * TEST_DATABASE_URL and runs them for real.
 */
import { execSync } from 'node:child_process';
import { prisma } from '../../src/common/prisma.js';

/** Returns true when the configured database accepts connections. */
export async function canConnectToDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Pushes the Prisma schema to the test database (idempotent — no migration
 * history required for ephemeral test DBs).
 */
export function pushTestSchema(): void {
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'inherit',
  });
}

/** Truncates every table in the public schema. */
export async function truncateAllTables(): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  if (tables.length === 0) return;
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`
  );
}

/**
 * Grants a user wildcard permissions by wiring a '*:*' permission through a
 * tenant role + role assignment (mirrors what seedPermissionsAndRoles does
 * for admins, without needing the seed data).
 */
export async function grantAllPermissions(userId: string, tenantId: string): Promise<void> {
  const permission = await prisma.permission.upsert({
    where: { resource_action: { resource: '*', action: '*' } },
    update: {},
    create: { resource: '*', action: '*', description: 'Wildcard (test)', category: 'test' },
  });

  const role = await prisma.role.create({
    data: { name: 'test-admin', type: 'custom', tenantId },
  });

  await prisma.rolePermission.create({
    data: { roleId: role.id, permissionId: permission.id },
  });

  await prisma.roleAssignment.create({
    data: { userId, roleId: role.id, assignedBy: userId },
  });
}
