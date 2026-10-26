/* scripts/grant-owner.ts — grant the global Owner role (wildcard perms) to a user.
 * Usage: cd apps/api && npx tsx ../../scripts/grant-owner.ts [email] [tenantSlug] */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EMAIL = process.argv[2] ?? 'admin@demo.com';
const SLUG = process.argv[3] ?? 'demo-hotel';

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: SLUG } });
  const user = await prisma.user.findFirstOrThrow({
    where: { email: EMAIL, tenantId: tenant.id },
  });

  const owner = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (!owner) throw new Error('Owner role not found — run: cd apps/api && npx prisma db seed');

  const existing = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, roleId: owner.id, propertyId: null },
  });
  if (existing) {
    console.log(`${EMAIL} already has global Owner — nothing to do.`);
    return;
  }

  await prisma.roleAssignment.create({
    data: { userId: user.id, roleId: owner.id, propertyId: null },
  });
  console.log(`Granted global Owner to ${EMAIL} (user ${user.id}) on tenant "${SLUG}".`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
