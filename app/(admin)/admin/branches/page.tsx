"use client";

import { useEffect, useState } from "react";
import { useFeedback } from "@/components/ui/Feedback";

type Branch = {
  id: number;
  slug: string;
  name: string;
  area: string | null;
  address: string | null;
  mapUrl: string | null;
  phone: string | null;
  description: string | null;
  hours: string | null;
  sortOrder: number;
  birthdayRooms: number;
  isActive: boolean;
};

const EMPTY = { slug: "", name: "", area: "", address: "", mapUrl: "", phone: "", description: "", hours: "", sortOrder: "0", birthdayRooms: "1", isActive: true };

const FIELDS: [keyof typeof EMPTY, string, string?][] = [
  ["name", "نام شعبه (مثلاً شعبه لوتوس)"],
  ["slug", "شناسه آدرس (انگلیسی، مثلاً lotus)"],
  ["area", "محدوده (مثلاً تهران · پونک)"],
  ["address", "آدرس کامل"],
  ["mapUrl", "لینک نقشه"],
  ["phone", "تلفن"],
  ["hours", "ساعت کاری"],
  ["sortOrder", "ترتیب نمایش"],
  ["birthdayRooms", "تعداد سالن تولد (هم‌زمان)"],
];

export default function BranchesAdminPage() {
  const { confirm: confirmDialog, toast } = useFeedback();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/branches", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data)) setBranches(data);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(b: Branch) {
    setEditingId(b.id);
    setForm({
      slug: b.slug,
      name: b.name,
      area: b.area ?? "",
      address: b.address ?? "",
      mapUrl: b.mapUrl ?? "",
      phone: b.phone ?? "",
      description: b.description ?? "",
      hours: b.hours ?? "",
      sortOrder: String(b.sortOrder),
      birthdayRooms: String(b.birthdayRooms ?? 1),
      isActive: b.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/branches/${editingId}` : "/api/branches", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder || 0), birthdayRooms: Number(form.birthdayRooms || 1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره");
      toast(editingId ? "شعبه ویرایش شد" : "شعبه ساخته شد");
      reset();
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function remove(b: Branch) {
    if (!(await confirmDialog(`شعبه «${b.name}» حذف شود؟`, { danger: true }))) return;
    const res = await fetch(`/api/branches/${b.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast(data.error || "خطا در حذف");
    toast("شعبه حذف شد");
    await load();
  }

  const box = { border: "1px solid #c9ccd0", borderRadius: 8, padding: 16, background: "#fff", marginBottom: 12 } as const;
  const input = { width: "100%", padding: 8, border: "1px solid #c9ccd0", borderRadius: 6, font: "inherit" } as const;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>شعبه‌ها</h1>

      <div style={box}>
        <h3>{editingId ? "ویرایش شعبه" : "شعبه جدید"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
          {FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input style={input} value={String(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <label style={{ display: "block", marginTop: 10 }}>
          توضیح کوتاه شعبه
          <textarea style={input} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label style={{ display: "block", margin: "10px 0" }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> فعال (نمایش در سایت)
        </label>
        <button type="button" onClick={save} disabled={saving} style={{ padding: "8px 20px", marginInlineEnd: 8 }}>
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
        {editingId && <button type="button" onClick={reset} style={{ padding: "8px 20px" }}>انصراف</button>}
      </div>

      {branches.map((b) => (
        <div key={b.id} style={{ ...box, display: "flex", gap: 12, alignItems: "center", opacity: b.isActive ? 1 : 0.55 }}>
          <div style={{ flex: 1 }}>
            <b>{b.name}</b> <small>/branches/{b.slug}</small>
            <div>{b.area}</div>
          </div>
          <button type="button" onClick={() => edit(b)}>ویرایش</button>
          <button type="button" onClick={() => remove(b)}>حذف</button>
        </div>
      ))}
    </div>
  );
}
