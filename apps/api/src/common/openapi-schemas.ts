/* apps/api/src/common/openapi-schemas.ts
 * Shared OpenAPI response/param schemas. Kept separate from openapi.ts so
 * route modules can import them without a circular dependency (openapi.ts
 * imports all route registries).
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .openapi('ErrorResponse');

export const MessageResponseSchema = z.object({ message: z.string() }).openapi('MessageResponse');

export const IdParamSchema = z.object({ id: z.string() }).openapi('IdParam');

export const PaginationMetaSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .openapi('PaginationMeta');

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });
