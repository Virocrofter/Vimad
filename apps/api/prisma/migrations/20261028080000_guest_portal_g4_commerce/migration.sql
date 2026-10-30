-- G4: Room-service menu + guest orders, and a demo upsell catalog
CREATE TABLE IF NOT EXISTS "menu_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "price" DECIMAL(10,2) NOT NULL,
    "availableFrom" TEXT NOT NULL DEFAULT '00:00',
    "availableTo" TEXT NOT NULL DEFAULT '23:59',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "menu_items_tenantId_propertyId_status_idx" ON "menu_items"("tenantId", "propertyId", "status");

CREATE TABLE IF NOT EXISTS "guest_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "folioId" TEXT,
    "folioItemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "total" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guest_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "guest_orders_idempotencyKey_key" ON "guest_orders"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "guest_orders_folioItemId_key" ON "guest_orders"("folioItemId");
CREATE INDEX IF NOT EXISTS "guest_orders_tenantId_reservationId_idx" ON "guest_orders"("tenantId", "reservationId");
ALTER TABLE "guest_orders" ADD CONSTRAINT "guest_orders_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "guest_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "guest_order_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "guest_order_items_orderId_idx" ON "guest_order_items"("orderId");
ALTER TABLE "guest_order_items" ADD CONSTRAINT "guest_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "guest_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Demo menu (kitchen hours in property local time)
INSERT INTO "menu_items" ("id", "tenantId", "propertyId", "name", "description", "category", "price", "availableFrom", "availableTo", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t.id, p.id, v.name, v.description, v.category, v.price, v.from_t, v.to_t, now(), now()
FROM tenants t
JOIN properties p ON p."tenantId" = t.id AND p.code = 'DEMO-01'
CROSS JOIN (VALUES
  ('Full Breakfast', 'Eggs any style, bacon, sausage, grilled tomato, toast, preserves', 'breakfast', 145.00, '06:30', '10:30'),
  ('Continental Breakfast', 'Pastries, fruit, yoghurt, muesli, preserves, coffee or tea', 'breakfast', 95.00, '06:30', '10:30'),
  ('Club Sandwich', 'Triple-deck chicken, bacon, egg and avocado on toasted white', 'mains', 95.00, '11:00', '22:00'),
  ('Margherita Pizza', 'Wood-fired with fior di latte, tomato and basil', 'mains', 120.00, '11:00', '22:00'),
  ('Beef Burger', '180g patty, cheddar, caramelised onion, hand-cut fries', 'mains', 135.00, '11:00', '22:30'),
  ('Caesar Salad', 'Grilled chicken, cos, parmesan, anchovy dressing', 'salads', 85.00, '11:00', '22:00'),
  ('Fresh Fruit Platter', 'Seasonal fruit with mint and honey yoghurt', 'snacks', 75.00, '00:00', '23:59'),
  ('Filter Coffee', 'Bottomless house blend', 'drinks', 25.00, '06:00', '22:00'),
  ('Fresh Orange Juice', 'Pressed to order', 'drinks', 35.00, '06:30', '10:30'),
  ('Bottle of Local Wine', 'Red or white, from the winelands', 'drinks', 220.00, '00:00', '23:59')
) AS v(name, description, category, price, from_t, to_t)
WHERE t.slug = 'demo-hotel'
  AND NOT EXISTS (SELECT 1 FROM "menu_items" mi WHERE mi."tenantId" = t.id AND mi."propertyId" = p.id AND mi.name = v.name);

-- Demo upsell products (C7)
INSERT INTO "upsell_products" ("id", "tenantId", "propertyId", "name", "category", "price", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t.id, p.id, v.name, v.category, v.price, now(), now()
FROM tenants t
JOIN properties p ON p."tenantId" = t.id AND p.code = 'DEMO-01'
CROSS JOIN (VALUES
  ('Late Checkout (2 PM)', 'extra', 350.00),
  ('Airport Transfer', 'transfer', 450.00),
  ('Spa Access Pass', 'extra', 300.00),
  ('In-Room Celebration Setup', 'extra', 550.00)
) AS v(name, category, price)
WHERE t.slug = 'demo-hotel'
  AND NOT EXISTS (SELECT 1 FROM "upsell_products" u WHERE u."tenantId" = t.id AND u."propertyId" = p.id AND u.name = v.name);
