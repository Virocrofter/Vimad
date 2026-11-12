-- Constraint only. Duplicate cleanup ran separately (merge-repoint via
-- pg_catalog FK discovery). Production DBs must run equivalent cleanup first.
CREATE UNIQUE INDEX "guests_tenantId_email_key" ON "guests"("tenantId", "email");
