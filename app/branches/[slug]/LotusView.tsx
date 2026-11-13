"use client";

import Link from "next/link";
import { faNumber, formatPrice, useBranchData } from "./useBranchData";
import type { BranchInfo } from "./useBranchData";
import "./lotus.css";

const pad = (n: number) => String(n).padStart(3, "0");

const CAFE = [
  ["قهوه و نوشیدنی", "از اسپرسو تا نوشیدنی‌های ویژه"],
  ["فضای راحت", "مبلمان مدرن و دنج"],
  ["تماشای مسابقات", "روی پرده بزرگ پادرا"],
  ["دورهمی و گفتگو", "با دوستان، خانواده و همکاران"],
];

const BDAY = [
  ["بازی", "هیجان برای همه"],
  ["کیک", "جشن بدون کیک نمی‌شه"],
  ["عکس و فیلم", "لحظه‌ها رو نگه دار"],
  ["کافه", "دورهمی بعد از بازی"],
];

function Shapes() {
  return (
    <div className="sq-shapes" aria-hidden="true">
      <i className="sq-circle" />
      <i className="sq-triangle" />
      <i className="sq-square" />
    </div>
  );
}

/** شعبه لوتوس: تم «اسکویید» — قرمز، سفید و مشکی */
export default function LotusView({ branch }: { branch: BranchInfo }) {
  const { games, events, loadingGames, loadingEvents } = useBranchData(branch.slug);

  return (
    <div className="sq-page" dir="rtl">
      <section className="sq-hero" id="home">
        <Shapes />
        <div className="sq-kicker">PADRA PARK · {branch.name}</div>
        <h1>
          بازی شروع شد.
          <br />
          <strong>آماده‌ای؟</strong>
        </h1>
        <p>{branch.description || "جایی برای رقابت، هیجان و بازی‌هایی که فراموش نمی‌شوند."}</p>
        <div className="sq-actions">
          <a href="#games" className="sq-btn">ورود به بازی‌ها</a>
          {branch.mapUrl && (
            <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className="sq-btn sq-btn-line">
              آدرس روی نقشه
            </a>
          )}
        </div>
        <div className="sq-info">
          {branch.area && <span>{branch.area}</span>}
          {branch.hours && <span>ساعت کاری: {branch.hours}</span>}
          {branch.address && <span>{branch.address}</span>}
        </div>
      </section>

      <section className="sq-sec" id="games">
        <div className="sq-head">
          <span>ROUND 01</span>
          <h2>بازی‌ها</h2>
        </div>
        {loadingGames ? (
          <div className="sq-empty">در حال بارگذاری بازی‌ها...</div>
        ) : games.length === 0 ? (
          <div className="sq-empty">بازی‌های این شعبه به‌زودی اضافه می‌شوند.</div>
        ) : (
          <div className="sq-grid">
            {games.map((game, i) => (
              <Link key={game.id} href={`/booking?gameId=${game.id}`} className="sq-card">
                <div className="sq-card-media">
                  {game.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" src={game.image} alt={game.name} />
                  ) : (
                    <div className="sq-card-ph"><Shapes /></div>
                  )}
                  <span className="sq-badge">{pad(i + 1)}</span>
                </div>
                <div className="sq-card-body">
                  <h3>{game.name}</h3>
                  {game.description && <p>{game.description}</p>}
                  <div className="sq-meta">
                    {game.duration && <span><b>مدت</b> {game.duration}</span>}
                    {game.capacity && <span><b>بازیکن</b> {game.capacity}</span>}
                    <span><b>ورودی</b> {formatPrice(game.price)}</span>
                  </div>
                  <span className="sq-go">رزرو ←</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="sq-sec sq-sec-alt" id="today">
        <div className="sq-head">
          <span>ROUND 02</span>
          <h2>ایونت‌ها</h2>
        </div>
        {loadingEvents ? (
          <div className="sq-empty">در حال بررسی برنامه...</div>
        ) : events.length === 0 ? (
          <div className="sq-empty">فعلاً ایونتی ثبت نشده؛ بازی‌ها همیشه آماده‌اند.</div>
        ) : (
          <div className="sq-events">
            {events.map((event, i) => (
              <article key={event.id} className="sq-event">
                <div className="sq-event-no">{pad(i + 1)}</div>
                <div className="sq-event-main">
                  <small>{event.genre || "EVENT"}</small>
                  <h3>{event.title}</h3>
                  {event.description && <p>{event.description}</p>}
                  {event.duration && <span className="sq-chip">{faNumber.format(event.duration)} دقیقه</span>}
                </div>
                {event.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="sq-event-img" loading="lazy" src={event.image} alt={event.title} />
                )}
                <div className="sq-slots">
                  {event.slots.length === 0 && <span className="sq-dim">سانس آزادی وجود ندارد</span>}
                  {event.slots.map((slot) => (
                    <Link
                      key={`${slot.date}-${slot.startTime}`}
                      className="sq-slot"
                      href={`/booking?eventId=${event.id}&date=${slot.date}&startTime=${encodeURIComponent(slot.startTime)}`}
                    >
                      <small>
                        {new Intl.DateTimeFormat("fa-IR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
                          new Date(`${slot.date}T00:00:00Z`)
                        )}
                      </small>
                      <strong>{slot.startTime}</strong>
                      <small>{faNumber.format(slot.price)} تومان · {faNumber.format(slot.remaining)} ظرفیت</small>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="sq-sec" id="cafe">
        <div className="sq-head">
          <span>BREAK TIME</span>
          <h2>کافه پادرا</h2>
        </div>
        <p className="sq-lead">بعد از بازی، وقتشه کمی آروم‌تر بشی. یک نوشیدنی خوش‌طعم، یک میز راحت و چند دقیقه دور از شلوغی.</p>
        <div className="sq-four">
          {CAFE.map(([t, s], i) => (
            <div key={t} className="sq-tile">
              <span>{["○", "△", "□", "○"][i]}</span>
              <strong>{t}</strong>
              <small>{s}</small>
            </div>
          ))}
        </div>
        <div className="sq-actions">
          <a href="/menu" className="sq-btn">منوی کافه</a>
          {branch.phone && <a href={`tel:${branch.phone}`} className="sq-btn sq-btn-line">رزرو میز</a>}
        </div>
      </section>

      <section className="sq-sec sq-sec-red" id="birthday">
        <div className="sq-head">
          <span>BIRTHDAYS</span>
          <h2>اینجا فقط تولد نمی‌گیریم.</h2>
        </div>
        <p className="sq-lead">یه روز معمولی رو تبدیل کن به یه خاطره‌ای که همه دوست دارن دوباره تعریفش کنن.</p>
        <div className="sq-four">
          {BDAY.map(([t, s], i) => (
            <div key={t} className="sq-tile">
              <span>{pad(i + 1)}</span>
              <strong>{t}</strong>
              <small>{s}</small>
            </div>
          ))}
        </div>
        <div className="sq-cta">
          <h3>تولدت رو پادرا‌یی کن.</h3>
          <a href={`/birthday?branch=${branch.slug}`} className="sq-btn sq-btn-white">رزرو تولد</a>
        </div>
      </section>
    </div>
  );
}
