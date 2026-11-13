import { NextResponse } from "next/server";

import { authorize } from "@/lib/auth";
import { readPackageBody } from "@/lib/birthday-package";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await authorize("games.view");
    if (!auth.ok) return auth.response;

    const list = await prisma.birthdayPackage.findMany({
      include: { branch: { select: { id: true, name: true } } },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("BIRTHDAY PACKAGES GET ERROR:", error);
    return NextResponse.json({ error: "دیتابیس برای پکیج‌های تولد آماده نیست (مایگریشن اجرا نشده)" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const parsed = readPackageBody(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const created = await prisma.birthdayPackage.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("BIRTHDAY PACKAGE POST ERROR:", error);
    return NextResponse.json({ error: "خطا در ثبت پکیج" }, { status: 500 });
  }
}
