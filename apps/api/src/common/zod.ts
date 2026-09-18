/* apps/api/src/common/zod.ts
 * Must be imported BEFORE any module that builds zod schemas.
 * extendZodWithOpenApi patches the zod factories, so schemas created
 * before this runs never receive the .openapi() method.
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export { z };
