// Fallback auth for gates: sign a spine-compatible JWT ({userId, tenantId, email, role}).
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/common/prisma';
(async () => {
  const email = process.argv[2];
  if (!email) {
    console.log('');
    process.exit(0);
  }
  const envPath = path.resolve(__dirname, '../.env');
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const g = (k: string) => {
    const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
    return m ? m[1].trim().replace(/^"|"$/g, '') : '';
  };
  const secret = g('JWT_SECRET') || process.env.JWT_SECRET || 'dev-secret-change-me-min-32-chars!!';
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT id, "tenantId" FROM users WHERE email=$1 ORDER BY "createdAt" ASC LIMIT 1`,
    email
  )) as any[];
  if (!rows[0]) {
    console.log('');
    process.exit(0);
  }
  const token = jwt.sign(
    { userId: rows[0].id, tenantId: rows[0].tenantId, email, role: 'owner' },
    secret,
    { expiresIn: '1h' }
  );
  console.log(token);
  await prisma.$disconnect();
})().catch(() => {
  console.log('');
  process.exit(0);
});
