import { NextResponse } from "next/server";

import { modeOf } from "@/lib/birthday-pricing";
import { prisma } from "@/lib/prisma";

/** GET /api/birthdays/options?branch=slug → پکیج‌های فعال تولد برای یک شعبه */
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("branch") ?? "";
    const branch = await prisma.branch.findFirst({ where: { slug, isActive: true } });

    if (!branch) return NextResponse.json({ error: "شعبه پیدا نشد" }, { status: 404 });

    const packages = await prisma.birthdayPackage.findMany({
      where: { isActive: true, OR: [{ branchId: null }, { branchId: branch.id }] },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    const view = (kind: string) =>
      packages
        .filter((p) => p.kind === kind)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          items: (p.items ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
          durationMinutes: p.durationMinutes,
          price: p.price,
          pricingMode: modeOf(p.kind, p.pricingMode),
          image: p.image,
        }));

    return NextResponse.json({
      branch: { id: branch.id, slug: branch.slug, name: branch.name },
      games: view("GAME"),
      content: view("CONTENT"),
      cake: view("CAKE"),
      extras: view("EXTRA"),
    });
  } catch (error) {
    console.error("BIRTHDAY OPTIONS ERROR:", error);
    return NextResponse.json({ error: "خطا در دریافت پکیج‌ها" }, { status: 500 });
  }
}
