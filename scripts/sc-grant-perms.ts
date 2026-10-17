/* scripts/sc-grant-perms.ts — grant S&C permissions to system roles (idempotent) */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SC_PERMS: [string, string][] = [
  ['sc_client', 'create'],
  ['sc_client', 'read'],
  ['sc_client', 'update'],
  ['sc_client', 'delete'],
  ['sc_event', 'create'],
  ['sc_event', 'read'],
  ['sc_event', 'update'],
  ['sc_event', 'delete'],
  ['sc_beo', 'read'],
  ['sc_beo', 'manage'],
  ['sc_beo', 'approve'],
  ['sc_beo', 'sign'],
  ['sc_catalog', 'manage'],
];
const STAFF_PERMS: [string, string][] = [
  ['sc_client', 'read'],
  ['sc_event', 'read'],
  ['sc_beo', 'read'],
];

async function grant(roleName: string, keys: [string, string][]) {
  const role = await prisma.role.findFirst({ where: { name: roleName, tenantId: null } });
  if (!role) {
    console.log(`role missing: ${roleName}`);
    return;
  }
  let n = 0;
  for (const [resource, action] of keys) {
    const perm = await prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });
    if (!perm) {
      console.log(`perm missing: ${resource}:${action}`);
      continue;
    }
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
    n++;
  }
  console.log(`${roleName}: ${n} S&C permissions granted`);
}

await grant('Admin', SC_PERMS);
await grant('Manager', SC_PERMS);
await grant('Staff', STAFF_PERMS);
const owner = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
console.log(
  `Owner: ${owner ? await prisma.rolePermission.count({ where: { roleId: owner.id } }) : 'missing'} total permissions`
);
await prisma.$disconnect();
