-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT,
    "mapUrl" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "hours" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- AlterTable
ALTER TABLE "Game" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Event" ADD COLUMN "branchId" INTEGER;

CREATE INDEX "Game_branchId_idx" ON "Game"("branchId");
CREATE INDEX "Event_branchId_idx" ON "Event"("branchId");

ALTER TABLE "Game" ADD CONSTRAINT "Game_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: دو شعبه‌ی اول (اطلاعات را از پنل مدیریت ویرایش کنید)
INSERT INTO "Branch" ("slug","name","area","mapUrl","description","sortOrder","updatedAt") VALUES
 ('hamila','شعبه همیلا','تهران · پونک','https://nshn.ir/b9_bv2vAQxM5Xs','اولین پادرا پارک؛ بازی، ایونت، کافه و جشن تولد زیر یک سقف.',1,CURRENT_TIMESTAMP),
 ('lotus','شعبه لوتوس',NULL,NULL,'شعبه جدید پادرا پارک.',2,CURRENT_TIMESTAMP);

-- بازی‌ها و ایونت‌های فعلی متعلق به شعبه همیلا هستند
UPDATE "Game" SET "branchId" = (SELECT "id" FROM "Branch" WHERE "slug"='hamila');
UPDATE "Event" SET "branchId" = (SELECT "id" FROM "Branch" WHERE "slug"='hamila');
