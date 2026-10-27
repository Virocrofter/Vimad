CREATE TABLE "onboarding_imports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'csv',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT,
    "mapping" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB,
    "errors" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "onboarding_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_import_rows" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "onboarding_import_rows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isChainStandard" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "property_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "onboarding_imports_tenantId_createdAt_idx" ON "onboarding_imports"("tenantId", "createdAt");
CREATE INDEX "onboarding_import_rows_importId_idx" ON "onboarding_import_rows"("importId");
CREATE INDEX "property_templates_tenantId_idx" ON "property_templates"("tenantId");
CREATE UNIQUE INDEX "property_templates_tenantId_name_key" ON "property_templates"("tenantId", "name");

ALTER TABLE "onboarding_imports" ADD CONSTRAINT "onboarding_imports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_import_rows" ADD CONSTRAINT "onboarding_import_rows_importId_fkey" FOREIGN KEY ("importId") REFERENCES "onboarding_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_templates" ADD CONSTRAINT "property_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'onboarding'
FROM (VALUES
  ('onboarding','view','View onboarding imports, templates and chain standard'),
  ('onboarding','manage','Stage and execute onboarding imports, create templates and clones')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'onboarding'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'onboarding' AND p.action = 'view'
WHERE r."tenantId" IS NULL AND r.name IN ('Staff','Housekeeper')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
