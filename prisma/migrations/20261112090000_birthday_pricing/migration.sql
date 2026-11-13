-- قیمت‌گذاری بر اساس تعداد نفرات: فیلدهای «نفرات پایه» و «قیمت هر نفر اضافه» حذف می‌شوند
ALTER TABLE "BirthdayPackage" DROP COLUMN "includedGuests";
ALTER TABLE "BirthdayPackage" DROP COLUMN "extraGuestPrice";

-- نحوه‌ی محاسبه‌ی قیمت (برای «خدمات اضافه»)
ALTER TABLE "BirthdayPackage" ADD COLUMN "pricingMode" TEXT NOT NULL DEFAULT 'FIXED';
