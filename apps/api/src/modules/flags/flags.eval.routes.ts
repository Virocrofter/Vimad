// ─── Feature Flags — tenant-scoped consumption API (Phase B) ───
// Live evaluation for the hotel + guest apps. Mounted at /v1/flags.
// Precedence mirrors the admin engine: kill(failMode) → override →
// segment → tenant-hash rollout → default. 45s per-tenant cache.
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../common/prisma.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

const SALT = process.env.FLAG_ROLLOUT_SALT || 'vimad-flags-v2';
const j = (v: unknown, fb: unknown) => {
  if (v === null || v === undefined) return fb;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return fb;
    }
  }
  return v;
};

const cache = new Map<
  string,
  {
    at: number;
    values: Record<string, unknown>;
    meta: Record<string, { source: string; detail: string }>;
  }
>();
const TTL = 45_000;

function hashPct(tenantId: string): number {
  return (
    parseInt(
      crypto.createHash('sha256').update(`${SALT}:${tenantId}`).digest('hex').slice(0, 8),
      16
    ) % 100
  );
}

function offValue(f: any): unknown {
  switch (f.valueType || 'boolean') {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'json':
      return null;
    default:
      return false;
  }
}

function match(c: any, t: any): boolean {
  const v = (t as any)[c.field];
  switch (c.op) {
    case 'eq':
      return v === c.value;
    case 'neq':
      return v !== c.value;
    case 'in':
      return Array.isArray(c.value) && c.value.includes(v);
    case 'not_in':
      return Array.isArray(c.value) && !c.value.includes(v);
    case 'gt':
      return Number(v) > Number(c.value);
    case 'gte':
      return Number(v) >= Number(c.value);
    case 'lt':
      return Number(v) < Number(c.value);
    case 'lte':
      return Number(v) <= Number(c.value);
    case 'createdAfter':
      return new Date(v) > new Date(c.value);
    case 'createdBefore':
      return new Date(v) < new Date(c.value);
    default:
      return false;
  }
}

async function tenantCtx(tenantId: string) {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT t.id, t.slug, t.plan, t.status, t."createdAt",
            (SELECT count(*)::int FROM properties p WHERE p."tenantId" = t.id) AS "propertyCount"
     FROM tenants t WHERE t.id = $1 LIMIT 1`,
    tenantId
  )) as any[];
  return rows[0] || null;
}

async function evaluate(flag: any, t: any) {
  const dv =
    flag.defaultValueJsonb !== null && flag.defaultValueJsonb !== undefined
      ? flag.defaultValueJsonb
      : flag.defaultValue;
  if (flag.status === 'killed')
    return {
      value: flag.failMode === 'open' ? dv : offValue(flag),
      source: 'kill',
      detail: `killed${flag.killReason ? ': ' + flag.killReason : ''}`,
    };
  const ov = (await prisma.$queryRawUnsafe(
    `SELECT value FROM feature_flag_overrides WHERE "flagId" = $1 AND "tenantId" = $2`,
    flag.id,
    t.id
  )) as any[];
  if (ov[0]) return { value: ov[0].value, source: 'override', detail: 'tenant override' };
  for (const r of j(flag.segmentRules, []) as any[]) {
    if (Array.isArray(r.all) && r.all.length && r.all.every((c: any) => match(c, t))) {
      return {
        value: r.value !== undefined ? r.value : dv,
        source: 'segment',
        detail: r.name || 'segment rule',
      };
    }
  }
  const pct = hashPct(t.id);
  const rollout = Number(flag.rolloutPct || 0);
  if (rollout > 0 && pct < rollout)
    return { value: dv, source: 'rollout', detail: `hash ${pct} < rollout ${rollout}%` };
  return { value: offValue(flag), source: 'default', detail: 'off' };
}

async function computeAll(tenantId: string) {
  const t = await tenantCtx(tenantId);
  if (!t) return null;
  const flags = (await prisma.$queryRawUnsafe(
    `SELECT * FROM feature_flags WHERE environment = 'production' ORDER BY key`
  )) as any[];
  const values: Record<string, unknown> = {};
  const meta: Record<string, { source: string; detail: string }> = {};
  for (const f of flags) {
    const e = await evaluate(f, t);
    values[f.key] = e.value;
    meta[f.key] = { source: e.source, detail: e.detail };
  }
  return { values, meta };
}

router.get('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tid = (req as any).auth?.tenantId;
    if (!tid) {
      res.status(401).json({ error: 'no tenant in token' });
      return;
    }
    const hit = cache.get(tid);
    if (hit && Date.now() - hit.at < TTL) {
      res.json({
        values: hit.values,
        meta: hit.meta,
        generatedAt: new Date(hit.at).toISOString(),
        cached: true,
      });
      return;
    }
    const all = await computeAll(tid);
    if (!all) {
      res.status(404).json({ error: 'tenant not found' });
      return;
    }
    cache.set(tid, { at: Date.now(), ...all });
    res.json({ ...all, generatedAt: new Date().toISOString(), cached: false });
  } catch (e) {
    next(e);
  }
});

router.get('/evaluate/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tid = (req as any).auth?.tenantId;
    const flags = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE key = $1 AND environment = 'production' LIMIT 1`,
      req.params.key
    )) as any[];
    if (!flags[0]) {
      res.status(404).json({ error: 'flag not found' });
      return;
    }
    const t = await tenantCtx(tid);
    if (!t) {
      res.status(404).json({ error: 'tenant not found' });
      return;
    }
    const e = await evaluate(flags[0], t);
    res.json({ key: req.params.key, value: e.value, source: e.source, detail: e.detail });
  } catch (e) {
    next(e);
  }
});

router.post('/impressions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tid = (req as any).auth?.tenantId;
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 500) : [];
    let sampled = 0;
    for (const it of items) {
      if (!it || !it.flagKey) continue;
      if (hashPct(`${it.flagKey}:${it.tenantId || tid}`) >= 10) continue;
      await prisma.$executeRawUnsafe(
        `INSERT INTO flag_impressions (id, "flagId", "flagKey", "tenantId", "onState", error, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        crypto.randomUUID(),
        it.flagId ?? null,
        String(it.flagKey),
        String(it.tenantId || tid),
        it.on !== false,
        it.error === true
      );
      sampled++;
    }
    res.json({ received: items.length, sampled });
  } catch (e) {
    next(e);
  }
});

export default router;
