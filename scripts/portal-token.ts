import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config();
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo-hotel' } });
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() - 1);
  const r = await prisma.reservation.findFirstOrThrow({
    where: { tenantId: tenant.id, status: 'confirmed', arrivalDate: { gte: min } },
    orderBy: { arrivalDate: 'asc' },
  });
  const token = jwt.sign(
    { scope: 'guest-portal', tenantId: tenant.id, guestId: r.guestId, reservationId: r.id },
    process.env.JWT_SECRET as string,
    { expiresIn: '2h' }
  );
  console.log(r.confirmationNumber + ' ' + token);
}
main().finally(() => prisma.$disconnect());
