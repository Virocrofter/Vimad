CREATE TABLE "inventory_daily_cache" (
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total" INTEGER NOT NULL,
    "ooo" INTEGER NOT NULL,
    "occupied" INTEGER NOT NULL,
    "held" INTEGER NOT NULL,
    "adjustment" INTEGER NOT NULL,
    "sellable" INTEGER NOT NULL,
    "overbookingLimit" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_daily_cache_pkey" PRIMARY KEY ("propertyId", "roomTypeId", "date")
);
CREATE INDEX "inventory_daily_cache_roomTypeId_date_idx" ON "inventory_daily_cache"("roomTypeId", "date");
ALTER TABLE "inventory_daily_cache" ADD CONSTRAINT "inventory_daily_cache_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
