"use client";

import { useState } from "react";

const fa = new Intl.NumberFormat("fa-IR");

/** هر ساعت بازی = یک متر مربع زمین پاک؛ هر خانه یک متر مربع است */
export default function EcoCounter() {
  const [hours, setHours] = useState(24);
  const lit = Math.min(hours, 100);

  return (
    <div className="pd-eco-box">
      <div className="pd-eco-tiles" aria-hidden="true">
        {Array.from({ length: 100 }, (_, i) => (
          <i key={i} className={i < lit ? "on" : ""} />
        ))}
      </div>

      <div className="pd-eco-ctrl">
        <label htmlFor="eco-hours">چند ساعت بازی کنیم؟</label>
        <input
          id="eco-hours"
          type="range"
          min={0}
          max={100}
          value={Math.min(hours, 100)}
          onChange={(e) => setHours(Number(e.target.value))}
        />
        <div className="pd-eco-out">
          <b>{fa.format(hours)}</b> ساعت بازی
          <span>=</span>
          <b>{fa.format(hours)}</b> متر مربع زمین پاک
        </div>
      </div>
    </div>
  );
}
