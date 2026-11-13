"use client";

import { useEffect, useState } from "react";

export type EventSlot = {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  capacity: number;
  remaining: number;
};

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  genre: string | null;
  duration: number | null;
  slots: EventSlot[];
};

export type GameItem = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  duration: string | null;
  capacity: string | null;
  price: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type BranchInfo = {
  slug: string;
  name: string;
  area: string | null;
  address: string | null;
  mapUrl: string | null;
  phone: string | null;
  description: string | null;
  hours: string | null;
};

/** بازی‌ها و ایونت‌های (همراه سانس‌های آزاد) یک شعبه */
export function useBranchData(slug: string) {
  const [games, setGames] = useState<GameItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const q = `branch=${encodeURIComponent(slug)}`;

    fetch(`/api/games?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list: GameItem[] = Array.isArray(data) ? data : [];
        setGames(list.filter((g) => g.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      })
      .catch(() => setGames([]))
      .finally(() => setLoadingGames(false));

    fetch(`/api/events/available?${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [slug]);

  return { games, events, loadingGames, loadingEvents };
}

export const faNumber = new Intl.NumberFormat("fa-IR");

export function formatPrice(price: number | null) {
  return price ? `${faNumber.format(price)} تومان` : "استعلام قیمت";
}
