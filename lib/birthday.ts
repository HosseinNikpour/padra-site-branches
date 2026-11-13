import type { Prisma } from "@prisma/client";

import { dbDate, isValidDate, nowInTehran, timeToMinutes } from "@/lib/availability";
import { BookingError, HOLD_MINUTES, holdingFilter, recordStatus } from "@/lib/booking";
import { CHILD_AGE_LIMIT, countsFor, lineAmount, modeOf, type PricingMode } from "@/lib/birthday-pricing";
import { prisma } from "@/lib/prisma";

/** سانس‌های تولد: ۲ ساعته، از ۱۱ صبح تا ۱۱ شب */
export const BIRTHDAY_SLOTS = [
  { startTime: "11:00", endTime: "13:00" },
  { startTime: "13:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "19:00" },
  { startTime: "19:00", endTime: "21:00" },
  { startTime: "21:00", endTime: "23:00" },
] as const;

/** رزرو تولد تا این تعداد روز آینده باز است */
export const BIRTHDAY_WINDOW_DAYS = 90;

export { CHILD_AGE_LIMIT };

export const KINDS = ["GAME", "CONTENT", "CAKE", "EXTRA"] as const;
export type PackageKind = (typeof KINDS)[number];

export function birthdayLockKey(branchId: number, date: string) {
  const dayNumber = Math.floor(dbDate(date).getTime() / 86_400_000);
  return (3 * 10_000_000 + branchId) * 100_000 + dayNumber;
}

type Db = Pick<Prisma.TransactionClient, "booking">;

/** تعداد تولدهای فعال (قطعی یا در مهلت پرداخت) یک شعبه در یک سانس */
export async function countBirthdays(db: Db, branchId: number, date: Date, startTime: string, excludeId?: number) {
  return db.booking.count({
    where: {
      branchId,
      birthdayPackageId: { not: null },
      date,
      startTime,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...holdingFilter(new Date()),
    },
  });
}

/** وضعیت سانس‌های یک روز برای یک شعبه */
export async function birthdaySlots(db: Db, branch: { id: number; birthdayRooms: number }, date: string) {
  if (!isValidDate(date)) return [];

  const today = nowInTehran();
  const day = dbDate(date);

  const rows = await db.booking.groupBy({
    by: ["startTime"],
    where: { branchId: branch.id, birthdayPackageId: { not: null }, date: day, ...holdingFilter(new Date()) },
    _count: { _all: true },
  });
  const taken = new Map(rows.map((r) => [r.startTime, r._count._all]));

  return BIRTHDAY_SLOTS.map((slot) => {
    const past = date < today.date || (date === today.date && timeToMinutes(slot.startTime) <= today.minutes);
    const full = (taken.get(slot.startTime) ?? 0) >= Math.max(1, branch.birthdayRooms);

    return { ...slot, status: past ? "past" : full ? "full" : "available" } as const;
  });
}

/* ---------- ساخت رزرو تولد ---------- */


type Priced = { id: number; name: string; price: number };

export type BirthdayBookingInput = {
  branch: { id: number; name: string; birthdayRooms: number };
  date: string;
  startTime: string;
  childName: string;
  age: number;
  gender: "MALE" | "FEMALE";
  guests: number | null;
  children: number | null;
  companions: number | null;
  game: Priced & { items: string | null; durationMinutes: number | null };
  content: Priced | null;
  cake: Priced | null;
  extras: (Priced & { pricingMode: string })[];
  customerName: string;
  customerPhone: string;
  userId: number | null;
};

/** مبلغ هر بخش؛ سرور همیشه خودش حساب می‌کند و عدد مرورگر را قبول نمی‌کند. */
export function birthdayAmounts(input: Pick<BirthdayBookingInput, "age" | "guests" | "children" | "companions" | "game" | "content" | "cake" | "extras">) {
  const counts = countsFor(input.age, input.guests ?? 0, input.children ?? 0, input.companions ?? 0);
  const game = lineAmount(input.game.price, modeOf("GAME"), counts);
  const content = input.content ? lineAmount(input.content.price, modeOf("CONTENT"), counts) : 0;
  const cake = input.cake ? lineAmount(input.cake.price, modeOf("CAKE"), counts) : 0;
  const extras = input.extras.map((e) => ({
    id: e.id,
    name: e.name,
    mode: modeOf("EXTRA", e.pricingMode) as PricingMode,
    amount: lineAmount(e.price, modeOf("EXTRA", e.pricingMode), counts),
  }));
  const total = game + content + cake + extras.reduce((sum, e) => sum + e.amount, 0);

  return { counts, game, content, cake, extras, total };
}

export async function createBirthdayBooking(input: BirthdayBookingInput) {
  const slot = BIRTHDAY_SLOTS.find((s) => s.startTime === input.startTime);
  if (!slot) throw new BookingError(400, "ساعت انتخاب‌شده معتبر نیست");

  const today = nowInTehran();
  if (!isValidDate(input.date) || input.date < today.date) throw new BookingError(400, "تاریخ معتبر نیست");
  if (input.date === today.date && timeToMinutes(slot.startTime) <= today.minutes) {
    throw new BookingError(400, "زمان این سانس گذشته است");
  }
  const last = new Date(dbDate(today.date).getTime() + BIRTHDAY_WINDOW_DAYS * 86_400_000);
  if (dbDate(input.date) > last) throw new BookingError(400, `رزرو تولد فقط تا ${BIRTHDAY_WINDOW_DAYS} روز آینده امکان‌پذیر است`);

  const amounts = birthdayAmounts(input);

  if (input.extras.some((e) => modeOf("EXTRA", e.pricingMode) === "PER_COMPANION") && amounts.counts.companions < 1) {
    throw new BookingError(400, "خدماتِ ویژه‌ی همراهان فقط وقتی انتخاب می‌شود که تعداد همراه حداقل ۱ باشد");
  }

  const quantity = amounts.counts.all;
  const now = new Date();

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${birthdayLockKey(input.branch.id, input.date)})`;

      const used = await countBirthdays(tx, input.branch.id, dbDate(input.date), slot.startTime);
      if (used >= Math.max(1, input.branch.birthdayRooms)) {
        throw new BookingError(409, "این سانس همین الان رزرو شد. لطفاً ساعت دیگری انتخاب کنید");
      }

      const created = await tx.booking.create({
        data: {
          branchId: input.branch.id,
          birthdayPackageId: input.game.id,
          date: dbDate(input.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          userId: input.userId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          quantity,
          amount: amounts.total,
          status: "PENDING",
          expiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000),
          birthdayData: {
            branchName: input.branch.name,
            childName: input.childName,
            age: input.age,
            gender: input.gender,
            guests: input.guests,
            children: input.children,
            companions: input.companions,
            packageName: input.game.name,
            packageItems: input.game.items,
            packageDuration: input.game.durationMinutes,
            packageUnitPrice: input.game.price,
            packageAmount: amounts.game,
            contentName: input.content?.name ?? null,
            contentAmount: amounts.content,
            cakeName: input.cake?.name ?? null,
            cakeUnitPrice: input.cake?.price ?? null,
            cakeAmount: amounts.cake,
            extras: amounts.extras.map((e) => ({ name: e.name, amount: e.amount })),
          },
        },
      });

      await recordStatus(tx, created.id, null, "PENDING", input.userId ? "CUSTOMER" : "SYSTEM", { actorId: input.userId });

      return created;
    },
    { timeout: 10_000 }
  );
}
