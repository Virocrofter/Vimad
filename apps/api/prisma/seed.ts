import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-hotel' },
    update: {},
    create: {
      name: 'Demo Hotel Group',
      slug: 'demo-hotel',
      plan: 'trial',
    },
  });

  // Demo users
  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'frontdesk@demo.com' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'frontdesk@demo.com',
      firstName: 'Front',
      lastName: 'Desk',
      role: 'staff',
    },
  });

  // Demo property
  const property = await prisma.property.upsert({
    where: {
      tenantId_code: { tenantId: tenant.id, code: 'DEMO-01' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Demo Downtown Hotel',
      code: 'DEMO-01',
      address: '123 Main St',
      city: 'Boston',
      country: 'US',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  });

  // Room types
  const roomTypes = await Promise.all(
    [
      { name: 'Standard Queen', code: 'STD-Q', baseOccupancy: 2, maxOccupancy: 3 },
      { name: 'Deluxe King', code: 'DLX-K', baseOccupancy: 2, maxOccupancy: 3 },
      { name: 'Suite', code: 'STE', baseOccupancy: 2, maxOccupancy: 4 },
    ].map((rt) =>
      prisma.roomType.upsert({
        where: { propertyId_code: { propertyId: property.id, code: rt.code } },
        update: {},
        create: {
          tenantId: tenant.id,
          propertyId: property.id,
          ...rt,
        },
      })
    )
  );

  // Rooms
  const rooms = [];
  for (let floor = 1; floor <= 4; floor++) {
    for (let room = 1; room <= 5; room++) {
      const number = `${floor}0${room}`.replace(/0+(\d{3})/, '$1');
      const rt = roomTypes[room % roomTypes.length];
      rooms.push(
        prisma.room.upsert({
          where: { propertyId_number: { propertyId: property.id, number } },
          update: {},
          create: {
            tenantId: tenant.id,
            propertyId: property.id,
            roomTypeId: rt.id,
            number,
            floor: String(floor),
          },
        })
      );
    }
  }
  await Promise.all(rooms);

  // Rate plans
  await Promise.all(
    roomTypes.map((rt) =>
      prisma.ratePlan.upsert({
        where: { propertyId_code: { propertyId: property.id, code: `${rt.code}-RACK` } },
        update: {},
        create: {
          tenantId: tenant.id,
          propertyId: property.id,
          roomTypeId: rt.id,
          name: `${rt.name} Rack Rate`,
          code: `${rt.code}-RACK`,
          baseRate: rt.code === 'STE' ? 320 : rt.code === 'DLX-K' ? 189 : 145,
        },
      })
    )
  );

  // Demo guests
  const guest = await prisma.guest.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'john.smith@example.com' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 555-0101',
    },
  });

  await prisma.guest.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'sarah.johnson@example.com' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 555-0102',
    },
  });

  // Demo reservation
  const arrival = new Date('2026-09-01');
  const departure = new Date('2026-09-04');
  const nights = 3;
  const rate = 189;
  const total = rate * nights;

  const room = await prisma.room.findFirst({
    where: { propertyId: property.id },
  });

  if (room) {
    await prisma.reservation.upsert({
      where: { confirmationNumber: 'DEMO-4021' },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        guestId: guest.id,
        confirmationNumber: 'DEMO-4021',
        status: 'confirmed',
        source: 'direct',
        arrivalDate: arrival,
        departureDate: departure,
        nights,
        adults: 2,
        children: 0,
        totalAmount: total,
        balance: total,
        stays: {
          create: Array.from({ length: nights }).map((_, i) => ({
            roomId: room.id,
            date: new Date(arrival.getTime() + i * 24 * 60 * 60 * 1000),
            rate,
          })),
        },
        folio: {
          create: {
            totalCharges: total,
            totalPayments: 0,
            balance: total,
            items: {
              create: Array.from({ length: nights }).map((_, i) => ({
                type: 'room_charge',
                description: `Room charge - Night ${i + 1}`,
                amount: rate,
              })),
            },
          },
        },
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
