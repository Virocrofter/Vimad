import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const conf = process.argv[2];
  if (!conf)
    throw new Error('usage: npx tsx ../../scripts/mint-portal-token.ts <confirmationNumber>');
  const r = await prisma.reservation.findUnique({ where: { confirmationNumber: conf } });
  if (!r) throw new Error('reservation not found: ' + conf);
  const token = jwt.sign(
    { scope: 'guest-portal', reservationId: r.id, tenantId: r.tenantId, guestId: r.guestId },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '1h' }
  );
  console.log(token);
}
main().finally(() => prisma.$disconnect());
