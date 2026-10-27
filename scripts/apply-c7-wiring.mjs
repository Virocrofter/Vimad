#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let pass = 0;
let fail = 0;

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const write = (rel, content) => fs.writeFileSync(path.join(root, rel), content);

const ok = (label) => { pass += 1; console.log(`WIRED   ${label}`); };
const bad = (label, snippet) => {
  fail += 1;
  console.log(`MANUAL  ${label}`);
  if (snippet) console.log(`        ${snippet}`);
};

const CONFIG_MODEL = `
// ─── C7: Chain loyalty config ───

model LoyaltyConfig {
  tenantId    String   @id
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  chainId     String?
  earnRate    Decimal  @default(1) @db.Decimal(10, 4)
  redeemValue Decimal  @default(0.1) @db.Decimal(10, 4)
  tiers       Json     @default("[]")
  updatedAt   DateTime @updatedAt

  @@map("loyalty_configs")
}
`;

// 1. prisma schema — three surgical edits
try {
  const rel = 'apps/api/prisma/schema.prisma';
  let s = read(rel);
  let changed = false;

  if (!s.includes('model LoyaltyConfig')) {
    if (!s.includes('loyaltyConfig      LoyaltyConfig?')) {
      const tenantAnchor = /^\s*propertyTemplates PropertyTemplate\[\]$/m;
      if (tenantAnchor.test(s)) {
        s = s.replace(tenantAnchor, (m) => `${m}\n  loyaltyConfig      LoyaltyConfig?`);
      } else {
        bad('Tenant loyaltyConfig relation', 'add to model Tenant: loyaltyConfig LoyaltyConfig?');
      }
    }
    if (!s.includes('loyaltyTransactions LoyaltyTransaction[]')) {
      const propAnchor = /^\s*arInvoices\s+ArInvoice\[\]$/m;
      if (propAnchor.test(s)) {
        s = s.replace(propAnchor, (m) => `${m}\n  loyaltyTransactions LoyaltyTransaction[]`);
      } else {
        bad('Property loyaltyTransactions relation', 'add to model Property: loyaltyTransactions LoyaltyTransaction[]');
      }
    }
    const ltAnchor = /(source\s+String\s+@default\("Manual"\)\n\s*createdById String\?\n)/;
    if (ltAnchor.test(s)) {
      s = s.replace(ltAnchor, (m) =>
        `${m}  propertyId  String?\n  property    Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)\n`
      );
    } else {
      bad('LoyaltyTransaction propertyId', 'add propertyId + property relation to model LoyaltyTransaction');
    }
    s = s.trimEnd() + '\n' + CONFIG_MODEL;
    changed = true;
  }

  if (changed) {
    write(rel, s);
    ok('prisma schema.prisma');
  } else {
    ok('prisma schema.prisma (already)');
  }
} catch {
  bad('prisma schema.prisma', 'add LoyaltyConfig model + relations');
}

// 2. api index.ts
try {
  const rel = 'apps/api/src/index.ts';
  let s = read(rel);
  if (s.includes('chain-loyalty.routes.js')) {
    ok('api index.ts (already)');
  } else {
    const impRe = /import[^\n]*onboarding\.routes\.js[^\n]*\n/;
    const useRe = /app\.use\(\s*'\/v1\/onboarding'[^\n]*\n/;
    if (impRe.test(s)) {
      s = s.replace(impRe, (m) => `${m}import { chainLoyaltyRouter } from './modules/chain-loyalty/chain-loyalty.routes.js';\n`);
    } else {
      const lastImp = [...s.matchAll(/^import[^\n]*\n/gm)].pop();
      if (lastImp) {
        s = s.slice(0, lastImp.index + lastImp[0].length) +
          "import { chainLoyaltyRouter } from './modules/chain-loyalty/chain-loyalty.routes.js';\n" +
          s.slice(lastImp.index + lastImp[0].length);
      }
    }
    if (useRe.test(s)) {
      s = s.replace(useRe, (m) => `${m}app.use('/v1/chain-loyalty', chainLoyaltyRouter);\n`);
    } else {
      const uses = [...s.matchAll(/^app\.use\(\s*'\/v1\/[^\n]*\n/gm)];
      const last = uses.pop();
      if (last) {
        s = s.slice(0, last.index + last[0].length) +
          "app.use('/v1/chain-loyalty', chainLoyaltyRouter);\n" +
          s.slice(last.index + last[0].length);
      }
    }
    write(rel, s);
    ok('api index.ts');
  }
} catch {
  bad('api index.ts', "import { chainLoyaltyRouter } from './modules/chain-loyalty/chain-loyalty.routes.js'; + app.use('/v1/chain-loyalty', chainLoyaltyRouter);");
}

// 3. openapi.ts
try {
  const rel = 'apps/api/src/common/openapi.ts';
  let s = read(rel);
  if (s.includes('chainLoyaltyModule')) {
    ok('openapi.ts (already)');
  } else {
    const impRe = /import \* as onboardingModule from '[^']*';\n/;
    if (impRe.test(s)) {
      s = s.replace(impRe, (m) => `${m}import * as chainLoyaltyModule from '../modules/chain-loyalty/chain-loyalty.routes.js';\n`);
      const lines = s.split('\n');
      const target = lines.findIndex((l) => l.includes('onboardingModule,') && !l.trim().startsWith('import'));
      if (target >= 0) {
        const indent = lines[target].match(/^\s*/)[0];
        lines.splice(target + 1, 0, `${indent}chainLoyaltyModule,`);
        write(rel, lines.join('\n'));
        ok('openapi.ts');
      } else {
        bad('openapi.ts module array', 'add chainLoyaltyModule to the route modules array');
      }
    } else {
      bad('openapi.ts onboarding anchor', 'add chainLoyaltyModule import + registry entry');
    }
  }
} catch {
  bad('openapi.ts', "add chainLoyaltyModule import + registry entry");
}

// 4. web router — anchor on the C6 onboarding route line
try {
  const rel = 'apps/web/src/router.tsx';
  let s = read(rel);
  if (s.includes('chain-loyalty/page')) {
    ok('router.tsx (already)');
  } else {
    const imports = [...s.matchAll(/^import[^\n]*\n/gm)];
    const last = imports.pop();
    if (last) {
      s = s.slice(0, last.index + last[0].length) +
        "import ChainLoyaltyPage from './app/app/chain-loyalty/page';\n" +
        s.slice(last.index + last[0].length);
    }
    const lines = s.split('\n');
    const anchor = lines.findIndex((l) => /path:\s*['"]onboarding['"]/.test(l));
    if (anchor >= 0) {
      const line = lines[anchor];
      const indent = line.match(/^\s*/)[0];
      const trimmed = line.trim();
      const routeLine = trimmed.startsWith('<Route')
        ? `${indent}<Route path="chain-loyalty" element={<ChainLoyaltyPage />} />`
        : `${indent}{ path: 'chain-loyalty', element: <ChainLoyaltyPage /> },`;
      lines.splice(anchor + 1, 0, routeLine);
      write(rel, lines.join('\n'));
      ok('router.tsx');
    } else {
      bad('router.tsx route', "{ path: 'chain-loyalty', element: <ChainLoyaltyPage /> } + import ChainLoyaltyPage from './app/app/chain-loyalty/page';");
    }
  }
} catch {
  bad('router.tsx', "add route + import for ./app/app/chain-loyalty/page");
}

// 5. sidebar — clone the Onboarding entry added by C6
try {
  const rel = 'apps/web/src/components/layout/Sidebar.tsx';
  let s = read(rel);
  if (/chain-loyalty/i.test(s)) {
    ok('Sidebar.tsx (already)');
  } else {
    const lines = s.split('\n');
    const anchor = lines.findIndex((l) => /onboarding/i.test(l) && !/import/i.test(l));
    if (anchor >= 0) {
      const cloned = lines[anchor]
        .replace(/onboarding/gi, 'chain-loyalty')
        .replace(/Onboarding/g, 'Chain Loyalty');
      lines.splice(anchor + 1, 0, cloned);
      write(rel, lines.join('\n'));
      ok('Sidebar.tsx');
    } else {
      bad('Sidebar.tsx nav item', "add nav entry with path '/app/chain-loyalty' and label 'Chain Loyalty'");
    }
  }
} catch {
  bad('Sidebar.tsx', "add nav entry path '/app/chain-loyalty' label 'Chain Loyalty'");
}

console.log(`\n== wiring: ${pass} ok, ${fail} need manual ==`);
process.exit(fail === 0 ? 0 : 1);
