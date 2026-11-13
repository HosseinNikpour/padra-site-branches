import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { readBranchBody } from "@/lib/branches";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const branchId = Number((await params).id);
    if (!Number.isInteger(branchId)) {
      return NextResponse.json({ error: "شناسه شعبه معتبر نیست" }, { status: 400 });
    }

    const data = readBranchBody(await request.json());
    if (!data.name) return NextResponse.json({ error: "نام شعبه الزامی است" }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json({ error: "شناسه آدرس معتبر نیست" }, { status: 400 });
    }
    const clash = await prisma.branch.findUnique({ where: { slug: data.slug } });
    if (clash && clash.id !== branchId) {
      return NextResponse.json({ error: "این شناسه آدرس قبلاً استفاده شده است" }, { status: 409 });
    }

    const branch = await prisma.branch.update({ where: { id: branchId }, data });
    return NextResponse.json(branch);
  } catch (error) {
    console.error("BRANCH PUT ERROR:", error);
    return NextResponse.json({ error: "خطا در ویرایش شعبه" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const branchId = Number((await params).id);
    if (!Number.isInteger(branchId)) {
      return NextResponse.json({ error: "شناسه شعبه معتبر نیست" }, { status: 400 });
    }

    const used = (await prisma.game.count({ where: { branchId } })) + (await prisma.event.count({ where: { branchId } }));
    if (used > 0) {
      return NextResponse.json({ error: "این شعبه بازی یا ایونت دارد؛ به‌جای حذف، آن را غیرفعال کنید" }, { status: 409 });
    }

    await prisma.branch.delete({ where: { id: branchId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("BRANCH DELETE ERROR:", error);
    return NextResponse.json({ error: "خطا در حذف شعبه" }, { status: 500 });
  }
}
