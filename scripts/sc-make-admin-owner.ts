/* scripts/sc-make-admin-owner.ts — give the dev admin user the Owner role (all 82 perms) */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo-hotel' } });
if (!tenant) throw new Error('demo tenant not found');
const user = await prisma.user.findUnique({
  where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
});
if (!user) throw new Error('admin@demo.com not found');
const owner = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
if (!owner) throw new Error('Owner role not found');

await prisma.roleAssignment.upsert({
  where: { userId_roleId_propertyId: { userId: user.id, roleId: owner.id, propertyId: '' as any } },
  update: {},
  create: { userId: user.id, roleId: owner.id },
});
const count = await prisma.rolePermission.count({ where: { roleId: owner.id } });
console.log(`admin@demo.com → Owner role assigned (${count} permissions effective)`);
await prisma.$disconnect();
