"use client";

import { useEffect, useMemo, useState } from "react";

import DateObject from "react-date-object";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { CHILD_AGE_LIMIT, countsFor, lineAmount, modeOf, multiplierOf, type Counts, type PricingMode } from "@/lib/birthday-pricing";
import { fa } from "@/lib/format";
import { PHONE_ERROR, parsePhone } from "@/lib/phone";

import "./birthday.css";

type Branch = { slug: string; name: string; area: string | null };

type Pkg = {
  id: number;
  name: string;
  description: string | null;
  items: string[];
  durationMinutes: number | null;
  price: number;
  pricingMode: PricingMode;
  image: string | null;
};

type Options = { games: Pkg[]; content: Pkg[]; cake: Pkg[]; extras: Pkg[] };
type Slot = { startTime: string; endTime: string; status: "available" | "full" | "past" };
type Kind = "GAME" | "CONTENT" | "CAKE" | "EXTRA";

const EMPTY_OPTIONS: Options = { games: [], content: [], cake: [], extras: [] };

const UNIT: Record<PricingMode, string> = {
  FIXED: "",
  PER_CHILD: "هر کودک / مهمان",
  PER_PERSON: "هر نفر",
  PER_COMPANION: "هر همراه",
};

function toIso(d: DateObject) {
  const g = d.toDate();
  return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}`;
}

const modeFor = (kind: Kind, pkg: Pkg) => modeOf(kind, pkg.pricingMode);

/** «۲٬۰۰۰٬۰۰۰ تومان / هر نفر» */
function priceText(kind: Kind, pkg: Pkg) {
  const mode = modeFor(kind, pkg);
  const base = pkg.price > 0 ? `${fa(pkg.price)} تومان` : "رایگان";

  return mode === "FIXED" ? base : `${base} / ${UNIT[mode]}`;
}

/** «۱۰ × ۲٬۰۰۰٬۰۰۰ = ۲۰٬۰۰۰٬۰۰۰ تومان» */
function calcText(kind: Kind, pkg: Pkg, counts: Counts) {
  const mode = modeFor(kind, pkg);
  const mult = multiplierOf(mode, counts);

  return mult === null
    ? `${fa(pkg.price)} تومان`
    : `${fa(mult)} × ${fa(pkg.price)} = ${fa(lineAmount(pkg.price, mode, counts))} تومان`;
}

function Details({ kind, pkg, counts }: { kind: Kind; pkg: Pkg; counts: Counts }) {
  const mode = modeFor(kind, pkg);

  return (
    <div className="bd-detail">
      {pkg.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pkg.image} alt={pkg.name} />
      )}
      <div>
        <h4>{pkg.name}</h4>
        {pkg.description && <p>{pkg.description}</p>}
        {pkg.items.length > 0 && (
          <>
            <small>{kind === "GAME" ? "بازی‌های این پکیج" : "شامل"}</small>
            <ul>
              {pkg.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </>
        )}
        <div className="bd-facts">
          {pkg.durationMinutes ? <span>مدت: {fa(pkg.durationMinutes)} دقیقه</span> : null}
          <span>قیمت: {priceText(kind, pkg)}</span>
          {mode !== "FIXED" && counts.all > 0 && <span>جمع: {calcText(kind, pkg, counts)}</span>}
        </div>
      </div>
    </div>
  );
}

/** انتخاب تکی (پکیج بازی، تولید محتوا، سرویس کیک) */
function PackagePicker({ list, value, onChange, kind, counts }: { list: Pkg[]; value: number | null; onChange: (id: number) => void; kind: Kind; counts: Counts }) {
  const selected = list.find((p) => p.id === value) ?? null;

  if (list.length === 0) return <p className="bd-muted">فعلاً موردی برای این شعبه ثبت نشده است.</p>;

  return (
    <div>
      <div className="bd-pkgs" role="radiogroup">
        {list.map((p) => (
          <button type="button" key={p.id} role="radio" aria-checked={p.id === value} className={`bd-pkg ${p.id === value ? "on" : ""}`} onClick={() => onChange(p.id)}>
            <b>{p.name}</b>
            <span>{priceText(kind, p)}</span>
          </button>
        ))}
      </div>
      {selected && <Details kind={kind} pkg={selected} counts={counts} />}
    </div>
  );
}

/** انتخاب چندتایی (خدمات اضافه) */
function ExtrasPicker({ list, value, onToggle, counts }: { list: Pkg[]; value: number[]; onToggle: (id: number) => void; counts: Counts }) {
  if (list.length === 0) return <p className="bd-muted">برای این سن و تعداد مهمان، خدمات اضافه‌ای موجود نیست.</p>;

  return (
    <div className="bd-extras">
      {list.map((p) => {
        const on = value.includes(p.id);
        const mode = modeFor("EXTRA", p);
        const needsCompanion = mode === "PER_COMPANION" && counts.companions < 1;

        return (
          <div key={p.id} className={`bd-extra ${on ? "on" : ""}`}>
            <label className="bd-check">
              <input type="checkbox" checked={on} disabled={needsCompanion} onChange={() => onToggle(p.id)} />
              <span>
                <b>{p.name}</b> — {priceText("EXTRA", p)}
                {on && mode !== "FIXED" && counts.all > 0 && <em> ({calcText("EXTRA", p, counts)})</em>}
              </span>
            </label>
            {p.description && <p>{p.description}</p>}
            {p.items.length > 0 && (
              <ul>
                {p.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
            {needsCompanion && <small className="bd-muted">برای انتخاب این مورد، تعداد همراه را حداقل ۱ وارد کنید.</small>}
          </div>
        );
      })}
    </div>
  );
}

export default function BirthdayClient({ branch: branchInfo }: { branch: Branch }) {
  // شعبه از دکمه‌ای که کاربر در سایت زده مشخص شده است و در این صفحه قابل تغییر نیست
  const branch = branchInfo.slug;
  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [slotsError, setSlotsError] = useState("");

  const [pickerDate, setPickerDate] = useState<DateObject | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState("");

  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [guests, setGuests] = useState("");
  const [children, setChildren] = useState("");
  const [companions, setCompanions] = useState("0");

  const [gameId, setGameId] = useState<number | null>(null);
  const [wantContent, setWantContent] = useState(false);
  const [contentId, setContentId] = useState<number | null>(null);
  const [wantCake, setWantCake] = useState(false);
  const [cakeId, setCakeId] = useState<number | null>(null);
  const [wantExtras, setWantExtras] = useState(false);
  const [extraIds, setExtraIds] = useState<number[]>([]);

  const [customer, setCustomer] = useState<{ id: number; name: string; phone: string } | null>(null);
  const [customerLoaded, setCustomerLoaded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ---------- داده‌ها ---------- */

  useEffect(() => {
    fetch("/api/bookings/identity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer ?? null))
      .catch(() => setCustomer(null))
      .finally(() => setCustomerLoaded(true));
  }, []);

  useEffect(() => {
    if (!branch) return;
    setOptionsLoading(true);
    setGameId(null);
    setContentId(null);
    setCakeId(null);
    setExtraIds([]);

    setOptionsError("");

    fetch(`/api/birthdays/options?branch=${encodeURIComponent(branch)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "خطا در دریافت پکیج‌ها");
        const games: Pkg[] = d.games ?? [];
        setOptions({ games, content: d.content ?? [], cake: d.cake ?? [], extras: d.extras ?? [] });
        // پکیج بازی الزامی است؛ اولین پکیج به‌صورت پیش‌فرض انتخاب می‌شود
        setGameId(games[0]?.id ?? null);
      })
      .catch((e: Error) => {
        setOptions(EMPTY_OPTIONS);
        setOptionsError(e.message || "خطا در دریافت پکیج‌ها");
      })
      .finally(() => setOptionsLoading(false));
  }, [branch]);

  useEffect(() => {
    setStartTime("");
    if (!branch || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlotsError("");
    fetch(`/api/birthdays/slots?branch=${encodeURIComponent(branch)}&date=${date}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "خطا در دریافت ساعت‌ها");
        setSlots(d.slots ?? []);
      })
      .catch((e: Error) => {
        setSlots([]);
        setSlotsError(e.message || "خطا در دریافت ساعت‌ها");
      })
      .finally(() => setSlotsLoading(false));
  }, [branch, date]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  /* ---------- محاسبات (واکنش به انتخاب کاربر) ---------- */

  const ageNum = Number.parseInt(age, 10);
  const ageValid = Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 99;
  const isChild = ageValid && ageNum < CHILD_AGE_LIMIT;
  const guestsNum = Number.parseInt(guests, 10) || 0;
  const childrenNum = Number.parseInt(children, 10) || 0;
  const companionsNum = Number.parseInt(companions, 10) || 0;
  const counts: Counts = ageValid ? countsFor(ageNum, guestsNum, childrenNum, companionsNum) : { children: 0, companions: 0, all: 0 };

  const game = options.games.find((p) => p.id === gameId) ?? null;
  const content = wantContent ? options.content.find((p) => p.id === contentId) ?? null : null;
  const cake = wantCake ? options.cake.find((p) => p.id === cakeId) ?? null : null;

  // خدماتِ «به ازای هر همراه» برای سن ۱۵ به بالا (بدون همراه) نمایش داده نمی‌شود
  const visibleExtras = options.extras.filter((p) => !(modeOf("EXTRA", p.pricingMode) === "PER_COMPANION" && ageValid && !isChild));
  const chosenExtras = wantExtras
    ? visibleExtras.filter((p) => extraIds.includes(p.id) && !(modeOf("EXTRA", p.pricingMode) === "PER_COMPANION" && counts.companions < 1))
    : [];

  const gameAmount = game ? lineAmount(game.price, "PER_CHILD", counts) : 0;
  const contentAmount = content ? content.price : 0;
  const cakeAmount = cake ? lineAmount(cake.price, "PER_PERSON", counts) : 0;
  const extrasAmount = chosenExtras.reduce((sum, p) => sum + lineAmount(p.price, modeOf("EXTRA", p.pricingMode), counts), 0);
  const total = gameAmount + contentAmount + cakeAmount + extrasAmount;
  const phoneVerified = !!otpToken && otpPhone === customerPhone.trim();

  const maxDate = useMemo(() => new DateObject({ calendar: persian, locale: persian_fa }).add(90, "days"), []);
  const minDate = useMemo(() => new DateObject({ calendar: persian, locale: persian_fa }), []);

  function toggleContent(on: boolean) {
    setWantContent(on);
    if (on && options.content.length === 1) setContentId(options.content[0].id);
    if (!on) setContentId(null);
  }

  function toggleExtras(on: boolean) {
    setWantExtras(on);
    if (!on) setExtraIds([]);
  }

  function toggleExtra(id: number) {
    setExtraIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function toggleCake(on: boolean) {
    setWantCake(on);
    if (on && options.cake.length === 1) setCakeId(options.cake[0].id);
    if (!on) setCakeId(null);
  }

  /* ---------- تأیید موبایل ---------- */

  async function sendOtp() {
    setOtpMessage("");
    if (!parsePhone(customerPhone)) return setOtpMessage(PHONE_ERROR);
    try {
      setOtpBusy(true);
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: customerPhone.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setOtpMessage(d.error || "ارسال کد ممکن نشد");
      setOtpSent(true);
      setOtpCode("");
      setOtpCooldown(60);
      setOtpMessage("کد تأیید پیامک شد.");
    } catch {
      setOtpMessage("ارتباط با سرور برقرار نشد");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyOtp() {
    setOtpMessage("");
    if (otpCode.trim().length !== 6) return setOtpMessage("کد ۶ رقمی را وارد کنید");
    try {
      setOtpBusy(true);
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: customerPhone.trim(), code: otpCode.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.otpToken) return setOtpMessage(d.error || "کد صحیح نیست");
      setOtpToken(d.otpToken);
      setOtpPhone(customerPhone.trim());
    } catch {
      setOtpMessage("ارتباط با سرور برقرار نشد");
    } finally {
      setOtpBusy(false);
    }
  }

  /* ---------- ثبت ---------- */

  async function submit() {
    setError("");

    if (!date) return setError("تاریخ تولد را انتخاب کنید");
    if (!startTime) return setError("ساعت را انتخاب کنید");
    if (childName.trim().length < 2) return setError("نام فرد متولد را وارد کنید");
    if (!ageValid) return setError("سن فرد متولد را وارد کنید");
    if (!gender) return setError("جنسیت را انتخاب کنید");
    if (isChild ? childrenNum < 1 : guestsNum < 1) return setError(isChild ? "تعداد کودک را وارد کنید" : "تعداد مهمان را وارد کنید");
    if (!game) return setError("پکیج بازی را انتخاب کنید");
    if (wantContent && !content) return setError("پکیج تولید محتوا را انتخاب کنید یا تیک آن را بردارید");
    if (wantCake && !cake) return setError("سرویس کیک را انتخاب کنید یا تیک آن را بردارید");
    if (wantExtras && chosenExtras.length === 0) return setError("خدمات اضافه را انتخاب کنید یا تیک آن را بردارید");
    if (!customer && customerName.trim().length < 2) return setError("نام و نام خانوادگی خود را وارد کنید");
    if ((!customer || !customer.phone) && !parsePhone(customerPhone)) return setError(PHONE_ERROR);
    if (!customer && !phoneVerified) return setError("ابتدا شماره موبایل خود را با کد پیامکی تأیید کنید");

    try {
      setSubmitting(true);
      const res = await fetch("/api/birthdays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          date,
          startTime,
          childName: childName.trim(),
          age: ageNum,
          gender,
          ...(isChild ? { children: childrenNum, companions: companionsNum } : { guests: guestsNum }),
          packageId: game.id,
          contentId: content?.id ?? null,
          cakeId: cake?.id ?? null,
          extraIds: chosenExtras.map((p) => p.id),
          customerPhone: customerPhone.trim(),
          ...(customer ? {} : { customerName: customerName.trim(), otpToken }),
        }),
      });
      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(d.error || "خطا در ثبت رزرو");
        if (d.code === "OTP_REQUIRED") {
          setOtpToken("");
          setOtpSent(false);
        }
        if (res.status === 409) {
          setStartTime("");
          const s = await fetch(`/api/birthdays/slots?branch=${encodeURIComponent(branch)}&date=${date}`).then((r) => r.json());
          setSlots(s.slots ?? []);
        }
        return;
      }

      if (d.free && d.trackingCode) {
        window.location.href = `/booking/result?status=success&code=${encodeURIComponent(d.trackingCode)}`;
        return;
      }

      window.location.href = d.paymentUrl;
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bd-page">
      <section className="bd-hero">
        <span>BIRTHDAY AT PADRA</span>
        <h1>تولدت رو پادرایی کن</h1>
        <p>تاریخ و ساعت را انتخاب کن، پکیج مورد علاقه‌ات را بردار و رزرو را با پرداخت آنلاین نهایی کن.</p>
        <div className="bd-branch">
          <b>{branchInfo.name}</b>
          {branchInfo.area ? <span>{branchInfo.area}</span> : null}
          <a href="/#branches">شعبه دیگر</a>
        </div>
      </section>

      <div className="bd-wrap">
        <div className="bd-card">
          <h2><i>۱</i> تاریخ و ساعت</h2>
          <div className="bd-field">
            <label>تاریخ تولد</label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              value={pickerDate}
              onChange={(v) => {
                const d = Array.isArray(v) ? v[0] : v;
                setPickerDate(d ?? null);
                setDate(d ? toIso(d) : "");
              }}
              minDate={minDate}
              maxDate={maxDate}
              inputClass="bd-input"
              placeholder="انتخاب تاریخ"
              editable={false}
            />
          </div>

          {date && (
            <div className="bd-field">
              <label>ساعت</label>
              {slotsLoading ? (
                <p className="bd-muted">در حال بررسی سانس‌ها...</p>
              ) : slotsError ? (
                <div className="bd-error" role="alert">{slotsError}</div>
              ) : slots.length === 0 ? (
                <p className="bd-muted">برای این تاریخ سانسی وجود ندارد.</p>
              ) : (
                <div className="bd-slots">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.startTime}
                      disabled={s.status !== "available"}
                      className={`bd-slot ${startTime === s.startTime ? "on" : ""}`}
                      onClick={() => setStartTime(s.startTime)}
                    >
                      <b>{s.startTime} تا {s.endTime}</b>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bd-card">
          <h2><i>۲</i> اطلاعات فرد متولد</h2>
          <div className="bd-row">
            <div className="bd-field">
              <label>نام</label>
              <input className="bd-input" value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={60} />
            </div>
            <div className="bd-field">
              <label>سن</label>
              <input className="bd-input" type="number" min={1} max={99} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>

          <div className="bd-field">
            <label>جنسیت</label>
            <div className="bd-chips">
              <button type="button" className={`bd-chip ${gender === "MALE" ? "on" : ""}`} onClick={() => setGender("MALE")}>پسر / آقا</button>
              <button type="button" className={`bd-chip ${gender === "FEMALE" ? "on" : ""}`} onClick={() => setGender("FEMALE")}>دختر / خانم</button>
            </div>
          </div>

          {!ageValid ? (
            <p className="bd-muted">پس از وارد کردن سن، فیلدهای تعداد مهمان‌ها نمایش داده می‌شود.</p>
          ) : isChild ? (
            <div className="bd-row">
              <div className="bd-field">
                <label>تعداد کودک</label>
                <input className="bd-input" type="number" min={1} inputMode="numeric" value={children} onChange={(e) => setChildren(e.target.value)} />
              </div>
              <div className="bd-field">
                <label>تعداد همراه</label>
                <input className="bd-input" type="number" min={0} inputMode="numeric" value={companions} onChange={(e) => setCompanions(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="bd-field">
              <label>تعداد مهمان</label>
              <input className="bd-input" type="number" min={1} inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
          )}
        </div>

        <div className="bd-card">
          <h2><i>۳</i> پکیج بازی</h2>
          {optionsLoading ? <p className="bd-muted">در حال بارگذاری...</p> : optionsError ? <div className="bd-error" role="alert">{optionsError}</div> : <PackagePicker kind="GAME" list={options.games} value={gameId} onChange={setGameId} counts={counts} />}
        </div>

        <div className="bd-card">
          <label className="bd-check">
            <input type="checkbox" checked={wantContent} onChange={(e) => toggleContent(e.target.checked)} />
            <span><b>تولید محتوا</b> (اختیاری) — عکس و فیلم حرفه‌ای از جشن</span>
          </label>
          {wantContent && <PackagePicker kind="CONTENT" list={options.content} value={contentId} onChange={setContentId} counts={counts} />}
        </div>

        <div className="bd-card">
          <label className="bd-check">
            <input type="checkbox" checked={wantCake} onChange={(e) => toggleCake(e.target.checked)} />
            <span><b>سرویس کیک</b> (اختیاری) — قیمت به ازای هر نفر (کودک + همراه)</span>
          </label>
          {wantCake && <PackagePicker kind="CAKE" list={options.cake} value={cakeId} onChange={setCakeId} counts={counts} />}
        </div>

        <div className="bd-card">
          <label className="bd-check">
            <input type="checkbox" checked={wantExtras} onChange={(e) => toggleExtras(e.target.checked)} />
            <span><b>خدمات اضافه</b> (اختیاری) — پادرا پارتی، بازی برای همراهان و …</span>
          </label>
          {wantExtras && <ExtrasPicker list={visibleExtras} value={extraIds} onToggle={toggleExtra} counts={counts} />}
        </div>

        <div className="bd-card">
          <h2><i>۴</i> مشخصات شما</h2>
          {customerLoaded && customer ? (
            <div className="bd-me">
              <small>رزرو به نام</small>
              <b>{customer.name}</b>
              {customer.phone && <span dir="ltr">{customer.phone}</span>}
            </div>
          ) : null}
          {customerLoaded && customer && !customer.phone ? (
            <div className="bd-field" style={{ marginTop: 12 }}>
              <label>شماره موبایل (برای پیگیری رزرو)</label>
              <input className="bd-input" dir="ltr" inputMode="tel" placeholder="09123456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          ) : null}
          {customerLoaded && customer ? (
            <></>
          ) : (
            customerLoaded && (
              <>
                <div className="bd-row">
                  <div className="bd-field">
                    <label>نام و نام خانوادگی</label>
                    <input className="bd-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={60} />
                  </div>
                  <div className="bd-field">
                    <label>شماره موبایل</label>
                    <input className="bd-input" dir="ltr" inputMode="tel" placeholder="09123456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                </div>

                {phoneVerified ? (
                  <p className="bd-ok">✓ شماره موبایل تأیید شد.</p>
                ) : (
                  <div className="bd-otp">
                    {otpSent && (
                      <input className="bd-input" dir="ltr" inputMode="numeric" maxLength={6} placeholder="کد ۶ رقمی" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                    )}
                    {otpSent && (
                      <button type="button" className="bd-btn" onClick={verifyOtp} disabled={otpBusy}>تأیید کد</button>
                    )}
                    <button type="button" className="bd-btn bd-btn-line" onClick={sendOtp} disabled={otpBusy || otpCooldown > 0}>
                      {otpCooldown > 0 ? `ارسال دوباره (${fa(otpCooldown)})` : otpSent ? "ارسال دوباره کد" : "ارسال کد تأیید"}
                    </button>
                    {otpMessage && <p className="bd-muted">{otpMessage}</p>}
                  </div>
                )}
              </>
            )
          )}
        </div>

        {/* خلاصه — ثابت در انتهای صفحه، شناور نیست */}
        <div className="bd-summary">
          <h2>خلاصه رزرو</h2>
          <dl>
            <div><dt>شعبه</dt><dd>{branchInfo.name}</dd></div>
            <div><dt>تاریخ و ساعت</dt><dd>{pickerDate ? `${pickerDate.format("dddd D MMMM YYYY")}${startTime ? ` · ${startTime}` : ""}` : "—"}</dd></div>
            <div><dt>متولد</dt><dd>{childName ? `${childName}${ageValid ? ` (${fa(ageNum)} ساله)` : ""}` : "—"}</dd></div>
            <div><dt>مهمانان</dt><dd>{!ageValid ? "—" : isChild ? `${fa(childrenNum)} کودک + ${fa(companionsNum)} همراه` : `${fa(guestsNum)} نفر`}</dd></div>
            <div><dt>پکیج بازی</dt><dd>{game ? `${game.name} — ${counts.all > 0 ? calcText("GAME", game, counts) : priceText("GAME", game)}` : "—"}</dd></div>
            {wantContent && <div><dt>تولید محتوا</dt><dd>{content ? `${content.name} — ${fa(content.price)} تومان` : "انتخاب نشده"}</dd></div>}
            {wantCake && <div><dt>سرویس کیک</dt><dd>{cake ? `${cake.name} — ${counts.all > 0 ? calcText("CAKE", cake, counts) : priceText("CAKE", cake)}` : "انتخاب نشده"}</dd></div>}
            {chosenExtras.map((p) => (
              <div key={p.id}><dt>{p.name}</dt><dd>{counts.all > 0 ? calcText("EXTRA", p, counts) : priceText("EXTRA", p)}</dd></div>
            ))}
          </dl>
          {!ageValid || counts.all === 0 ? <p className="bd-muted">پس از وارد کردن سن و تعداد مهمان‌ها، مبلغ نهایی محاسبه می‌شود.</p> : null}
          <div className="bd-total"><span>مبلغ قابل پرداخت</span><strong>{fa(total)} تومان</strong></div>
          <p className="bd-muted">پس از ثبت، به درگاه امن پرداخت منتقل می‌شوید. سانس تا ۲۰ دقیقه برای شما نگه داشته می‌شود و پس از پرداخت موفق، کد رهگیری پیامک می‌شود.</p>
          {error && <div className="bd-error" role="alert">{error}</div>}
          <button type="button" className="bd-pay" onClick={submit} disabled={submitting}>
            {submitting ? "در حال انتقال به درگاه..." : "پرداخت و ثبت نهایی"} <span>←</span>
          </button>
        </div>
      </div>
    </main>
  );
}
