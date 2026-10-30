import { readFileSync, writeFileSync } from 'node:fs';

let failed = 0;
function patch(file, pairs) {
  let src = readFileSync(file, 'utf8');
  for (const [anchor, replacement, label] of pairs) {
    const count = src.split(anchor).length - 1;
    if (count !== 1) {
      console.error('PATCH FAIL: ' + file + ' — anchor not unique/found (' + count + '): ' + label);
      process.exitCode = 1;
      failed++;
      continue;
    }
    src = src.replace(anchor, replacement);
    console.log('patched: ' + label);
  }
  if (!process.exitCode) writeFileSync(file, src);
}

patch('apps/api/src/modules/guest-portal/guest-portal.routes.ts', [
  [
    "import { validateBody } from '../../common/validate.js';",
    "import rateLimit from 'express-rate-limit';\nimport { validateBody } from '../../common/validate.js';",
    'rate-limit import',
  ],
  [
    'export const guestPortalRouter = Router();',
    `export const guestPortalRouter = Router();

// [P0] lookup/verify mint portal tokens — stricter than A4's 30/min:
// 10 req/min/IP blocks credential stuffing + scraping without hurting
// a real guest retrying a typo.
const guestPortalLookupLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in a minute.' },
  },
});`,
    'lookup limiter',
  ],
  [
    `guestPortalRouter.post(
  '/lookup',
  validateBody(LookupInputSchema),`,
    `guestPortalRouter.post(
  '/lookup',
  guestPortalLookupLimiter,
  validateBody(LookupInputSchema),`,
    'limiter on /lookup',
  ],
  [
    `guestPortalRouter.post(
  '/verify',
  validateBody(verifyIdentitySchema),`,
    `guestPortalRouter.post(
  '/verify',
  guestPortalLookupLimiter,
  validateBody(verifyIdentitySchema),`,
    'limiter on /verify',
  ],
]);

patch('apps/api/src/index.ts', [
  [
    "import { guestPortalRouter } from './modules/guest-portal/guest-portal.routes.js';",
    "import { guestPortalRouter } from './modules/guest-portal/guest-portal.routes.js';\nimport { guestPortalRefreshRouter } from './modules/guest-portal/refresh.routes.js';",
    'refresh router import',
  ],
  [
    "  app.use('/v1/guest-portal/support', ticketsGuestRouter);",
    "  app.use('/v1/guest-portal', guestPortalRefreshRouter);\n  app.use('/v1/guest-portal/support', ticketsGuestRouter);",
    'refresh router mount (before support, before main portal)',
  ],
]);

if (failed) process.exit(1);
console.log('ALL PATCHES OK');
