-- Branch: تعداد سالن تولد
ALTER TABLE "Branch" ADD COLUMN "birthdayRooms" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "BirthdayPackage" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'GAME',
    "branchId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "items" TEXT,
    "durationMinutes" INTEGER,
    "price" INTEGER NOT NULL DEFAULT 0,
    "includedGuests" INTEGER NOT NULL DEFAULT 0,
    "extraGuestPrice" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BirthdayPackage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BirthdayPackage_kind_isActive_idx" ON "BirthdayPackage"("kind", "isActive");
CREATE INDEX "BirthdayPackage_branchId_idx" ON "BirthdayPackage"("branchId");

ALTER TABLE "BirthdayPackage" ADD CONSTRAINT "BirthdayPackage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Booking: رزرو تولد
ALTER TABLE "Booking" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "birthdayPackageId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "birthdayData" JSONB;

CREATE INDEX "Booking_branchId_birthdayPackageId_date_idx" ON "Booking"("branchId", "birthdayPackageId", "date");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_birthdayPackageId_fkey" FOREIGN KEY ("birthdayPackageId") REFERENCES "BirthdayPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
