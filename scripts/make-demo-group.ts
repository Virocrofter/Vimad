import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const slug = process.argv[2] ?? 'demo-hotel';
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
  const property = await prisma.property.findFirstOrThrow({ where: { tenantId: tenant.id } });
  const roomType = await prisma.roomType.findFirstOrThrow({ where: { propertyId: property.id } });
  const g = await prisma.group.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      code: `GB-${Date.now().toString(36).toUpperCase()}`,
      name: 'T3 Group Billing Demo',
      blockType: 'courtesy',
      status: 'confirmed',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 2 * 86400_000),
    },
  });
  const folios: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const guest = await prisma.guest.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Family',
        lastName: `Member${i}`,
        email: `fam${i}@example.com`,
      },
    });
    const res = await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        guestId: guest.id,
        groupId: g.id,
        confirmationNumber: `GB-DEMO-${i}-${Date.now().toString(36)}`,
        status: 'checked_in',
        source: 'direct',
        arrivalDate: new Date(),
        departureDate: new Date(Date.now() + 2 * 86400_000),
        nights: 2,
        adults: 2,
        roomTypeId: roomType.id,
        totalAmount: 400,
        balance: 400,
        checkedInAt: new Date(),
      },
    });
    const folio = await prisma.folio.create({
      data: {
        reservationId: res.id,
        tenantId: tenant.id,
        groupId: g.id,
        totalCharges: 0,
        totalPayments: 0,
        balance: 0,
      },
    });
    await prisma.folioItem.create({
      data: {
        folioId: folio.id,
        type: 'room_charge',
        description: `Room charge night 1 — member ${i}`,
        amount: 200,
      },
    });
    await prisma.folioItem.create({
      data: {
        folioId: folio.id,
        type: 'misc',
        description: `Incidentals — member ${i}`,
        amount: 25 * i,
      },
    });
    folios.push(folio.id);
  }
  const master = await prisma.folio.create({
    data: {
      reservationId: null,
      tenantId: tenant.id,
      groupId: g.id,
      isMaster: true,
      totalCharges: 0,
      totalPayments: 0,
      balance: 0,
    },
  });
  await prisma.folioItem.create({
    data: {
      folioId: master.id,
      type: 'misc',
      description: 'Shared airport transfer (unassigned)',
      amount: 150,
    },
  });
  console.log(
    JSON.stringify({ groupId: g.id, folios, masterFolioId: master.id, propertyId: property.id })
  );
}
main().finally(() => prisma.$disconnect());
