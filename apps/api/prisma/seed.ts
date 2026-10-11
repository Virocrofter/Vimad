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

  // Loyalty permissions
  {
    resource: 'loyalty',
    action: 'create',
    category: 'loyalty',
    description: 'Enroll loyalty members',
  },
  {
    resource: 'loyalty',
    action: 'read',
    category: 'loyalty',
    description: 'View loyalty members and transactions',
  },
  {
    resource: 'loyalty',
    action: 'update',
    category: 'loyalty',
    description: 'Adjust member points',
  },
  {
    resource: 'loyalty',
    action: 'delete',
    category: 'loyalty',
    description: 'Remove loyalty transactions',
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
      'loyalty:create',
      'loyalty:read',
      'loyalty:update',
      'loyalty:delete',
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
      'loyalty:read',
      'loyalty:update',
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

// ─── Guest roster for the Guests section ───
interface GuestSeed {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  city?: string;
  country?: string;
  address?: string;
  dateOfBirth?: Date;
  passportNumber?: string;
  vipStatus?: string;
  loyaltyPoints?: number;
  blacklisted?: boolean;
  blacklistReason?: string;
  doNotDisturb?: boolean;
  notes?: string;
  createdAt?: Date; // backdate to control "new this month" stats
  preferences?: { category: string; key: string; value: string }[];
  documents?: {
    type: string;
    number?: string;
    issuedBy?: string;
    issueDate?: Date;
    expiryDate?: Date;
  }[];
  guestNotes?: string[];
}

const GUEST_ROSTER: GuestSeed[] = [
  {
    id: 'demo-guest-john',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 555-0101',
    nationality: 'US',
    city: 'New York',
    country: 'United States',
    address: '48 W 21st St',
    dateOfBirth: new Date('1985-03-12'),
    passportNumber: 'X12345678',
    vipStatus: 'gold',
    loyaltyPoints: 5400,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 14)),
    preferences: [
      { category: 'room', key: 'Floor', value: 'High floor' },
      { category: 'bed', key: 'Pillow', value: 'Firm' },
      { category: 'dietary', key: 'Meal', value: 'Vegetarian' },
    ],
    documents: [
      {
        type: 'passport',
        number: 'X12345678',
        issuedBy: 'US Department of State',
        issueDate: new Date('2018-04-01'),
        expiryDate: new Date('2028-03-31'),
      },
    ],
    guestNotes: [
      'Prefers quiet rooms away from the elevator.',
      'Allergic to feather pillows — housekeeping flagged.',
    ],
  },
  {
    id: 'demo-guest-sarah',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 555-0102',
    nationality: 'US',
    city: 'Chicago',
    country: 'United States',
    vipStatus: 'silver',
    loyaltyPoints: 1800,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 9)),
    preferences: [{ category: 'amenity', key: 'Newspaper', value: 'Wall Street Journal' }],
  },
  {
    id: 'demo-guest-003',
    firstName: 'Aisha',
    lastName: 'Patel',
    email: 'aisha.patel@example.com',
    phone: '+27 82 555 0110',
    nationality: 'ZA',
    city: 'Durban',
    country: 'South Africa',
    vipStatus: 'platinum',
    loyaltyPoints: 11500,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 22)),
    preferences: [
      { category: 'bed', key: 'Bedding', value: 'Hypoallergenic' },
      { category: 'amenity', key: 'Arrival', value: 'Champagne on arrival' },
    ],
    documents: [
      {
        type: 'passport',
        number: 'P1234567',
        issuedBy: 'Dept of Home Affairs SA',
        issueDate: new Date('2020-01-15'),
        expiryDate: new Date('2030-01-14'),
      },
      { type: 'driver_license', number: 'DL99887766', issuedBy: 'KZN Licensing' },
    ],
    guestNotes: ['Honeymoon stay last year — comp upgrade offered.'],
  },
  {
    id: 'demo-guest-004',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    phone: '+1 555-0103',
    nationality: 'US',
    city: 'Seattle',
    country: 'United States',
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    notes: 'Corporate account — Horizon Logistics.',
    preferences: [{ category: 'other', key: 'Checkout', value: 'Late checkout preferred' }],
  },
  {
    id: 'demo-guest-005',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@example.com',
    phone: '+1 555-0104',
    nationality: 'MX',
    city: 'Mexico City',
    country: 'Mexico',
    vipStatus: 'bronze',
    loyaltyPoints: 350,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 5)),
  },
  {
    id: 'demo-guest-006',
    firstName: 'David',
    lastName: 'Okafor',
    email: 'david.okafor@example.com',
    phone: '+234 803 555 0105',
    nationality: 'NG',
    city: 'Lagos',
    country: 'Nigeria',
    blacklisted: true,
    blacklistReason: 'Credit card fraud — chargebacks on two consecutive stays.',
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 18)),
    guestNotes: [
      'Attempted check-in with mismatched ID in June — verify all future bookings manually.',
    ],
  },
  {
    id: 'demo-guest-007',
    firstName: 'Lisa',
    lastName: 'Mueller',
    email: 'lisa.mueller@example.de',
    phone: '+49 151 555 0106',
    nationality: 'DE',
    city: 'Berlin',
    country: 'Germany',
    vipStatus: 'gold',
    loyaltyPoints: 6200,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 16)),
    preferences: [
      { category: 'room', key: 'View', value: 'City view' },
      { category: 'dietary', key: 'Breakfast', value: 'Gluten-free options' },
    ],
    documents: [
      {
        type: 'passport',
        number: 'C01X00T5',
        issuedBy: 'Bundesdruckerei',
        issueDate: new Date('2019-06-01'),
        expiryDate: new Date('2029-05-31'),
      },
    ],
  },
  {
    id: 'demo-guest-008',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@example.co.uk',
    phone: '+44 7700 555107',
    nationality: 'GB',
    city: 'Manchester',
    country: 'United Kingdom',
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 7)),
  },
  {
    id: 'demo-guest-009',
    firstName: 'Fatima',
    lastName: 'Al-Sayed',
    email: 'fatima.alsayed@example.ae',
    phone: '+971 50 555 0108',
    nationality: 'AE',
    city: 'Dubai',
    country: 'UAE',
    vipStatus: 'silver',
    loyaltyPoints: 2100,
    doNotDisturb: true,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 11)),
    preferences: [
      { category: 'accessibility', key: 'Mobility', value: 'Wheelchair accessible room' },
    ],
  },
  {
    id: 'demo-guest-010',
    firstName: 'Tom',
    lastName: 'Becker',
    email: 'tom.becker@example.com',
    phone: '+1 555-0109',
    nationality: 'US',
    city: 'Phoenix',
    country: 'United States',
    blacklisted: true,
    blacklistReason: 'Three no-shows on prepaid corporate rates.',
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 24)),
  },
  {
    id: 'demo-guest-011',
    firstName: 'Grace',
    lastName: 'Kim',
    email: 'grace.kim@example.kr',
    phone: '+82 10 5555 0110',
    nationality: 'KR',
    city: 'Seoul',
    country: 'South Korea',
    vipStatus: 'platinum',
    loyaltyPoints: 14800,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 26)),
    preferences: [
      { category: 'room', key: 'View', value: 'Ocean view' },
      { category: 'dietary', key: 'Diet', value: 'Pescatarian' },
    ],
    documents: [
      {
        type: 'passport',
        number: 'M12345678',
        issuedBy: 'Ministry of Foreign Affairs KR',
        issueDate: new Date('2021-02-10'),
        expiryDate: new Date('2031-02-09'),
      },
    ],
    guestNotes: ['VIP — notify GM on every arrival.'],
  },
  {
    id: 'demo-guest-012',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos.m@example.mx',
    phone: '+52 55 5555 0111',
    nationality: 'MX',
    city: 'Guadalajara',
    country: 'Mexico',
    vipStatus: 'bronze',
    loyaltyPoints: 200,
    createdAt: new Date(), // new this month
  },
  {
    id: 'demo-guest-013',
    firstName: 'Naledi',
    lastName: 'Mokoena',
    email: 'naledi.m@example.co.za',
    phone: '+27 83 555 0112',
    nationality: 'ZA',
    city: 'Johannesburg',
    country: 'South Africa',
    vipStatus: 'silver',
    loyaltyPoints: 1400,
    createdAt: new Date(), // new this month
    documents: [
      {
        type: 'national_id',
        number: '9001014800089',
        issuedBy: 'Dept of Home Affairs SA',
        issueDate: new Date('2018-01-01'),
      },
    ],
  },
  {
    id: 'demo-guest-014',
    firstName: 'Oliver',
    lastName: 'Bennett',
    email: 'oliver.b@example.au',
    phone: '+61 4 5555 0113',
    nationality: 'AU',
    city: 'Sydney',
    country: 'Australia',
    vipStatus: 'gold',
    loyaltyPoints: 7300,
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 13)),
  },
  {
    id: 'demo-guest-015',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@example.in',
    phone: '+91 98 5555 0114',
    nationality: 'IN',
    city: 'Bengaluru',
    country: 'India',
    createdAt: new Date(), // new this month
    preferences: [{ category: 'dietary', key: 'Meal', value: 'Vegetarian, no onion/garlic' }],
  },
];

// ─── Reservation blueprint (dates relative to "now" so the board always has live data) ───
interface ReservationSeed {
  confirmationNumber: string;
  guestKey: string; // id from GUEST_ROSTER
  roomIndex: number; // index into rooms array (stable per property)
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  arrivalOffsetDays: number; // relative to today
  nights: number;
  rate: number;
  adults?: number;
  children?: number;
  source?: string;
}

const daysFromNow = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

const RESERVATION_ROSTER: ReservationSeed[] = [
  // ── In house now ──
  {
    confirmationNumber: 'DEMO-4101',
    guestKey: 'demo-guest-john',
    roomIndex: 0,
    status: 'checked_in',
    arrivalOffsetDays: -2,
    nights: 4,
    rate: 189,
    source: 'direct',
  },
  {
    confirmationNumber: 'DEMO-4102',
    guestKey: 'demo-guest-007',
    roomIndex: 5,
    status: 'checked_in',
    arrivalOffsetDays: -1,
    nights: 3,
    rate: 189,
    source: 'bookingcom',
  },
  {
    confirmationNumber: 'DEMO-4103',
    guestKey: 'demo-guest-013',
    roomIndex: 10,
    status: 'checked_in',
    arrivalOffsetDays: -3,
    nights: 4,
    rate: 145,
    source: 'direct',
  },
  // ── Upcoming confirmed ──
  {
    confirmationNumber: 'DEMO-4201',
    guestKey: 'demo-guest-003',
    roomIndex: 1,
    status: 'confirmed',
    arrivalOffsetDays: 10,
    nights: 3,
    rate: 320,
    source: 'direct',
  },
  {
    confirmationNumber: 'DEMO-4202',
    guestKey: 'demo-guest-004',
    roomIndex: 2,
    status: 'confirmed',
    arrivalOffsetDays: 5,
    nights: 2,
    rate: 145,
    source: 'phone',
  },
  {
    confirmationNumber: 'DEMO-4203',
    guestKey: 'demo-guest-011',
    roomIndex: 14,
    status: 'confirmed',
    arrivalOffsetDays: 15,
    nights: 4,
    rate: 320,
    source: 'email',
  },
  {
    confirmationNumber: 'DEMO-4204',
    guestKey: 'demo-guest-015',
    roomIndex: 3,
    status: 'confirmed',
    arrivalOffsetDays: 7,
    nights: 2,
    rate: 145,
    source: 'expedia',
  },
  // ── Completed history ──
  {
    confirmationNumber: 'DEMO-4301',
    guestKey: 'demo-guest-john',
    roomIndex: 4,
    status: 'checked_out',
    arrivalOffsetDays: -60,
    nights: 4,
    rate: 189,
    source: 'direct',
  },
  {
    confirmationNumber: 'DEMO-4302',
    guestKey: 'demo-guest-john',
    roomIndex: 6,
    status: 'checked_out',
    arrivalOffsetDays: -120,
    nights: 2,
    rate: 145,
    source: 'bookingcom',
  },
  {
    confirmationNumber: 'DEMO-4303',
    guestKey: 'demo-guest-003',
    roomIndex: 7,
    status: 'checked_out',
    arrivalOffsetDays: -30,
    nights: 5,
    rate: 320,
    source: 'direct',
  },
  {
    confirmationNumber: 'DEMO-4304',
    guestKey: 'demo-guest-005',
    roomIndex: 8,
    status: 'checked_out',
    arrivalOffsetDays: -90,
    nights: 1,
    rate: 145,
    source: 'walkin',
  },
  {
    confirmationNumber: 'DEMO-4305',
    guestKey: 'demo-guest-009',
    roomIndex: 9,
    status: 'checked_out',
    arrivalOffsetDays: -45,
    nights: 3,
    rate: 189,
    source: 'expedia',
  },
  {
    confirmationNumber: 'DEMO-4306',
    guestKey: 'demo-guest-010',
    roomIndex: 11,
    status: 'checked_out',
    arrivalOffsetDays: -200,
    nights: 1,
    rate: 145,
    source: 'phone',
  },
  {
    confirmationNumber: 'DEMO-4307',
    guestKey: 'demo-guest-014',
    roomIndex: 12,
    status: 'checked_out',
    arrivalOffsetDays: -10,
    nights: 2,
    rate: 189,
    source: 'direct',
  },
  // ── Cancelled / no-show ──
  {
    confirmationNumber: 'DEMO-4401',
    guestKey: 'demo-guest-004',
    roomIndex: 13,
    status: 'cancelled',
    arrivalOffsetDays: 20,
    nights: 3,
    rate: 189,
    source: 'bookingcom',
  },
  {
    confirmationNumber: 'DEMO-4402',
    guestKey: 'demo-guest-006',
    roomIndex: 4,
    status: 'cancelled',
    arrivalOffsetDays: -15,
    nights: 2,
    rate: 145,
    source: 'direct',
  },
  {
    confirmationNumber: 'DEMO-4403',
    guestKey: 'demo-guest-008',
    roomIndex: 5,
    status: 'no_show',
    arrivalOffsetDays: -14,
    nights: 1,
    rate: 145,
    source: 'expedia',
  },
];

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
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
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
  const roomCreates = [];
  for (let floor = 1; floor <= 4; floor++) {
    for (let room = 1; room <= 5; room++) {
      const number = `${floor}0${room}`.replace(/0+(\d{3})/, '$1');
      const rt = roomTypes[room % roomTypes.length];
      roomCreates.push(
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
  await Promise.all(roomCreates);

  const allRooms = await prisma.room.findMany({
    where: { propertyId: property.id },
    orderBy: { number: 'asc' },
  });

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

  // ─── Guests (rich roster for the Guests section) ───
  const guestMap = new Map<string, { id: string }>();

  for (const g of GUEST_ROSTER) {
    const { preferences, documents, guestNotes, createdAt, ...fields } = g;

    const guest = await prisma.guest.upsert({
      where: { id: g.id },
      update: {
        tenantId: tenant.id,
        ...fields,
        ...(createdAt ? { createdAt } : {}),
        preferences: preferences
          ? {
              deleteMany: {},
              create: preferences,
            }
          : undefined,
        documents: documents
          ? {
              deleteMany: {},
              create: documents,
            }
          : undefined,
        guestNotes: guestNotes
          ? {
              deleteMany: {},
              create: guestNotes.map((body) => ({ body })),
            }
          : undefined,
      },
      create: {
        tenantId: tenant.id,
        ...fields,
        ...(createdAt ? { createdAt } : {}),
        preferences: { create: preferences ?? [] },
        documents: { create: documents ?? [] },
        guestNotes: { create: (guestNotes ?? []).map((body) => ({ body })) },
      },
    });

    guestMap.set(g.id, guest);
  }

  console.log(`Seeded ${guestMap.size} guests.`);

  // ─── Reservations across all statuses ───
  for (const r of RESERVATION_ROSTER) {
    const guest = guestMap.get(r.guestKey);
    const room = allRooms[r.roomIndex % allRooms.length];
    if (!guest || !room) continue;

    const arrival = daysFromNow(r.arrivalOffsetDays);
    const departure = daysFromNow(r.arrivalOffsetDays + r.nights);
    const total = r.rate * r.nights;
    const countsForRevenue = r.status === 'checked_in' || r.status === 'checked_out';

    await prisma.reservation.upsert({
      where: { confirmationNumber: r.confirmationNumber },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        guestId: guest.id,
        confirmationNumber: r.confirmationNumber,
        status: r.status,
        source: r.source ?? 'direct',
        arrivalDate: arrival,
        departureDate: departure,
        nights: r.nights,
        adults: r.adults ?? 2,
        children: r.children ?? 0,
        totalAmount: total,
        balance: countsForRevenue ? total : 0,
        stays: {
          create: Array.from({ length: r.nights }).map((_, i) => ({
            roomId: room.id,
            date: new Date(arrival.getTime() + i * 24 * 60 * 60 * 1000),
            rate: r.rate,
          })),
        },
        ...(countsForRevenue
          ? {
              folio: {
                create: {
                  tenantId: tenant.id,
                  totalCharges: total,
                  totalPayments: r.status === 'checked_out' ? total : 0,
                  balance: r.status === 'checked_out' ? 0 : total,
                  items: {
                    create: Array.from({ length: r.nights }).map((_, i) => ({
                      type: 'room_charge',
                      description: `Room charge - Night ${i + 1}`,
                      amount: r.rate,
                    })),
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  console.log(`Seeded ${RESERVATION_ROSTER.length} reservations.`);

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

  // ─── Housekeeping: Full task roster ───
  const housekeepingStaff = await prisma.user.findMany({
    where: {
      tenantId: tenant.id,
      status: 'active',
      role: { in: ['staff', 'housekeeper'] },
    },
  });

  const manager = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: { in: ['manager', 'admin', 'owner'] } },
  });

  const staffIds = housekeepingStaff.map((s) => s.id);
  const managerId = manager?.id ?? staffIds[0];

  // Clear existing demo tasks
  await prisma.housekeepingTask.deleteMany({ where: { tenantId: tenant.id } });

  const taskTemplates = [
    {
      type: 'cleaning',
      priority: 'high',
      duration: 45,
      checklist: ['Strip bed', 'Clean bathroom', 'Restock amenities', 'Vacuum', 'Wipe surfaces'],
    },
    {
      type: 'cleaning',
      priority: 'normal',
      duration: 30,
      checklist: ['Make bed', 'Clean bathroom', 'Restock towels', 'Vacuum floor'],
    },
    {
      type: 'deep_clean',
      priority: 'normal',
      duration: 90,
      checklist: [
        'Strip bed',
        'Deep clean bathroom',
        'Dust all surfaces',
        'Clean windows',
        'Shampoo carpet',
        'Check minibar',
      ],
    },
    {
      type: 'inspection',
      priority: 'high',
      duration: 15,
      checklist: ['Verify cleanliness', 'Check amenities', 'Test TV/AC', 'Inspect for damage'],
    },
    {
      type: 'turndown',
      priority: 'low',
      duration: 15,
      checklist: ['Turn down bed', 'Replace towels', 'Empty trash', 'Dim lights'],
    },
    {
      type: 'maintenance',
      priority: 'urgent',
      duration: 60,
      checklist: ['Assess issue', 'Fix or escalate', 'Test functionality'],
    },
  ];

  const taskStatuses = [
    'pending',
    'pending',
    'pending',
    'in_progress',
    'in_progress',
    'completed',
    'completed',
    'completed',
    'inspected',
    'inspected',
  ] as const;

  const now = new Date();
  const tasksToCreate: any[] = [];

  // Generate 30 tasks across rooms and floors
  for (let i = 0; i < 30; i++) {
    const room = allRooms[i % allRooms.length];
    const template = taskTemplates[i % taskTemplates.length];
    const status = taskStatuses[i % taskStatuses.length];
    const assignee = staffIds[i % staffIds.length] ?? null;
    const scheduledOffset = Math.floor(Math.random() * 48) - 24; // -24h to +24h

    const scheduledAt = new Date(now.getTime() + scheduledOffset * 60 * 60 * 1000);
    const startedAt = status !== 'pending' ? new Date(scheduledAt.getTime() + 5 * 60000) : null;
    const completedAt = ['completed', 'inspected'].includes(status)
      ? new Date(scheduledAt.getTime() + template.duration * 60000)
      : null;
    const verifiedAt =
      status === 'inspected' ? new Date((completedAt ?? now).getTime() + 10 * 60000) : null;

    tasksToCreate.push({
      tenantId: tenant.id,
      propertyId: property.id,
      roomId: room.id,
      type: template.type,
      priority: template.priority,
      status,
      scheduledAt,
      startedAt,
      completedAt,
      verifiedAt,
      estimatedDuration: template.duration,
      actualDuration: completedAt ? template.duration + Math.floor(Math.random() * 10 - 5) : null,
      notes:
        i % 7 === 0
          ? 'Guest requested extra towels'
          : i % 11 === 0
            ? 'VIP room — inspect carefully'
            : null,
      checklist: template.checklist,
      assigneeId: assignee,
      inspectorId: status === 'inspected' ? managerId : null,
    });
  }

  // Create 5 overdue tasks
  for (let i = 0; i < 5; i++) {
    const room = allRooms[(i * 3) % allRooms.length];
    tasksToCreate.push({
      tenantId: tenant.id,
      propertyId: property.id,
      roomId: room.id,
      type: 'cleaning',
      priority: i < 2 ? 'urgent' : 'high',
      status: i < 3 ? 'pending' : 'in_progress',
      scheduledAt: new Date(now.getTime() - (4 + i * 2) * 60 * 60 * 1000), // 4-12 hours ago
      startedAt: i >= 3 ? new Date(now.getTime() - 3 * 60 * 60 * 1000) : null,
      estimatedDuration: 45,
      notes: 'OVERDUE — needs immediate attention',
      checklist: ['Strip bed', 'Clean bathroom', 'Restock amenities', 'Vacuum', 'Wipe surfaces'],
      assigneeId: staffIds[i % staffIds.length] ?? null,
    });
  }

  await prisma.housekeepingTask.createMany({ data: tasksToCreate });
  console.log(`Seeded ${tasksToCreate.length} housekeeping tasks.`);

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
