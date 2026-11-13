"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Game = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  duration: string | null;
  capacity: string | null;
  price: number | null;
};

type Slot = { date: string; startTime: string; endTime: string; price: number; capacity: number; remaining: number };

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  genre: string | null;
  duration: number | null;
  slots: Slot[];
};

const CAFE = [
  ["قهوه و نوشیدنی", "از اسپرسو تا نوشیدنی‌های ویژه"],
  ["فضای راحت", "مبلمان مدرن و دنج"],
  ["تماشای مسابقات", "روی پرده بزرگ پادرا"],
  ["دورهمی و گفتگو", "با دوستان، خانواده و همکاران"],
];

const fa = new Intl.NumberFormat("fa-IR");

function formatPrice(price: number | null) {
  return price ? `${fa.format(price)} تومان` : "استعلام قیمت";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );
}

export default function BranchClient({ slug, branchName, phone }: { slug: string; branchName: string; phone: string | null }) {
  const [games, setGames] = useState<Game[] | null>(null);
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    const q = `branch=${encodeURIComponent(slug)}`;

    fetch(`/api/games?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setGames(Array.isArray(d) ? d.filter((g: Game & { isActive?: boolean }) => g.isActive !== false) : []))
      .catch(() => setGames([]));

    fetch(`/api/events/available?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]));
  }, [slug]);

  return (
    <div className="pd-wrap">
      <section className="pd-sec" id="games">
        <div className="pd-eyebrow">GAMES</div>
        <h2>بازی‌ها</h2>
        {games === null && <p className="pd-mut">در حال بارگذاری بازی‌ها...</p>}
        {games?.length === 0 && <p className="pd-mut">هنوز بازی‌ای برای این شعبه ثبت نشده است.</p>}
        <div className="pd-grid">
          {games?.map((game) => (
            <div key={game.id} className="pd-card">
              {game.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.image} alt={game.name} className="pd-card-img" />
              )}
              <h3>{game.name}</h3>
              {game.description && <p className="pd-mut">{game.description}</p>}
              <div>
                {game.duration && <span className="pd-chip">مدت: {game.duration}</span>}
                {game.capacity && <span className="pd-chip">تعداد بازیکن: {game.capacity}</span>}
                <span className="pd-chip">{formatPrice(game.price)}</span>
              </div>
              <Link href={`/booking?gameId=${game.id}`} className="pd-btn pd-btn-small">رزرو بازی</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="pd-sec" id="events">
        <div className="pd-eyebrow">EVENTS</div>
        <h2>ایونت‌ها</h2>
        {events === null && <p className="pd-mut">در حال بررسی برنامه...</p>}
        {events?.length === 0 && <p className="pd-mut">در حال حاضر ایونتی برای این شعبه ثبت نشده است.</p>}
        <div className="pd-grid">
          {events?.map((event) => (
            <div key={event.id} className="pd-card">
              {event.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt={event.title} className="pd-card-img" />
              )}
              <h3>{event.title}</h3>
              <div>
                {event.genre && <span className="pd-chip">{event.genre}</span>}
                {event.duration && <span className="pd-chip">{fa.format(event.duration)} دقیقه</span>}
              </div>
              {event.description && <p className="pd-mut">{event.description}</p>}
              <div className="pd-slots">
                {event.slots.length === 0 && <span className="pd-mut">در حال حاضر سانس آزادی ندارد</span>}
                {event.slots.slice(0, 8).map((slot) => (
                  <Link
                    key={`${slot.date}-${slot.startTime}`}
                    className="pd-slot"
                    href={`/booking?eventId=${event.id}&date=${slot.date}&startTime=${encodeURIComponent(slot.startTime)}`}
                  >
                    <b>{formatDate(slot.date)}</b>
                    <span>
                      {slot.startTime} تا {slot.endTime} · {formatPrice(slot.price)} · {fa.format(slot.remaining)} ظرفیت
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pd-sec" id="cafe">
        <div className="pd-eyebrow">CAFE</div>
        <h2>کافه پادرا</h2>
        <p>بعد از بازی، وقتشه کمی آروم‌تر بشی. یک نوشیدنی خوش‌طعم، یک میز راحت و چند دقیقه دور از شلوغی.</p>
        <div className="pd-grid">
          {CAFE.map(([title, text]) => (
            <div key={title} className="pd-card">
              <b>{title}</b>
              <div className="pd-mut">{text}</div>
            </div>
          ))}
        </div>
        <p>
          <Link href="/menu" className="pd-btn pd-btn-small">منوی کافه</Link>
        </p>
      </section>

      <section className="pd-sec" id="birthday">
        <div className="pd-eyebrow">BIRTHDAY</div>
        <h2>تولدت رو پادرایی کن</h2>
        <p>
          یه روز معمولی رو تبدیل کن به یه خاطره‌ای که همه دوست دارن دوباره تعریفش کنن؛ بازی، کیک، عکس و فیلم و دورهمی بعد
          از بازی در کافه {branchName}.
        </p>
        {phone && (
          <a href={`tel:${phone}`} className="pd-btn pd-btn-small">هماهنگی و رزرو تولد</a>
        )}
      </section>
    </div>
  );
}
