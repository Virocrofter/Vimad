import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Permission Definitions (Resource × Action Matrix) ───
const PERMISSIONS = [
  // Reservation permissions
  {
    resource: 'reservation',
    action: 'create',
    category: 'reservations',
    description: 'Create new reservations',
  },
  {
    resource: 'reservation',
    action: 'read',
    category: 'reservations',
    description: 'View reservations',
  },
  {
    resource: 'reservation',
    action: 'update',
    category: 'reservations',
    description: 'Modify reservations',
  },
  {
    resource: 'reservation',
    action: 'delete',
    category: 'reservations',
    description: 'Cancel/delete reservations',
  },
  {
    resource: 'reservation',
    action: 'checkin',
    category: 'reservations',
    description: 'Check in guests',
  },
  {
    resource: 'reservation',
    action: 'checkout',
    category: 'reservations',
    description: 'Check out guests',
  },

  // Guest permissions
  { resource: 'guest', action: 'create', category: 'guests', description: 'Add new guests' },
  { resource: 'guest', action: 'read', category: 'guests', description: 'View guest profiles' },
  {
    resource: 'guest',
    action: 'update',
    category: 'guests',
    description: 'Edit guest information',
  },
  { resource: 'guest', action: 'delete', category: 'guests', description: 'Remove guest records' },

  // Property permissions
  { resource: 'property', action: 'create', category: 'properties', description: 'Add properties' },
  { resource: 'property', action: 'read', category: 'properties', description: 'View properties' },
  {
    resource: 'property',
    action: 'update',
    category: 'properties',
    description: 'Edit properties',
  },
  {
    resource: 'property',
    action: 'delete',
    category: 'properties',
    description: 'Remove properties',
  },

  // Room permissions
  { resource: 'room', action: 'create', category: 'inventory', description: 'Add rooms' },
  { resource: 'room', action: 'read', category: 'inventory', description: 'View rooms' },
  { resource: 'room', action: 'update', category: 'inventory', description: 'Update room status' },
  { resource: 'room', action: 'delete', category: 'inventory', description: 'Remove rooms' },

  // Folio/Billing permissions
  { resource: 'folio', action: 'create', category: 'billing', description: 'Create folio charges' },
  { resource: 'folio', action: 'read', category: 'billing', description: 'View folios' },
  { resource: 'folio', action: 'update', category: 'billing', description: 'Post adjustments' },
  { resource: 'folio', action: 'payment', category: 'billing', description: 'Process payments' },
  { resource: 'folio', action: 'refund', category: 'billing', description: 'Issue refunds' },

  // Rate plan permissions
  { resource: 'rate_plan', action: 'read', category: 'rates', description: 'View rate plans' },
  { resource: 'rate_plan', action: 'update', category: 'rates', description: 'Modify rates' },

  // Channel permissions
  {
    resource: 'channel',
    action: 'read',
    category: 'channel',
    description: 'View channel connections',
  },
  {
    resource: 'channel',
    action: 'create',
    category: 'channel',
    description: 'Create channel connections',
  },
  {
    resource: 'channel',
    action: 'update',
    category: 'channel',
    description: 'Update channel connections',
  },
  {
    resource: 'channel',
    action: 'delete',
    category: 'channel',
    description: 'Delete channel connections',
  },

  // SMS permissions
  { resource: 'sms', action: 'send', category: 'communications', description: 'Send SMS messages' },
  {
    resource: 'sms',
    action: 'read',
    category: 'communications',
    description: 'View SMS templates',
  },

  // Notification permissions
  {
    resource: 'notification',
    action: 'create',
    category: 'notifications',
    description: 'Create notifications',
  },
  {
    resource: 'notification',
    action: 'read',
    category: 'notifications',
    description: 'View notifications',
  },

  // API key permissions
  { resource: 'api_key', action: 'create', category: 'admin', description: 'Create API keys' },
  { resource: 'api_key', action: 'read', category: 'admin', description: 'View API keys' },
  {
    resource: 'api_key',
    action: 'update',
    category: 'admin',
    description: 'Update/revoke API keys',
  },
  { resource: 'api_key', action: 'delete', category: 'admin', description: 'Delete API keys' },

  // Reporting permissions
  { resource: 'report', action: 'read', category: 'reports', description: 'View reports' },
  { resource: 'report', action: 'export', category: 'reports', description: 'Export report data' },

  // Night audit permissions
  {
    resource: 'night_audit',
    action: 'run',
    category: 'operations',
    description: 'Execute night audit',
  },
  {
    resource: 'night_audit',
    action: 'read',
    category: 'operations',
    description: 'View audit reports',
  },

  // User management permissions
  { resource: 'user', action: 'create', category: 'admin', description: 'Create users' },
  { resource: 'user', action: 'read', category: 'admin', description: 'View users' },
  { resource: 'user', action: 'update', category: 'admin', description: 'Edit users' },
  { resource: 'user', action: 'delete', category: 'admin', description: 'Remove users' },

  // Settings permissions
  { resource: 'setting', action: 'read', category: 'admin', description: 'View settings' },
  { resource: 'setting', action: 'update', category: 'admin', description: 'Modify settings' },

  // Housekeeping permissions
  {
    resource: 'housekeeping',
    action: 'read',
    category: 'operations',
    description: 'View housekeeping status',
  },
  {
    resource: 'housekeeping',
    action: 'update',
    category: 'operations',
    description: 'Update room status',
  },
  {
    resource: 'housekeeping',
    action: 'assign',
    category: 'operations',
    description: 'Assign housekeeping tasks',
  },
];

// ─── Role Definitions with Permission Sets ───
const ROLES = [
  {
    name: 'Owner',
    type: 'system',
    isDefault: false,
    isLocked: true,
    description: 'Full property access. Can manage all settings, billing, and users.',
    permissions: ['*'], // Wildcard = all permissions
  },
  {
    name: 'Admin',
    type: 'system',
    isDefault: false,
    isLocked: true,
    description: 'Manage day-to-day operations, users, and reports. Cannot delete properties.',
    permissions: [
      'reservation:create',
      'reservation:read',
      'reservation:update',
      'reservation:delete',
      'reservation:checkin',
      'reservation:checkout',
      'guest:create',
      'guest:read',
      'guest:update',
      'property:read',
      'property:update',
      'room:create',
      'room:read',
      'room:update',
      'room:delete',
      'folio:create',
      'folio:read',
      'folio:update',
      'folio:payment',
      'folio:refund',
      'rate_plan:read',
      'rate_plan:update',
      'channel:read',
      'channel:create',
      'channel:update',
      'channel:delete',
      'sms:send',
      'sms:read',
      'notification:create',
      'notification:read',
      'api_key:create',
      'api_key:read',
      'api_key:update',
      'api_key:delete',
      'report:read',
      'report:export',
      'night_audit:run',
      'night_audit:read',
      'user:create',
      'user:read',
      'user:update',
      'setting:read',
      'setting:update',
      'housekeeping:read',
      'housekeeping:update',
      'housekeeping:assign',
    ],
  },
  {
    name: 'Manager',
    type: 'system',
    isDefault: false,
    isLocked: true,
    description: 'Manage reservations, guests, and staff. Limited billing access.',
    permissions: [
      'reservation:create',
      'reservation:read',
      'reservation:update',
      'reservation:checkin',
      'reservation:checkout',
      'guest:create',
      'guest:read',
      'guest:update',
      'property:read',
      'room:read',
      'room:update',
      'folio:create',
      'folio:read',
      'folio:update',
      'folio:payment',
      'rate_plan:read',
      'channel:read',
      'sms:send',
      'sms:read',
      'notification:read',
      'report:read',
      'night_audit:read',
      'user:read',
      'housekeeping:read',
      'housekeeping:update',
      'housekeeping:assign',
    ],
  },
  {
    name: 'Staff',
    type: 'system',
    isDefault: true,
    isLocked: true,
    description: 'Front desk operations. Create reservations and manage guest check-in/out.',
    permissions: [
      'reservation:create',
      'reservation:read',
      'reservation:update',
      'reservation:checkin',
      'reservation:checkout',
      'guest:create',
      'guest:read',
      'guest:update',
      'property:read',
      'room:read',
      'folio:create',
      'folio:read',
      'folio:payment',
      'housekeeping:read',
      'housekeeping:update',
      'notification:read',
    ],
  },
  {
    name: 'Housekeeper',
    type: 'system',
    isDefault: false,
    isLocked: false,
    description: 'Update room cleaning status and view assignments.',
    permissions: ['room:read', 'housekeeping:read', 'housekeeping:update'],
  },
];

// ─── Seed Permissions & System Roles ───
async function seedPermissionsAndRoles() {
  const permissionMap = new Map<string, string>(); // key -> id

  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
    });

    if (!existing) {
      const created = await prisma.permission.create({
        data: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          category: perm.category,
        },
      });
      permissionMap.set(`${perm.resource}:${perm.action}`, created.id);
    } else {
      permissionMap.set(`${perm.resource}:${perm.action}`, existing.id);
    }
  }

  for (const roleDef of ROLES) {
    const existingRole = await prisma.role.findFirst({
      where: { name: roleDef.name, tenantId: null },
    });

    let role;
    if (!existingRole) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
          type: roleDef.type,
          isDefault: roleDef.isDefault,
          isLocked: roleDef.isLocked,
        },
      });
    } else {
      role = existingRole;
    }

    if (roleDef.permissions.includes('*')) {
      const allPerms = await prisma.permission.findMany();
      for (const perm of allPerms) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: perm.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    } else {
      for (const permKey of roleDef.permissions) {
        const permId = permissionMap.get(permKey);
        if (permId) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: { roleId: role.id, permissionId: permId },
            },
            update: {},
            create: { roleId: role.id, permissionId: permId },
          });
        }
      }
    }
  }

  console.log('Permissions and roles seeded.');
}

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

  // Demo users — password hashes so /auth/login works out of the box
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const frontdeskPasswordHash = await bcrypt.hash('frontdesk123', 10);

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' },
    },
    update: { passwordHash: adminPasswordHash },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'frontdesk@demo.com' },
    },
    update: { passwordHash: frontdeskPasswordHash },
    create: {
      tenantId: tenant.id,
      email: 'frontdesk@demo.com',
      passwordHash: frontdeskPasswordHash,
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

  // Seed permissions and system roles
  await seedPermissionsAndRoles();

  // Demo guests — Guest has no tenantId+email unique constraint, so upsert by id via findFirst
  const guest = await prisma.guest.upsert({
    where: { id: 'demo-guest-john' },
    update: {},
    create: {
      id: 'demo-guest-john',
      tenantId: tenant.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 555-0101',
    },
  });

  await prisma.guest.upsert({
    where: { id: 'demo-guest-sarah' },
    update: {},
    create: {
      id: 'demo-guest-sarah',
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
            tenantId: tenant.id,
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

  // Seed a demo channel manager connection
  await prisma.channelConnection.upsert({
    where: {
      tenantId_propertyId_provider_hotelId: {
        tenantId: tenant.id,
        propertyId: property.id,
        provider: 'bookingcom',
        hotelId: 'DEMO-HOTEL-001',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      propertyId: property.id,
      provider: 'bookingcom',
      hotelId: 'DEMO-HOTEL-001',
      apiKey: 'demo-api-key',
      apiSecret: 'demo-api-secret',
      endpoint: 'https://supply-xml.booking.com/json/',
      settings: {
        syncInterval: 5,
        autoConfirm: false,
        rateMultiplier: 1,
        minStaySync: true,
        restrictionsSync: true,
      },
      status: 'active',
      lastSyncStatus: 'success',
      connectedAt: new Date(),
    },
  });

  // Seed demo housekeeping tasks
  const demoRoom = await prisma.room.findFirst({ where: { propertyId: property.id } });
  if (demoRoom) {
    await prisma.housekeepingTask.upsert({
      where: { id: 'demo-task-001' },
      update: {},
      create: {
        id: 'demo-task-001',
        tenantId: tenant.id,
        propertyId: property.id,
        roomId: demoRoom.id,
        type: 'cleaning',
        priority: 'normal',
        status: 'pending',
        scheduledAt: new Date(),
        estimatedDuration: 30,
        checklist: ['Make bed', 'Restock towels', 'Vacuum'],
      },
    });

    await prisma.housekeepingTask.upsert({
      where: { id: 'demo-task-002' },
      update: {},
      create: {
        id: 'demo-task-002',
        tenantId: tenant.id,
        propertyId: property.id,
        roomId: demoRoom.id,
        type: 'inspection',
        priority: 'high',
        status: 'completed',
        scheduledAt: new Date(),
        completedAt: new Date(),
        estimatedDuration: 15,
        checklist: ['Verify cleanliness', 'Check amenities'],
      },
    });
  }

  // Seed a demo night audit
  const adminUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'admin' } });
  await prisma.nightAudit.upsert({
    where: {
      tenantId_propertyId_auditDate: {
        tenantId: tenant.id,
        propertyId: property.id,
        auditDate: new Date('2026-08-31'),
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      propertyId: property.id,
      auditDate: new Date('2026-08-31'),
      status: 'completed',
      runBy: adminUser?.id ?? 'system',
      steps: {
        autoPostRoomCharges: true,
        verifyBalances: true,
        generateReports: true,
        closeDay: true,
      },
      results: {
        roomChargesPosted: 12,
        balanceVerification: { verified: 12, discrepancies: 0 },
        reportsGenerated: { arrivals: 5, departures: 3, inHouse: 18, roomRevenue: 2262 },
      },
      completedAt: new Date(),
    },
  });

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
