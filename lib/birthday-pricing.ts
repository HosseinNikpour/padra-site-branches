/** منطق قیمت‌گذاری رزرو تولد؛ بدون وابستگی به دیتابیس تا هم سرور و هم مرورگر از آن استفاده کنند. */

/** سن پایین‌تر از این: «تعداد کودک» و «تعداد همراه»؛ سن بالاتر: «تعداد مهمان» */
export const CHILD_AGE_LIMIT = 15;

/**
 * نحوه‌ی محاسبه‌ی قیمت یک مورد:
 *  FIXED          قیمت ثابت
 *  PER_CHILD      قیمت × تعداد کودک (یا تعداد مهمان در سن ۱۵ به بالا)
 *  PER_PERSON     قیمت × (تعداد کودک + تعداد همراه)
 *  PER_COMPANION  قیمت × تعداد همراه
 */
export const PRICING_MODES = ["FIXED", "PER_CHILD", "PER_PERSON", "PER_COMPANION"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const MODE_LABEL: Record<PricingMode, string> = {
  FIXED: "قیمت ثابت",
  PER_CHILD: "به ازای هر کودک / مهمان",
  PER_PERSON: "به ازای هر نفر (کودک + همراه)",
  PER_COMPANION: "به ازای هر همراه",
};

export type Counts = { children: number; companions: number; all: number };

export function countsFor(age: number, guests: number, children: number, companions: number): Counts {
  if (age >= CHILD_AGE_LIMIT) return { children: guests, companions: 0, all: guests };

  return { children, companions, all: children + companions };
}

export function isMode(value: unknown): value is PricingMode {
  return PRICING_MODES.includes(value as PricingMode);
}

/** پکیج بازی همیشه «هر کودک»، سرویس کیک «هر نفر»، تولید محتوا «ثابت»؛ خدمات اضافه هرکدام نحوه‌ی خودش را دارد. */
export function modeOf(kind: string, stored?: string | null): PricingMode {
  if (kind === "GAME") return "PER_CHILD";
  if (kind === "CAKE") return "PER_PERSON";
  if (kind === "CONTENT") return "FIXED";

  return isMode(stored) ? stored : "FIXED";
}

export function lineAmount(price: number, mode: PricingMode, counts: Counts) {
  switch (mode) {
    case "PER_CHILD":
      return price * counts.children;
    case "PER_PERSON":
      return price * counts.all;
    case "PER_COMPANION":
      return price * counts.companions;
    default:
      return price;
  }
}

/** تعداد ضرب‌شونده برای نمایش (مثلاً «۱۰ نفر × قیمت») */
export function multiplierOf(mode: PricingMode, counts: Counts) {
  return mode === "FIXED" ? null : mode === "PER_CHILD" ? counts.children : mode === "PER_PERSON" ? counts.all : counts.companions;
}
