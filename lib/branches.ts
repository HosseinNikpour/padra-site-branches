export function readBranchBody(body: Record<string, unknown>) {
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || null;
  };
  return {
    slug: String(body.slug ?? "").trim().toLowerCase(),
    name: String(body.name ?? "").trim(),
    area: str(body.area),
    address: str(body.address),
    mapUrl: str(body.mapUrl),
    phone: str(body.phone),
    description: str(body.description),
    hours: str(body.hours),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
    birthdayRooms: Math.min(20, Math.max(1, Math.trunc(Number(body.birthdayRooms ?? 1)) || 1)),
    isActive: typeof body.isActive === "boolean" ? body.isActive : true,
  };
}

