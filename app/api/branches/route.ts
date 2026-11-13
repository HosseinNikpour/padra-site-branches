import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, hasAccess } from "@/lib/auth";
import { readBranchBody } from "@/lib/branches";

export async function GET() {
  try {
    const canSeeAll = await hasAccess("games.view");
    const branches = await prisma.branch.findMany({
      where: canSeeAll ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("BRANCHES GET ERROR:", error);
    return NextResponse.json({ error: "خطا در دریافت شعبه‌ها" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("games.manage");
    if (!auth.ok) return auth.response;

    const data = readBranchBody(await request.json());
    if (!data.name) return NextResponse.json({ error: "نام شعبه الزامی است" }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json({ error: "شناسه آدرس باید فقط حروف انگلیسی کوچک، عدد و خط تیره باشد" }, { status: 400 });
    }
    if (await prisma.branch.findUnique({ where: { slug: data.slug } })) {
      return NextResponse.json({ error: "این شناسه آدرس قبلاً استفاده شده است" }, { status: 409 });
    }

    const branch = await prisma.branch.create({ data });
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("BRANCHES POST ERROR:", error);
    return NextResponse.json({ error: "خطا در ایجاد شعبه" }, { status: 500 });
  }
}
