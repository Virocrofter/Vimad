import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createGuest,
  createGuestDocument,
  createGuestNote,
  createGuestPreference,
  deleteGuest,
  deleteGuestDocument,
  deleteGuestNote,
  deleteGuestPreference,
  getGuest,
  getGuestStats,
  guestCreateSchema,
  guestDocumentSchema,
  guestMergeSchema,
  guestNoteCreateSchema,
  guestPreferenceSchema,
  guestUpdateSchema,
  listGuests,
  listGuestNotes,
  mergeGuests,
  updateGuest,
  type GuestCreateInput,
  type GuestDocumentInput,
  type GuestListQuery,
  type GuestMergeInput,
  type GuestNoteCreateInput,
  type GuestPreferenceInput,
  type GuestUpdateInput,
} from './guests.service.js';
import { attachPropertyScope } from '../auth/auth.middleware.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const guestQuerySchema = paginationSchema
  .extend({
    search: z.string().optional(),
    vipStatus: z.string().optional(),
    blacklisted: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['firstName', 'lastName', 'email', 'vipStatus', 'createdAt']).optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  })
  .openapi('GuestQuery');
const GuestCreateInputSchema = guestCreateSchema.openapi('GuestCreateInput');
const GuestUpdateInputSchema = guestUpdateSchema.openapi('GuestUpdateInput');
const GuestNoteInputSchema = guestNoteCreateSchema.openapi('GuestNoteInput');
const GuestPreferenceInputSchema = guestPreferenceSchema.openapi('GuestPreferenceInput');
const GuestDocumentInputSchema = guestDocumentSchema.openapi('GuestDocumentInput');
const GuestMergeInputSchema = guestMergeSchema.openapi('GuestMergeInput');

const GuestItemSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.date().or(z.string()).optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    passportNumber: z.string().optional(),
    vipStatus: z.string().optional(),
    doNotDisturb: z.boolean().optional(),
    blacklisted: z.boolean().optional(),
    blacklistReason: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('GuestItem');

const GuestStatsSchema = z
  .object({
    total: z.number(),
    vip: z.number(),
    newThisMonth: z.number(),
    inHouse: z.number(),
    blacklisted: z.number(),
  })
  .openapi('GuestStats');

const GuestNoteSchema = z
  .object({
    id: z.string(),
    guestId: z.string(),
    authorId: z.string().optional(),
    body: z.string(),
    createdAt: z.date().or(z.string()),
  })
  .openapi('GuestNote');

const GuestPreferenceSchema = z
  .object({
    id: z.string(),
    guestId: z.string(),
    category: z.string(),
    key: z.string(),
    value: z.string(),
  })
  .openapi('GuestPreference');

const GuestDocumentSchema = z
  .object({
    id: z.string(),
    guestId: z.string(),
    type: z.string(),
    number: z.string().optional(),
    issuedBy: z.string().optional(),
    issueDate: z.date().or(z.string()).optional(),
    expiryDate: z.date().or(z.string()).optional(),
    fileUrl: z.string().optional(),
  })
  .openapi('GuestDocument');

const GuestMergeResultSchema = z
  .object({
    target: GuestItemSchema,
    movedReservations: z.number(),
    movedNotes: z.number(),
    movedPreferences: z.number(),
    movedDocuments: z.number(),
    movedLoyaltyTransactions: z.number(),
  })
  .openapi('GuestMergeResult');

const GuestResponseSchema = z.object({ data: GuestItemSchema }).openapi('GuestResponse');
const GuestListResponseSchema =
  PaginatedResponseSchema(GuestItemSchema).openapi('GuestListResponse');
const GuestStatsResponseSchema = z.object({ data: GuestStatsSchema }).openapi('GuestStatsResponse');
const GuestNotesResponseSchema = z
  .object({ data: z.array(GuestNoteSchema) })
  .openapi('GuestNotesResponse');
const GuestPreferenceResponseSchema = z
  .object({ data: GuestPreferenceSchema })
  .openapi('GuestPreferenceResponse');
const GuestDocumentResponseSchema = z
  .object({ data: GuestDocumentSchema })
  .openapi('GuestDocumentResponse');
const GuestMergeResponseSchema = z
  .object({ data: GuestMergeResultSchema })
  .openapi('GuestMergeResponse');

export const guestsRouter = Router();

guestsRouter.use(authMiddleware, tenantScope);
guestsRouter.use(attachPropertyScope);

/** req.user is typed as {} in the global augmentation — read id through a cast */
function currentUserId(req: Request): string | undefined {
  return (req.user as { id?: string } | undefined)?.id;
}

// ─── GET /stats (must be registered before /:id) ───
registry.registerPath({
  method: 'get',
  path: '/stats',
  tags: ['Guests'],
  description: 'Guest statistics for the current tenant',
  responses: {
    200: {
      description: 'Guest stats',
      content: { 'application/json': { schema: GuestStatsResponseSchema } },
    },
  },
});

guestsRouter.get(
  '/stats',
  requirePermission('guest', 'read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getGuestStats(_req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET / ───
registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Guests'],
  description: 'List guests',
  request: { query: guestQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of guests',
      content: { 'application/json': { schema: GuestListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.get(
  '/',
  requirePermission('guest', 'read'),
  validateQuery(guestQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listGuests(
        req.tenantId,
        req.validatedQuery as GuestListQuery,
        req.effectivePropertyIds ?? undefined
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /:id ───
registry.registerPath({
  method: 'get',
  path: '/{id}',
  tags: ['Guests'],
  description: 'Get a guest by ID',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Guest details',
      content: { 'application/json': { schema: GuestResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.get(
  '/:id',
  requirePermission('guest', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getGuest(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST / ───
registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Guests'],
  description: 'Create a guest',
  request: {
    body: {
      description: 'Guest payload',
      content: { 'application/json': { schema: GuestCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Guest created',
      content: { 'application/json': { schema: GuestResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.post(
  '/',
  requirePermission('guest', 'create'),
  validateBody(guestCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuest(req.tenantId, req.validatedBody as GuestCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /:id ───
registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Guests'],
  description: 'Update a guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Guest update payload',
      content: { 'application/json': { schema: GuestUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Guest updated',
      content: { 'application/json': { schema: GuestResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.patch(
  '/:id',
  requirePermission('guest', 'update'),
  validateBody(guestUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateGuest(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /:id ───
registry.registerPath({
  method: 'delete',
  path: '/{id}',
  tags: ['Guests'],
  description: 'Delete a guest (blocked if reservation history exists)',
  request: { params: IdParamSchema },
  responses: {
    204: { description: 'Guest deleted' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Guest has reservation history',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.delete(
  '/:id',
  requirePermission('guest', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteGuest(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /:id/merge ───
registry.registerPath({
  method: 'post',
  path: '/{id}/merge',
  tags: ['Guests'],
  description: 'Merge a duplicate guest profile into another guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Merge payload',
      content: { 'application/json': { schema: GuestMergeInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Merge completed',
      content: { 'application/json': { schema: GuestMergeResponseSchema } },
    },
    400: {
      description: 'Invalid merge',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.post(
  '/:id/merge',
  requirePermission('guest', 'update'),
  validateBody(guestMergeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mergeGuests(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestMergeInput,
        currentUserId(req)
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /:id/notes ───
registry.registerPath({
  method: 'get',
  path: '/{id}/notes',
  tags: ['Guests'],
  description: 'List notes for a guest',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Guest notes',
      content: { 'application/json': { schema: GuestNotesResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.get(
  '/:id/notes',
  requirePermission('guest', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listGuestNotes(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /:id/notes ───
registry.registerPath({
  method: 'post',
  path: '/{id}/notes',
  tags: ['Guests'],
  description: 'Add a note to a guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Note payload',
      content: { 'application/json': { schema: GuestNoteInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Note created',
      content: { 'application/json': { schema: GuestNotesResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.post(
  '/:id/notes',
  requirePermission('guest', 'update'),
  validateBody(guestNoteCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuestNote(
        req.tenantId,
        req.params.id,
        currentUserId(req),
        req.validatedBody as GuestNoteCreateInput
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /:id/notes/:noteId ───
registry.registerPath({
  method: 'delete',
  path: '/{id}/notes/{noteId}',
  tags: ['Guests'],
  description: 'Delete a guest note',
  request: {
    params: IdParamSchema.extend({ noteId: z.string() }),
  },
  responses: {
    204: { description: 'Note deleted' },
    404: {
      description: 'Note not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.delete(
  '/:id/notes/:noteId',
  requirePermission('guest', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteGuestNote(req.tenantId, req.params.id, req.params.noteId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /:id/preferences ───
registry.registerPath({
  method: 'post',
  path: '/{id}/preferences',
  tags: ['Guests'],
  description: 'Add a preference to a guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Preference payload',
      content: { 'application/json': { schema: GuestPreferenceInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Preference created',
      content: { 'application/json': { schema: GuestPreferenceResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.post(
  '/:id/preferences',
  requirePermission('guest', 'update'),
  validateBody(guestPreferenceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuestPreference(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestPreferenceInput
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /:id/preferences/:prefId ───
registry.registerPath({
  method: 'delete',
  path: '/{id}/preferences/{prefId}',
  tags: ['Guests'],
  description: 'Delete a guest preference',
  request: {
    params: IdParamSchema.extend({ prefId: z.string() }),
  },
  responses: {
    204: { description: 'Preference deleted' },
    404: {
      description: 'Preference not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.delete(
  '/:id/preferences/:prefId',
  requirePermission('guest', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteGuestPreference(req.tenantId, req.params.id, req.params.prefId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /:id/documents ───
registry.registerPath({
  method: 'post',
  path: '/{id}/documents',
  tags: ['Guests'],
  description: 'Add a document to a guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Document payload',
      content: { 'application/json': { schema: GuestDocumentInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Document created',
      content: { 'application/json': { schema: GuestDocumentResponseSchema } },
    },
    404: {
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.post(
  '/:id/documents',
  requirePermission('guest', 'update'),
  validateBody(guestDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuestDocument(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestDocumentInput
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /:id/documents/:docId ───
registry.registerPath({
  method: 'delete',
  path: '/{id}/documents/{docId}',
  tags: ['Guests'],
  description: 'Delete a guest document',
  request: {
    params: IdParamSchema.extend({ docId: z.string() }),
  },
  responses: {
    204: { description: 'Document deleted' },
    404: {
      description: 'Document not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.delete(
  '/:id/documents/:docId',
  requirePermission('guest', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteGuestDocument(req.tenantId, req.params.id, req.params.docId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
