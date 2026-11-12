// ─── Feature Flags v2 — industry-grade admin API ───
// Mounted at /admin/feature-flags (see src/index.ts).
// Typed values (bool/string/number/json), variants, tenant-hash percentage
// rollouts, segment targeting, kill switch with declared fail mode,
// evaluation trace, sampled impression logging, full audit trail.
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../../common/prisma.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';

const router = Router();
router.use(authMiddleware, requireAdminRole);

const ah =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const SALT = process.env.FLAG_ROLLOUT_SALT || 'vimad-flags-v2';
const KEY_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
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

const qreason = (req: Request): string | undefined => {
  const q = req.query?.reason;
  return typeof q === 'string' ? q : req.body?.reason;
};

type FlagRow = Record<string, any>;
type TenantCtx = {
  id: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  propertyCount: number;
};

function offValue(flag: FlagRow): unknown {
  switch (flag.valueType || 'boolean') {
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

function hashPct(tenantId: string): number {
  const h = crypto.createHash('sha256').update(`${SALT}:${tenantId}`).digest('hex');
  return parseInt(h.slice(0, 8), 16) % 100; // 0..99 — stable per tenant
}

function matchCondition(c: any, t: TenantCtx): boolean {
  const field: string = c.field;
  const val = (t as any)[field];
  switch (c.op) {
    case 'eq':
      return val === c.value;
    case 'neq':
      return val !== c.value;
    case 'in':
      return Array.isArray(c.value) && c.value.includes(val);
    case 'not_in':
      return Array.isArray(c.value) && !c.value.includes(val);
    case 'gt':
      return Number(val) > Number(c.value);
    case 'gte':
      return Number(val) >= Number(c.value);
    case 'lt':
      return Number(val) < Number(c.value);
    case 'lte':
      return Number(val) <= Number(c.value);
    case 'createdAfter':
      return new Date(val) > new Date(c.value);
    case 'createdBefore':
      return new Date(val) < new Date(c.value);
    default:
      return false;
  }
}

async function getTenant(ref: string): Promise<TenantCtx | null> {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT t.id, t.slug, t.plan, t.status, t."createdAt",
            (SELECT count(*)::int FROM properties p WHERE p."tenantId" = t.id) AS "propertyCount"
     FROM tenants t WHERE t.id = $1 OR t.slug = $1 LIMIT 1`,
    ref
  );
  return (rows as TenantCtx[])[0] || null;
}

async function allFlags(): Promise<FlagRow[]> {
  return prisma.$queryRawUnsafe(
    `SELECT f.*,
            (SELECT count(*)::int FROM feature_flag_overrides o WHERE o."flagId" = f.id) AS "overridesCount",
            (SELECT "createdAt"::text FROM platform_audit_events p WHERE p."entityId" = f.id ORDER BY "createdAt" DESC LIMIT 1) AS "lastChangeAt",
            (SELECT "actorEmail" FROM platform_audit_events p WHERE p."entityId" = f.id ORDER BY "createdAt" DESC LIMIT 1) AS "lastChangeBy"
     FROM feature_flags f ORDER BY f."createdAt" DESC`
  ) as Promise<FlagRow[]>;
}

function normalize(flag: FlagRow): FlagRow {
  return {
    ...flag,
    defaultValue:
      flag.defaultValueJsonb !== null && flag.defaultValueJsonb !== undefined
        ? flag.defaultValueJsonb
        : flag.defaultValue,
    variants: j(flag.variants, []),
    segmentRules: j(flag.segmentRules, []),
    rolloutPct: Number(flag.rolloutPct || 0),
    protected: flag.protected === true,
  };
}

async function evaluateFlag(flag: FlagRow, tenant: TenantCtx) {
  const dv =
    flag.defaultValueJsonb !== null && flag.defaultValueJsonb !== undefined
      ? flag.defaultValueJsonb
      : flag.defaultValue;
  if (flag.status === 'killed') {
    return {
      value: flag.failMode === 'open' ? dv : offValue(flag),
      source: 'kill',
      detail: `Flag killed${flag.killReason ? `: ${flag.killReason}` : ''} — failing ${flag.failMode}`,
    };
  }
  const ov = (await prisma.$queryRawUnsafe(
    `SELECT * FROM feature_flag_overrides WHERE "flagId" = $1 AND "tenantId" = $2`,
    flag.id,
    tenant.id
  )) as any[];
  if (ov[0]) {
    return {
      value: ov[0].value,
      source: 'override',
      detail: `Tenant override (${ov[0].reason || 'no reason recorded'})`,
    };
  }
  const rules = j(flag.segmentRules, []) as any[];
  for (const r of rules) {
    if (
      Array.isArray(r.all) &&
      r.all.length &&
      r.all.every((c: any) => matchCondition(c, tenant))
    ) {
      return {
        value: r.value !== undefined ? r.value : dv,
        source: 'segment',
        detail: r.name || 'Segment rule matched',
      };
    }
  }
  const pct = hashPct(tenant.id);
  const rollout = Number(flag.rolloutPct || 0);
  if (rollout > 0 && pct < rollout) {
    return { value: dv, source: 'rollout', detail: `Tenant hash ${pct} < rollout ${rollout}%` };
  }
  return {
    value: offValue(flag),
    source: 'default',
    detail:
      rollout > 0
        ? `Tenant hash ${pct} ≥ rollout ${rollout}% — outside ramp`
        : 'Rollout 0% — off unless overridden or segmented',
  };
}

async function audit(
  req: Request,
  action: string,
  entityId: string,
  after: unknown,
  reason?: string
) {
  const email = (req as any).auth?.user?.email || (req as any).user?.sub || 'system';
  await prisma.$executeRawUnsafe(
    `INSERT INTO platform_audit_events (id, "actorEmail", action, entity, "entityId", "tenantId", "after", reason, source, "ipAddress", "createdAt")
     VALUES ($1, $2, $3, 'feature_flag', $4, NULL, $5::jsonb, $6, 'console', $7, NOW())`,
    crypto.randomUUID(),
    email,
    action,
    entityId,
    JSON.stringify(after ?? null),
    reason ?? null,
    req.ip ?? null
  );
}

// ── Reads ─────────────────────────────────────────────────────────────
router.get(
  '/',
  ah(async (_req, res) => {
    const flags = await allFlags();
    res.json({ flags: flags.map(normalize) });
  })
);

router.get(
  '/evaluate/:tenantId',
  ah(async (req, res) => {
    const tenant = await getTenant(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const flags = (await allFlags()).filter(
      (f) => !f.environment || f.environment === 'production'
    );
    const results = [];
    for (const f of flags) {
      const e = await evaluateFlag(f, tenant);
      results.push({
        key: f.key,
        flagId: f.id,
        value: e.value,
        source: e.source,
        detail: e.detail,
        hashPct: hashPct(tenant.id),
        valueType: f.valueType,
      });
    }
    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        plan: tenant.plan,
        propertyCount: tenant.propertyCount,
      },
      results,
    });
  })
);

router.get(
  '/bootstrap/:tenantId',
  ah(async (req, res) => {
    const tenant = await getTenant(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const flags = (await allFlags()).filter(
      (f) => !f.environment || f.environment === 'production'
    );
    const values: Record<string, unknown> = {};
    const meta: Record<string, { source: string; detail: string }> = {};
    for (const f of flags) {
      const e = await evaluateFlag(f, tenant);
      values[f.key] = e.value;
      meta[f.key] = { source: e.source, detail: e.detail };
    }
    res.json({ tenantId: tenant.id, generatedAt: new Date().toISOString(), values, meta });
  })
);

router.post(
  '/impressions',
  ah(async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 500) : [];
    let sampled = 0;
    for (const it of items) {
      if (!it || !it.flagKey || !it.tenantId) continue;
      // deterministic 10% sample so the same event is never double-counted
      if (hashPct(`${it.flagKey}:${it.tenantId}`) >= 10) continue;
      await prisma.$executeRawUnsafe(
        `INSERT INTO flag_impressions (id, "flagId", "flagKey", "tenantId", "onState", error, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        crypto.randomUUID(),
        it.flagId ?? null,
        String(it.flagKey),
        String(it.tenantId),
        it.on !== false,
        it.error === true
      );
      sampled++;
    }
    res.json({ received: items.length, sampled });
  })
);

router.get(
  '/overrides',
  ah(async (_req, res) => {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT o.*, f.key AS "flagKey", t.slug AS "tenantSlug", t.name AS "tenantName"
     FROM feature_flag_overrides o
     JOIN feature_flags f ON f.id = o."flagId"
     LEFT JOIN tenants t ON t.id = o."tenantId"
     ORDER BY o."createdAt" DESC LIMIT 500`
    );
    res.json({ overrides: rows });
  })
);

router.get(
  '/:id/trace/:tenantId',
  ah(async (req, res) => {
    const tenant = await getTenant(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    if (!rows[0]) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    const flag = normalize(rows[0]);
    const e = await evaluateFlag(flag, tenant);
    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        propertyCount: tenant.propertyCount,
        createdAt: tenant.createdAt,
      },
      flag: {
        id: flag.id,
        key: flag.key,
        status: flag.status,
        valueType: flag.valueType,
        defaultValue: flag.defaultValue,
        rolloutPct: flag.rolloutPct,
        failMode: flag.failMode,
        segmentRules: flag.segmentRules,
      },
      verdict: { value: e.value, source: e.source, detail: e.detail },
      hashPct: hashPct(tenant.id),
    });
  })
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    if (!rows[0]) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    const flag = normalize(rows[0]);
    const overrides = await prisma.$queryRawUnsafe(
      `SELECT o.*, t.slug AS "tenantSlug", t.name AS "tenantName"
     FROM feature_flag_overrides o LEFT JOIN tenants t ON t.id = o."tenantId"
     WHERE o."flagId" = $1 ORDER BY o."createdAt" DESC`,
      flag.id
    );
    const changes = await prisma.$queryRawUnsafe(
      `SELECT "actorEmail", action, reason, "createdAt"::text FROM platform_audit_events
     WHERE "entityId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
      flag.id
    );
    const stats = (await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS "impressions24h",
            count(*) FILTER (WHERE error)::int AS "errors24h",
            count(DISTINCT "tenantId")::int AS "tenants24h"
     FROM flag_impressions WHERE "flagId" = $1 AND "createdAt" > NOW() - INTERVAL '24 hours'`,
      flag.id
    )) as any[];
    const tenants = (await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS c FROM tenants`
    )) as any[];
    const s = stats[0] || {};
    res.json({
      flag,
      overrides,
      changes,
      analytics: {
        impressions24h: s.impressions24h || 0,
        errors24h: s.errors24h || 0,
        tenants24h: s.tenants24h || 0,
        adoptionPct: tenants[0]?.c ? Math.round(((s.tenants24h || 0) / tenants[0].c) * 100) : 0,
      },
    });
  })
);

// ── Writes (super_admin) ──────────────────────────────────────────────
router.post(
  '/',
  ah(async (req, res) => {
    const b = req.body || {};
    if (!b.key || !KEY_RE.test(b.key)) {
      res.status(400).json({ error: 'key must match ' + KEY_RE.source });
      return;
    }
    const valueType = ['boolean', 'string', 'number', 'json'].includes(b.valueType)
      ? b.valueType
      : 'boolean';
    const environment = b.environment || 'production';
    const id = crypto.randomUUID();
    const inserted = await prisma.$executeRawUnsafe(
      `INSERT INTO feature_flags (id, key, description, owner, environment, status, "defaultValue", "defaultValueJsonb",
       "valueType", variants, "failMode", protected, "rolloutPct", "segmentRules", "createdBy", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,'active',$6,$7::jsonb,$8,$9::jsonb,$10,$11,$12,$13::jsonb,$14,NOW(),NOW())
     ON CONFLICT ("key", "environment") DO NOTHING`,
      id,
      b.key,
      b.description ?? '',
      b.owner ?? 'platform',
      environment,
      valueType === 'boolean' ? b.defaultValue === true : false,
      JSON.stringify(
        b.defaultValue ??
          (valueType === 'boolean'
            ? false
            : valueType === 'number'
              ? 0
              : valueType === 'string'
                ? ''
                : null)
      ),
      valueType,
      JSON.stringify(b.variants ?? []),
      b.failMode === 'open' ? 'open' : 'closed',
      b.protected === true,
      Math.min(100, Math.max(0, Number(b.rolloutPct || 0))),
      JSON.stringify(b.segmentRules ?? []),
      (req as any).auth?.user?.email ?? 'system'
    );
    if (!inserted) {
      res.status(409).json({ error: `Flag '${b.key}' already exists in ${environment}` });
      return;
    }
    await audit(req, 'flag.create', id, { key: b.key, valueType, environment }, b.reason);
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE id = $1`,
      id
    )) as any[];
    res.status(201).json({ flag: normalize(rows[0]) });
  })
);

router.patch(
  '/:id',
  ah(async (req, res) => {
    const b = req.body || {};
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const push = (col: string, val: any) => {
      sets.push(
        `"${col}" = $${i++}${col === 'variants' || col === 'segmentRules' ? '::jsonb' : ''}`
      );
      params.push(val);
    };
    if (b.description !== undefined) push('description', String(b.description));
    if (b.owner !== undefined) push('owner', String(b.owner));
    if (b.variants !== undefined) push('variants', JSON.stringify(b.variants));
    if (b.segmentRules !== undefined) push('segmentRules', JSON.stringify(b.segmentRules));
    if (b.failMode !== undefined) push('failMode', b.failMode === 'open' ? 'open' : 'closed');
    if (b.protected !== undefined) push('protected', b.protected === true);
    if (!sets.length) {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }
    sets.push(`"updatedAt" = NOW()`);
    params.push(req.params.id);
    const n = await prisma.$executeRawUnsafe(
      `UPDATE feature_flags SET ${sets.join(', ')} WHERE id = $${i}`,
      ...params
    );
    if (!n) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await audit(req, 'flag.update', req.params.id, b, b.reason);
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    res.json({ flag: normalize(rows[0]) });
  })
);

router.post(
  '/:id/default',
  ah(async (req, res) => {
    if (req.body?.value === undefined) {
      res.status(400).json({ error: 'value required' });
      return;
    }
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    if (!rows[0]) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await prisma.$executeRawUnsafe(
      `UPDATE feature_flags SET "defaultValueJsonb" = $2::jsonb, "defaultValue" = $3, "updatedAt" = NOW() WHERE id = $1`,
      req.params.id,
      JSON.stringify(req.body.value),
      (rows[0].valueType || 'boolean') === 'boolean'
        ? req.body.value === true
        : rows[0].defaultValue
    );
    await audit(req, 'flag.default', req.params.id, { value: req.body.value }, qreason(req));
    res.json({ ok: true, value: req.body.value });
  })
);

router.post(
  '/:id/rollout',
  ah(async (req, res) => {
    const pct = Math.min(100, Math.max(0, Number(req.body?.rolloutPct)));
    if (Number.isNaN(pct)) {
      res.status(400).json({ error: 'rolloutPct must be 0-100' });
      return;
    }
    const n = await prisma.$executeRawUnsafe(
      `UPDATE feature_flags SET "rolloutPct" = $2, "updatedAt" = NOW() WHERE id = $1`,
      req.params.id,
      pct
    );
    if (!n) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await audit(req, 'flag.rollout', req.params.id, { rolloutPct: pct }, qreason(req));
    res.json({ ok: true, rolloutPct: pct });
  })
);

router.post(
  '/:id/kill',
  ah(async (req, res) => {
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 3) {
      res.status(400).json({ error: 'Kill requires a reason (min 3 chars)' });
      return;
    }
    const n = await prisma.$executeRawUnsafe(
      `UPDATE feature_flags SET status = 'killed', "killReason" = $2, "killedAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
      req.params.id,
      reason
    );
    if (!n) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await audit(req, 'flag.kill', req.params.id, { status: 'killed' }, reason);
    res.json({ ok: true, status: 'killed' });
  })
);

router.post(
  '/:id/restore',
  ah(async (req, res) => {
    const n = await prisma.$executeRawUnsafe(
      `UPDATE feature_flags SET status = 'active', "killReason" = NULL, "killedAt" = NULL, "rolloutPct" = 0, "updatedAt" = NOW() WHERE id = $1`,
      req.params.id
    );
    if (!n) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await audit(
      req,
      'flag.restore',
      req.params.id,
      { status: 'active', rolloutPct: 0 },
      qreason(req)
    );
    res.json({ ok: true, status: 'active', rolloutPct: 0 });
  })
);

router.post(
  '/:id/overrides',
  ah(async (req, res) => {
    const { tenantId, value, reason } = req.body || {};
    if (!tenantId || reason === undefined || String(reason).trim().length < 3) {
      res.status(400).json({ error: 'tenantId + reason (min 3 chars) required' });
      return;
    }
    const tenant = await getTenant(String(tenantId));
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const flag = (await prisma.$queryRawUnsafe(
      `SELECT id FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    if (!flag[0]) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO feature_flag_overrides (id, "flagId", "tenantId", value, cohort, "createdBy", reason, "createdAt")
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, NOW())
     ON CONFLICT ("flagId", "tenantId") DO UPDATE SET value = EXCLUDED.value, reason = EXCLUDED.reason, "createdBy" = EXCLUDED."createdBy", "createdAt" = NOW()`,
      crypto.randomUUID(),
      req.params.id,
      tenant.id,
      JSON.stringify(value ?? null),
      req.body?.cohort ?? null,
      (req as any).auth?.user?.email ?? 'system',
      String(reason).trim()
    );
    await audit(
      req,
      'flag.override',
      req.params.id,
      { tenant: tenant.slug, value },
      String(reason).trim()
    );
    res.json({ ok: true, tenantId: tenant.id });
  })
);

router.delete(
  '/overrides/:overrideId',
  ah(async (req, res) => {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT * FROM feature_flag_overrides WHERE id = $1`,
      req.params.overrideId
    )) as any[];
    if (!rows[0]) {
      res.status(404).json({ error: 'Override not found' });
      return;
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM feature_flag_overrides WHERE id = $1`,
      req.params.overrideId
    );
    await audit(
      req,
      'flag.override.remove',
      rows[0].flagId,
      { overrideId: req.params.overrideId },
      qreason(req)
    );
    res.json({ ok: true });
  })
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT key FROM feature_flags WHERE id = $1`,
      req.params.id
    )) as any[];
    if (!rows[0]) {
      res.status(404).json({ error: 'Flag not found' });
      return;
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM flag_impressions WHERE "flagId" = $1`,
      req.params.id
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM feature_flag_overrides WHERE "flagId" = $1`,
      req.params.id
    );
    await prisma.$executeRawUnsafe(`DELETE FROM feature_flags WHERE id = $1`, req.params.id);
    await audit(req, 'flag.delete', req.params.id, { key: rows[0].key }, qreason(req));
    res.json({ ok: true });
  })
);

export default router;
