import { NextResponse } from "next/server";

import { isValidDate } from "@/lib/availability";
import { birthdaySlots } from "@/lib/birthday";
import { prisma } from "@/lib/prisma";

/** GET /api/birthdays/slots?branch=slug&date=YYYY-MM-DD → وضعیت سانس‌های ۲ ساعته */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const date = params.get("date");
    const branch = await prisma.branch.findFirst({ where: { slug: params.get("branch") ?? "", isActive: true } });

    if (!branch || !isValidDate(date)) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    return NextResponse.json({ slots: await birthdaySlots(prisma, branch, date) });
  } catch (error) {
    console.error("BIRTHDAY SLOTS ERROR:", error);
    return NextResponse.json({ error: "خطا در دریافت سانس‌ها" }, { status: 500 });
  }
}
