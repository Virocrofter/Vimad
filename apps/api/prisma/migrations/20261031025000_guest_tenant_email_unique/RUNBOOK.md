# RUNBOOK — guests (tenantId, email) unique constraint (pre-live checklist)

**Migration:** `20261031025000_guest_tenant_email_unique`
**Risk:** `CREATE UNIQUE INDEX` fails with `23505` if duplicate guest rows exist;
a failed `migrate deploy` then wedges the environment (P3009/P3018) until resolved.
**Dev database:** already cleaned via merge-repoint on 2026-10-31. This runbook
is for any OTHER environment (staging, production, customer replicas).

## 0. Verify whether you need this at all

`psql $DATABASE_URL -c "SELECT \`tenantId\`, email, count(_) FROM guests WHERE email IS NOT NULL GROUP BY 1,2 HAVING count(_) > 1"`
Zero rows → skip to step 3.

## 1. Back up

`pg_dump $DATABASE_URL --table=guests --table=reservations --table=payments --table=guest_preferences --table=guest_documents --table=guest_notes --table=loyalty_transactions --table=guest_payment_methods --table=tasks --table=concierge_items --table=guest_vehicles --table=reservation_companions --table=guest_identity_members --table=loyalty_redemptions --table=tickets --table=tax_invoices --table=folio_split_requests --table=guest_orders --table=reviews --table=guest_consents --table=guest_segment_memberships --table=chat_threads -f guests-pre-dedupe-$(date +%F).sql`

## 2. Dedupe (merge-repoint — no child data lost)

1. `npx tsx scripts/production/guest-dedupe-merge-repoint.ts --dry-run` — review the ledger.
2. `npx tsx scripts/production/guest-dedupe-merge-repoint.ts` — must end with `CLEAN`.
   The script keeps the oldest row per (tenantId, email), re-points every FK
   reference (pg_catalog-discovered + `chat_threads.guestId`), deletes extras,
   and verifies zero remaining groups. Idempotent.

## 3. Apply

`npx prisma migrate deploy` — expect `Applying migration 20261031025000_guest_tenant_email_unique` with no error.

## 4. Verify

`psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename='guests' AND indexname='guests_tenantId_email_key'"` → one row.

## If the deploy already failed with 23505 (recovery)

1. `npx prisma migrate resolve --rolled-back 20261031025000_guest_tenant_email_unique`
2. Run steps 1–2 above (the error's DETAIL line names the offending email).
3. `npx prisma migrate deploy` again — do NOT edit the migration SQL.

## Rollback (if a post-constraint release misbehaves)

`DROP INDEX IF EXISTS "guests_tenantId_email_key";` then resolve the migration
as rolled-back. Re-applying later requires re-running steps 0–3.
