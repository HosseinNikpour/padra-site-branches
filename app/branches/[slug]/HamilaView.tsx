"use client";

import Link from "next/link";
import { formatPrice, useBranchData } from "./useBranchData";
import type { BranchInfo } from "./useBranchData";
import "@/app/styles/home/base.css";
import "@/app/styles/home/hero.css";
import "@/app/styles/home/games.css";
import "@/app/styles/home/today.css";
import "@/app/styles/home/cafe.css";
import "@/app/styles/home/birthday.css";

/** شعبه همیلا: تم «سفینه» — سفید، طوسی و مشکی (همان استایل سایت قبلی) */
export default function HamilaView({ branch }: { branch: BranchInfo }) {
  const { games, events, loadingGames, loadingEvents } = useBranchData(branch.slug);
  const phone = branch.phone || "09386620999";

  return (
    <div className="home-page theme-hamila">
      <section className="hero-section" id="home">
        <div className="hero-grid"></div>
        <div className="hero-noise"></div>

        <div className="hero-side-label">
          <span>PADRA PARK</span>
          <span>ENTERTAINMENT CENTER</span>
        </div>

        {/* <div className="hero-number">
          <span>01</span>
          <small>/ 05</small>
        </div> */}

        <div className="hero-content">
          <div className="hero-kicker">
            <span className="hero-kicker-line"></span>
            <span>PADRA PARK · {branch.name}</span>
          </div>

          <h1>
            بازی فقط
            <br />
            <strong>شروع ماجراست.</strong>
          </h1>

          <p>
            جایی برای رقابت، هیجان، خنده و ساختن یک شب متفاوت.
          </p>

          {/* <div className="hero-actions">
            <Link href="/booking" className="primary-action">
              <span>رزرو بازی</span>
              <span className="action-arrow">↗</span>
            </Link>

            <a href="#games" className="secondary-action">
              دیدن بازی‌ها
            </a>
          </div> */}
        </div>

        <div className="hero-visual">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/img/safine.mp4" type="video/mp4" />
          </video>

          <div className="hero-image-overlay"></div>

          <div className="hero-image-caption">
            <span>FEATURED EXPERIENCE</span>
            <strong>PADRA PARK</strong>
          </div>

          <div className="hero-corner top-left"></div>
          <div className="hero-corner bottom-right"></div>
        </div>

        {/* <div className="hero-bottom">
          <div>
            <span>LOCATION</span>
            <strong>تهران · پونک</strong>
          </div>

          <div>
            <span>EXPERIENCES</span>
            <strong>{games.length || 5} بازی</strong>
          </div>

          <div>
            <span>BOOKING</span>
            <strong>ONLINE</strong>
          </div>

          <div className="hero-scroll">
            <span>SCROLL</span>
            <i></i>
          </div>
        </div> */}
      </section>


      {/* =====================================================
          GAMES
      ===================================================== */}
      <section className="games-section" id="games">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE EXPERIENCES</span>
            <h2>
              انتخاب کن.
              <br />
              <strong>بازی شروع میشه.</strong>
            </h2>
          </div>

          {/* <div className="section-index">02</div> */}
        </div>

        {loadingGames ? (
          <div className="games-loading">در حال بارگذاری بازی‌ها...</div>
        ) : games.length === 0 ? (
          <div className="games-empty">
            در حال آماده‌سازی تجربه‌های پادرا هستیم.
          </div>
        ) : (
          <div className="games-layout">
            {games.map((game, index) => (
              <article
                className="game-card"
                key={game.id}
              >
                <Link
                  href={`/booking?gameId=${game.id}`}
                  className="game-card-link"
                >
                  <div className="game-card-image-wrap">
                    {game.image ? (
                      <img loading="lazy" decoding="async"
                        src={game.image}
                        alt={game.name}
                        className="game-card-image"
                      />
                    ) : (
                      <div className="game-card-placeholder">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      </div>
                    )}

                    <div className="game-card-image-overlay"></div>

                    <div className="game-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="game-card-top">
                      <span>EXPERIENCE</span>
                      <span>↗</span>
                    </div>
                  </div>

                  <div className="game-card-content">
                    <div className="game-title-row">
                      <h3>{game.name}</h3>
                      <span className="game-arrow">↗</span>
                    </div>

                    {game.description && (
                      <p>{game.description}</p>
                    )}

                    <div className="game-meta">
                      {game.duration && (
                        <span>
                          <b>مدت</b>
                          {(game.duration)}
                        </span>
                      )}

                      {game.capacity && (
                        <span>
                          <b>تعداد بازیکن</b>
                          {(game.capacity)}
                        </span>
                      )}

                      {game.price && (
                        <span>
                          <b>قیمت</b>
                          {formatPrice(game.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          TODAY
      ===================================================== */}
      <section className="today-section" id="today">
        <div className="today-background-grid"></div>

        <div className="today-header">
          <div className="today-header-title">
            <span className="eyebrow">LIVE AT PADRA</span>

            <h2>
              چه ایونتی رزرو کنیم؟
            </h2>

            <p>
              همه سانس‌های آزاد ایونت‌های پادرا را ببین و همان‌جا انتخاب کن.
            </p>
          </div>

          <div className="today-date">
            <span>امروز</span>

            <strong>
              {new Intl.DateTimeFormat("fa-IR", {
                day: "numeric",
                month: "long",
              }).format(new Date())} 
            </strong>
          </div>
        </div>

        {loadingEvents ? (
          <div className="today-loading">
            در حال بررسی برنامه امروز...
          </div>
        ) : events.length === 0 ? (
          <div className="today-empty">
            <div className="empty-icon">+</div>

            <h3>امروز برنامه ویژه‌ای نداریم.</h3>

            <p>
              ولی بازی‌ها همیشه آماده‌اند.
            </p>
          </div>
        ) : (
          <div className="today-editorial">
            {events.map((event, index) => {
              const slots = event.slots ?? [];

              return (
                <article
                  key={event.id}
                  className="today-editorial-row"
                >
               {/* شماره و دسته‌بندی */}
                  <div className="today-editorial-index">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>{event.genre || "EVENT"}</small>
                  </div>

                  {/* اطلاعات ایونت */}
                  <div className="today-editorial-info">
                    <h3>{event.title}</h3>

                    {event.description && <p>{event.description}</p>}

                    {event.duration && (
                      <div className="today-editorial-duration">
                        <span>مدت</span>
                        <strong>{event.duration} دقیقه</strong>
                      </div>
                    )}
                  </div>

                  {/* تصویر */}
                  <div className="today-editorial-image">
                    {event.image ? (
                      <img loading="lazy" decoding="async" src={event.image} alt={event.title} />
                    ) : (
                      <div className="today-editorial-image-placeholder">
                        <span>PADRA</span>
                        <strong>EVENT</strong>
                      </div>
                    )}
                    <div className="today-editorial-image-overlay"></div>
                  </div>
    {/* سانس‌ها در سمت راست ایونت */}
                  <div className="today-editorial-schedule">
                    <div className="schedule-heading">
                      <span>سانس‌های قابل رزرو</span>
                      <small>{new Intl.NumberFormat("fa-IR").format(slots.length)} سانس</small>
                    </div>

                    {slots.length > 0 ? (
                      <div className="schedule-times">
                        {slots.map((slot) => (
                          <Link
                            key={`${slot.date}-${slot.startTime}`}
                            href={`/booking?eventId=${event.id}&date=${slot.date}&startTime=${encodeURIComponent(slot.startTime)}`}
                            className="schedule-time schedule-time-link"
                          >
                            <small>{new Intl.DateTimeFormat("fa-IR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${slot.date}T00:00:00Z`))}</small>
                            <div className="schedule-time-main">
                              <strong>{slot.startTime}</strong>
                              <span>تا {slot.endTime}</span>
                            </div>
                            <small>{new Intl.NumberFormat("fa-IR").format(slot.price)} تومان · {new Intl.NumberFormat("fa-IR").format(slot.remaining)} ظرفیت</small>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="schedule-empty"><span>—</span><p>در حال حاضر سانس آزادی ندارد</p></div>
                    )}
                  </div>
                 
                </article>
              );
            })}
          </div>
        )}
      </section>
      {/* =====================================================
          PADRA cafe
      ===================================================== */}

      <section className="cafe-section" id="cafe">
        <div className="cafe-bg-shape cafe-bg-shape-one"></div>
        <div className="cafe-bg-shape cafe-bg-shape-two"></div>

        <div className="cafe-container">

          {/* معرفی کافه */}
          <div className="cafe-intro">
            <span className="cafe-eyebrow">
              CAFE AT PADRA
            </span>

            <h2>
              یک مکث خوب،
              <br />
              وسط یک روز <strong>هیجان‌انگیز.</strong>
            </h2>

            <p>
              بعد از بازی، وقتشه کمی آروم‌تر بشی.
              یک نوشیدنی خوش‌طعم، یک میز راحت
              و چند دقیقه دور از شلوغی.
            </p>

            <div className="cafe-actions">
              <a href="/menu" className="cafe-button cafe-button-primary">
                منوی کافه
                <span>↗</span>
              </a>

              <a href={`tel:${phone}`} className="cafe-button cafe-button-secondary">
                رزرو میز
                <span>↗</span>
              </a>
            </div>

            {/* دو عکس کوچک منو */}
            <div className="cafe-menu-preview">

              <a href="/menu" className="cafe-menu-item">
                <div className="cafe-menu-image">
                  <img loading="lazy" decoding="async"
                    src="/img/CafeMenu.gif"
                    alt="نوشیدنی کافه"
                  />
                </div>

                <div className="cafe-menu-overlay">
                  <div>
                    <strong>نوشیدنی‌ها</strong>
                    <span>HOT & COLD DRINKS</span>
                  </div>

                  <span className="cafe-menu-arrow">↗</span>
                </div>
              </a>

              <a href="/menu" className="cafe-menu-item">
                <div className="cafe-menu-image">
                  <img loading="lazy" decoding="async"
                    src="/img/CafeMenu2.gif"
                    alt="دسر"
                  />
                </div>

                <div className="cafe-menu-overlay">
                  <div>
                    <strong>دسر و میان‌وعده</strong>
                    <span>SNACKS</span>
                  </div>

                  <span className="cafe-menu-arrow">↗</span>
                </div>
              </a>

            </div>
          </div>


          {/* عکس بزرگ کافه */}
          <div className="cafe-visual">

            <img loading="lazy" decoding="async"
              src="/img/cafe.gif"
              alt="کافه پادرا"
            />

            <div className="cafe-visual-overlay"></div>

            <div className="cafe-visual-label">
              <span>PADRA</span>
              <strong>CAFE</strong>
            </div>

            <div className="cafe-visual-note">
              Good Food
              <br />
              Good Vibes
            </div>

          </div>

        </div>


        {/* ویژگی‌های کافه */}
        <div className="cafe-features">

          <div className="cafe-feature">
            <div className="cafe-feature-icon">☕</div>

            <div>
              <strong>قهوه و نوشیدنی</strong>
              <span>از اسپرسو تا نوشیدنی‌های ویژه</span>
            </div>
          </div>

          <div className="cafe-feature">
            <div className="cafe-feature-icon">◯</div>

            <div>
              <strong>فضای راحت</strong>
              <span>مبلمان مدرن و دنج</span>
            </div>
          </div>

          <div className="cafe-feature">
            <div className="cafe-feature-icon">▣</div>

            <div>
              <strong>تماشای مسابقات</strong>
              <span>روی پرده بزرگ پادرا</span>
            </div>
          </div>

          <div className="cafe-feature">
            <div className="cafe-feature-icon">♧</div>

            <div>
              <strong>دورهمی و گفتگو</strong>
              <span>با دوستان، خانواده و همکاران</span>
            </div>
          </div>

        </div>
      </section>


      {/* =====================================================
          EVENTS / BIRTHDAY
      ===================================================== */}
      {/* <section className="events-section">
        <div className="events-title">
          <span className="eyebrow">MAKE IT A NIGHT</span>

          <h2>
            تولد؟
            <br />
            <strong>دورهمی؟</strong>
          </h2>

          <p>
            وقتی قرار نیست یه شب معمولی داشته باشی،
            پادرا رو انتخاب کن.
          </p>

          <a href="tel:02100000000" className="text-action">
            هماهنگی و رزرو
            <span>↗</span>
          </a>
        </div>

        <div className="events-collage">
          <div className="collage-card collage-main">
            {games[2]?.image ? (
              <img loading="lazy" decoding="async" src={games[2].image} alt="Birthday" />
            ) : (
              <div className="collage-placeholder">
                <span>BIRTHDAY</span>
              </div>
            )}

            <div className="collage-overlay"></div>

            <div className="collage-caption">
              <span>01</span>
              <strong>BIRTHDAY</strong>
            </div>
          </div>

          <div className="collage-card collage-small">
            {games[3]?.image ? (
              <img loading="lazy" decoding="async" src={games[3].image} alt="Group Event" />
            ) : (
              <div className="collage-placeholder">
                <span>EVENT</span>
              </div>
            )}

            <div className="collage-caption">
              <span>02</span>
              <strong>GROUPS</strong>
            </div>
          </div>

          <div className="collage-note">
            <span>YOUR PEOPLE.</span>
            <strong>YOUR NIGHT.</strong>
          </div>
        </div>
      </section> */}

      {/* =====================================================
          BIRTHDAY
      ===================================================== */}
      <section className="birthday-section" id="birthday">

        <div className="birthday-bg-number">
          24
        </div>

        <div className="birthday-container">

          {/* HEADER */}
          <div className="birthday-heading">

            <span className="birthday-eyebrow">
              BIRTHDAYS AT PADRA
            </span>

            <h2>
              اینجا فقط

              <strong>  تولد نمی‌گیریم.</strong>
            </h2>

            <p>
              یه روز معمولی رو تبدیل کن به یه خاطره‌ای
              که همه دوست دارن دوباره تعریفش کنن.
            </p>

          </div>


          {/* PHOTO STORY */}
          <div className="birthday-story">

            {/* عکس کوچک */}
            <div className="birthday-photo birthday-photo-small">
              <img loading="lazy" decoding="async"
                src="/img/birthday2.gif"
                alt="جشن تولد در پادرا"
              />

              <span className="birthday-photo-label">
                THE MOMENT
              </span>
            </div>


            {/* عکس اصلی */}
            <div className="birthday-photo birthday-photo-main">

              <img loading="lazy" decoding="async"
                src="/img/birthday3.gif"
                alt="تولد در پادرا پارک"
              />

              <div className="birthday-photo-overlay"></div>

              <div className="birthday-photo-caption">
                <span>01 / 04</span>

                <strong>
                  یک روز،
                  <br />
                  کلی خاطره.
                </strong>
              </div>

            </div>


            {/* عکس سوم */}
            <div className="birthday-photo birthday-photo-third">
              <img loading="lazy" decoding="async"
                src="/img/birthday1.gif"
                alt="جشن تولد پادرا"
              />
            </div>

          </div>


          {/* EXPERIENCE STRIP */}
          <div className="birthday-experience">

            <div className="birthday-experience-title">
              <span>YOUR DAY</span>
              <strong>همه‌چیز برای یک روز متفاوت</strong>
            </div>

            <div className="birthday-experience-items">

              <div className="birthday-experience-item">
                <span>01</span>
                <strong>بازی</strong>
                <small>
                  هیجان برای همه
                </small>
              </div>

              <div className="birthday-experience-item">
                <span>02</span>
                <strong>کیک</strong>
                <small>
                  جشن بدون کیک نمی‌شه
                </small>
              </div>

              <div className="birthday-experience-item">
                <span>03</span>
                <strong>عکس و فیلم</strong>
                <small>
                  لحظه‌ها رو نگه دار
                </small>
              </div>

              <div className="birthday-experience-item">
                <span>04</span>
                <strong>کافه</strong>
                <small>
                  دورهمی بعد از بازی
                </small>
              </div>

            </div>

          </div>


          {/* BOTTOM CTA */}
          <div className="birthday-bottom">

            <div>
              <span>
                READY TO CELEBRATE?
              </span>

              <h3>
                تولدت رو
                <strong> پادرا‌یی کن.</strong>
              </h3>
            </div>

            <a
              href={`/birthday?branch=${branch.slug}`}
              className="birthday-cta"
            >
              رزرو تولد
              <span>↗</span>
            </a>

          </div>

        </div>
      </section>

    </div>
  );
}
