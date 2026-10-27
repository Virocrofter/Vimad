#!/usr/bin/env node
import fs from 'node:fs';
const rel = 'apps/api/prisma/schema.prisma';
let s = fs.readFileSync(rel, 'utf8');
const tenantRe = /model Tenant \{[\s\S]*?@@map\("tenants"\)/;
const tenantBlock = s.match(tenantRe)[0];
if (tenantBlock.includes('loyaltyTransactions LoyaltyTransaction[]')) {
  s = s.replace(tenantRe, (m) => m.replace(/\n[ \t]*loyaltyTransactions LoyaltyTransaction\[\]/, ''));
  console.log('removed misplaced relation from Tenant');
}
const propRe = /model Property \{[\s\S]*?@@map\("properties"\)/;
const propBlock = s.match(propRe)[0];
if (!propBlock.includes('loyaltyTransactions LoyaltyTransaction[]')) {
  if (!/arInvoices\s+ArInvoice\[\]/.test(propBlock)) {
    console.error('no arInvoices anchor in Property model');
    process.exit(1);
  }
  s = s.replace(propRe, (m) =>
    m.replace(/(\n[ \t]*arInvoices\s+ArInvoice\[\])/, '$1\n  loyaltyTransactions LoyaltyTransaction[]')
  );
  console.log('added loyaltyTransactions to Property');
}
fs.writeFileSync(rel, s);
console.log('schema fixed');
