import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  sendSms,
  sendTemplatedSms,
  smsSendSchema,
  SMS_TEMPLATES,
  type SmsSendInput,
} from './sms.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const SmsSendInputSchema = smsSendSchema.openapi('SmsSendInput');
const SmsTemplateSendInputSchema = z
  .object({
    to: z.string(),
    templateId: z.string(),
    variables: z.record(z.string(), z.string()),
  })
  .openapi('SmsTemplateSendInput');

const SmsResultSchema = z
  .object({
    data: z.object({
      success: z.boolean(),
      sid: z.string().optional(),
      error: z.string().optional(),
    }),
  })
  .openapi('SmsResultResponse');

const SmsTemplateSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    body: z.string(),
    variables: z.array(z.string()),
  })
  .openapi('SmsTemplate');

const SmsTemplateListResponseSchema = z
  .object({
    data: z.array(SmsTemplateSchema),
  })
  .openapi('SmsTemplateListResponse');

export const smsRouter = Router();

smsRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'post',
  path: '/send',
  tags: ['SMS'],
  description: 'Send an SMS message',
  request: {
    body: {
      description: 'SMS payload',
      content: { 'application/json': { schema: SmsSendInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'SMS send result',
      content: { 'application/json': { schema: SmsResultSchema } },
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

smsRouter.post(
  '/send',
  requirePermission('sms', 'send'),
  validateBody(smsSendSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendSms(req.validatedBody as SmsSendInput);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/send-template',
  tags: ['SMS'],
  description: 'Send a templated SMS message',
  request: {
    body: {
      description: 'Templated SMS payload',
      content: { 'application/json': { schema: SmsTemplateSendInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'SMS send result',
      content: { 'application/json': { schema: SmsResultSchema } },
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

smsRouter.post(
  '/send-template',
  requirePermission('sms', 'send'),
  validateBody(
    z.object({
      to: z.string(),
      templateId: z.string(),
      variables: z.record(z.string(), z.string()),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, templateId, variables } = req.validatedBody as {
        to: string;
        templateId: string;
        variables: Record<string, string>;
      };
      const result = await sendTemplatedSms(to, templateId, variables);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/templates',
  tags: ['SMS'],
  description: 'List available SMS templates',
  responses: {
    200: {
      description: 'SMS templates',
      content: { 'application/json': { schema: SmsTemplateListResponseSchema } },
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

smsRouter.get('/templates', requirePermission('sms', 'read'), (_req: Request, res: Response) => {
  res.json({
    data: Object.values(SMS_TEMPLATES).map((t) => ({
      id: t.id,
      name: t.name,
      variables: t.variables,
    })),
  });
});
