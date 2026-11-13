"use client";

import { useEffect, useState } from "react";
import { useFeedback } from "@/components/ui/Feedback";
import { MODE_LABEL, modeOf, type PricingMode } from "@/lib/birthday-pricing";

type Pkg = {
  id: number;
  kind: "GAME" | "CONTENT" | "CAKE" | "EXTRA";
  branchId: number | null;
  branch: { name: string } | null;
  name: string;
  description: string | null;
  items: string | null;
  durationMinutes: number | null;
  price: number;
  pricingMode: PricingMode;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

const KIND_LABEL = { GAME: "پکیج بازی", CONTENT: "پکیج تولید محتوا", CAKE: "سرویس کیک", EXTRA: "خدمات اضافه" } as const;

/** برچسب قیمت بسته به نوع (قیمت پکیج بازی و سرویس کیک «به ازای هر نفر» است) */
const PRICE_LABEL = {
  GAME: "قیمت به ازای هر کودک / مهمان (تومان)",
  CAKE: "قیمت به ازای هر نفر (کودک + همراه) (تومان)",
  CONTENT: "قیمت ثابت (تومان)",
  EXTRA: "قیمت (تومان)",
} as const;

const EMPTY = {
  kind: "GAME", branchId: "", name: "", description: "", items: "", durationMinutes: "",
  price: "", pricingMode: "FIXED", image: "", sortOrder: "0", isActive: true,
};

export default function BirthdayPackagesPage() {
  const { confirm: confirmDialog, toast } = useFeedback();
  const [list, setList] = useState<Pkg[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");

  async function load() {
    const problems: string[] = [];

    async function get<T>(url: string, label: string): Promise<T[]> {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !Array.isArray(data)) {
          problems.push(`${label}: ${data?.error ?? `خطای سرور (${res.status})`}`);
          return [];
        }

        return data as T[];
      } catch {
        problems.push(`${label}: ارتباط با سرور برقرار نشد`);
        return [];
      }
    }

    const [pk, br] = await Promise.all([
      get<Pkg>("/api/birthday-packages", "پکیج‌ها"),
      get<{ id: number; name: string }>("/api/branches", "شعبه‌ها"),
    ]);

    setList(pk);
    setBranches(br);
    setLoadError(
      problems.length
        ? `${problems.join(" | ")} — اگر تازه نسخه جدید را گذاشته‌اید، ابتدا «npx prisma migrate deploy» و «npx prisma generate» را اجرا و سرور را دوباره راه‌اندازی کنید.`
        : ""
    );
  }

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof EMPTY, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  function edit(p: Pkg) {
    setEditingId(p.id);
    setForm({
      kind: p.kind, branchId: p.branchId ? String(p.branchId) : "", name: p.name, description: p.description ?? "",
      items: p.items ?? "", durationMinutes: p.durationMinutes ? String(p.durationMinutes) : "", price: String(p.price),
      pricingMode: p.pricingMode ?? "FIXED", image: p.image ?? "",
      sortOrder: String(p.sortOrder), isActive: p.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }

  async function save() {
    if (!form.name.trim()) return toast("نام پکیج را وارد کنید");
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/birthday-packages/${editingId}` : "/api/birthday-packages", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره");
      toast(editingId ? "پکیج ویرایش شد" : "پکیج ساخته شد");
      reset();
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Pkg) {
    if (!(await confirmDialog(`پکیج «${p.name}» حذف شود؟`, { danger: true }))) return;
    const res = await fetch(`/api/birthday-packages/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast(data.error || "خطا در حذف");
    toast("پکیج حذف شد");
    await load();
  }

  const box = { border: "1px solid #dce3e8", borderRadius: 12, padding: 18, background: "#fff", marginBottom: 12 } as const;
  const input = { width: "100%", padding: "11px 13px", border: "1px solid #dce3e8", borderRadius: 9, background: "#fbfcfd", font: "inherit", fontSize: 13 } as const;
  const lab = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: "#3e444b" } as const;
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 } as const;

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h1>پکیج‌های تولد</h1>
      <p style={{ color: "#6b747d" }}>
        پکیج بازی، پکیج تولید محتوا، سرویس کیک و خدمات اضافه (مثل پادرا پارتی یا بازی برای همراهان) را اینجا تعریف کنید. «همه‌ی شعبه‌ها» یعنی پکیج در هر شعبه نمایش داده شود.
      </p>

      {loadError && (
        <div style={{ ...box, borderColor: "#f1b6b6", background: "#fff0f0", color: "#b42318" }} role="alert">
          {loadError}
        </div>
      )}

      <div style={box}>
        <h3>{editingId ? "ویرایش پکیج" : "پکیج جدید"}</h3>
        <div style={grid}>
          <label style={lab}>نوع
            <select style={input} value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label style={lab}>شعبه
            <select style={input} value={form.branchId} onChange={(e) => set("branchId", e.target.value)}>
              <option value="">همه‌ی شعبه‌ها</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label style={lab}>نام پکیج
            <input style={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label style={lab}>مدت (دقیقه)
            <input style={input} type="number" min={0} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
          </label>
          <label style={lab}>{PRICE_LABEL[form.kind as keyof typeof PRICE_LABEL]}
            <input style={input} type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} />
          </label>
          {form.kind === "EXTRA" && (
            <label style={lab}>نحوه‌ی محاسبه‌ی قیمت
              <select style={input} value={form.pricingMode} onChange={(e) => set("pricingMode", e.target.value)}>
                {(Object.keys(MODE_LABEL) as PricingMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
              </select>
            </label>
          )}
          <label style={lab}>ترتیب نمایش
            <input style={input} type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          </label>
          <label style={lab}>آدرس تصویر (اختیاری)
            <input style={input} dir="ltr" value={form.image} onChange={(e) => set("image", e.target.value)} />
          </label>
        </div>
        <label style={{ ...lab, marginTop: 12 }}>
          {form.kind === "GAME" ? "بازی‌های داخل پکیج (هر خط یک بازی)" : "موارد داخل پکیج (هر خط یک مورد)"}
          <textarea style={input} rows={4} value={form.items} onChange={(e) => set("items", e.target.value)} />
        </label>
        <label style={{ ...lab, marginTop: 12 }}>توضیحات
          <textarea style={input} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label style={{ display: "block", margin: "12px 0" }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> فعال
        </label>
        <button type="button" onClick={save} disabled={saving} style={{ padding: "9px 22px", marginInlineEnd: 8 }}>
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
        {editingId && <button type="button" onClick={reset} style={{ padding: "9px 22px" }}>انصراف</button>}
      </div>

      {(["GAME", "CONTENT", "CAKE", "EXTRA"] as const).map((kind) => (
        <section key={kind}>
          <h3>{KIND_LABEL[kind]}</h3>
          {list.filter((p) => p.kind === kind).length === 0 && <p style={{ color: "#6b747d" }}>هنوز موردی ثبت نشده.</p>}
          {list.filter((p) => p.kind === kind).map((p) => (
            <div key={p.id} style={{ ...box, display: "flex", gap: 12, alignItems: "center", opacity: p.isActive ? 1 : 0.55 }}>
              <div style={{ flex: 1 }}>
                <b>{p.name}</b>{" "}
                <small>{p.branch ? p.branch.name : "همه‌ی شعبه‌ها"} · {p.price.toLocaleString("fa-IR")} تومان · {MODE_LABEL[modeOf(p.kind, p.pricingMode)]}{p.durationMinutes ? ` · ${p.durationMinutes.toLocaleString("fa-IR")} دقیقه` : ""}</small>
              </div>
              <button type="button" onClick={() => edit(p)}>ویرایش</button>
              <button type="button" onClick={() => remove(p)}>حذف</button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
