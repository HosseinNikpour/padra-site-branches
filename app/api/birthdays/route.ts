import { NextResponse } from "next/server";

import { isValidDate } from "@/lib/availability";
import { CHILD_AGE_LIMIT, createBirthdayBooking } from "@/lib/birthday";
import { BookingError, recordStatus } from "@/lib/booking";
import { getBookingIdentity } from "@/lib/booking-identity";
import { checkOtpToken, consumeOtp } from "@/lib/otp";
import { confirmFreeBooking, getSiteUrl, startPayment } from "@/lib/payment";
import { PHONE_ERROR, parsePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ZarinpalError } from "@/lib/zarinpal";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const int = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));

/** ثبت رزرو تولد و انتقال به درگاه پرداخت (مثل رزرو بازی و ایونت) */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit(`birthday:ip:${ip}`, 8, 10 * 60 * 1000);
    if (!ipLimit.allowed) return bad("تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کنید", 429);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("اطلاعات رزرو نامعتبر است");

    const branch = await prisma.branch.findFirst({ where: { slug: String(body.branch ?? ""), isActive: true } });
    if (!branch) return bad("شعبه پیدا نشد", 404);

    const date = body.date;
    if (!isValidDate(date)) return bad("تاریخ را انتخاب کنید");

    const childName = String(body.childName ?? "").trim();
    if (childName.length < 2 || childName.length > 60) return bad("نام فرد متولد را وارد کنید");

    const age = int(body.age);
    if (!Number.isInteger(age) || age < 1 || age > 99) return bad("سن فرد متولد معتبر نیست");

    if (body.gender !== "MALE" && body.gender !== "FEMALE") return bad("جنسیت را انتخاب کنید");

    let guests: number | null = null;
    let children: number | null = null;
    let companions: number | null = null;

    if (age >= CHILD_AGE_LIMIT) {
      guests = int(body.guests);
      if (!Number.isInteger(guests) || guests < 1 || guests > 300) return bad("تعداد مهمان معتبر نیست");
    } else {
      children = int(body.children);
      companions = int(body.companions);
      if (!Number.isInteger(children) || children < 1 || children > 300) return bad("تعداد کودک معتبر نیست");
      if (!Number.isInteger(companions) || companions < 0 || companions > 300) return bad("تعداد همراه معتبر نیست");
    }

    const inBranch = { isActive: true, OR: [{ branchId: null }, { branchId: branch.id }] };
    const game = await prisma.birthdayPackage.findFirst({ where: { id: int(body.packageId) || -1, kind: "GAME", ...inBranch } });
    if (!game) return bad("پکیج بازی را انتخاب کنید");

    const content = body.contentId
      ? await prisma.birthdayPackage.findFirst({ where: { id: int(body.contentId) || -1, kind: "CONTENT", ...inBranch } })
      : null;
    if (body.contentId && !content) return bad("پکیج تولید محتوا معتبر نیست");

    const cake = body.cakeId
      ? await prisma.birthdayPackage.findFirst({ where: { id: int(body.cakeId) || -1, kind: "CAKE", ...inBranch } })
      : null;
    if (body.cakeId && !cake) return bad("سرویس کیک معتبر نیست");

    const rawExtras: unknown[] = Array.isArray(body.extraIds) ? body.extraIds.slice(0, 20) : [];
    const extraIds = [...new Set(rawExtras.map((v) => Number(v)).filter((v) => Number.isInteger(v)))];
    const extras = extraIds.length
      ? await prisma.birthdayPackage.findMany({ where: { id: { in: extraIds }, kind: "EXTRA", ...inBranch } })
      : [];
    if (extras.length !== extraIds.length) return bad("یکی از خدمات اضافه معتبر نیست");

    const customer = await getBookingIdentity();
    const customerName = customer ? customer.name : String(body.customerName ?? "").trim();
    const customerPhone = parsePhone(customer?.phone) ?? parsePhone(body.customerPhone);

    if (customerName.length < 2 || customerName.length > 60) return bad("نام و نام خانوادگی خود را وارد کنید");
    if (!customerPhone) return bad(PHONE_ERROR);

    const phoneLimit = await rateLimit(`birthday:phone:${customerPhone}`, 5, 60 * 60 * 1000);
    if (!phoneLimit.allowed) return bad("برای این شماره تعداد رزروها زیاد است. بعداً تلاش کنید", 429);

    let otpId: number | null = null;
    if (!customer) {
      otpId = await checkOtpToken(body.otpToken, customerPhone);
      if (!otpId) {
        return NextResponse.json(
          { error: "ابتدا شماره موبایل خود را با کد پیامکی تأیید کنید", code: "OTP_REQUIRED" },
          { status: 403 }
        );
      }
    }

    const booking = await createBirthdayBooking({
      branch,
      date,
      startTime: String(body.startTime ?? ""),
      childName,
      age,
      gender: body.gender,
      guests,
      children,
      companions,
      game,
      content,
      cake,
      extras,
      customerName,
      customerPhone,
      userId: customer?.id ?? null,
    });

    if (otpId) await consumeOtp(otpId);

    if (booking.amount <= 0) {
      const trackingCode = await confirmFreeBooking(booking.id);
      return NextResponse.json({ id: booking.id, free: true, trackingCode }, { status: 201 });
    }

    try {
      const paymentUrl = await startPayment(booking, getSiteUrl(request));
      return NextResponse.json({ id: booking.id, amount: booking.amount, paymentUrl }, { status: 201 });
    } catch (error) {
      const cancelled = await prisma.booking.updateMany({
        where: { id: booking.id, status: "PENDING" },
        data: { status: "CANCELLED", expiresAt: null },
      });

      if (cancelled.count === 1) {
        await recordStatus(prisma, booking.id, "PENDING", "CANCELLED", "SYSTEM", { note: "اتصال به درگاه ناموفق بود" });
      }

      console.error("BIRTHDAY START PAYMENT ERROR:", error);

      return bad(error instanceof ZarinpalError ? error.message : "خطا در اتصال به درگاه پرداخت", 502);
    }
  } catch (error) {
    if (error instanceof BookingError) return bad(error.message, error.status);

    console.error("CREATE BIRTHDAY ERROR:", error);
    return bad("خطا در ثبت رزرو تولد", 500);
  }
}
