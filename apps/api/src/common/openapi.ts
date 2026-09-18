/* apps/api/src/common/openapi.ts */
import { z } from 'zod';
import { extendZodWithOpenApi, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import * as authModule from '../modules/auth/auth.routes.js';
import * as propertiesModule from '../modules/properties/properties.routes.js';
import * as guestsModule from '../modules/guests/guests.routes.js';
import * as reservationsModule from '../modules/reservations/reservations.routes.js';
import * as roomsModule from '../modules/rooms/rooms.routes.js';
import * as roomTypesModule from '../modules/room-types/room-types.routes.js';
import * as ratesModule from '../modules/rates/rates.routes.js';
import * as foliosModule from '../modules/folios/folios.routes.js';
import * as channelModule from '../modules/channel/channel.routes.js';
import * as housekeepingModule from '../modules/housekeeping/housekeeping.routes.js';
import * as nightAuditModule from '../modules/night-audit/night-audit.routes.js';
import * as smsModule from '../modules/sms/sms.routes.js';
import * as guestPortalModule from '../modules/guest-portal/guest-portal.routes.js';
import * as healthModule from '../modules/health/health.routes.js';
import * as notificationModule from '../modules/notifications/notification.routes.js';
import * as apiKeyModule from '../modules/rbac/api-key.routes.js';
import * as rbacModule from '../modules/rbac/rbac.routes.js';
import * as pushModule from '../modules/push/push.routes.js';
import * as filesModule from '../modules/files/files.routes.js';
import * as adminModule from '../modules/admin/admin.routes.js';

extendZodWithOpenApi(z);

// ─── Shared Schemas (re-exported from the cycle-free schemas module) ───
export {
  ErrorResponseSchema,
  MessageResponseSchema,
  IdParamSchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
} from './openapi-schemas.js';

// ─── Registry Extractor ───
// Each route module exports a `registry` (OpenAPIRegistry). We support both
// direct exports and the case where the module is wrapped in a default export.
function getRegistry(mod: unknown): { definitions: any[] } | null {
  if (!mod || typeof mod !== 'object') return null;

  // Direct named export
  if ('registry' in mod && mod.registry && typeof (mod as any).registry === 'object') {
    return (mod as any).registry;
  }

  // Default export wrapper
  if ('default' in mod && (mod as any).default && typeof (mod as any).default === 'object') {
    const def = (mod as any).default;
    if ('registry' in def && def.registry) return def.registry;
  }

  // If the module itself IS the registry (duck-type check for definitions array)
  if ('definitions' in mod && Array.isArray((mod as any).definitions)) {
    return mod as any;
  }

  return null;
}

// ─── Document Generator ───
export function generateOpenAPIDocument() {
  const modules = [
    authModule,
    propertiesModule,
    guestsModule,
    reservationsModule,
    roomsModule,
    roomTypesModule,
    ratesModule,
    foliosModule,
    channelModule,
    housekeepingModule,
    nightAuditModule,
    smsModule,
    guestPortalModule,
    notificationModule,
    apiKeyModule,
    rbacModule,
    pushModule,
    healthModule,
    filesModule,
    adminModule,
  ];

  const allDefinitions: any[] = [];

  for (const mod of modules) {
    const registry = getRegistry(mod);
    if (registry && Array.isArray(registry.definitions)) {
      allDefinitions.push(...registry.definitions);
    }
  }

  const generator = new OpenApiGeneratorV3(allDefinitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Vimad PMS API',
      version: '0.0.0',
      description: 'Unified Property Management System API',
      contact: {
        name: 'Vimad Support',
        email: 'api@vimad.io',
      },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'https://api.vimad.io', description: 'Production' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Properties', description: 'Property management' },
      { name: 'Guests', description: 'Guest management' },
      { name: 'Reservations', description: 'Reservation management' },
      { name: 'Rooms', description: 'Room management' },
      { name: 'Room Types', description: 'Room type management' },
      { name: 'Rates', description: 'Rate plan management' },
      { name: 'Folios', description: 'Folio & billing management' },
      { name: 'Channel', description: 'Channel manager integrations' },
      { name: 'Housekeeping', description: 'Housekeeping task management' },
      { name: 'Night Audit', description: 'Night audit operations' },
      { name: 'SMS', description: 'SMS messaging' },
      { name: 'Guest Portal', description: 'Guest self-service portal' },
      { name: 'Health', description: 'System health checks' },
      { name: 'Notifications', description: 'Real-time notifications' },
      { name: 'API Keys', description: 'API key management' },
      { name: 'RBAC', description: 'Roles, permissions, and role assignments' },
      { name: 'Push', description: 'Web Push subscriptions & notifications' },
      { name: 'Files', description: 'File downloads and storage' },
      { name: 'Admin', description: 'Platform admin dashboard endpoints' },
    ],
  });
}
