/* apps/api/src/modules/invoices/invoices.routes.ts — [A5] auth'd routes */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import fs from 'node:fs';
import {
  issueInvoiceSchema,
  issueTaxInvoice,
  getInvoice,
  listInvoices,
  sendInvoiceEmail,
  getInvoicePdfPath,
} from './invoices.service.js';
import { validateBody } from '../../common/validate.js';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
export const invoicesRouter = Router();

const IdParamSchema = z.object({ id: z.string() });

invoicesRouter.use(authMiddleware);

registry.registerPath({
  method: 'get',
  path: '/v1/invoices',
  tags: ['Invoices'],
  responses: { 200: { description: 'Tax invoice / receipt list' } },
});
invoicesRouter.get(
  '/',
  requirePermission('invoice', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listInvoices((req as any).auth.tenantId, req.query as any) });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/invoices',
  tags: ['Invoices'],
  responses: {
    201: { description: 'Tax invoice issued (folio charges grouped, VAT computed)' },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
invoicesRouter.post(
  '/',
  validateBody(issueInvoiceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await issueTaxInvoice((req as any).auth.tenantId, req.validatedBody as any);
      res.status(201).json({ data: invoice });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/v1/invoices/{id}',
  tags: ['Invoices'],
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Invoice detail with line items' },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
invoicesRouter.get(
  '/:id',
  requirePermission('invoice', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await getInvoice((req as any).auth.tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/invoices/{id}/send',
  tags: ['Invoices'],
  request: { params: IdParamSchema },
  responses: { 200: { description: 'Invoice emailed to the guest' } },
});
invoicesRouter.post(
  '/:id/send',
  requirePermission('invoice', 'issue'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sendInvoiceEmail(req.params.id);
      res.json({ data: { sent: true } });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/v1/invoices/{id}/pdf',
  tags: ['Invoices'],
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'PDF document (application/pdf)' },
    404: {
      description: 'Not found / PDF not generated',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
invoicesRouter.get(
  '/:id/pdf',
  requirePermission('invoice', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path, number, type } = await getInvoicePdfPath(
        (req as any).auth.tenantId,
        req.params.id
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${number}.pdf"`);
      fs.createReadStream(path).pipe(res);
    } catch (err) {
      next(err);
    }
  }
);
