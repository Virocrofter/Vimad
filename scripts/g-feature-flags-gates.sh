#!/bin/bash
# Feature Flags v2 — production gates
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$HOME/Desktop/Vimad")"
say(){ printf '%s\n' "$*"; }
fail(){ say "FATAL: $*"; exit 1; }

say '== [1/5] building api =='
npm run build --workspace=apps/api >/tmp/ff_build_api.log 2>&1 || { tail -25 /tmp/ff_build_api.log; fail 'api build'; }
say '== [2/5] migrating =='
(cd apps/api && npx prisma migrate deploy >/tmp/ff_migrate.log 2>&1) || { tail -25 /tmp/ff_migrate.log; fail 'migrate deploy'; }
say '== [3/5] seeding =='
(cd apps/api && npx tsx scripts/seed-feature-flags.ts) || fail 'seed'
say '== [4/5] building web =='
npm run build --workspace=apps/web >/tmp/ff_build_web.log 2>&1 || { tail -25 /tmp/ff_build_web.log; fail 'web build'; }

say '== [5/5] live gates (node) =='
node scripts/feature-flags-gates.mjs
