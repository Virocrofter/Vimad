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

  // Room type permissions
  { resource: 'room_type', action: 'create', category: 'inventory', description: 'Add room types' },
  { resource: 'room_type', action: 'read', category: 'inventory', description: 'View room types' },
  {
    resource: 'room_type',
    action: 'update',
    category: 'inventory',
    description: 'Update room types',
  },
  {
    resource: 'room_type',
    action: 'delete',
    category: 'inventory',
    description: 'Remove room types',
  },

  // Folio/Billing permissions
  { resource: 'folio', action: 'create', category: 'billing', description: 'Create folio charges' },
  { resource: 'folio', action: 'read', category: 'billing', description: 'View folios' },
  { resource: 'folio', action: 'update', category: 'billing', description: 'Post adjustments' },
  { resource: 'folio', action: 'payment', category: 'billing', description: 'Process payments' },
  { resource: 'folio', action: 'refund', category: 'billing', description: 'Issue refunds' },
  { resource: 'folio', action: 'delete', category: 'billing', description: 'Delete folios' },

  // Rate plan permissions
  { resource: 'rate_plan', action: 'read', category: 'rates', description: 'View rate plans' },
  { resource: 'rate_plan', action: 'update', category: 'rates', description: 'Modify rates' },
  { resource: 'rate_plan', action: 'delete', category: 'rates', description: 'Delete rate plans' },
  { resource: 'rate_plan', action: 'create', category: 'rates', description: 'Create rate plans' },

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
  // Task permissions (T1)
  { resource: 'task', action: 'create', category: 'operations', description: 'Create tasks' },
  { resource: 'task', action: 'read', category: 'operations', description: 'View tasks' },
  {
    resource: 'task',
    action: 'update',
    category: 'operations',
    description: 'Update/complete tasks',
  },
  { resource: 'task', action: 'delete', category: 'operations', description: 'Cancel tasks' },
  {
    resource: 'task',
    action: 'assign',
    category: 'operations',
    description: 'Assign tasks to staff',
  },
  { resource: 'task_rule', action: 'read', category: 'operations', description: 'View task rules' },
  {
    resource: 'task_rule',
    action: 'manage',
    category: 'operations',
    description: 'Create/edit task rules',
  },

  // Group permissions (G1)
  {
    resource: 'group',
    action: 'create',
    category: 'reservations',
    description: 'Create group blocks',
  },
  {
    resource: 'group',
    action: 'read',
    category: 'reservations',
    description: 'View groups and rooming lists',
  },
  {
    resource: 'group',
    action: 'update',
    category: 'reservations',
    description: 'Edit group blocks and members',
  },
  { resource: 'group', action: 'delete', category: 'reservations', description: 'Cancel groups' },

  // Sales & Catering permissions (S&C)
  {
    resource: 'sc_client',
    action: 'create',
    category: 'sales_catering',
    description: 'Create S&C clients',
  },
  {
    resource: 'sc_client',
    action: 'read',
    category: 'sales_catering',
    description: 'View S&C clients',
  },
  {
    resource: 'sc_client',
    action: 'update',
    category: 'sales_catering',
    description: 'Edit S&C clients',
  },
  {
    resource: 'sc_client',
    action: 'delete',
    category: 'sales_catering',
    description: 'Delete S&C clients',
  },
  {
    resource: 'sc_event',
    action: 'create',
    category: 'sales_catering',
    description: 'Create events/leads',
  },
  { resource: 'sc_event', action: 'read', category: 'sales_catering', description: 'View events' },
  {
    resource: 'sc_event',
    action: 'update',
    category: 'sales_catering',
    description: 'Edit events / move pipeline',
  },
  {
    resource: 'sc_event',
    action: 'delete',
    category: 'sales_catering',
    description: 'Delete events',
  },
  { resource: 'sc_beo', action: 'read', category: 'sales_catering', description: 'View BEOs' },
  {
    resource: 'sc_beo',
    action: 'manage',
    category: 'sales_catering',
    description: 'Create/edit/submit BEOs',
  },
  {
    resource: 'sc_beo',
    action: 'approve',
    category: 'sales_catering',
    description: 'Approve BEOs',
  },
  { resource: 'sc_beo', action: 'sign', category: 'sales_catering', description: 'Sign BEOs' },
  {
    resource: 'sc_catalog',
    action: 'manage',
    category: 'sales_catering',
    description: 'Manage venues, menus, AV, setups, decor',
  },

  // CRM permissions
  {
    resource: 'crm',
    action: 'read',
    category: 'crm',
    description: 'View CRM guest 360, segments, follow-ups',
  },
  {
    resource: 'crm',
    action: 'manage',
    category: 'crm',
    description: 'Edit CRM tags, notes, segments, follow-ups, corporate accounts',
  },

  // Support permissions
  {
    resource: 'ticket',
    action: 'read',
    category: 'support',
    description: 'View support tickets and threads',
  },
  {
    resource: 'ticket',
    action: 'update',
    category: 'support',
    description: 'Reply, change status, assign tickets',
  },
  {
    resource: 'ticket',
    action: 'manage',
    category: 'support',
    description: 'Create/edit/delete tickets, internal notes',
  },

  // AR permissions
  {
    resource: 'ar',
    action: 'read',
    category: 'billing',
    description: 'View AR accounts, invoices, payments, aging',
  },
  {
    resource: 'ar',
    action: 'manage',
    category: 'billing',
    description: 'Create/edit AR invoices, record payments',
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
      'room_type:create',
      'room_type:read',
      'room_type:update',
      'room_type:delete',
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
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
      'task:assign',
      'task_rule:read',
      'task_rule:manage',
      'group:create',
      'group:read',
      'group:update',
      'group:delete',
      'crm:read',
      'crm:manage',
      'inventory:view',
      'inventory:adjust',
      'ticket:read',
      'ticket:update',
      'ticket:manage',
      'ar:read',
      'ar:manage',
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
      'task:read',
      'task:update',
      'task:assign',
      'task_rule:read',
      'group:create',
      'group:read',
      'group:update',
      'crm:read',
      'crm:manage',
      'inventory:view',
      'inventory:adjust',
      'ticket:read',
      'ticket:update',
      'ticket:manage',
      'ar:read',
      'ar:manage',
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
      'housekeeping:read',
      'housekeeping:update',
      'task:read',
      'task:update',
      'loyalty:read',
      'loyalty:update',
      'group:read',
      'crm:read',
      'inventory:view',
      'ticket:read',
      'ticket:update',
      'ar:read',
    ],
  },
  {
    name: 'Housekeeper',
    type: 'system',
    isDefault: false,
    isLocked: false,
    description: 'Update room cleaning status and view assignments.',
    permissions: [
      'room:read',
      'housekeeping:read',
      'housekeeping:update',
      'inventory:view',
      'ticket:read',
      'ticket:update',
    ],
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
              create: guestNotes.map((body) => ({ body, tenantId: tenant.id })),
            }
          : undefined,
      },
      create: {
        tenantId: tenant.id,
        ...fields,
        ...(createdAt ? { createdAt } : {}),
        preferences: { create: preferences ?? [] },
        documents: { create: documents ?? [] },
        guestNotes: { create: (guestNotes ?? []).map((body) => ({ body, tenantId: tenant.id })) },
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

  // ─── T1: Task rules engine — 20 seeded generators (rows, not code) ───
  const TASK_RULES = [
    {
      key: 'dirty-room-on-departure',
      name: 'Dirty room on departure',
      department: 'housekeeping',
      trigger: { type: 'schedule', everyMinutes: 5 },
      action: {
        title: 'Clean room {{roomNumber}} (departed {{guestName}})',
        priority: 'normal',
        slaMinutes: 240,
        dedupe: 'open',
      },
    },
    {
      key: 'arrival-not-inspected-by-12',
      name: 'Arrival not inspected by 12:00',
      department: 'housekeeping',
      trigger: { type: 'schedule', everyMinutes: 60 },
      action: {
        title: 'Inspect room {{roomNumber}} — {{guestName}} checked in uninspected',
        priority: 'high',
        slaMinutes: 120,
        dedupe: 'daily',
      },
    },
    {
      key: 'dnd-decision-16',
      name: 'DND decision at 16:00',
      department: 'housekeeping',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title: 'DND decision — room {{roomNumber}} ({{guestName}}): service or skip?',
        priority: 'normal',
        dedupe: 'daily',
      },
    },
    {
      key: 'no-show-call',
      name: 'No-show call',
      department: 'front_desk',
      trigger: { type: 'schedule', everyMinutes: 60 },
      action: {
        title: 'Call no-show guest {{guestName}} ({{confirmationNumber}}) — {{guestPhone}}',
        priority: 'high',
        slaMinutes: 180,
        dedupe: 'open',
      },
    },
    {
      key: 'unassigned-room-16',
      name: 'Unassigned room at 16:00',
      department: 'front_desk',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title: 'Assign room — {{guestName}} arriving today ({{confirmationNumber}}) has no room',
        priority: 'urgent',
        slaMinutes: 60,
        dedupe: 'daily',
      },
    },
    {
      key: 'deposit-t3-payment-request',
      name: 'Deposit T-3 payment request',
      department: 'front_desk',
      trigger: { type: 'schedule', everyMinutes: 360 },
      action: {
        title:
          'Send T-3 deposit request — {{guestName}} ({{confirmationNumber}}), balance R{{balance}}',
        description: 'Open Payment Requests and send the A2 hosted pay-now link.',
        priority: 'high',
        slaMinutes: 720,
        dedupe: 'open',
      },
    },
    {
      key: 'folio-settle-at-checkout',
      name: 'Folio settle at checkout',
      department: 'front_desk',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title:
          'Settle folio — {{guestName}} ({{confirmationNumber}}) departed with R{{folioBalance}} balance',
        priority: 'high',
        slaMinutes: 120,
        dedupe: 'open',
      },
    },
    {
      key: 'complaint-30min-sla',
      name: 'Complaint 30-min SLA (manual)',
      department: 'management',
      description:
        'Template — create the task manually (or via API) with slaMinutes=30 when a complaint lands.',
      trigger: { type: 'manual' },
      action: { title: 'Complaint — 30 min SLA', priority: 'urgent', slaMinutes: 30 },
    },
    {
      key: 'key-active-without-checkin',
      name: 'Key active without check-in',
      department: 'security',
      trigger: { type: 'schedule', everyMinutes: 15 },
      action: {
        title:
          'SECURITY: key active, no check-in — room {{roomNumber}} ({{guestName}}, {{confirmationNumber}})',
        priority: 'urgent',
        slaMinutes: 30,
        dedupe: 'open',
      },
    },
    {
      key: 'preventive-maintenance',
      name: 'Preventive maintenance round',
      department: 'maintenance',
      trigger: { type: 'schedule', everyMinutes: 1440 },
      action: {
        title:
          'Preventive maintenance — {{propertyName}} (generator, fire, lifts, loadshedding gear)',
        priority: 'normal',
        slaMinutes: 4320,
        dedupe: 'once',
      },
    },
    {
      key: 'night-audit-not-rolled-04',
      name: 'Night audit not rolled (04:00)',
      department: 'management',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title:
          'Business date NOT rolled — {{propertyName}} has no completed night audit for {{businessDate}}',
        priority: 'urgent',
        slaMinutes: 60,
        dedupe: 'daily',
      },
    },
    {
      key: 'compliance-cert-expiry',
      name: 'Compliance certificate expiry',
      department: 'management',
      trigger: { type: 'schedule', everyMinutes: 1440 },
      config: {
        certs: [
          {
            name: 'Fire safety certificate',
            expiryDate: new Date(Date.now() + 21 * 86400_000).toISOString().slice(0, 10),
          },
          {
            name: 'Liquor licence',
            expiryDate: new Date(Date.now() + 45 * 86400_000).toISOString().slice(0, 10),
          },
          {
            name: 'Health certificate',
            expiryDate: new Date(Date.now() + 12 * 86400_000).toISOString().slice(0, 10),
          },
        ],
      },
      action: {
        title: 'Renew {{certName}} — expires {{expiryDate}}',
        priority: 'high',
        slaMinutes: 10080,
        dedupe: 'daily',
      },
    },
    {
      key: 'overbooking-decision',
      name: 'Overbooking decision to GM',
      department: 'management',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title:
          'OVERBOOKED: {{propertyName}} — {{arrivalsTonight}} arrivals vs {{roomsAvailable}} rooms tonight',
        priority: 'urgent',
        slaMinutes: 120,
        dedupe: 'daily',
      },
    },
    {
      key: 'special-request-prep',
      name: 'Special-request prep',
      department: 'concierge',
      trigger: { type: 'schedule', everyMinutes: 360 },
      action: {
        title: 'Prep special request — {{guestName}} ({{confirmationNumber}}): {{specialRequest}}',
        priority: 'normal',
        slaMinutes: 720,
        dedupe: 'daily',
      },
    },
    {
      key: 'repeat-vip-prep',
      name: 'Repeat-VIP prep',
      department: 'concierge',
      trigger: { type: 'schedule', everyMinutes: 360 },
      action: {
        title:
          'VIP prep — {{guestName}} ({{vipStatus}}, {{previousStays}} prior stays) arrives tomorrow',
        priority: 'high',
        slaMinutes: 720,
        dedupe: 'daily',
      },
    },
    {
      key: 'post-stay-recovery',
      name: 'Post-stay recovery',
      department: 'management',
      trigger: { type: 'schedule', everyMinutes: 720 },
      action: {
        title: 'Recovery call — {{guestName}} ({{confirmationNumber}}) departed unhappy',
        description: 'Folio carried a complaint marker. Call {{guestEmail}} and log outcome.',
        priority: 'high',
        slaMinutes: 1440,
        dedupe: 'once',
      },
    },
    {
      key: 'corporate-credit-limit-review',
      name: 'Corporate credit-limit review',
      department: 'management',
      trigger: { type: 'schedule', everyMinutes: 10080 },
      action: {
        title:
          'Credit review — {{guestName}}: {{openBalances}} open balances, R{{outstandingTotal}} outstanding',
        priority: 'normal',
        slaMinutes: 2880,
        dedupe: 'daily',
      },
    },
    {
      key: 'card-retry-failure',
      name: 'Card retry failure',
      department: 'front_desk',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title: 'Card failed — {{guestName}} ({{confirmationNumber}}): {{failureReason}}',
        priority: 'high',
        slaMinutes: 240,
        dedupe: 'once',
      },
    },
    {
      key: 'hk-dirty-3h-escalation',
      name: 'HK dirty-3h escalation',
      department: 'housekeeping',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title: 'ESCALATED: room {{roomNumber}} dirty >3h at {{propertyName}}',
        priority: 'urgent',
        slaMinutes: 60,
        dedupe: 'open',
      },
    },
    {
      key: 'inspection-fail-reclean',
      name: 'Inspection fail → re-clean',
      department: 'housekeeping',
      trigger: { type: 'schedule', everyMinutes: 30 },
      action: {
        title: 'Re-clean room {{roomNumber}} — inspection FAILED ({{inspectionNotes}})',
        priority: 'high',
        slaMinutes: 90,
        dedupe: 'daily',
      },
    },
  ];

  for (const r of TASK_RULES) {
    await prisma.taskRule.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: r.key } },
      update: {
        name: r.name,
        department: r.department,
        description: (r as { description?: string }).description ?? null,
        trigger: r.trigger as object,
        action: r.action as object,
        ...(r.config ? { config: r.config as object } : {}),
      },
      create: {
        tenantId: tenant.id,
        key: r.key,
        name: r.name,
        department: r.department,
        description: (r as { description?: string }).description ?? null,
        trigger: r.trigger as object,
        conditions: {},
        action: r.action as object,
        ...(r.config ? { config: r.config as object } : {}),
      },
    });
  }
  console.log(`Seeded ${TASK_RULES.length} task rules.`);

  // ─── T4: Parking — bays, guest vehicles, one arrival today with a car ───
  const PARKING_BAYS: { label: string; zone: string; evCharger?: boolean }[] = [
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `A-${String(i + 1).padStart(2, '0')}`,
      zone: 'standard',
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      label: `B-${String(i + 1).padStart(2, '0')}`,
      zone: 'standard',
    })),
    ...Array.from({ length: 3 }, (_, i) => ({ label: `EV-${i + 1}`, zone: 'ev', evCharger: true })),
    ...Array.from({ length: 2 }, (_, i) => ({ label: `ACC-${i + 1}`, zone: 'accessible' })),
    { label: 'VAL-1', zone: 'valet' },
  ];
  for (const b of PARKING_BAYS) {
    await prisma.parkingBay.upsert({
      where: { propertyId_label: { propertyId: property.id, label: b.label } },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        label: b.label,
        zone: b.zone,
        evCharger: b.evCharger ?? false,
      },
    });
  }

  const VEHICLE_SEEDS = [
    {
      guestKey: 'demo-guest-john',
      plate: 'ND 123 456',
      make: 'Toyota',
      model: 'Corolla',
      color: 'Silver',
      isPrimary: true,
    },
    {
      guestKey: 'demo-guest-013',
      plate: 'CA 789 012',
      make: 'VW',
      model: 'Golf GTI',
      color: 'Blue',
      isPrimary: true,
    },
    {
      guestKey: 'demo-guest-003',
      plate: 'CLM 45 67',
      make: 'BMW',
      model: 'X3',
      color: 'White',
      isPrimary: true,
      isElectric: true,
    },
    {
      guestKey: 'demo-guest-015',
      plate: 'KA 55 890',
      make: 'Hyundai',
      model: 'Kona EV',
      color: 'Red',
      isPrimary: true,
      isElectric: true,
    },
  ];
  for (const v of VEHICLE_SEEDS) {
    const guest = guestMap.get(v.guestKey);
    if (!guest) continue;
    const { guestKey, ...veh } = v;
    await prisma.guestVehicle.upsert({
      where: { tenantId_plate: { tenantId: tenant.id, plate: v.plate } },
      update: { guestId: guest.id },
      create: { tenantId: tenant.id, guestId: guest.id, ...veh },
    });
  }

  // Same-day arrival with a vehicle on file — makes the board light up
  // immediately (auto-assign has something to assign).
  const parkGuest = await prisma.guest.upsert({
    where: { id: 'demo-guest-park-1' },
    update: {},
    create: {
      id: 'demo-guest-park-1',
      tenantId: tenant.id,
      firstName: 'Nandi',
      lastName: 'Dlamini',
      email: 'nandi.d@example.co.za',
      phone: '+27 84 555 0999',
    },
  });
  await prisma.guestVehicle.upsert({
    where: { tenantId_plate: { tenantId: tenant.id, plate: 'NPN 2468' } },
    update: { guestId: parkGuest.id },
    create: {
      tenantId: tenant.id,
      guestId: parkGuest.id,
      plate: 'NPN 2468',
      make: 'Audi',
      model: 'A3',
      color: 'Grey',
      isPrimary: true,
    },
  });
  await prisma.reservation.upsert({
    where: { confirmationNumber: 'DEMO-PARK-1' },
    update: {
      arrivalDate: daysFromNow(0),
      departureDate: daysFromNow(2),
      status: 'confirmed',
    },
    create: {
      tenantId: tenant.id,
      propertyId: property.id,
      guestId: parkGuest.id,
      confirmationNumber: 'DEMO-PARK-1',
      status: 'confirmed',
      source: 'direct',
      arrivalDate: daysFromNow(0),
      departureDate: daysFromNow(2),
      nights: 2,
      adults: 2,
      totalAmount: 378,
      balance: 378,
    },
  });
  console.log('Seeded parking bays, guest vehicles and a same-day arrival.');

  // ─── C1: Chains + chain-admin — one login sees a 4-property group ───
  const CHAIN_ADMIN_PERMS = [
    'property:read',
    'property:create',
    'property:update',
    'reservation:create',
    'reservation:read',
    'reservation:update',
    'reservation:checkin',
    'reservation:checkout',
    'guest:create',
    'guest:read',
    'guest:update',
    'room:read',
    'room:update',
    'folio:create',
    'folio:read',
    'folio:payment',
    'rate_plan:read',
    'housekeeping:read',
    'housekeeping:update',
    'task:read',
    'task:update',
    'report:read',
    'night_audit:read',
    'notification:read',
    'loyalty:read',
    'channel:read',
    'sms:read',
  ];

  let chainAdminRole = await prisma.role.findFirst({
    where: { name: 'Chain Admin', tenantId: null },
  });
  if (!chainAdminRole) {
    chainAdminRole = await prisma.role.create({
      data: {
        name: 'Chain Admin',
        description:
          'Operates every property in a chain from one login. Full operations access across properties; no user or settings admin.',
        type: 'system',
        isDefault: false,
        isLocked: true,
      },
    });
  }
  for (const key of CHAIN_ADMIN_PERMS) {
    const [resource, action] = key.split(':');
    const perm = await prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: chainAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: chainAdminRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('Chain Admin role seeded.');

  // Demo chain: Demo Coast Group — 4 properties around Durban
  const chain = await prisma.chain.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'demo-coast' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Demo Coast Group', slug: 'demo-coast' },
  });

  const CHAIN_PROPERTIES = [
    { name: 'Umhlanga Sands Hotel', code: 'DEMO-02', city: 'Umhlanga' },
    { name: 'Ballito Bay Lodge', code: 'DEMO-03', city: 'Ballito' },
    { name: 'Durban North Terrace', code: 'DEMO-04', city: 'Durban North' },
    { name: 'Glenwood Guest House', code: 'DEMO-05', city: 'Glenwood' },
  ];
  const chainPropertyIds: string[] = [];
  for (const p of CHAIN_PROPERTIES) {
    const prop = await prisma.property.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: p.code } },
      update: { chainId: chain.id },
      create: {
        tenantId: tenant.id,
        chainId: chain.id,
        name: p.name,
        code: p.code,
        city: p.city,
        country: 'ZA',
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
      },
    });
    chainPropertyIds.push(prop.id);
  }
  console.log(`Chain "${chain.name}" seeded with ${chainPropertyIds.length} properties.`);

  // Chain admin user — one login, all 4 sites
  const chainAdminPasswordHash = await bcrypt.hash('chainadmin123', 10);
  const chainAdminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'chainadmin@demo.com' } },
    update: { passwordHash: chainAdminPasswordHash, lastPropertyId: chainPropertyIds[0] },
    create: {
      tenantId: tenant.id,
      email: 'chainadmin@demo.com',
      passwordHash: chainAdminPasswordHash,
      firstName: 'Chain',
      lastName: 'Admin',
      role: 'chain_admin',
      lastPropertyId: chainPropertyIds[0],
    },
  });
  const existingAssignment = await prisma.roleAssignment.findFirst({
    where: { userId: chainAdminUser.id, roleId: chainAdminRole.id, propertyId: null },
  });
  if (!existingAssignment) {
    await prisma.roleAssignment.create({
      data: { userId: chainAdminUser.id, roleId: chainAdminRole.id, propertyId: null },
    });
  }
  console.log('Chain admin user seeded (chainadmin@demo.com / chainadmin123).');

  // ─── S&C: demo catalog + one client/event/BEO chain ───
  const venue = await prisma.venue.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BALLROOM' } },
    update: {},
    create: {
      tenantId: tenant.id,
      propertyId: property.id,
      name: 'Grand Ballroom',
      code: 'BALLROOM',
      capacity: 300,
      areaSqm: 465,
      rentalPrice: 2500,
      features: ['Stage', 'Dance Floor', 'Natural Light'],
    },
  });
  const menu = await prisma.menuPackage.upsert({
    where: { id: 'demo-sc-menu-plated' },
    update: {},
    create: {
      id: 'demo-sc-menu-plated',
      tenantId: tenant.id,
      name: 'Plated Premium',
      pricePerPerson: 85,
      description: '3-course plated dinner with premium proteins',
      courses: [
        { course: 'First', items: ['Heirloom Tomato Salad (V)', 'Shrimp Cocktail'] },
        { course: 'Main', items: ['Filet Mignon', 'Pan-Seared Salmon'] },
        { course: 'Dessert', items: ['Chocolate Lava Cake'] },
      ],
      includes: ['Coffee & Tea', 'Dinner Rolls', 'Service Staff'],
    },
  });
  const av = await prisma.avPackage.upsert({
    where: { id: 'demo-sc-av-std' },
    update: {},
    create: {
      id: 'demo-sc-av-std',
      tenantId: tenant.id,
      name: 'Standard AV',
      price: 600,
      description: 'Dual projectors, screens, 2 wireless mics, podium',
      items: [
        'Dual Projectors & Screens',
        '2 Wireless Microphones',
        'Enhanced Sound System',
        'Podium with Mic',
      ],
    },
  });
  const setup = await prisma.setupStyle.upsert({
    where: { id: 'demo-sc-setup-banquet' },
    update: {},
    create: {
      id: 'demo-sc-setup-banquet',
      tenantId: tenant.id,
      name: 'Banquet Rounds',
      price: 200,
    },
  });
  await prisma.decorOption.upsert({
    where: { id: 'demo-sc-decor-center' },
    update: {},
    create: {
      id: 'demo-sc-decor-center',
      tenantId: tenant.id,
      name: 'Floral Centerpieces',
      price: 45,
      unit: 'each',
    },
  });

  const scClient = await prisma.scClient.upsert({
    where: { id: 'demo-sc-client-1' },
    update: {},
    create: {
      id: 'demo-sc-client-1',
      tenantId: tenant.id,
      name: 'Acme Corporation',
      type: 'corporate',
      primaryContact: 'Sarah Williams',
      email: 's.williams@acme.com',
      tags: ['Repeat Client', 'Net-30'],
    },
  });
  const scEvent = await prisma.scEvent.upsert({
    where: { id: 'demo-sc-event-1' },
    update: {},
    create: {
      id: 'demo-sc-event-1',
      tenantId: tenant.id,
      propertyId: property.id,
      clientId: scClient.id,
      name: 'Q4 Leadership Offsite',
      type: 'corporate',
      status: 'quoted',
      eventDate: daysFromNow(21),
      guestCount: 40,
      budget: 12800,
      probability: 60,
    },
  });
  await prisma.beo.upsert({
    where: { id: 'demo-sc-beo-1' },
    update: {},
    create: {
      id: 'demo-sc-beo-1',
      tenantId: tenant.id,
      eventId: scEvent.id,
      version: 1,
      status: 'draft',
      title: 'Q4 Leadership Offsite — BEO',
      eventDate: daysFromNow(21),
      startTime: '09:00',
      endTime: '17:00',
      guestCount: 40,
      venueId: venue.id,
      setupId: setup.id,
      menuId: menu.id,
      avId: av.id,
    },
  });
  console.log('S&C catalog + demo chain seeded.');

  // ─── T7: Meal plans + restaurants — matches the Meal Plans page seed data ───
  const restaurant = await prisma.restaurant.upsert({
    where: { propertyId_name: { propertyId: property.id, name: 'The Garden Restaurant' } },
    update: {},
    create: {
      tenantId: tenant.id,
      propertyId: property.id,
      name: 'The Garden Restaurant',
      type: 'main',
      cuisine: 'International',
      capacity: 120,
      operatingHours: '06:00 - 22:00',
    },
  });

  const MEAL_PLAN_SEEDS = [
    {
      name: 'Standard Breakfast',
      code: 'BB-STD',
      boardBasis: 'BB',
      price: 25,
      description: 'Continental and hot breakfast buffet',
      inclusions: ['Continental buffet', 'Hot station', 'Coffee & tea', 'Fresh juice'],
      exclusions: ['Alcoholic beverages', 'Room service'],
      postTime: '06:00',
    },
    {
      name: 'Half Board Premium',
      code: 'HB-PREM',
      boardBasis: 'HB',
      price: 65,
      description: 'Breakfast buffet + 3-course dinner',
      inclusions: ['Breakfast buffet', '3-course dinner', 'House wine with dinner', 'Coffee & tea'],
      exclusions: ['Premium spirits', 'Room service', 'Minibar'],
      postTime: '18:00',
    },
    {
      name: 'Full Board Family',
      code: 'FB-FAM',
      boardBasis: 'FB',
      price: 89,
      description: 'All meals included — perfect for families',
      inclusions: [
        'Breakfast buffet',
        'Lunch buffet',
        'Dinner buffet',
        'Soft drinks with meals',
        'Kids menu',
      ],
      exclusions: ['Alcoholic beverages', 'Room service', 'Minibar'],
      postTime: '12:00',
    },
  ];

  for (const mp of MEAL_PLAN_SEEDS) {
    await prisma.mealPlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: mp.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        propertyId: property.id,
        restaurantId: restaurant.id,
        autoPost: true,
        childUnder6: 'free',
        childUnder12: '50',
        childUnder16: '75',
        ...mp,
      },
    });
  }
  console.log(`Seeded ${MEAL_PLAN_SEEDS.length} meal plans + 1 restaurant.`);

  // Attach BB-STD to the in-house breakfast guest so the board lights up.
  const breakfastPlan = await prisma.mealPlan.findUnique({
    where: { propertyId_code: { propertyId: property.id, code: 'BB-STD' } },
  });
  const johnInHouse = await prisma.reservation.findUnique({
    where: { confirmationNumber: 'DEMO-4101' },
  });
  if (breakfastPlan && johnInHouse) {
    await prisma.mealPlanAssignment.upsert({
      where: { id: 'demo-meal-assign-1' },
      update: {},
      create: {
        id: 'demo-meal-assign-1',
        tenantId: tenant.id,
        reservationId: johnInHouse.id,
        mealPlanId: breakfastPlan.id,
        startDate: johnInHouse.arrivalDate,
        endDate: johnInHouse.departureDate,
        adults: johnInHouse.adults,
        children: johnInHouse.children,
        dailyRate: 25 * johnInHouse.adults,
      },
    });
  }
  console.log('meals have been seeded.');

  // ─── AR: two corporate accounts with live invoices + a payment ───
  const arAccount1 = await prisma.corporateAccount.upsert({
    where: { id: 'demo-ar-acct-1' },
    update: {},
    create: {
      id: 'demo-ar-acct-1',
      tenantId: tenant.id,
      name: 'Horizon Logistics (Pty) Ltd',
      contactName: 'Michael Chen',
      email: 'ap@horizonlogistics.co.za',
      billingEmail: 'ap@horizonlogistics.co.za',
      taxNumber: '4123456789',
      creditLimit: 50000,
      paymentTermsDays: 30,
    },
  });
  await prisma.corporateAccount.upsert({
    where: { id: 'demo-ar-acct-2' },
    update: {},
    create: {
      id: 'demo-ar-acct-2',
      tenantId: tenant.id,
      name: 'Blue Crane Events',
      contactName: 'Naledi Dube',
      email: 'finance@bluecrane.co.za',
      billingEmail: 'finance@bluecrane.co.za',
      creditLimit: 15000,
      paymentTermsDays: 14,
    },
  });

  const arInvoiceSeeds = [
    {
      id: 'demo-ar-inv-1',
      accountId: arAccount1.id,
      number: 'AR-INV-000001',
      subtotal: 8200,
      dueOffset: -45, // overdue → 45 days past due, lands in 31–60 bucket
      items: [
        { description: 'Corporate room block — Oct (12 rooms × 5 nights)', amount: 7500 },
        { description: 'Conference room hire — 3 days', amount: 700 },
      ],
    },
    {
      id: 'demo-ar-inv-2',
      accountId: arAccount1.id,
      number: 'AR-INV-000002',
      subtotal: 3240,
      dueOffset: 10, // not yet due
      items: [{ description: 'Master folio — DEMO-4401 group incidentals', amount: 3240 }],
    },
    {
      id: 'demo-ar-inv-3',
      accountId: 'demo-ar-acct-2',
      number: 'AR-INV-000003',
      subtotal: 1895,
      dueOffset: -20, // partially paid, 20 days past due
      items: [{ description: 'Wedding block — BEO catering balance', amount: 1895 }],
    },
  ];

  for (const s of arInvoiceSeeds) {
    const vat = Math.round(s.subtotal * 0.15 * 100) / 100;
    const total = Math.round((s.subtotal + vat) * 100) / 100;
    await prisma.arInvoice.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        tenantId: tenant.id,
        corporateAccountId: s.accountId,
        number: s.number,
        status: 'sent',
        subtotal: s.subtotal,
        vatRate: 15,
        vatAmount: vat,
        total,
        amountPaid: s.id === 'demo-ar-inv-3' ? 1000 : 0,
        ...(s.id === 'demo-ar-inv-3' ? { status: 'partially_paid' } : {}),
        issueDate: new Date(Date.now() - 30 * 86400_000),
        dueDate: new Date(Date.now() + s.dueOffset * 86400_000),
        sentAt: new Date(Date.now() - 30 * 86400_000),
        items: {
          create: s.items.map((i) => ({
            description: i.description,
            amount: i.amount,
            date: new Date(Date.now() - 30 * 86400_000),
          })),
        },
      },
    });
  }
  await prisma.arInvoiceCounter.upsert({
    where: { tenantId: tenant.id },
    update: { lastNumber: 3 },
    create: { tenantId: tenant.id, lastNumber: 3 },
  });
  console.log('AR accounts + invoices seeded.');

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
