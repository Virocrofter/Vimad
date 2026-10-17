/* apps/api/src/modules/sales-catering/sales-catering.routes.ts */
import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../../common/validate.js';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import * as svc from './sales-catering.service.js';

export const salesCateringRouter = Router();
salesCateringRouter.use(authMiddleware);

const idParams = z.object({ id: z.string() });

// ─── Catalogs (mounted at /catalog/:kind) — read: sc_event:read, write: sc_catalog:manage ───

const catalogKeys = ['venues', 'menus', 'av-packages', 'setups', 'decor'] as const;
const catalogBody = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    capacity: z.number().int().optional(),
    areaSqm: z.number().int().optional(),
    rentalPrice: z.number().optional(),
    pricePerPerson: z.number().optional(),
    price: z.number().optional(),
    description: z.string().optional(),
    courses: z.array(z.any()).optional(),
    includes: z.array(z.string()).optional(),
    items: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    unit: z.string().optional(),
    icon: z.string().optional(),
    propertyId: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

salesCateringRouter.get(
  '/catalog/:kind',
  requirePermission('sc_event', 'read'),
  async (req, res, next) => {
    try {
      const kind = req.params.kind as any;
      if (!catalogKeys.includes(kind)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown catalog' } });
        return;
      }
      res.json({ data: await svc.listCatalog(req.auth!.tenantId, kind) });
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/catalog/:kind',
  requirePermission('sc_catalog', 'manage'),
  validateBody(catalogBody),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await svc.createCatalogItem(req.auth!.tenantId, req.params.kind as any, req.validatedBody)
        );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.patch(
  '/catalog/:kind/:id',
  requirePermission('sc_catalog', 'manage'),
  validateParams(idParams),
  validateBody(catalogBody),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateCatalogItem(
          req.auth!.tenantId,
          req.params.kind as any,
          req.params.id,
          req.validatedBody
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.delete(
  '/catalog/:kind/:id',
  requirePermission('sc_catalog', 'manage'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(
        await svc.deleteCatalogItem(req.auth!.tenantId, req.params.kind as any, req.params.id)
      );
    } catch (e) {
      next(e);
    }
  }
);

// ─── Clients ───

const clientBody = z
  .object({
    name: z.string().min(1),
    type: z.enum(['corporate', 'wedding', 'social', 'nonprofit', 'individual']).optional(),
    primaryContact: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    accountManagerId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

salesCateringRouter.get(
  '/clients',
  requirePermission('sc_client', 'read'),
  validateQuery(z.object({ q: z.string().optional() })),
  async (req, res, next) => {
    try {
      res.json({
        data: await svc.listClients(req.auth!.tenantId, (req.validatedQuery as any).q ?? ''),
      });
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.get(
  '/clients/:id',
  requirePermission('sc_client', 'read'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(await svc.getClient(req.auth!.tenantId, req.params.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/clients',
  requirePermission('sc_client', 'create'),
  validateBody(clientBody),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await svc.createClient(req.auth!.tenantId, req.validatedBody, req.auth!.user!.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.patch(
  '/clients/:id',
  requirePermission('sc_client', 'update'),
  validateParams(idParams),
  validateBody(clientBody.partial()),
  async (req, res, next) => {
    try {
      res.json(await svc.updateClient(req.auth!.tenantId, req.params.id, req.validatedBody));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.delete(
  '/clients/:id',
  requirePermission('sc_client', 'delete'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(await svc.deleteClient(req.auth!.tenantId, req.params.id));
    } catch (e) {
      next(e);
    }
  }
);

// ─── Events ───

const eventBody = z
  .object({
    name: z.string().min(1),
    type: z.enum(['wedding', 'corporate', 'social', 'conference', 'banquet']).optional(),
    status: z
      .enum([
        'lead',
        'quoted',
        'contracted',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'lost',
      ])
      .optional(),
    eventDate: z.string().or(z.date()),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    guestCount: z.number().int().min(0).optional(),
    budget: z.number().optional(),
    clientId: z.string().optional(),
    propertyId: z.string().optional(),
    ownerId: z.string().optional(),
    probability: z.number().int().min(0).max(100).optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    lostReason: z.string().optional(),
  })
  .passthrough();

salesCateringRouter.get('/stats', requirePermission('sc_event', 'read'), async (req, res, next) => {
  try {
    res.json(await svc.pipelineStats(req.auth!.tenantId));
  } catch (e) {
    next(e);
  }
});

salesCateringRouter.get(
  '/events',
  requirePermission('sc_event', 'read'),
  validateQuery(
    z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      clientId: z.string().optional(),
    })
  ),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.listEvents(req.auth!.tenantId, req.validatedQuery as any) });
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.get(
  '/events/:id',
  requirePermission('sc_event', 'read'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(await svc.getEvent(req.auth!.tenantId, req.params.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/events',
  requirePermission('sc_event', 'create'),
  validateBody(eventBody),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await svc.createEvent(req.auth!.tenantId, req.validatedBody, req.auth!.user!.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.patch(
  '/events/:id',
  requirePermission('sc_event', 'update'),
  validateParams(idParams),
  validateBody(eventBody.partial()),
  async (req, res, next) => {
    try {
      res.json(
        await svc.updateEvent(
          req.auth!.tenantId,
          req.params.id,
          req.validatedBody,
          req.auth!.user!.id
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.delete(
  '/events/:id',
  requirePermission('sc_event', 'delete'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(await svc.deleteEvent(req.auth!.tenantId, req.params.id));
    } catch (e) {
      next(e);
    }
  }
);

// ─── BEOs ───

const beoBody = z
  .object({
    id: z.string().optional(),
    eventId: z.string(),
    title: z.string().optional(),
    eventDate: z.string().or(z.date()).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    guestCount: z.number().int().min(0).optional(),
    venueId: z.string().optional(),
    setupId: z.string().optional(),
    menuId: z.string().optional(),
    avId: z.string().optional(),
    priceOverrides: z.record(z.number()).optional(),
    additionalServices: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
    decor: z.array(z.object({ optionId: z.string(), qty: z.number().int().min(1) })).optional(),
    specialInstructions: z.string().optional(),
    logistics: z.record(z.any()).optional(),
  })
  .passthrough();

salesCateringRouter.get(
  '/beos',
  requirePermission('sc_beo', 'read'),
  validateQuery(z.object({ status: z.string().optional(), eventId: z.string().optional() })),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.listBeos(req.auth!.tenantId, req.validatedQuery as any) });
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.get(
  '/beos/:id',
  requirePermission('sc_beo', 'read'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(await svc.getBeo(req.auth!.tenantId, req.params.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/beos',
  requirePermission('sc_beo', 'manage'),
  validateBody(beoBody),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await svc.upsertBeo(req.auth!.tenantId, req.validatedBody, req.auth!.user!.id));
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/beos/:id/submit',
  requirePermission('sc_beo', 'manage'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(
        await svc.submitBeoForApproval(req.auth!.tenantId, req.params.id, req.auth!.user!.id)
      );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/beos/:id/approve',
  requirePermission('sc_beo', 'approve'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(
        await svc.decideBeo(req.auth!.tenantId, req.params.id, 'approve', req.auth!.user!.id)
      );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/beos/:id/request-changes',
  requirePermission('sc_beo', 'approve'),
  validateParams(idParams),
  async (req, res, next) => {
    try {
      res.json(
        await svc.decideBeo(
          req.auth!.tenantId,
          req.params.id,
          'request_changes',
          req.auth!.user!.id
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

salesCateringRouter.post(
  '/beos/:id/sign',
  requirePermission('sc_beo', 'sign'),
  validateParams(idParams),
  validateBody(z.object({ name: z.string().min(1), role: z.string().optional() })),
  async (req, res, next) => {
    try {
      res.json(await svc.signBeo(req.auth!.tenantId, req.params.id, req.validatedBody as any, req));
    } catch (e) {
      next(e);
    }
  }
);

// ─── Activity ───

salesCateringRouter.post(
  '/activities',
  requirePermission('sc_client', 'update'),
  validateBody(
    z.object({
      clientId: z.string().optional(),
      eventId: z.string().optional(),
      type: z.enum(['call', 'email', 'meeting', 'note']).optional(),
      body: z.string().min(1),
    })
  ),
  async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await svc.addActivity(req.auth!.tenantId, req.validatedBody, req.auth!.user!.id));
    } catch (e) {
      next(e);
    }
  }
);
