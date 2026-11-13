import { KINDS, type PackageKind } from "@/lib/birthday";
import { isMode, modeOf } from "@/lib/birthday-pricing";

const num = (v: unknown, min = 0) => Math.max(min, Math.trunc(Number(v) || 0));

export function readPackageBody(body: Record<string, unknown>) {
  const kind = String(body.kind ?? "GAME") as PackageKind;
  const name = String(body.name ?? "").trim();

  if (!KINDS.includes(kind)) return { error: "نوع پکیج معتبر نیست" } as const;
  if (!name) return { error: "نام پکیج را وارد کنید" } as const;
  if (kind === "EXTRA" && !isMode(body.pricingMode)) return { error: "نحوه‌ی محاسبه‌ی قیمت را انتخاب کنید" } as const;

  const text = (v: unknown) => String(v ?? "").trim() || null;
  const branchId = body.branchId === null || body.branchId === undefined || body.branchId === "" ? null : Number(body.branchId);

  if (branchId !== null && !Number.isInteger(branchId)) return { error: "شعبه معتبر نیست" } as const;

  return {
    data: {
      kind,
      branchId,
      name,
      description: text(body.description),
      items: text(body.items),
      durationMinutes: body.durationMinutes === "" || body.durationMinutes == null ? null : num(body.durationMinutes),
      price: num(body.price),
      pricingMode: modeOf(kind, String(body.pricingMode ?? "")),
      image: text(body.image),
      sortOrder: num(body.sortOrder),
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    },
  } as const;
}
