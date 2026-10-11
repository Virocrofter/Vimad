#!/usr/bin/env python3
"""Gate no-backend routes in apps/web/src/router.tsx with <FlagRoute>.

Idempotent: routes already wrapped in FlagRoute are skipped.
Run from the repo root:  python3 scripts/gate-routes.py
"""
import re
import sys
from pathlib import Path

ROUTER = Path('apps/web/src/router.tsx')

# (path, flag, element_hint). Paths must match `path="..."` exactly.
# element_hint: only wrap when the element contains this component name
# (disambiguates duplicate paths like admin vs app "reports" / "onboarding").
# Order matters: hinted rules run first, then un-hinted catch the remainder.
RULES = [
    # /admin/* — no backend in v1
    ('analytics', 'adminAnalytics', None),
    ('announcements', 'adminAnnouncements', None),
    ('backups', 'adminBackups', None),
    ('billing', 'adminBilling', None),
    ('data-export', 'adminDataExport', None),
    ('demo-access', 'adminDemoAccess', None),
    ('feature-flags', 'adminFeatureFlags', None),
    ('feedback', 'adminFeedback', None),
    ('finances', 'adminFinances', None),
    ('integrations', 'adminIntegrations', None),
    ('onboarding', 'adminOnboarding', 'AdminOnboardingPage'),
    ('profiler', 'adminProfiler', None),
    ('quotas', 'adminQuotas', None),
    ('regions', 'adminRegions', None),
    ('reports', 'adminReports', 'AdminReportsPage'),
    ('security', 'adminSecurity', None),
    ('ticket', 'adminTickets', None),
    # /app/* — no backend in v1
    ('loyalty', 'loyalty', None),
    ('groups', 'groups', None),
    ('keys', 'staffKeys', None),
    ('reports', 'reports', None),
]

IMPORT_LINE = "import { FlagRoute } from './components/FlagRoute';"


def main() -> int:
    if not ROUTER.exists():
        sys.exit(f'ERROR: {ROUTER} not found — run from the repo root.')

    src = ROUTER.read_text()
    if '<FlagRoute' in src and IMPORT_LINE in src:
        print('Already gated — nothing to do.')
        return 0

    original = src
    wrapped, skipped = [], []

    for path, flag, hint in RULES:
        # Match: <Route path="X" element={<Comp />} ... />
        pattern = re.compile(
            r'(<Route\s+path="' + re.escape(path) + r'"\s+element=\{)(<[^}]+?/>)(\})'
        )

        def repl(m):
            elem = m.group(2)
            if hint and hint not in elem:
                return m.group(0)
            if 'FlagRoute' in elem:
                return m.group(0)
            wrapped.append(path)
            return f'{m.group(1)}<FlagRoute flag="{flag}">{elem}</FlagRoute>{m.group(3)}'

        new_src = pattern.sub(repl, src, count=1)
        if new_src == src:
            skipped.append(path)
        src = new_src

    if not wrapped:
        sys.exit('ERROR: no routes matched. Route attributes may differ — check path= order in router.tsx.')

    # Insert the import after the last top-level import line.
    if IMPORT_LINE not in src:
        lines = src.splitlines()
        last_import = max(i for i, l in enumerate(lines) if l.startswith('import '))
        lines.insert(last_import + 1, IMPORT_LINE)
        src = '\n'.join(lines) + ('\n' if original.endswith('\n') else '')

    backup = ROUTER.with_suffix('.tsx.flagbak')
    backup.write_text(original)
    ROUTER.write_text(src)

    print(f'Wrapped {len(wrapped)} routes: {", ".join(wrapped)}')
    if skipped:
        print(f'Not found (skipped): {", ".join(skipped)}')
    print(f'Backup: {backup}  (restore with: cp {backup} {ROUTER})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())