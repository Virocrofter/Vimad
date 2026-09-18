/* apps/api/src/modules/files/files.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import { AppError } from '../../common/errors.js';
import { readLocalFile, verifyLocalSignature } from '../../common/storage.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const FileQuerySchema = z
  .object({
    expires: z.coerce.number(),
    sig: z.string(),
  })
  .openapi('FileDownloadQuery');

export const filesRouter = Router();

// Serves locally-stored exports (STORAGE_PROVIDER=local). In S3 mode this
// route is unused — downloads go straight to the bucket via presigned URLs.
registry.registerPath({
  method: 'get',
  path: '/{key}',
  tags: ['Files'],
  description: 'Download a stored file with a signed URL (local storage provider only)',
  responses: {
    200: { description: 'File content' },
    403: {
      description: 'Invalid or expired signature',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

filesRouter.get('/*key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storageProvider = process.env.STORAGE_PROVIDER ?? 'local';

    if (storageProvider !== 'local') {
      throw new AppError(404, 'Not found', 'NOT_FOUND');
    }

    const key = (req.params as Record<string, string>)[0];
    const { expires, sig } = FileQuerySchema.parse(req.query);

    if (!verifyLocalSignature(key, expires, sig)) {
      throw new AppError(403, 'Invalid or expired download link', 'SIGNATURE_INVALID');
    }

    const content = await readLocalFile(key);
    const ext = key.split('.').pop();
    const contentType =
      ext === 'pdf' ? 'application/pdf' : ext === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  } catch (err) {
    next(err);
  }
});
