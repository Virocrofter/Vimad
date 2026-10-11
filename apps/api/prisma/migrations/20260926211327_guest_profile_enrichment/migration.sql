-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "blacklistReason" TEXT,
ADD COLUMN     "blacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "doNotDisturb" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "guest_notes" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_notes_guestId_idx" ON "guest_notes"("guestId");

-- AddForeignKey
ALTER TABLE "guest_notes" ADD CONSTRAINT "guest_notes_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_notes" ADD CONSTRAINT "guest_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
