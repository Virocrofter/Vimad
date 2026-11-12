// Feature Flags v2 — COMPLETE catalog seed. Idempotent upsert by (key, environment).
// Generated 2026-11-09: one flag per shipped feature surface.
import { prisma } from '../src/common/prisma';

const FLAGS: Array<[string, string, string, any, number, boolean, string]> = [
  [
    'reservations-workspace',
    'Reservation workspace + traces',
    'production',
    true,
    100,
    false,
    'open',
  ],
  ['room-plan-tapechart', 'Room plan / tape chart', 'production', true, 100, false, 'open'],
  [
    'front-desk-cockpit',
    'Today cockpit / arrival-departure',
    'production',
    true,
    100,
    false,
    'open',
  ],
  [
    'central-reservations',
    'Central reservations for chains',
    'production',
    true,
    100,
    false,
    'open',
  ],
  [
    'new-checkin-flow',
    'C4B online check-in v2 (ID scan + deposit)',
    'production',
    false,
    25,
    true,
    'closed',
  ],
  ['night-audit-auto', 'Scheduled night audit runs', 'production', true, 100, true, 'closed'],
  ['chains', 'Chain model + property switcher', 'production', true, 100, false, 'open'],
  ['chain-dashboard', 'Chain-wide dashboard', 'production', true, 100, false, 'open'],
  ['chain-billing', 'Chain consolidated billing', 'production', true, 100, true, 'closed'],
  ['chain-loyalty', 'Chain loyalty program', 'production', true, 100, false, 'open'],
  [
    'guest-identity-merge',
    'Guest identity graph / dedupe',
    'production',
    true,
    100,
    true,
    'closed',
  ],
  ['groups-blocks', 'Group room blocks + rooming list', 'production', true, 100, false, 'open'],
  [
    'group-billing-master-folio',
    'Master folio + group billing',
    'production',
    true,
    100,
    true,
    'closed',
  ],
  ['sales-catering-beo', 'S&C pipeline + BEO builder', 'production', true, 100, false, 'open'],
  ['housekeeping-board', 'Housekeeping board', 'production', true, 100, false, 'open'],
  ['hk-supervisor', 'Supervisor reassign/SLA surface', 'production', true, 100, false, 'open'],
  ['hk-space-status', 'Service status (OOO/OOS) engine', 'production', true, 100, false, 'open'],
  [
    'minibar-auto-post',
    'Minibar checks auto-post to folio',
    'production',
    true,
    100,
    true,
    'closed',
  ],
  [
    'concierge-board',
    'Concierge: transfers, wakeups, upsells',
    'production',
    true,
    100,
    false,
    'open',
  ],
  ['tasks-rules-engine', 'Universal tasks + auto rules', 'production', true, 100, false, 'open'],
  ['task-push-whatsapp', 'WhatsApp/SMS one-tap task push', 'production', true, 100, false, 'open'],
  ['flight-status', 'Flight status hook for concierge', 'production', true, 100, false, 'open'],
  ['parking-board', 'Parking bays + assignments', 'production', true, 100, false, 'open'],
  ['ev-charging', 'EV bay charging states', 'production', true, 100, false, 'open'],
  ['valet-mode', 'Valet workflows', 'production', true, 100, false, 'open'],
  ['meal-plans', 'Board-basis meal plans', 'production', true, 100, false, 'open'],
  ['inventory-engine', 'Sellable inventory + overbooking', 'production', true, 100, true, 'closed'],
  ['rate-grids', 'Rate grids + availability calendar', 'production', true, 100, false, 'open'],
  ['pricing-rules', 'Pricing rules engine', 'production', true, 100, false, 'open'],
  ['ai-pricing-engine', 'AI rate suggestions', 'production', true, 100, false, 'open'],
  ['vouchers', 'Voucher codes', 'production', true, 100, false, 'open'],
  ['channel-manager', 'OTA channel connections', 'production', true, 100, true, 'closed'],
  ['channel-webhooks', 'Channel push webhooks', 'production', true, 100, false, 'open'],
  ['ota-observability', 'Channel sync observability', 'production', true, 100, false, 'open'],
  ['paystack-payments', 'Paystack card payments', 'production', true, 100, true, 'closed'],
  ['payment-requests', 'Hosted deposit payment requests', 'production', true, 100, true, 'closed'],
  ['deposit-automation', 'Reminder + expiry automation', 'production', true, 100, true, 'closed'],
  [
    'abandoned-deposit-recovery',
    'Recover abandoned booking deposits',
    'production',
    true,
    100,
    true,
    'closed',
  ],
  ['payment-exceptions-queue', 'Payment exceptions desk', 'production', true, 100, false, 'open'],
  ['deposit-percent', 'Default deposit % for requests', 'staging', 50, 100, true, 'closed'],
  ['tax-invoices-sars', 'SARS tax invoices', 'production', true, 100, true, 'closed'],
  ['credit-notes', 'Credit notes', 'production', true, 100, true, 'closed'],
  ['folio-v2', 'Split-view folio', 'production', false, 50, false, 'closed'],
  ['folio-split-requests', 'Guest folio split requests', 'production', true, 100, true, 'closed'],
  ['tomsa-levy-auto', 'Auto-post TOMSA levy', 'production', false, 0, true, 'closed'],
  ['vcc-virtual-cards', 'Virtual credit cards', 'production', true, 100, true, 'closed'],
  ['upsell-pos', 'Upsell catalog + sales', 'production', true, 100, false, 'open'],
  ['accounting-journal', 'Accounting journal entries', 'production', true, 100, true, 'closed'],
  ['accounting-export', 'Accounting exports', 'production', true, 100, false, 'open'],
  ['reports-builder', 'Report builder + library', 'production', true, 100, false, 'open'],
  ['report-scheduler', 'Scheduled reports', 'production', true, 100, false, 'open'],
  ['tenant-reports', 'Tenant-scoped report tables', 'production', true, 100, false, 'open'],
  ['ar-dunning', 'Accounts receivable + dunning', 'production', true, 100, true, 'closed'],
  ['crm-guest-360', 'CRM guest profiles + follow-ups', 'production', true, 100, false, 'open'],
  ['crm-segments', 'Guest segments engine', 'production', true, 100, false, 'open'],
  ['winback-automation', 'Winback campaigns', 'production', true, 100, false, 'open'],
  ['marketing-campaigns', 'Marketing campaigns', 'production', true, 100, false, 'open'],
  [
    'marketing-workflows',
    'Marketing automation workflows',
    'production',
    false,
    0,
    false,
    'closed',
  ],
  [
    'marketing-consent-enforcement',
    'POPIA/GDPR consent gating',
    'production',
    true,
    100,
    true,
    'closed',
  ],
  ['loyalty-engine', 'Loyalty earn/redeem', 'production', true, 100, false, 'open'],
  ['loyalty-rewards-portal', 'Guest reward catalog', 'production', true, 100, false, 'open'],
  ['guest-portal-commerce', 'Room-service ordering', 'production', true, 100, false, 'open'],
  ['guest-portal-chat', 'Guest chat', 'production', true, 100, false, 'open'],
  ['guest-portal-reviews', 'Guest reviews', 'production', true, 100, false, 'open'],
  ['guest-portal-announcements', 'Portal announcements', 'production', true, 100, false, 'open'],
  ['guest-portal-tickets', 'Guest support tickets', 'production', true, 100, false, 'open'],
  [
    'calm-premium-theme',
    'Portal theme (string flag)',
    'production',
    'calm-premium',
    100,
    false,
    'open',
  ],
  ['digital-keys', 'Digital key issuance', 'production', true, 100, true, 'closed'],
  ['rbac-roles', 'Roles + permission matrix', 'production', true, 100, true, 'closed'],
  ['api-keys', 'Scoped API keys', 'production', true, 100, true, 'closed'],
  ['sso-login', 'SSO/SAML login', 'production', false, 0, true, 'closed'],
  ['user-management', 'Tenant staff management', 'production', true, 100, false, 'open'],
  ['audit-trail', 'Tenant audit trail', 'production', true, 100, true, 'closed'],
  ['gdpr-data-export', 'GDPR export/erasure', 'production', true, 100, true, 'closed'],
  ['retention-policies', 'Retention + legal hold', 'production', true, 100, true, 'closed'],
  ['exceptions-queue', 'Operational exceptions queue', 'production', true, 100, false, 'open'],
  ['notifications-push', 'Push notifications', 'production', true, 100, false, 'open'],
  ['sms-twilio', 'Twilio SMS sending', 'production', true, 100, true, 'closed'],
  ['onboarding-csv', 'CSV bulk onboarding', 'production', true, 100, false, 'open'],
  ['property-templates', 'Property templates + clones', 'production', true, 100, false, 'open'],
  ['demo-access-program', 'Demo request/access program', 'production', true, 100, false, 'open'],
  ['backups-dr', 'Backups + restore drills', 'production', true, 100, true, 'closed'],
  ['profiler-admin', 'Production profiler', 'production', true, 100, false, 'open'],
  ['shadow-mode', 'Shadow-mode comparison runs', 'production', false, 0, true, 'closed'],
  ['system-health-probes', 'Health probes + heartbeats', 'production', true, 100, false, 'open'],
  ['feature-flags-v2', 'This flag system itself', 'production', true, 100, false, 'open'],
];

(async () => {
  for (const [key, description, env, dv, rollout, prot, fail] of FLAGS) {
    const isBool = typeof dv === 'boolean';
    await prisma.$executeRawUnsafe(
      `INSERT INTO feature_flags (id, key, description, owner, environment, status, "defaultValue", "defaultValueJsonb",
        "valueType", variants, "failMode", protected, "rolloutPct", "segmentRules", "createdBy", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'platform', $3, 'active', $4, $5::jsonb,
        $6, '[]'::jsonb, $7, $8, $9, '[]'::jsonb, 'seed-catalog', NOW(), NOW())
       ON CONFLICT ("key", "environment") DO UPDATE SET
         description = EXCLUDED.description, "defaultValueJsonb" = EXCLUDED."defaultValueJsonb",
         "valueType" = EXCLUDED."valueType", "failMode" = EXCLUDED."failMode",
         protected = EXCLUDED.protected, "updatedAt" = NOW()`,
      key,
      description,
      env,
      isBool ? dv : false,
      JSON.stringify(dv),
      typeof dv === 'boolean'
        ? 'boolean'
        : typeof dv === 'number'
          ? 'number'
          : typeof dv === 'string'
            ? 'string'
            : 'json',
      fail,
      prot,
      rollout
    );
  }
  const tenants = (await prisma.$queryRawUnsafe(
    `SELECT id, slug FROM tenants WHERE slug IN ('demo-hotel','vimad-internal')`
  )) as any[];
  const demo = tenants.find((t: any) => t.slug === 'demo-hotel');
  const internal = tenants.find((t: any) => t.slug === 'vimad-internal');
  const byKey = async (k: string) =>
    (
      (await prisma.$queryRawUnsafe(
        `SELECT id FROM feature_flags WHERE key=$1 AND environment='production' LIMIT 1`,
        k
      )) as any[]
    )[0]?.id;
  const ov = async (flagKey: string, tenantId: string, value: any, reason: string) => {
    const fid = await byKey(flagKey);
    if (!fid || !tenantId) return;
    await prisma.$executeRawUnsafe(
      `INSERT INTO feature_flag_overrides (id, "flagId", "tenantId", value, "createdBy", reason, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3::jsonb, 'seed-catalog', $4, NOW())
       ON CONFLICT ("flagId", "tenantId") DO UPDATE SET value = EXCLUDED.value, reason = EXCLUDED.reason, "createdAt" = NOW()`,
      fid,
      tenantId,
      JSON.stringify(value),
      reason
    );
  };
  await ov(
    'new-checkin-flow',
    demo?.id,
    true,
    'Demo hotel showcases online check-in on sales calls'
  );
  await ov('folio-v2', demo?.id, true, 'Demo folio v2 for demo walkthroughs');
  await ov('calm-premium-theme', demo?.id, 'calm-premium', 'Demo portal renders calm-premium');
  await ov('guest-portal-commerce', demo?.id, true, 'Demo room-service ordering');
  await ov('deposit-percent', internal?.id, 30, 'Internal tenant on low deposit while testing');
  const c = (await prisma.$queryRawUnsafe(`SELECT count(*)::int AS c FROM feature_flags`)) as any[];
  console.log(
    `SEEDED complete catalog: ${c[0].c} flags total (${FLAGS.length} catalog entries), demo overrides attached`
  );
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
