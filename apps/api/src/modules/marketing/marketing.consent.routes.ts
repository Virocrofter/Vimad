/* apps/api/src/modules/marketing/marketing.consent.routes.ts
 * E5: purpose-specific guest consent, ENFORCED AT SEND TIME. This is the
 * roadmap's hard gate: no campaign/workflow send may run without it.
 *
 * Model (from 20261029130000_add_guest_consents): append-only history —
 * every grant/revoke is a row; the newest capturedAt per
 * (guestId, purpose, channel) is the verdict. Unsubscribe is a revoke with
 * source 'unsubscribe', never a delete.
 *
 * Rules honored:
 *  - enforcement happens at send time (the gate endpoint), not at signup;
 *  - purpose- AND channel-specific: marketing/email says nothing about
 *    offers/sms;
 *  - operational/transactional messages (confirmations, folio receipts)
 *    are NEVER gated on marketing consent — the two are not conflated;
 *  - full history is auditable (source + capturedAt per change).
 *
 * Follow-up wiring (incremental, per house rule): existing marketing
 * automation send paths should call the gate (or latestConsent) per
 * recipient before dispatch — this module is the enforcement primitive.
 */
import { NextFunction, Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';

export const marketingConsentRouter = Router();
marketingConsentRouter.use(authMiddleware, tenantScope);

const PURPOSES = ['marketing', 'newsletter', 'offers', 'events', 'operational'];
const CHANNELS = ['email', 'sms', 'whatsapp'];

function tenantOf(req: Request): string | undefined {
  return ((req as any).user?.tenantId ?? (req as any).tenantId) as string | undefined;
}

function bad(res: Response, message: string) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

async function latestConsent(tenantId: string, guestId: string, purpose: string, channel: string) {
  const rows = await prisma.guestConsent.findMany({
    where: { tenantId, guestId, purpose, channel },
    orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }], // id tiebreak on same-ms writes
    take: 1,
  });
  return rows[0] ?? null;
}

// GET /v1/marketing/consents?guestId= — full append-only history (auditable)
marketingConsentRouter.get('/consents', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const guestId = String((req.query as any).guestId ?? '');
  if (!guestId) return bad(res, 'guestId is required');
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest)
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'guest not found' } });
  const rows = await prisma.guestConsent.findMany({
    where: { tenantId, guestId },
    orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
    take: 100,
  });
  return res.json({ data: rows });
});

// POST /v1/marketing/consents — record a grant or revoke. Unsubscribe is
// { status: 'revoked', source: 'unsubscribe' }. Nothing is ever deleted.
marketingConsentRouter.post('/consents', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const {
    guestId,
    purpose = 'marketing',
    channel = 'email',
    status,
    source = 'manual',
  } = (req.body ?? {}) as any;
  if (!guestId) return bad(res, 'guestId is required');
  if (!PURPOSES.includes(purpose))
    return bad(res, 'purpose must be one of: ' + PURPOSES.join(', '));
  if (purpose === 'operational') {
    return bad(res, 'operational messages do not take marketing consent');
  }
  if (!CHANNELS.includes(channel))
    return bad(res, 'channel must be one of: ' + CHANNELS.join(', '));
  if (status !== 'granted' && status !== 'revoked') {
    return bad(res, 'status must be granted or revoked');
  }
  const guest = await prisma.guest.findFirst({ where: { id: String(guestId), tenantId } });
  if (!guest)
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'guest not found' } });
  const row = await prisma.guestConsent.create({
    data: {
      tenantId,
      guestId: String(guestId),
      purpose,
      channel,
      status,
      source: String(source).slice(0, 40),
    },
  });
  return res.status(201).json({ data: row });
});

// POST /v1/marketing/consents/gate — SEND-TIME ENFORCEMENT. Every marketing
// dispatch path calls this per recipient before sending. 403 = do not send.
marketingConsentRouter.post('/consents/gate', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const { guestId, purpose = 'marketing', channel = 'email' } = (req.body ?? {}) as any;
  if (!guestId) return bad(res, 'guestId is required');
  if (!PURPOSES.includes(purpose))
    return bad(res, 'purpose must be one of: ' + PURPOSES.join(', '));
  if (!CHANNELS.includes(channel))
    return bad(res, 'channel must be one of: ' + CHANNELS.join(', '));
  const guest = await prisma.guest.findFirst({ where: { id: String(guestId), tenantId } });
  if (!guest)
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'guest not found' } });

  // Transactional/operational messages are never gated on marketing consent.
  if (purpose === 'operational') {
    return res.json({ data: { allowed: true, reason: 'operational_exempt', consent: null } });
  }

  const consent = await latestConsent(tenantId, String(guestId), purpose, channel);
  if (!consent) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: null,
        action: 'consent.suppressed',
        entity: 'guest_consent',
        entityId: String(guestId),
        metadata: { purpose, channel, reason: 'no_consent', source: 'send_gate' },
      },
    });
    return res.status(403).json({
      error: {
        code: 'CONSENT_REQUIRED',
        message: 'No ' + purpose + ' consent on file for ' + channel,
        consent: null,
      },
    });
  }
  if (consent.status !== 'granted') {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: null,
        action: 'consent.suppressed',
        entity: 'guest_consent',
        entityId: String(guestId),
        metadata: {
          purpose,
          channel,
          reason: 'revoked',
          consentStatus: consent.status,
          source: 'send_gate',
        },
      },
    });
    return res.status(403).json({
      error: {
        code: 'CONSENT_REVOKED',
        message:
          purpose +
          ' consent on ' +
          channel +
          ' was ' +
          consent.status +
          ' at ' +
          consent.capturedAt,
        consent,
      },
    });
  }
  return res.json({ data: { allowed: true, reason: 'granted', consent } });
});

/* Exported for campaign workflows (H3 win-back and beyond): the same
 * verdict logic as the gate endpoint, without HTTP. Campaign send paths
 * MUST go through this (or the gate endpoint) before dispatch. */
export async function isSendAllowed(
  tenantId: string,
  guestId: string,
  purpose: string,
  channel: string
): Promise<{ allowed: boolean; consent: any }> {
  const consent = await latestConsent(tenantId, guestId, purpose, channel);
  return { allowed: !!consent && consent.status === 'granted', consent };
}

// POST /v1/marketing/consents/filter — campaign batch gate: of these guest
// ids, who may receive this purpose on this channel? One query, latest-wins
// grouping in JS (the append-only model makes this exact).
marketingConsentRouter.post('/consents/filter', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const { guestIds, purpose = 'marketing', channel = 'email' } = (req.body ?? {}) as any;
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return bad(res, 'guestIds must be a non-empty array');
  }
  if (!PURPOSES.includes(purpose))
    return bad(res, 'purpose must be one of: ' + PURPOSES.join(', '));
  if (!CHANNELS.includes(channel))
    return bad(res, 'channel must be one of: ' + CHANNELS.join(', '));
  const ids = guestIds.map(String).slice(0, 5000);
  if (purpose === 'operational') return res.json({ data: { allowed: ids } });

  const rows = await prisma.guestConsent.findMany({
    where: { tenantId, purpose, channel, guestId: { in: ids } },
    orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
  });
  const verdict = new Map<string, string>();
  for (const r of rows) {
    if (!verdict.has(r.guestId)) verdict.set(r.guestId, r.status); // newest first
  }
  const allowed = ids.filter((id) => verdict.get(id) === 'granted');
  return res.json({ data: { allowed } });
});

// GET /v1/marketing/consents/audit — E5.3 CRM view: the suppression trail.
// Reads consent.suppressed audit rows (written by the send-time gate and by
// campaign dispatches). Pair with GET /consents?guestId= for the full
// grant/revoke history per guest.
marketingConsentRouter.get(
  '/consents/audit',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await prisma.auditLog.findMany({
        where: { tenantId: tenantOf(req)!, action: 'consent.suppressed' },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return res.json({ data: rows });
    } catch (err) {
      return next(err);
    }
  }
);
