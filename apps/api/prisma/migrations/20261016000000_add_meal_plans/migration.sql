-- T7: Meal plans — board basis plans, restaurants, reservation assignments,
-- and an idempotent posting log (one row per assignment per day).

CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'main',
    "cuisine" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "operatingHours" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "boardBasis" TEXT NOT NULL DEFAULT 'BB',
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "autoPost" BOOLEAN NOT NULL DEFAULT true,
    "postTime" TEXT NOT NULL DEFAULT '06:00',
    "restaurantId" TEXT,
    "description" TEXT,
    "inclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "childUnder6" TEXT NOT NULL DEFAULT 'free',
    "childUnder12" TEXT NOT NULL DEFAULT '50',
    "childUnder16" TEXT NOT NULL DEFAULT '75',
    "seasonality" TEXT NOT NULL DEFAULT 'year-round',
    "startDate" DATE,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meal_plan_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meal_plan_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meal_plan_postings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "folioItemId" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meal_plan_postings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurants_propertyId_name_key" ON "restaurants"("propertyId", "name");
CREATE INDEX "restaurants_tenantId_idx" ON "restaurants"("tenantId");
CREATE UNIQUE INDEX "meal_plans_propertyId_code_key" ON "meal_plans"("propertyId", "code");
CREATE INDEX "meal_plans_tenantId_idx" ON "meal_plans"("tenantId");
CREATE INDEX "meal_plans_propertyId_isActive_idx" ON "meal_plans"("propertyId", "isActive");
CREATE INDEX "meal_plan_assignments_tenantId_status_idx" ON "meal_plan_assignments"("tenantId", "status");
CREATE INDEX "meal_plan_assignments_reservationId_idx" ON "meal_plan_assignments"("reservationId");
CREATE INDEX "meal_plan_assignments_startDate_endDate_idx" ON "meal_plan_assignments"("startDate", "endDate");
CREATE UNIQUE INDEX "meal_plan_postings_assignmentId_date_key" ON "meal_plan_postings"("assignmentId", "date");
CREATE INDEX "meal_plan_postings_tenantId_status_idx" ON "meal_plan_postings"("tenantId", "status");
CREATE INDEX "meal_plan_postings_date_idx" ON "meal_plan_postings"("date");

ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_assignments" ADD CONSTRAINT "meal_plan_assignments_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_plan_postings" ADD CONSTRAINT "meal_plan_postings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meal_plan_postings" ADD CONSTRAINT "meal_plan_postings_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "meal_plan_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;