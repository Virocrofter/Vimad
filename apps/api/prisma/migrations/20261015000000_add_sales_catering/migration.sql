
CREATE TABLE "sc_clients" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'corporate', "primaryContact" TEXT, "email" TEXT,
  "phone" TEXT, "address" TEXT, "clientSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accountManagerId" TEXT, "tags" TEXT[] DEFAULT ARRAY[]::TEXT[], "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_clients_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_events" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "propertyId" TEXT, "clientId" TEXT,
  "name" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'corporate',
  "status" TEXT NOT NULL DEFAULT 'lead', "eventDate" DATE NOT NULL,
  "startTime" TEXT, "endTime" TEXT, "guestCount" INTEGER NOT NULL DEFAULT 0,
  "budget" DECIMAL(12,2), "source" TEXT NOT NULL DEFAULT 'direct',
  "probability" INTEGER NOT NULL DEFAULT 20, "ownerId" TEXT, "notes" TEXT, "lostReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_events_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_beos" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'draft',
  "title" TEXT NOT NULL, "eventDate" DATE NOT NULL, "startTime" TEXT, "endTime" TEXT,
  "guestCount" INTEGER NOT NULL DEFAULT 0, "venueId" TEXT, "setupId" TEXT, "menuId" TEXT, "avId" TEXT,
  "priceOverrides" JSONB NOT NULL DEFAULT '{}', "additionalServices" JSONB NOT NULL DEFAULT '[]',
  "decor" JSONB NOT NULL DEFAULT '[]', "specialInstructions" TEXT,
  "logistics" JSONB NOT NULL DEFAULT '{}', "snapshots" JSONB NOT NULL DEFAULT '{}',
  "signatures" JSONB NOT NULL DEFAULT '[]', "createdById" TEXT, "approvedById" TEXT, "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_beos_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_venues" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "propertyId" TEXT,
  "name" TEXT NOT NULL, "code" TEXT NOT NULL, "capacity" INTEGER NOT NULL DEFAULT 0,
  "areaSqm" INTEGER, "rentalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[], "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_venues_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_menu_packages" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "pricePerPerson" DECIMAL(10,2) NOT NULL, "description" TEXT,
  "courses" JSONB NOT NULL DEFAULT '[]', "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_menu_packages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_av_packages" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0, "description" TEXT,
  "items" TEXT[] DEFAULT ARRAY[]::TEXT[], "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_av_packages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_setup_styles" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0, "icon" TEXT, "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_setup_styles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_decor_options" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0, "unit" TEXT NOT NULL DEFAULT 'each',
  "icon" TEXT, "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sc_decor_options_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sc_activities" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "clientId" TEXT, "eventId" TEXT,
  "type" TEXT NOT NULL, "body" TEXT NOT NULL, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sc_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sc_clients_tenantId_idx" ON "sc_clients"("tenantId");
CREATE INDEX "sc_events_tenantId_idx" ON "sc_events"("tenantId");
CREATE INDEX "sc_events_tenantId_status_idx" ON "sc_events"("tenantId", "status");
CREATE INDEX "sc_events_eventDate_idx" ON "sc_events"("eventDate");
CREATE INDEX "sc_beos_tenantId_idx" ON "sc_beos"("tenantId");
CREATE INDEX "sc_beos_eventId_idx" ON "sc_beos"("eventId");
CREATE UNIQUE INDEX "sc_venues_tenantId_code_key" ON "sc_venues"("tenantId", "code");
CREATE INDEX "sc_venues_tenantId_idx" ON "sc_venues"("tenantId");
CREATE INDEX "sc_menu_packages_tenantId_idx" ON "sc_menu_packages"("tenantId");
CREATE INDEX "sc_av_packages_tenantId_idx" ON "sc_av_packages"("tenantId");
CREATE INDEX "sc_setup_styles_tenantId_idx" ON "sc_setup_styles"("tenantId");
CREATE INDEX "sc_decor_options_tenantId_idx" ON "sc_decor_options"("tenantId");
CREATE INDEX "sc_activities_tenantId_createdAt_idx" ON "sc_activities"("tenantId", "createdAt");
CREATE INDEX "sc_activities_clientId_idx" ON "sc_activities"("clientId");
CREATE INDEX "sc_activities_eventId_idx" ON "sc_activities"("eventId");

ALTER TABLE "sc_clients" ADD CONSTRAINT "sc_clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_clients" ADD CONSTRAINT "sc_clients_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "sc_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_events" ADD CONSTRAINT "sc_events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sc_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "sc_venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "sc_setup_styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "sc_menu_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_beos" ADD CONSTRAINT "sc_beos_avId_fkey" FOREIGN KEY ("avId") REFERENCES "sc_av_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_venues" ADD CONSTRAINT "sc_venues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_venues" ADD CONSTRAINT "sc_venues_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sc_menu_packages" ADD CONSTRAINT "sc_menu_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_av_packages" ADD CONSTRAINT "sc_av_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_setup_styles" ADD CONSTRAINT "sc_setup_styles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_decor_options" ADD CONSTRAINT "sc_decor_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "sc_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sc_activities" ADD CONSTRAINT "sc_activities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sc_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;