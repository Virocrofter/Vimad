#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let pass = 0;
let fail = 0;

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const write = (rel, content) => fs.writeFileSync(path.join(root, rel), content);
const exists = (rel) => fs.existsSync(path.join(root, rel));

const ok = (label) => { pass += 1; console.log(`WIRED   ${label}`); };
const bad = (label, snippet) => {
  fail += 1;
  console.log(`MANUAL  ${label}`);
  if (snippet) console.log(`        ${snippet}`);
};

const PRISMA_MODELS = `
// ─── C6: Bulk onboarding & property templates ───

model OnboardingImport {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  type        String   @default("csv")
  status      String   @default("pending")
  fileName    String?
  mapping     Json     @default("{}")
  stats       Json?
  errors      Json?
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rows OnboardingImportRow[]

  @@index([tenantId, createdAt])
  @@map("onboarding_imports")
}

model OnboardingImportRow {
  id        String           @id @default(cuid())
  importId  String
  import    OnboardingImport @relation(fields: [importId], references: [id], onDelete: Cascade)
  rowNumber Int
  data      Json
  status    String           @default("pending")
  error     String?
  createdAt DateTime         @default(now())

  @@index([importId])
  @@map("onboarding_import_rows")
}

model PropertyTemplate {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String
  isChainStandard Boolean  @default(false)
  config          Json     @default("{}")
  createdById     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("property_templates")
}
`;

// 1. prisma schema
try {
  const rel = 'apps/api/prisma/schema.prisma';
  let s = read(rel);
  if (!s.includes('model OnboardingImport')) {
    const anchor = /^(\s*)supportCases\s+SupportCase\[\]$/m;
    if (anchor.test(s)) {
      s = s.replace(anchor, (m) => `${m}\n  onboardingImports OnboardingImport[]\n  propertyTemplates PropertyTemplate[]`);
    } else {
      bad('prisma Tenant relations', 'add to model Tenant: onboardingImports OnboardingImport[] + propertyTemplates PropertyTemplate[]');
    }
    s = s.trimEnd() + '\n' + PRISMA_MODELS;
    write(rel, s);
    ok('prisma schema.prisma');
  } else {
    ok('prisma schema.prisma (already)');
  }
} catch {
  bad('prisma schema.prisma', 'add models OnboardingImport / OnboardingImportRow / PropertyTemplate');
}

// 2. api index.ts
try {
  const rel = 'apps/api/src/index.ts';
  let s = read(rel);
  if (s.includes('onboarding.routes.js')) {
    ok('api index.ts (already)');
  } else {
    const impRe = /import[^\n]*tickets\.routes\.js[^\n]*\n/;
    const useRe = /app\.use\(\s*'\/v1\/tickets'[^\n]*\n/;
    const hasImp = impRe.test(s);
    const hasUse = useRe.test(s);
    if (!hasImp) {
      const lastImp = [...s.matchAll(/^import[^\n]*\n/gm)].pop();
      if (lastImp) {
        s = s.slice(0, lastImp.index + lastImp[0].length) +
          "import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';\n" +
          s.slice(lastImp.index + lastImp[0].length);
      }
    } else {
      s = s.replace(impRe, (m) => `${m}import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';\n`);
    }
    if (hasUse) {
      s = s.replace(useRe, (m) => `${m}app.use('/v1/onboarding', onboardingRouter);\n`);
    } else {
      const uses = [...s.matchAll(/^app\.use\(\s*'\/v1\/[^\n]*\n/gm)];
      const last = uses.pop();
      if (last) {
        s = s.slice(0, last.index + last[0].length) +
          "app.use('/v1/onboarding', onboardingRouter);\n" +
          s.slice(last.index + last[0].length);
      }
    }
    write(rel, s);
    ok('api index.ts');
  }
} catch {
  bad('api index.ts', "import { onboardingRouter } from './modules/onboarding/onboarding.routes.js'; + app.use('/v1/onboarding', onboardingRouter);");
}

// 3. openapi.ts
try {
  const rel = 'apps/api/src/common/openapi.ts';
  let s = read(rel);
  if (s.includes('onboardingModule')) {
    ok('openapi.ts (already)');
  } else {
    const impRe = /import \* as ticketsModule from '[^']*';\n/;
    if (impRe.test(s)) {
      s = s.replace(impRe, (m) => `${m}import * as onboardingModule from '../modules/onboarding/onboarding.routes.js';\n`);
      const lines = s.split('\n');
      const target = lines.findIndex((l) => l.includes('ticketsModule') && !l.trim().startsWith('import'));
      if (target >= 0) {
        const indent = lines[target].match(/^\s*/)[0];
        lines.splice(target + 1, 0, `${indent}onboardingModule,`);
        s = lines.join('\n');
        write(rel, s);
        ok('openapi.ts');
      } else {
        bad('openapi.ts module array', 'add onboardingModule to the route modules array');
      }
    } else {
      bad('openapi.ts tickets anchor', "add: import * as onboardingModule from '../modules/onboarding/onboarding.routes.js'; and register it");
    }
  }
} catch {
  bad('openapi.ts', "add onboardingModule import + registry entry");
}

// 4. web router
try {
  const rel = 'apps/web/src/router.tsx';
  let s = read(rel);
  if (s.includes('onboarding/page')) {
    ok('router.tsx (already)');
  } else {
    const imports = [...s.matchAll(/^import[^\n]*\n/gm)];
    const last = imports.pop();
    if (last) {
      s = s.slice(0, last.index + last[0].length) +
        "import OnboardingPage from './app/app/onboarding/page';\n" +
        s.slice(last.index + last[0].length);
    }
    const lines = s.split('\n');
    const anchor = lines.findIndex((l) => /audit-trail|path:\s*['"]ar['"]/.test(l));
    if (anchor >= 0) {
      const line = lines[anchor];
      const indent = line.match(/^\s*/)[0];
      const trimmed = line.trim();
      const routeLine = trimmed.startsWith('<Route')
        ? `${indent}<Route path="onboarding" element={<OnboardingPage />} />`
        : `${indent}{ path: 'onboarding', element: <OnboardingPage /> },`;
      lines.splice(anchor + 1, 0, routeLine);
      s = lines.join('\n');
      write(rel, s);
      ok('router.tsx');
    } else {
      bad('router.tsx route', "{ path: 'onboarding', element: <OnboardingPage /> } + import OnboardingPage from './app/app/onboarding/page';");
    }
  }
} catch {
  bad('router.tsx', "add route + import for ./app/app/onboarding/page");
}

// 5. sidebar
try {
  const rel = 'apps/web/src/components/layout/Sidebar.tsx';
  let s = read(rel);
  if (/onboarding/i.test(s)) {
    ok('Sidebar.tsx (already)');
  } else {
    const lines = s.split('\n');
    const anchor = lines.findIndex((l) => /audit-trail/i.test(l));
    if (anchor >= 0) {
      const line = lines[anchor];
      const cloned = line
        .replace(/audit-trail/gi, 'onboarding')
        .replace(/audit\s+trail/gi, 'Onboarding');
      lines.splice(anchor + 1, 0, cloned);
      write(rel, lines.join('\n'));
      ok('Sidebar.tsx');
    } else {
      bad('Sidebar.tsx nav item', "add a nav entry with path '/app/onboarding' and label 'Onboarding'");
    }
  }
} catch {
  bad('Sidebar.tsx', "add nav entry path '/app/onboarding' label 'Onboarding'");
}

console.log(`\n== wiring: ${pass} ok, ${fail} need manual ==`);
process.exit(fail === 0 ? 0 : 1);
