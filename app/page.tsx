import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import EcoCounter from "@/components/site/EcoCounter";
import { prisma } from "@/lib/prisma";
import "./site.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پادرا پارک | پارک بازی به نفع زمین پاک",
  description: "پادرا؛ پارک بازی به نفع زمین پاک. هر ساعت بازی، یک متر مربع زمین از زباله پاک می‌شود.",
};

const MARQUEE = ["بازی کن", "زمین رو پاک کن", "هر ساعت = ۱ متر مربع", "پادرا پارک", "به نفع زمین"];

export default async function HomePage() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      games: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
    },
  });

  return (
    <main className="pd-page">
      <SiteHeader />

      {/* HERO */}
      <section className="pd-hero">
        <div className="pd-blob pd-blob-a" />
        <div className="pd-blob pd-blob-b" />
        <div className="pd-hero-in">
          <div className="pd-hero-copy">
            <span className="pd-pill">🌍 پارک بازی · پاک‌کردن زمین</span>
            <h1>
              بازی کن،
              <br />
              <em>زمین رو پاک کن.</em>
            </h1>
            <p className="pd-slogan">پادرا؛ پارک بازی به نفع زمین پاک</p>
            <p className="pd-lead">
              هر ساعتی که توی پادرا بازی می‌کنی، یک متر مربع زمین از زباله پاک می‌شود. سرگرمی تو، یک تغییر واقعی برای طبیعت.
            </p>
            <div className="pd-hero-actions">
              <a href="#branches" className="pd-btn">شعبه‌ها را ببین</a>
              <a href="#eco" className="pd-btn pd-btn-ghost">چطور زمین پاک می‌شود؟</a>
            </div>
          </div>

          <div className="pd-hero-art" aria-hidden="true">
            <div className="pd-planet">
              <i className="pd-land pd-land-1" />
              <i className="pd-land pd-land-2" />
              <i className="pd-land pd-land-3" />
            </div>
            <div className="pd-orbit pd-orbit-1"><b /></div>
            <div className="pd-orbit pd-orbit-2"><b /></div>
            <span className="pd-float pd-f1">○</span>
            <span className="pd-float pd-f2">△</span>
            <span className="pd-float pd-f3">□</span>
            <span className="pd-float pd-f4">+1 m²</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="pd-marquee" aria-hidden="true">
        <div className="pd-marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i}>{t} <i>✦</i></span>
          ))}
        </div>
      </div>

      {/* HOW */}
      <section className="pd-sec pd-wrap" id="how">
        <div className="pd-eyebrow">HOW IT WORKS</div>
        <h2>بازیِ تو، زمینِ پاک</h2>
        <div className="pd-steps">
          <div className="pd-step"><span>۱</span><h3>بازی کن</h3><p>یکی از بازی‌ها یا ایونت‌های پادرا را رزرو کن و با دوستانت وارد شو.</p></div>
          <div className="pd-step"><span>۲</span><h3>ساعتت ثبت می‌شود</h3><p>هر ساعتی که در پادرا بازی می‌شود، به حساب «زمین پاک» می‌رود.</p></div>
          <div className="pd-step"><span>۳</span><h3>زمین پاک می‌شود</h3><p>به ازای هر ساعت، یک متر مربع زمین از زباله پاک می‌شود.</p></div>
        </div>
      </section>

      {/* ECO */}
      <section className="pd-eco" id="eco">
        <div className="pd-wrap">
          <div className="pd-eyebrow pd-eyebrow-light">OUR PROMISE</div>
          <h2>هر ساعت بازی = یک متر مربع زمین پاک</h2>
          <p className="pd-eco-text">
            هر خانه‌ی این صفحه یک متر مربع است. اسلایدر را بکش و ببین با چند ساعت بازی چقدر از زمین را پاک می‌کنیم.
          </p>
          <EcoCounter />
        </div>
      </section>

      {/* BRANCHES */}
      <section className="pd-sec pd-wrap" id="branches">
        <div className="pd-eyebrow">BRANCHES</div>
        <h2>شعب پادرا</h2>
        <p className="pd-sub">هر شعبه دنیای خودش را دارد؛ یکی را انتخاب کن.</p>
        <div className="pd-bgrid">
          {branches.map((b) => (
            <Link key={b.id} href={`/branches/${b.slug}`} className={`pd-bc pd-bc-${b.slug}`}>
              <div className="pd-bc-art" aria-hidden="true">
                {b.slug === "lotus" ? (
                  <>
                    <i className="s-circle" /><i className="s-tri" /><i className="s-sq" />
                  </>
                ) : (
                  <>
                    <i className="r-body" /><i className="r-win" /><i className="r-fin" /><i className="r-fire" />
                  </>
                )}
              </div>
              <div className="pd-bc-body">
                <span className="pd-bc-tag">{b.slug === "lotus" ? "SQUID" : "SAFINE"}</span>
                <h3>{b.name}</h3>
                {b.area && <div className="pd-bc-area">{b.area}</div>}
                {b.description && <p>{b.description}</p>}
                <div className="pd-chips">
                  {b.games.slice(0, 5).map((g) => (
                    <span key={g.id}>{g.name}</span>
                  ))}
                </div>
                <span className="pd-bc-go">ورود به شعبه ←</span>
              </div>
            </Link>
          ))}
          {branches.length === 0 && <p className="pd-sub">به‌زودی</p>}
        </div>
      </section>

      {/* ABOUT */}
      <section className="pd-about" id="about">
        <div className="pd-wrap pd-about-in">
          <div>
            <div className="pd-eyebrow">ABOUT PADRA</div>
            <h2>
              پادرا فقط
              <br />
              <em>یک جای بازی نیست.</em>
            </h2>
          </div>
          <div className="pd-about-text">
            <p>
              ما پادرا را ساختیم برای آدم‌هایی که می‌خواهند چند ساعت از روزمرگی فاصله بگیرند، بازی کنند، بخندند و کنار هم
              یک تجربه متفاوت بسازند.
            </p>
            <p>
              از بازی‌های گروهی و هیجان‌انگیز گرفته تا کافه، ایونت، تولد و دورهمی؛ پادرا جایی است که قرار نیست فقط یک
              سرگرمی را تجربه کنی. و حالا، هر ساعت بازی‌ات یک قدم برای زمین پاک‌تر هم هست.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
