import { NextResponse } from "next/server";

import { authorize } from "@/lib/auth";
import { readPackageBody } from "@/lib/birthday-package";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه معتبر نیست" }, { status: 400 });

    const parsed = readPackageBody(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    return NextResponse.json(await prisma.birthdayPackage.update({ where: { id }, data: parsed.data }));
  } catch (error) {
    console.error("BIRTHDAY PACKAGE PUT ERROR:", error);
    return NextResponse.json({ error: "خطا در ویرایش پکیج" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه معتبر نیست" }, { status: 400 });

    // حذف پکیجی که رزرو دارد، سانس‌های آن را از شمارش خارج می‌کند؛ باید غیرفعال شود
    if ((await prisma.booking.count({ where: { birthdayPackageId: id } })) > 0) {
      return NextResponse.json({ error: "این پکیج رزرو دارد؛ به‌جای حذف، آن را غیرفعال کنید" }, { status: 409 });
    }

    await prisma.birthdayPackage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("BIRTHDAY PACKAGE DELETE ERROR:", error);
    return NextResponse.json({ error: "خطا در حذف پکیج" }, { status: 500 });
  }
}
