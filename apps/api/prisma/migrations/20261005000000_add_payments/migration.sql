-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "reservationId" TEXT,
    "guestId" TEXT,
    "folioId" TEXT,
    "reference" TEXT NOT NULL,
    "paystackId" INTEGER,
    "authorizationCode" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'card',
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "feeMinor" INTEGER NOT NULL DEFAULT 0,
    "refundedMinor" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "postedToFolio" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_payment_methods" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "paystackCustomerCode" TEXT,
    "authorizationCode" TEXT NOT NULL,
    "cardType" TEXT,
    "cardLast4" TEXT NOT NULL,
    "cardExpMonth" TEXT,
    "cardExpYear" TEXT,
    "bank" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'card',
    "reusable" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_tenantId_createdAt_idx" ON "payments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_tenantId_status_type_idx" ON "payments"("tenantId", "status", "type");

-- CreateIndex
CREATE INDEX "payments_reservationId_idx" ON "payments"("reservationId");

-- CreateIndex
CREATE INDEX "payments_guestId_idx" ON "payments"("guestId");

-- CreateIndex
CREATE INDEX "payments_folioId_idx" ON "payments"("folioId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_payment_methods_guestId_authorizationCode_key" ON "guest_payment_methods"("guestId", "authorizationCode");

-- CreateIndex
CREATE INDEX "guest_payment_methods_tenantId_idx" ON "guest_payment_methods"("tenantId");

-- CreateIndex
CREATE INDEX "guest_payment_methods_guestId_idx" ON "guest_payment_methods"("guestId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "folios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_payment_methods" ADD CONSTRAINT "guest_payment_methods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_payment_methods" ADD CONSTRAINT "guest_payment_methods_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;