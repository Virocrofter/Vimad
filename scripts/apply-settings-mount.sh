#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
IDX=apps/api/src/index.ts
OAS=apps/api/src/common/openapi.ts

if grep -q "tenantSettingsRouter" "$IDX"; then
  echo "index.ts already mounted — skipping"
else
  python3 - "$IDX" <<'PY'
import sys
path = sys.argv[1]
src = open(path).read()
imp = "import { tenantSettingsRouter } from './modules/tenant-settings/tenant-settings.routes.js';\n"
lines = src.splitlines(keepends=True)
last_import = max(i for i, l in enumerate(lines) if l.startswith('import '))
lines.insert(last_import + 1, imp)
open(path, 'w').write(''.join(lines))
PY
  python3 - "$IDX" <<'PY'
import sys
path = sys.argv[1]
src = open(path).read()
anchor = "app.use('/v1/support-cases',"
mount = "app.use('/v1/tenant', tenantSettingsRouter);\n"
if anchor in src:
    i = src.index(anchor)
    line_end = src.index('\n', i) + 1
    src = src[:line_end] + mount + src[line_end:]
else:
    raise SystemExit("Anchor '/v1/support-cases' not found in index.ts — mount manually: app.use('/v1/tenant', tenantSettingsRouter);")
open(path, 'w').write(src)
PY
  echo "index.ts patched"
fi

if grep -q "tenant-settings" "$OAS"; then
  echo "openapi.ts already registers module — skipping"
else
  python3 - "$OAS" <<'PY'
import sys
path = sys.argv[1]
src = open(path).read()
imp = "import * as tenantSettingsModule from '../modules/tenant-settings/tenant-settings.routes.js';\n"
lines = src.splitlines(keepends=True)
last_import = max(i for i, l in enumerate(lines) if l.startswith('import '))
lines.insert(last_import + 1, imp)
src = ''.join(lines)
anchor = 'supportCasesModule,'
if anchor in src:
    src = src.replace(anchor, anchor + '\n    tenantSettingsModule,', 1)
else:
    raise SystemExit("Anchor 'supportCasesModule,' not found in openapi.ts")
open(path, 'w').write(src)
PY
  echo "openapi.ts patched"
fi
echo "mount patch applied"
